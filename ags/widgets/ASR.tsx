import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { asrText } from "../services/vars";
import { HORIZONTAL } from "../services/vars";
import Pango from "gi://Pango";

export default function ASR() {
  return (
    <window
      visible={asrText.as((s) => s.length > 0)}
      name="asr"
      namespace="ags"
      anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
      layer={Astal.Layer.OVERLAY}
      application={app}
    >
      <Gtk.Box class="asr" orientation={HORIZONTAL}>
        <Gtk.Label
          label={asrText}
          wrap
          lines={2}
          xalign={0.5}
          wrapMode={Pango.WrapMode.WORD}
          naturalWrapMode={Gtk.NaturalWrapMode.WORD}
          ellipsize={Pango.EllipsizeMode.START}
        />
      </Gtk.Box>
    </window>
  );
}
