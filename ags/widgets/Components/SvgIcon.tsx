import { Gtk } from "ags/gtk4";
import { readFile } from "ags/file";
import GLib from "gi://GLib";
import { isNight } from "./Weather";
import type { Accessor } from "ags";

type SvgIconProps = {
  file: string | Accessor<string>;
  class?: string | Accessor<string>;
  css?: string | Accessor<string>;
  [key: string]: unknown;
};

/**
 * A themed SVG icon that follows the CSS `color` property.
 *
 * Accepts a static `string` path or an `Accessor<string>` for reactive bindings.
 * Re-bakes on theme changes (`isNight`) and on file path changes (Accessor).
 *
 * Size is controlled by CSS: `-gtk-icon-size: ...` on the parent or a class.
 *
 * Usage:
 * ```tsx
 * <SvgIcon file={`${ASSETS}/wttr/clear-day.svg`} />
 * <SvgIcon file={nowDetail((d) => _getWeatherCode(d.weatherCode))} />
 * ```
 */
export default function SvgIcon({ file, ...rest }: SvgIconProps) {
  return (
    <Gtk.Image
      {...rest}
      $={(self) => {
        const unsubs: (() => void)[] = [];

        const load = () => {
          const path = typeof file === "function" ? file() : file;
          const svgStr = readFile(path);
          if (!svgStr) return;

          const ctx = self.get_style_context();
          const rgba = ctx.get_color();
          const color = rgba.to_string();

          const modified = svgStr.replace(/currentColor/g, color);
          const bytes = GLib.Bytes.new(new TextEncoder().encode(modified));
          const svg = Gtk.Svg.new_from_bytes(bytes);
          self.set_from_paintable(svg);
        };

        self.connect("realize", load);

        // Re-bake on theme changes
        unsubs.push(isNight.subscribe(load));

        // Re-bake when the file path changes (reactive binding)
        if (typeof file === "function") {
          unsubs.push(file.subscribe(load));
        }

        // Clean up all subscriptions on destroy
        self.connect("destroy", () => unsubs.forEach((fn) => fn()));
      }}
    />
  );
}
