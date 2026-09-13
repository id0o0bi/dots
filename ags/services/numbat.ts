import { execAsync } from "ags/process";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { _CACHE } from "./vars";

export interface CalcEntry {
  id: string;
  timestamp: number;
  expr: string;
  result: string;
}

const DIR = `${_CACHE}/numbat`;
const HISTORY_FILE = `${DIR}/history.json`;
const MAX_HISTORY = 20;

/** Evaluate a numbat expression. Rejects with numbat's stderr on error. */
export function evalNumbat(expr: string): Promise<string> {
  // argv form on purpose: expressions contain * ( ) and friends, which
  // `sh -c` (and therefore shAsync) would expand before numbat sees them.
  return execAsync([
    "numbat",
    "--color",
    "never",
    "--pretty-print",
    "never",
    "-e",
    expr,
  ]);
}

/**
 * Numbat reports errors as a multi-line code frame:
 *   error: while type checking
 *     ┌─ <input:1>:1:3
 *     │
 *   1 │ 5 foo
 *     │   ^^^ unknown identifier
 *     = Did you mean 'foot'?
 * Keep the fragments that carry meaning (caret messages and `=` hints) and
 * drop the frame. The message sits on the longest fragment: the frame also
 * emits bare spans like "Time" / "Length" next to it, so the longest one
 * wins and the hints are appended after it.
 */
export function cleanError(e: unknown, fallback = "invalid expression"): string {
  // GJS throws GErrors (from execAsync) which are not instanceof Error,
  // but do carry .message — duck-type so both shapes of error work.
  const errMsg = (e as { message?: unknown } | null)?.message;
  const raw = typeof errMsg === "string" ? errMsg : String(e ?? "");
  const msgs: string[] = [];
  const hints: string[] = [];

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line || line === "Interpreter stopped") continue;
    if (line.startsWith("error: while")) continue;
    if (/^\d+\s*│/.test(line)) continue; // source echo
    if (line.includes("┌") || line.includes("└")) continue; // frame corners

    if (line.startsWith("=")) {
      const hint = line.slice(1).trim();
      if (hint) hints.push(hint);
      continue;
    }
    const caret = line.lastIndexOf("^");
    if (caret >= 0) {
      const after = line.slice(caret).replace(/^\^+\s*/, "").trim();
      if (after) msgs.push(after);
      continue;
    }
    if (line.includes("│")) {
      const after = line.slice(line.lastIndexOf("│") + 1).trim();
      if (after) msgs.push(after);
    }
  }

  const primary = msgs.sort((a, b) => b.length - a.length)[0];
  if (primary) return [primary, ...hints].join(" · ");

  // not a numbat frame (e.g. spawn failure): show what we actually got
  const first = raw.split("\n").map((l) => l.trim()).find(Boolean);
  return first ?? fallback;
}

const normExpr = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** `123 = 123`, `1 km = 1 km`: numbat just echoed the input back. */
export function isTrivialCalc(expr: string, result: string): boolean {
  return normExpr(expr) === normExpr(result);
}

/** Same expression as the most recent entry, whatever it evaluated to. */
export function isSameCalc(prev: CalcEntry | undefined, expr: string): boolean {
  return !!prev && normExpr(prev.expr) === normExpr(expr);
}

function ensureDir() {
  const dir = Gio.File.new_for_path(DIR);
  if (!dir.query_exists(null)) dir.make_directory_with_parents(null);
}

export function saveCalcEntry(entry: Omit<CalcEntry, "id" | "timestamp">) {
  const next: CalcEntry[] = [
    { ...entry, id: GLib.uuid_string_random(), timestamp: Date.now() },
    ...loadCalcHistory(),
  ].slice(0, MAX_HISTORY); // capped at 20, so a whole-file rewrite is fine

  ensureDir();
  Gio.File.new_for_path(HISTORY_FILE).replace_contents(
    new TextEncoder().encode(JSON.stringify(next, null, 2)),
    null,
    false,
    Gio.FileCreateFlags.REPLACE_DESTINATION,
    null,
  );
}

export function loadCalcHistory(): CalcEntry[] {
  const file = Gio.File.new_for_path(HISTORY_FILE);
  if (!file.query_exists(null)) return [];

  try {
    const [ok, contents] = file.load_contents(null);
    if (!ok) return [];
    const parsed = JSON.parse(new TextDecoder("utf-8").decode(contents));
    return Array.isArray(parsed) ? (parsed as CalcEntry[]) : [];
  } catch (e) {
    console.error("Failed to load calc history:", e);
    return [];
  }
}
