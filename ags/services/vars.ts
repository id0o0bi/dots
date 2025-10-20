import { createState } from "ags";
import { Gtk } from "ags/gtk4";
import { Process } from "ags/process";
import { createPoll } from "ags/time";
import GLib from "gi://GLib";

export const { HORIZONTAL, VERTICAL } = Gtk.Orientation;
export const { CENTER, START, END, BASELINE_CENTER } = Gtk.Align;

export const [lineStr, setLineStr] = createState("");

export var streamProc: Process;
export const setStreamProc = (proc: Process) => (streamProc = proc);

export const TXTBUF = new Gtk.TextBuffer();
export const DTTIME = createPoll(
  "0000-00-00 00:00:00",
  1000,
  "date +'%Y-%m-%d %H:%M:%S'",
);

export const TMPDIR = `${GLib.get_tmp_dir()}/id0o0bi`;
export const CONFIG = `${GLib.get_user_config_dir()}/ags`;
export const ASSETS = `${GLib.get_user_config_dir()}/ags/assets`;
export const _CACHE = `${GLib.get_user_cache_dir()}/ags`;

export const SCSS_CACHE = `${_CACHE}/main.css`;
export const WTTR_CACHE = `${_CACHE}/weather/wttr.in.json`;

// export const [TXT_BUF, setTextBuf] = createState(new Gtk.TextBuffer());

export const SEC_PKGS = [
  "linux",
  "linux-zen",
  "linux-firmware",
  "linux-headers",
  "linux-zen-headers",
  "hyprland",
];

export const WTTR_ICONS: Record<number, string> = {
  113: "clear-??", // "Sunny",
  116: "partly-cloudy-??", // "PartlyCloudy",
  119: "cloudy", // "Cloudy",
  122: "overcast-??", // "VeryCloudy",
  143: "fog-??", // "Fog",
  176: "partly-cloudy-??-rain", // "LightShowers",
  179: "sleet", // "LightSleetShowers",
  182: "sleet", // "LightSleet",
  185: "sleet", // "LightSleet",
  200: "thunderstorms-??-rain", // "ThunderyShowers",
  227: "partly-cloudy-??-snow", // "LightSnow",
  230: "overcast-??-snow", // "HeavySnow",
  248: "fog-??", // "Fog",
  260: "fog-??", // "Fog",
  263: "partly-cloudy-??-rain", // "LightShowers",
  266: "partly-cloudy-??-rain", // "LightRain",
  281: "sleet", // "LightSleet",
  284: "sleet", // "LightSleet",
  293: "partly-cloudy-??-rain", // "LightRain",
  296: "partly-cloudy-??-rain", // "LightRain",
  299: "overcast-??-rain", // "HeavyShowers",
  302: "overcast-??-rain", // "HeavyRain",
  305: "overcast-??-rain", // "HeavyShowers",
  308: "overcast-??-rain", // "HeavyRain",
  311: "sleet", // "LightSleet",
  314: "sleet", // "LightSleet",
  317: "sleet", // "LightSleet",
  320: "partly-cloudy-??-snow", // "LightSnow",
  323: "partly-cloudy-??-snow", // "LightSnowShowers",
  326: "partly-cloudy-??-snow", // "LightSnowShowers",
  329: "overcast-??-snow", // "HeavySnow",
  332: "overcast-??-snow", // "HeavySnow",
  335: "overcast-??-snow", // "HeavySnowShowers",
  338: "overcast-??-snow", // "HeavySnow",
  350: "sleet", // "LightSleet",
  353: "partly-cloudy-??-rain", // "LightShowers",
  356: "overcast-??-rain", // "HeavyShowers",
  359: "overcast-??-rain", // "HeavyRain",
  362: "sleet", // "LightSleetShowers",
  365: "sleet", // "LightSleetShowers",
  368: "partly-cloudy-??-snow", // "LightSnowShowers",
  371: "overcast-??-snow", // "HeavySnowShowers",
  374: "sleet", // "LightSleetShowers",
  377: "sleet", // "LightSleet",
  386: "thunderstorms-??-rain", // "ThunderyShowers",
  389: "thunderstorms-??-rain", // "ThunderyHeavyRain",
  392: "thunderstorms-??-snow", // "ThunderySnowShowers",
  395: "overcast-??-snow", // "HeavySnowShowers",
};
