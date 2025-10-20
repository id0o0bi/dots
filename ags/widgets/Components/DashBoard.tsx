import { Gtk } from "ags/gtk4";
import DashMpris from "./DashMpris";
import DashNotify from "./DashNotify";
import DashClock from "./DashClock";
import { DashWeatherForcast, DashWeatherInfo } from "./Weather";
import { HORIZONTAL, VERTICAL } from "../../services/vars";

export default function DashBoard() {
  return (
    <Gtk.Box orientation={HORIZONTAL}>
      <Gtk.Box orientation={VERTICAL} class="dashLeft">
        <DashMpris />
        <DashNotify />
      </Gtk.Box>
      <Gtk.Box orientation={VERTICAL} class="dashRight">
        <DashClock />
        <DashWeatherInfo />
        <Gtk.Calendar />
        <DashWeatherForcast />
      </Gtk.Box>
    </Gtk.Box>
  );
}
