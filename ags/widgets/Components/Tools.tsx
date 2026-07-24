import { Gtk } from "ags/gtk4";
import { createState } from "ags";
import { cmdOutBufStream } from "../../services/core";
import {
  CENTER,
  HORIZONTAL,
  setAsrText,
  setStreamProc,
  streamProc,
  VERTICAL,
} from "../../services/vars";
import Translator from "./Translator";

const CMD_ASR_MIC = ["/home/derren/.local/bin/asr-mic.sh"];

const [activePage, setActivePage] = createState("asr");

export function ToolsIcon() {
  return (
    <Gtk.Box class="tools-box" orientation={HORIZONTAL}>
      <Gtk.MenuButton class="unset tools">
        <Gtk.Label
          valign={CENTER}
          class={streamProc.as((s) => (s ? "animator on" : "animator"))}
          label={streamProc.as((s) => (s ? "" : "󱙺"))}
        />
        <Gtk.Popover hasArrow={false}>
          <Gtk.Box orientation={VERTICAL} class="tools-popover">
            {/* Tab switcher */}
            <Gtk.Box orientation={HORIZONTAL} halign={CENTER} class="tab-bar" spacing={0}>
              <Gtk.Button
                class={activePage.as(p => p === "asr" ? "tab-btn active" : "tab-btn")}
                onClicked={() => setActivePage("asr")}
              >
                <Gtk.Box orientation={HORIZONTAL} spacing={6}>
                  <Gtk.Label label="󰺹" css="font-size: 18px;" />
                  <Gtk.Label label="ASR" />
                </Gtk.Box>
              </Gtk.Button>
              <Gtk.Button
                class={activePage.as(p => p === "ocr" ? "tab-btn active" : "tab-btn")}
                onClicked={() => setActivePage("ocr")}
              >
                <Gtk.Box orientation={HORIZONTAL} spacing={6}>
                  <Gtk.Label label="" css="font-size: 18px;" />
                  <Gtk.Label label="OCR" />
                </Gtk.Box>
              </Gtk.Button>
            </Gtk.Box>

            {/* ASR page */}
            <Gtk.Box
              orientation={VERTICAL}
              visible={activePage.as(p => p === "asr")}
              class="asr-page"
            >
              <Gtk.Button
                class="round-btn"
                halign={CENTER}
                iconName={streamProc.as(s =>
                  s !== null ? "media-playback-stop-symbolic" : "audio-input-microphone-symbolic",
                )}
                tooltipText={streamProc.as(s => s !== null ? "Stop" : "Mic ASR")}
                onClicked={() => {
                  if (streamProc()) {
                    streamProc()?.kill();
                    setStreamProc(null);
                  } else {
                    setStreamProc(cmdOutBufStream(CMD_ASR_MIC, "asr-mic", setAsrText));
                  }
                }}
              />
              <Gtk.Label
                label="Press to Start/Stop ASR"
                halign={CENTER}
                class="asr-tip"
              />
            </Gtk.Box>

            {/* OCR / Translate page */}
            <Gtk.Box
              orientation={VERTICAL}
              visible={activePage.as(p => p === "ocr")}
            >
              <Translator />
            </Gtk.Box>
          </Gtk.Box>
        </Gtk.Popover>
      </Gtk.MenuButton>
    </Gtk.Box>
  );
}
