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
                  <Gtk.Box class="status">
                    <Gtk.Label
                      halign={START}
                      hexpand
                      sensitive={false}
                      label={formatTimeStamp(notification.time)}
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
