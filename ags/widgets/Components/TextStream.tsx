import { Gtk } from "ags/gtk4";
import { asrText, BASELINE_CENTER, lineStr } from "../../services/vars";
import Pango from "gi://Pango";

export default function TextStream() {
  return (
    <Gtk.Box
      hexpand
      visible={lineStr.as((s) => s.length > 0)}
      vexpand={false}
      class="textStream"
    >
      <Gtk.Inscription
        markup={lineStr}
        hexpand
        xalign={1}
        valign={BASELINE_CENTER}
        wrapMode={Pango.WrapMode.NONE}
        sensitive={false}
        textOverflow={Gtk.InscriptionOverflow.ELLIPSIZE_START}
      />
    </Gtk.Box>
  );
}
