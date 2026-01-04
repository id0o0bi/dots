import { createComputed, createState, For } from "ags";
import { Gtk } from "ags/gtk4";
import { ArchUpdate } from "../../services/type";
import { getSysUpdate } from "../../services/vendors/ArchUpdate";
import { cmdOutBufStream } from "../../services/core";
import {
  CENTER,
  END,
  HORIZONTAL,
  SEC_PKGS,
  START,
  VERTICAL,
} from "../../services/vars";

export const [update, setUpdates] = createState<Array<ArchUpdate>>([]);
// setInterval(getSysUpdate, 10000); // 10s for debug
setInterval(getSysUpdate, 10800000); // 3hour for use

const CMD = ["/home/derren/.local/bin/archupdate.sh"];

export function UpdateIcon() {
  // software-update-available-symbolic, software-update-urgent-symbolic
  let icon = createComputed([update], (u) => {
    if (u.length < 1) return "";
    let urgent = u.find((i) => SEC_PKGS.includes(i.package));
    return urgent
      ? "software-update-urgent-symbolic"
      : "software-update-available-symbolic";
  });

  return (
    <Gtk.MenuButton class="unset" visible={icon((i) => i.length > 0)}>
      <Gtk.Image
        iconName={icon}
        tooltipText={update((u) => `${u.length} updates`)}
      />
      <Gtk.Popover hasArrow={false}>
        <Gtk.Box orientation={VERTICAL}>
          <Gtk.Box orientation={HORIZONTAL}>
            <Gtk.Box hexpand={true}>
              <Gtk.Image iconName={icon} pixelSize={48} />
            </Gtk.Box>
            <Gtk.Box
              hexpand={false}
              halign={END}
              valign={CENTER}
              orientation={HORIZONTAL}
            >
              <Gtk.Button
                iconName="folder-download-symbolic"
                class="round-btn"
                tooltipText="Update"
                onClicked={() => cmdOutBufStream(CMD, "sys-update", true)}
              />
            </Gtk.Box>
          </Gtk.Box>
          <Gtk.Separator css="margin: 8px 0;" />
          <Gtk.ScrolledWindow
            class="updates"
            hscrollbarPolicy={Gtk.PolicyType.NEVER}
            vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
            maxContentHeight={680}
            propagateNaturalHeight={true}
          >
            <Gtk.ListBox class="packages" hexpand valign={START}>
              <For each={update}>
                {(p) => (
                  <Gtk.ListBoxRow onActivate={(e) => console.log(e)}>
                    <Gtk.Box orientation={VERTICAL}>
                      <Gtk.Label halign={START} label={p.package} />
                      <Gtk.Label
                        halign={START}
                        sensitive={false}
                        css="font-size:10px;"
                        label={`${p.version[0]}  ${p.version[1]}`}
                      />
                    </Gtk.Box>
                  </Gtk.ListBoxRow>
                )}
              </For>
            </Gtk.ListBox>
          </Gtk.ScrolledWindow>
        </Gtk.Box>
      </Gtk.Popover>
    </Gtk.MenuButton>
  );
}
