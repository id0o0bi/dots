import app from "ags/gtk4/app";
import { sh } from "./util";
import { _CACHE, CONFIG, SCSS_CACHE, setLineStr } from "./vars";
import { monitorFile, readFile, writeFileAsync } from "ags/file";
import { isNight } from "../widgets/Components/Weather";
import Gio from "gi://Gio";
import { execAsync, Process, subprocess } from "ags/process";
import { getSysUpdate } from "./vendors/ArchUpdate";

export function init() {
  if (!readFile(SCSS_CACHE)) {
    console.log("no css cache, creating one...");
    _applyCss();
  }

  // monitor style changes;
  monitorFile(`${CONFIG}/styles/components/`, () => _applyCss(isNight.get()));

  // update system theme on startup
  let nightTheme = sh([`grep 'prefer' ${CONFIG}/styles/colors.scss`]);
  if (isNight.get() !== nightTheme.indexOf("moon") > 0) {
    _applyCss(isNight.get());
  }

  // connect to isNight changes
  isNight.subscribe(() => {
    _applyCss(isNight.get());
  });

  // clean up cache files over 7 days
  execAsync(`find ${_CACHE}/procs/ -type f -mtime +3 -delete`);
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
  appendToTextBuffer: boolean,
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
      appendToTextBuffer && setLineStr(out);
    },
    (err) => {
      errStr += err + "\n";
      appendToTextBuffer && setLineStr(`<span color="red">${err}</span>`);
    },
  );

  proc.connect("exit", () => {
    writeFileAsync(`${fName}.out`, outStr);
    writeFileAsync(`${fName}.err`, errStr);
    // notify user with action: Open stdOut, Open stdErr
    if (appendToTextBuffer) {
      // timeout(2000, () => TXTBUF.set_text("", -1));
      // timeout(2000, () => setLineStr(""));
      setLineStr("");
    }
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

async function _applyCss(dark = true, reset = true) {
  const src = `${CONFIG}/styles/main.scss`;
  const dst = SCSS_CACHE;

  // dark = true;

  let subs = dark ? "moon" : "dawn";
  let scss = `${CONFIG}/styles/colors.scss`;

  sh([`sed -i 's/\$theme-prefer:.*/$theme-prefer: "${subs}";/' ${scss}`]);
  sh([`sass --no-source-map ${src} ${dst}`]);

  app.apply_css(dst, reset);

  const settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
  settings.set_string("color-scheme", `prefer-${dark ? "dark" : "light"}`);
}
