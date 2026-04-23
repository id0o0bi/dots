import app from "ags/gtk4/app";
import { sh, shAsync } from "./util";
import { _CACHE, CONFIG, SCSS_CACHE } from "./vars";
import { monitorFile, readFile } from "ags/file";
import { isNight } from "../widgets/Components/Weather";
import { Process, subprocess } from "ags/process";
import { getSysUpdate } from "./vendors/ArchUpdate";
import AstalBattery from "gi://AstalBattery?version=0.1";
import { applyTheme } from "./themes";

export function init() {
  // compile scss once on startup (generates the base CSS with structural styles)
  if (!readFile(SCSS_CACHE)) _compileScss();

  // apply theme (runtime CSS variable override — no sass recompilation needed)
  app.apply_css(readFile(SCSS_CACHE), true);
  applyTheme(isNight());

  // monitor style changes; recompile scss but keep current theme
  monitorFile(`${CONFIG}/styles/components/`, () => {
    _compileScss();
    app.apply_css(SCSS_CACHE);
  });

  // connect to isNight changes
  isNight.subscribe(() => applyTheme(isNight()));

  // batery monitor
  _batteryMonitor();

  // clean up cache files over 7 days
  shAsync([`find ${_CACHE}/procs/ -type f -mtime +3 -delete`]).catch(console.error);
}

/**
 *
 * Run a command, redirect stdout,stderr to files
 * optional: Append stdout,stderr to TextBuffer
 * @param command
 * @returns
 */
export function cmdOutBufStream(
  command: string[],
  logName: string,
  appendFunc?: Function,
): Process {
  let dTime = new Date().toISOString().replace(/[^\d]/g, "");
  let sRand = Math.random().toString(36).substring(2, 6);
  let fName = `${_CACHE}/procs/${logName}-${dTime}-${sRand}`;
  let outStr = "";
  let errStr = "";
  let proc = subprocess(
    command,
    (out) => {
      outStr += out + "\n";
      appendFunc?.apply(null, [out]);
    },
    (err) => {
      errStr += err + "\n";
    },
  );
  proc.connect("exit", () => {
    outStr = "";
    errStr = "";
    appendFunc?.apply(null, [""]);
  });
  return proc;
}

export function cli(req: string) {
  switch (req) {
    case "sysUpdate":
      getSysUpdate();
      break;
    default:
      console.log("Invalid command");
  }
  return "Done!";
}

/** Compile scss to css file (one-time, no theme mutation) */
function _compileScss() {
  const src = `${CONFIG}/styles/main.scss`;
  const dst = SCSS_CACHE;
  sh([`sass --no-source-map ${src} ${dst}`]);
}

async function _batteryMonitor() {
  const battery = AstalBattery.get_default();

  battery.connect("notify::percentage", () => {
    let percent = Math.floor(battery.percentage * 100);
    if (!battery.get_charging() && [5, 15, 30].includes(percent)) {
      let usi =
        percent <= 15
          ? ["critical", `'Battery Empty!'`, "battery-caution"]
          : ["normal", `'Battery Low!'`, "battery-low"];
      shAsync([
        "notify-send",
        `'Battery: ${percent}%'`,
        usi[1],
        "-i",
        usi[2],
        "-u",
        usi[0],
      ]).catch(console.error);
    }
  });
}
