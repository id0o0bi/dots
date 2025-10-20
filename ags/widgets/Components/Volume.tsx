import { Accessor, createBinding, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalWp from "gi://AstalWp";
import { HORIZONTAL, VERTICAL } from "../../services/vars";

const {
  defaultSpeaker: speaker,
  defaultMicrophone: microphone,
  audio,
} = AstalWp.get_default()!;

export default function Volume() {
  let speakers = createBinding(audio, "speakers");

  const sorted = (arr: Array<AstalWp.Endpoint>) => {
    return arr
      .filter((a) => !!a.get_id())
      .sort((a, b) => {
        let aName = a.get_name() || a.get_pw_property("node.nick") || "";
        let bName = b.get_name() || b.get_pw_property("node.nick") || "";
        return bName.localeCompare(aName);
      });
  };

  return (
    <Gtk.MenuButton
      class="unset"
      tooltipText={createBinding(
        speaker,
        "volume",
      )((v) => `${Math.floor(v * 100)}%`)}
    >
      <Gtk.Image iconName={createBinding(speaker, "volumeIcon")} />
      <Gtk.Popover hasArrow={false}>
        <Gtk.Box class="volumeRocker" orientation={VERTICAL}>
          <Gtk.Box class="control" orientation={HORIZONTAL}>
            <Gtk.Button
              class="round-btn"
              iconName={createBinding(speaker, "volumeIcon")}
              onClicked={() => speaker.set_mute(!speaker.mute)}
            />
            <slider
              hexpand={true}
              onChangeValue={({ value }) => {
                speaker.set_volume(value);
              }}
              value={createBinding(speaker, "volume")}
            />
          </Gtk.Box>
          <Gtk.Box class="control" orientation={HORIZONTAL}>
            <Gtk.Button
              class="round-btn"
              iconName={createBinding(microphone, "volumeIcon")}
              onClicked={() => microphone.set_mute(!microphone.mute)}
            />
            <slider
              hexpand={true}
              onChangeValue={({ value }) => {
                microphone.set_volume(value);
              }}
              value={createBinding(microphone, "volume")}
            />
          </Gtk.Box>
          <Gtk.Separator css="margin-bottom: 8px;" />
          <Gtk.Box class="linked vertical" orientation={VERTICAL}>
            <For each={speakers(sorted)}>
              {(s: AstalWp.Endpoint) => (
                <Gtk.ToggleButton
                  active={createBinding(speaker, "id")((id) => id == s.id)}
                  label={s.get_pw_property("node.nick") || s.get_name()}
                  onClicked={(self) => {
                    s.set_is_default(true);
                    self.set_active(speaker.id == s.id);
                  }}
                />
              )}
            </For>
          </Gtk.Box>
        </Gtk.Box>
      </Gtk.Popover>
    </Gtk.MenuButton>
  );
}

export function MicrophoneMute() {
  return (
    <Gtk.MenuButton class="unset" visible={createBinding(microphone, "mute")}>
      <Gtk.Image class="err" iconName="microphone-sensitivity-muted-symbolic" />
    </Gtk.MenuButton>
  );
}
