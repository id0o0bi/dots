import { Gtk } from "ags/gtk4";
import { CENTER, END, START, VERTICAL } from "../../services/vars";
import { createBinding, For } from "ags";
import { hasNotifications, notifd, Notification } from "./Notification";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import { formatTimeStamp } from "../../services/util";

const sorted = (notifications: AstalNotifd.Notification[]) =>
  notifications.sort((a, b) => b.time - a.time);

export default function DashNotify() {
  return (
    <Gtk.Box class="dashNotif" orientation={VERTICAL}>
      <Gtk.Box class="empty" visible={hasNotifications((x) => !x)}>
        <Gtk.Label
          hexpand
          vexpand
          valign={CENTER}
          halign={CENTER}
          sensitive={false}
          label="󱇦"
        />
      </Gtk.Box>
      <Gtk.ScrolledWindow
        vexpand={true}
        visible={hasNotifications}
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
      >
        <Gtk.ListBox
          class="notifications"
          valign={START}
          selectionMode={Gtk.SelectionMode.NONE}
        >
          <For each={createBinding(notifd, "notifications")(sorted)}>
            {(notification: AstalNotifd.Notification) => (
              <Gtk.ListBoxRow>
                <Gtk.Box orientation={VERTICAL}>
                  <Notification notification={notification} />
                  <Gtk.Box class="status" spacing={4}>
                    <Gtk.Label
                      halign={START}
                      hexpand
                      sensitive={false}
                      label={formatTimeStamp(notification.time)}
                    />
                    {/* nf-fa-info_circle, from the theme's Nerd Font.
                        Nerd Font patches sit on the em-box centre (330/1000em),
                        the lowercase text on its x-height centre (232), so the
                        glyph reads ~1px high; nudge it back onto the text. */}
                    <Gtk.Label
                      sensitive={false}
                      label={"\uF05A"}
                      marginTop={2}
                      tooltipText={notification.body}
                    />
                    <Gtk.Label
                      halign={END}
                      sensitive={false}
                      label={notification.appName}
                    />
                  </Gtk.Box>
                </Gtk.Box>
              </Gtk.ListBoxRow>
            )}
          </For>
        </Gtk.ListBox>
      </Gtk.ScrolledWindow>
    </Gtk.Box>
  );
}
