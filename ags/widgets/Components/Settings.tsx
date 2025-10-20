import { Gtk } from "ags/gtk4";
import { VERTICAL } from "../../services/vars";

export function SettingsIcon() {
  return (
    <Gtk.MenuButton class="unset">
      <Gtk.Image iconName="start-here-symbolic" />
      <Gtk.Popover hasArrow={false}>
        <Gtk.Box orientation={VERTICAL}>
          <Gtk.Button label="Update" />
          <Gtk.Button label="Preferences" />
        </Gtk.Box>
      </Gtk.Popover>
    </Gtk.MenuButton>
  );
}
