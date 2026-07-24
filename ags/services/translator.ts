import { shAsync } from "./util";
import { _CACHE } from "./vars";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

export interface TranslationEntry {
  id: string;
  timestamp: number;
  inputText: string;
  outputText: string;
  imagePath?: string;
}

const TRANSLATOR_CACHE = `${_CACHE}/translator`;
const HISTORY_FILE = `${TRANSLATOR_CACHE}/history.jsonl`;
const MAX_HISTORY = 100;
const LOAD_COUNT = 20;

const LLM_MODEL = "deepseek/deepseek-v4-flash";
const OCR_MODEL = "cloudflare/google-ai-studio/gemini-3.5-flash";

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

export async function translateText(inputText: string): Promise<string> {
  ensureCacheDir();

  const promptFile = `${TRANSLATOR_CACHE}/prompt.txt`;

  const prompt = `You are a translator. Detect the language of the text below and translate it.
- If the text is in English, translate to Chinese (Simplified).
- If the text is in Chinese, translate to English.
- For any other language, translate to English.
- Return ONLY the translated text. No explanations, no quotes, no preamble.

--- BEGIN TEXT ---
${inputText}
--- END TEXT ---`;

  writeFile(promptFile, prompt);

  try {
    const result = await shAsync([
      `pi -p --no-tools --model ${LLM_MODEL} @${promptFile}`,
    ]);
    deleteFile(promptFile);
    return result.trim();
  } catch (e) {
    console.error("Translation error:", e);
    deleteFile(promptFile);
    return "Translation failed. Please try again.";
  }
}

/** OCR an image, return extracted text, or empty string on failure. */
export async function ocrImage(imagePath: string): Promise<string> {
  ensureCacheDir();

  const promptFile = `${TRANSLATOR_CACHE}/prompt-ocr.txt`;
  const prompt = `You are an OCR expert. Extract all visible text from this image.
Return ONLY the extracted text. No explanations, no quotes, no preamble.
If no text is found, return an empty string.`;

  writeFile(promptFile, prompt);

  try {
    const result = await shAsync([
      `pi -p --no-tools --model ${OCR_MODEL} @${imagePath} @${promptFile}`,
    ]);
    deleteFile(promptFile);
    return result.trim();
  } catch (e) {
    console.error("OCR error:", e);
    deleteFile(promptFile);
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
