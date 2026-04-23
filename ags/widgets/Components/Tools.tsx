import { Gtk } from "ags/gtk4";
import { cmdOutBufStream } from "../../services/core";
import {
  CENTER,
  END,
  HORIZONTAL,
  lineStr,
  setAsrText,
  setStreamProc,
  streamProc,
  VERTICAL,
} from "../../services/vars";

const CMD_ASRALSA = ["/home/derren/.local/bin/asr-alsa.sh"];
const CMD_ASR_MIC = ["/home/derren/.local/bin/asr-mic.sh"];

export function ToolsIcon() {
  return (
    <Gtk.Box class="tools-box" orientation={HORIZONTAL}>
      <Gtk.Button
        class="unset stop"
        iconName="media-playback-stop-symbolic"
        visible={streamProc.as(s => s !== null)}
        tooltipText="Terminate Process"
        onClicked={() => {
          streamProc()?.kill();
          setStreamProc(null);
        }}
      />
      <Gtk.MenuButton class="unset tools">
        <Gtk.Label
          valign={CENTER}
          class={streamProc.as((s) => (s ? "animator on" : "animator"))}
          label={streamProc.as((s) => (s ? "" : "󱙺"))}
        />
        <Gtk.Popover hasArrow={false}>
          <Gtk.Box orientation={VERTICAL}>
            <Gtk.Box hexpand>
              <Gtk.Label css="font-size: 48px;" hexpand xalign={0} label="󰺹" />
              <Gtk.Button
                halign={END}
                valign={CENTER}
                class="round-btn"
                sensitive={lineStr.as((s) => s.length == 0)}
                iconName="audio-headphones-symbolic"
                onClicked={() => {
                  setStreamProc(cmdOutBufStream(CMD_ASRALSA, "asr-alsa", setAsrText));
                }}
              />
              <Gtk.Button
                halign={END}
                valign={CENTER}
                class="round-btn"
                sensitive={lineStr.as((s) => s.length == 0)}
                iconName="audio-input-microphone-symbolic"
                onClicked={() => {
                  setStreamProc(cmdOutBufStream(CMD_ASR_MIC, "asr-mic", setAsrText));
                }}
              />
            </Gtk.Box>
          </Gtk.Box>
        </Gtk.Popover>
      </Gtk.MenuButton>
    </Gtk.Box>
  );
}
