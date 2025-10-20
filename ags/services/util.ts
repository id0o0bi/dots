import { Gdk, Gtk } from "ags/gtk4";
import { exec, execAsync } from "ags/process";
import GLib from "gi://GLib";

export function sh(cmd: string[]) {
  try {
    let res = exec(["sh", "-c", ...cmd]);
    return res;
  } catch (e) {}
  return "";
}

export function shAsync(cmd: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execAsync(["sh", "-c", ...cmd])
      .then((res) => {
        resolve(res);
      })
      .catch(reject);
  });
}

export function checkIcon(enabled: boolean): string {
  return enabled ? "radio-checked-symbolic" : "radio-symbolic";
}

export function isIcon(icon?: string | null) {
  const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!);
  return icon && iconTheme.has_icon(icon);
}

export function fileExists(path: string) {
  return GLib.file_test(path, GLib.FileTest.EXISTS);
}

export function debounce(func: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: any) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

// transform time like '07:18 PM' into 24 hour format
export function to24HM(timeStr: string) {
  let mm = timeStr.slice(3, 5);
  let hh = timeStr.slice(0, 2);
  if (timeStr.endsWith("PM")) hh = (parseInt(hh) + 12).toString();
  return `${hh}:${mm}`;
}

export function escapeMarkup(text: string) {
  return GLib.markup_escape_text(text, -1);
}

/**
 * return a string representing how much time has passed
 * eg: 2 seconds, 3 days...
 */
export function timeElapsed(now: GLib.DateTime, ts: number) {
  let time = now.to_unix();
  let diff = time - ts;

  if (diff < 60) return "just  now";
  else if (diff < 3600) return `${Math.ceil(diff / 60)} minutes ago`;
  else if (diff < 86400) return `${Math.ceil(diff / 3600)} hours ago`;
  else if (diff < 604800) return `${Math.ceil(diff / 86400)} days ago`;

  return GLib.DateTime.new_from_unix_local(ts).format("%H:%M %d/%m");
}

export function formatTimeStamp(ts: number): string {
  return GLib.DateTime.new_from_unix_local(ts).format("%H:%M %d/%m") ?? "";
}

/**
 *
 * @param seconds: the number of seconds
 * @param format: in the format of 'd%:hh%:mm%:ss%'
 * @returns
 */
export function formatSeconds(seconds: number, format: string) {
  seconds = Math.round(seconds);
  if (seconds < 1) seconds = 0;

  let ss = seconds % 60;
  let mm = Math.floor(seconds / 60) % 60;
  let hh = Math.floor(seconds / 3600) % 24;
  let dd = Math.floor(seconds / 86400);

  let result = format;
  result = result.replace(/%d/g, dd.toString());
  result = result.replace(/%hh/g, hh.toString().padStart(2, "0"));
  result = result.replace(/%mm/g, mm.toString().padStart(2, "0"));
  result = result.replace(/%ss/g, ss.toString().padStart(2, "0"));

  result = result.replace(/^00?:/g, "");

  return result;
}
