import app from "ags/gtk4/app";
import { WorkSpaces, ClientTitle } from "./Components/Workspace";
import Battery from "./Components/Battery";
import Volume, { MicrophoneMute } from "./Components/Volume";
import SysTray from "./Components/SysTray";
import { UpdateIcon } from "./Components/Updates";
import Wireless from "./Components/Network";

import { Astal, Gtk, Gdk } from "ags/gtk4";
import TextStream from "./Components/TextStream";
import Bluetooth from "./Components/Bluetooth";
import DashCenter from "./Components/DashCenter";
import { ToolsIcon } from "./Components/Tools";

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

  return (
    <window
      visible
      name="bar"
      namespace="ags"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      layer={Astal.Layer.TOP}
      application={app}
    >
      <Gtk.CenterBox class="centerbox">
        <Gtk.Box $type="start" hexpand={true} class="workspace">
          <WorkSpaces />
          <ClientTitle />
        </Gtk.Box>
        <Gtk.Box $type="center">
          <DashCenter />
        </Gtk.Box>
        <Gtk.Box $type="end">
          <TextStream />
          <ToolsIcon />
          <SysTray />
          <UpdateIcon />
          <Bluetooth />
          <Wireless />
          <Volume />
          <MicrophoneMute />
          <Battery />
          {/*<SettingsIcon />*/}
        </Gtk.Box>
      </Gtk.CenterBox>
    </window>
  );
}
