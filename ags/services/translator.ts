import { shAsync } from "./util";
import { _CACHE } from "./vars";
import { execAsync } from "ags/process";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  fr: "French",
  ru: "Russian",
  ko: "Korean",
  de: "German",
  es: "Spanish",
};

export const LANGUAGES = [
  { code: "auto", name: "Auto", flag: "🌐" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
];

export interface TranslateResult {
  inputLang: string;
  outputLang: string;
  translation: string;
}

export interface TranslationEntry {
  id: string;
  timestamp: number;
  inputText: string;
  outputText: string;
  inputLang?: string;
  outputLang?: string;
  imagePath?: string;
}

const TRANSLATOR_CACHE = `${_CACHE}/translator`;
const HISTORY_FILE = `${TRANSLATOR_CACHE}/history.jsonl`;
const MAX_HISTORY = 100;
const LOAD_COUNT = 20;

const LLM_MODEL = "deepseek/deepseek-v4-flash";
const OCR_MODEL = "cloudflare/gemini-3.5-flash-lite";

// Lock pi down to a pure one-shot prompt: no default coding-assistant prompt,
// no tools, no skills, no extensions, no prompt templates, no AGENTS.md context
// files, and no session persistence.
const PI_FLAGS = [
  "-p",
  "--no-tools",
  "--no-skills",
  "--no-extensions",
  "--no-prompt-templates",
  "--no-context-files",
  "--no-session",
];

function ensureCacheDir() {
  const dir = Gio.File.new_for_path(TRANSLATOR_CACHE);
  if (!dir.query_exists(null)) {
    dir.make_directory_with_parents(null);
  }
}

function writeFile(path: string, content: string) {
  const file = Gio.File.new_for_path(path);
  file.replace_contents(
    new TextEncoder().encode(content),
    null,
    false,
    Gio.FileCreateFlags.REPLACE_DESTINATION,
    null,
  );
}

function deleteFile(path: string) {
  const file = Gio.File.new_for_path(path);
  if (file.query_exists(null)) file.delete(null);
}

/**
 * One-shot pi call for OCR/translation.
 *
 * Replaces pi's default coding-assistant system prompt with `systemPrompt`
 * (the only prompt the model sees), disables tools/skills/extensions/prompt
 * templates/context files, and attaches `inputFiles` as the user message.
 *
 * Runs pi directly by argv (no shell), so prompts and file paths never need
 * quoting. Input files are referenced as @file arguments: pi treats a leading
 * "@" in a *plain* message as a file path, so text inputs are materialized to
 * a file by the caller first (see translateText). No session is persisted.
 */
async function piPrompt(
  model: string,
  systemPrompt: string,
  inputFiles: string[],
): Promise<string> {
  return execAsync([
    "pi",
    ...PI_FLAGS,
    "--model",
    model,
    "--system-prompt",
    systemPrompt,
    ...inputFiles.map((f) => `@${f}`),
  ]);
}

function parseTranslateResult(raw: string): TranslateResult | null {
  const trimmed = raw.trim();

  // Try direct JSON parse
  try {
    const obj = JSON.parse(trimmed);
    if (obj.translation && obj.input_lang && obj.output_lang) {
      return {
        inputLang: obj.input_lang,
        outputLang: obj.output_lang,
        translation: obj.translation,
      };
    }
  } catch { /* ignore */ }

  // Try stripping markdown fences
  const jsonMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[1].trim());
      if (obj.translation && obj.input_lang && obj.output_lang) {
        return {
          inputLang: obj.input_lang,
          outputLang: obj.output_lang,
          translation: obj.translation,
        };
      }
    } catch { /* ignore */ }
  }

  return null;
}

export async function translateText(
  inputText: string,
  targetLang?: string,
): Promise<TranslateResult> {
  const targetInstruction = targetLang && targetLang !== "auto"
    ? `Translate the text to ${LANG_LABELS[targetLang] || targetLang}.`
    : `Detect the language:
- If the text is in English, translate to Chinese (Simplified).
- If the text is in Chinese, translate to English.
- For any other language, translate to English.`;

  const systemPrompt = `You are a translator. ${targetInstruction}

Return ONLY a single JSON object (no markdown fences, no extra text) with these keys:
- "input_lang": ISO 639-1 code (e.g. "en", "zh", "ja"), or "mixed" if the text contains multiple languages
- "output_lang": ISO 639-1 code of the output language
- "translation": the translated text`;

  // Pass the text to pi as a file argument (pi interprets a leading "@" in a
  // plain message as a file path). One tiny temp file per call, removed after.
  ensureCacheDir();
  const inputFile =
    `${TRANSLATOR_CACHE}/input-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.txt`;
  writeFile(inputFile, inputText);

  try {
    const result = await piPrompt(LLM_MODEL, systemPrompt, [inputFile]);

    const parsed = parseTranslateResult(result);
    if (parsed) return parsed;

    // Fallback: return raw text as translation with unknown langs
    console.warn("Failed to parse translation JSON, using raw output:", result.slice(0, 100));
    return { inputLang: "?", outputLang: targetLang || "?", translation: result.trim() };
  } catch (e) {
    console.error("Translation error:", e);
    return { inputLang: "?", outputLang: "?", translation: "Translation failed. Please try again." };
  } finally {
    deleteFile(inputFile);
  }
}

/** OCR an image, return extracted text, or empty string on failure. */
export async function ocrImage(imagePath: string): Promise<string> {
  const systemPrompt = `You are an OCR expert. Extract all visible text from the image provided by the user.
Return ONLY the extracted text. No explanations, no quotes, no preamble.
If no text is found, return an empty string.`;

  try {
    const result = await piPrompt(OCR_MODEL, systemPrompt, [imagePath]);
    return result.trim();
  } catch (e) {
    console.error("OCR error:", e);
    return "";
  }
}

/** Capture a screen region via slurp+grim, return the image path, or "" if cancelled. */
export async function captureScreenshot(): Promise<string> {
  ensureCacheDir();

  const timestamp = Date.now();
  const imagePath = `${TRANSLATOR_CACHE}/capture-${timestamp}.png`;

  try {
    const geometry = await shAsync(["slurp"]);
    if (!geometry) return ""; // User cancelled

    await shAsync([`grim -g "${geometry.trim()}" "${imagePath}"`]);
    return imagePath;
  } catch (e) {
    console.error("Capture error:", e);
    return "";
  }
}

export function saveToHistory(
  entry: Omit<TranslationEntry, "id" | "timestamp">,
) {
  ensureCacheDir();

  const newEntry: TranslationEntry = {
    ...entry,
    id: GLib.uuid_string_random(),
    timestamp: Date.now(),
  };

  const line = JSON.stringify(newEntry);
  const file = Gio.File.new_for_path(HISTORY_FILE);

  // append one JSON line
  const stream = file.append_to(Gio.FileCreateFlags.NONE, null);
  stream.write(new TextEncoder().encode(line + "\n"), null);
  stream.close(null);

  // trim to MAX_HISTORY lines
  const [ok, contents] = file.load_contents(null);
  if (ok) {
    const lines = new TextDecoder("utf-8")
      .decode(contents)
      .trim()
      .split("\n");
    if (lines.length > MAX_HISTORY) {
      const trimmed = lines.slice(-MAX_HISTORY).join("\n") + "\n";
      file.replace_contents(
        new TextEncoder().encode(trimmed),
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null,
      );
    }
  }
}

export function loadHistory(): TranslationEntry[] {
  const file = Gio.File.new_for_path(HISTORY_FILE);
  if (!file.query_exists(null)) return [];

  try {
    const [ok, contents] = file.load_contents(null);
    if (!ok) return [];

    const lines = new TextDecoder("utf-8")
      .decode(contents)
      .trim()
      .split("\n");

    // tail last LOAD_COUNT, parse each JSON line
    return lines.slice(-LOAD_COUNT).reverse().map((line) => {
      try {
        return JSON.parse(line) as TranslationEntry;
      } catch {
        return null;
      }
    }).filter((e): e is TranslationEntry => e !== null);
  } catch (e) {
    console.error("Failed to load history:", e);
  }

  return [];
}
