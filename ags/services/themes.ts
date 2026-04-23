import app from "ags/gtk4/app";
import Gio from "gi://Gio";

type ThemeName = "dawn" | "moon";

const THEMES: Record<ThemeName, Record<string, string>> = {
  dawn: {
    base_blur: "rgba(250, 244, 237, 0.7)",
    surface_blur: "rgba(255, 250, 243, 0.7)",
    overlay_blur: "rgba(242, 233, 225, 0.7)",
    base: "#faf4ed",
    surface: "#fffaf3",
    overlay: "#f2e9e1",
    muted: "#9893a5",
    subtle: "#797593",
    text: "#575279",
    love: "#b4637a",
    gold: "#ea9d34",
    rose: "#d7827e",
    pine: "#286983",
    foam: "#56949f",
    iris: "#907aa9",
    highlightLow: "#f4ede8",
    highlightMed: "#dfdad9",
    highlightHigh: "#cecacd",
    contrastWhite: "#000000",
    contrastBlack: "#ffffff",
  },
  moon: {
    base_blur: "rgba(35, 33, 54, 0.7)",
    surface_blur: "rgba(42, 39, 63, 0.7)",
    overlay_blur: "rgba(57, 53, 82, 0.7)",
    base: "#232136",
    surface: "#2a273f",
    overlay: "#393552",
    muted: "#6e6a86",
    subtle: "#908caa",
    text: "#e0def4",
    love: "#eb6f92",
    gold: "#f6c177",
    rose: "#ea9a97",
    pine: "#3e8fb0",
    foam: "#9ccfd8",
    iris: "#c4a7e7",
    highlightLow: "#2a283e",
    highlightMed: "#44415a",
    highlightHigh: "#56526e",
    contrastWhite: "#ffffff",
    contrastBlack: "#000000",
  },
};

function toCssVars(theme: ThemeName): string {
  const t = THEMES[theme];
  const vars = Object.entries(t)
    .map(([key, val]) => `  --rpt-${key}: ${val};`)
    .join("\n");
  return `:root {\n${vars}\n}\n`;
}

export function applyTheme(dark: boolean, reset = false) {
  const css = toCssVars(dark ? "moon" : "dawn");
  app.apply_css(css, reset);

  const settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
  settings.set_string(
    "color-scheme",
    `prefer-${dark ? "dark" : "light"}`,
  );
}
