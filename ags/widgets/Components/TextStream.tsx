import { Gtk } from "ags/gtk4";
import { BASELINE_CENTER, lineStr, streamProc } from "../../services/vars";
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
      {/*<Gtk.Button class="unset" iconName="object-flip-horizontal-symbolic" />*/}
      {/*<Gtk.Image file={`${ASSETS}/sound.gif`} />*/}
      <Gtk.Button
        class="unset"
        iconName="media-playback-stop-symbolic"
        tooltipText="Terminate Process"
        onClicked={() => {
          // console.log(streamProc);
          streamProc.signal(2);
        }}
      />
    </Gtk.Box>
  );
}
