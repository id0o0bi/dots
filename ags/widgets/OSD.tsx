import { createState } from "ags";
import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import AstalWp from "gi://AstalWp";
import { debounce, sh, shAsync } from "../services/util";
import { monitorFile } from "ags/file";
import { VERTICAL } from "../services/vars";

const { defaultSpeaker: speaker, defaultMicrophone: microphone } =
  AstalWp.get_default()!;

const dir = "/sys/class/backlight";
const scr = await shAsync([`ls -w1 ${dir} | head -1`]);
const max = Number(await shAsync([`cat ${dir}/${scr}/max_brightness`]));

export default function OSD() {
  const [visible, setVis] = createState(false);

  const [osdText, setOsdText] = createState("");
  const [osdIcon, setOsdIcon] = createState("");

  const delayHide = debounce(() => setVis(false), 2000);
  const showOSD = () => {
    setVis(true);
    delayHide();
  };

  speaker.connect("notify::mute", (e) => {
    setOsdIcon(e.get_volume_icon());
    setOsdText(e.get_mute() ? "Muted" : "");
    showOSD();
  });

  microphone.connect("notify::mute", (e) => {
    setOsdIcon(e.get_volume_icon());
    setOsdText(e.get_mute() ? "Muted" : "");
    showOSD();
  });

  speaker.connect("notify::volume", (e) => {
    setOsdIcon(e.get_volume_icon());
    setOsdText(`${Math.round(e.get_volume() * 100)}%`);
    showOSD();
  });

  monitorFile(`${dir}/${scr}/brightness`, (f) => {
    const brightness = Number(sh([`cat ${f}`]));
    setOsdIcon("display-brightness-symbolic");
    setOsdText(`${Math.round((brightness / max) * 100)}%`);
    showOSD();
  });

  return (
    <window
      visible={visible}
      name="osd"
      namespace="ags"
      anchor={Astal.WindowAnchor.BOTTOM}
      layer={Astal.Layer.OVERLAY}
      application={app}
    >
      <Gtk.Box orientation={VERTICAL}>
        <Gtk.Image iconName={osdIcon} />
        <Gtk.Label label={osdText} />
      </Gtk.Box>
    </window>
  );
}
