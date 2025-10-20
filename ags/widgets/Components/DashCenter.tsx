import { Gtk } from "ags/gtk4";
import { TodayIcon } from "./Weather";
import DashBoard from "./DashBoard";
import { DTTIME } from "../../services/vars";
import { NotifIcon } from "./Notification";

export default function DashCenter() {
  return (
    <Gtk.MenuButton class="unset dashButton">
      <Gtk.Box class="dash">
        <NotifIcon />
        <Gtk.Label class="time" label={DTTIME((d) => d.slice(11, 16))} />
        <TodayIcon />
      </Gtk.Box>
      <Gtk.Popover hasArrow={false}>
        <DashBoard />
      </Gtk.Popover>
    </Gtk.MenuButton>
  );
}
