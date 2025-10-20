import { createBinding, createState, For, onCleanup } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import AstalNotifd from "gi://AstalNotifd";
import { BASELINE_CENTER, END, START, VERTICAL } from "../../services/vars";
import { fileExists } from "../../services/util";
import Adw from "gi://Adw";
import app from "ags/gtk4/app";
import GLib from "gi://GLib?version=2.0";
import Pango from "gi://Pango?version=1.0";

export const notifd = AstalNotifd.get_default();
export const hasNotifications = createBinding(notifd, "notifications").as(
  (ns) => ns.length > 0,
);

export const clearNotifications = () => {
  notifd.get_notifications().map((n) => n.dismiss());
};

const urgency = (u: AstalNotifd.Urgency): string => {
  return u === AstalNotifd.Urgency.CRITICAL
    ? "critical"
    : u === AstalNotifd.Urgency.NORMAL
      ? "normal"
      : "low";
};

export const NotifIcon = () => (
  <Gtk.Label label="" visible={hasNotifications} />
);

export const Notification = ({
  notification: n,
}: {
  notification: AstalNotifd.Notification;
}) => {
  let icon = n.image || n.appIcon || n.desktopEntry || "emoji-objects-symbolic";
  icon = icon.replace(/^file:\/\//, "");
  let [valid, _] = Pango.parse_markup(n.body, -1, "0");
  let body = valid ? n.body : GLib.markup_escape_text(n.body, -1);
  return (
    <Gtk.Box class="content" valign={START} vexpand={false} hexpand>
      <Adw.Avatar
        class="image"
        valign={START}
        size={52}
        customImage={
          fileExists(icon) ? Gdk.Texture.new_from_filename(icon) : undefined
        }
        iconName={icon}
        text={n.appName}
      />
      <Gtk.Box class="sum" orientation={VERTICAL} hexpand vexpand={false}>
        <Gtk.Box class="title-box" hexpand>
          <Gtk.Inscription
            hexpand
            class={urgency(n.urgency)}
            valign={BASELINE_CENTER}
            wrapMode={Pango.WrapMode.NONE}
            textOverflow={Gtk.InscriptionOverflow.ELLIPSIZE_END}
            text={n.summary}
          />
          <Gtk.Button
            iconName="edit-delete-symbolic"
            onClicked={() => n.dismiss()}
            halign={END}
            valign={START}
          />
        </Gtk.Box>
        <Gtk.Label
          class="body"
          wrap
          wrapMode={Gtk.WrapMode.WORD}
          useMarkup
          sensitive={false}
          hexpand
          halign={START}
          xalign={0}
          label={body}
        />
        {n.actions.length > 0 && (
          <Gtk.Box class="actions">
            {n.actions.map(({ label, id }) => (
              <Gtk.Button label={label} onClicked={() => n.invoke(id)} />
            ))}
          </Gtk.Box>
        )}
      </Gtk.Box>
    </Gtk.Box>
  );
};

export const Popups = () => {
  const [pops, setPops] = createState(new Array<AstalNotifd.Notification>());

  const notifiedHandler = notifd.connect("notified", (_, id, replaced) => {
    if (notifd.dontDisturb) return;

    const pop = notifd.get_notification(id);
    // console.log(pop.summary);
    if (replaced && pops.get().some((n) => n.id === id)) {
      setPops((ns) => ns.map((n) => (n.id === id ? pop : n)));
    } else {
      setPops((ns) => [pop, ...ns]);
    }
  });

  const resolvedHandler = notifd.connect("resolved", (_, id) => {
    setPops((ns) => ns.filter((n) => n.id !== id));
  });

  let cleanUp = setInterval(() => {
    let ts = Math.floor(Date.now() / 1000);
    setPops((ns) =>
      ns.filter((n) => {
        return n.time + 10 > ts;
      }),
    );
  }, 2000);

  onCleanup(() => {
    notifd.disconnect(notifiedHandler);
    notifd.disconnect(resolvedHandler);
    clearInterval(cleanUp);
  });

  return (
    <window
      name="popups"
      namespace="ags"
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      visible={pops.as((p) => p.length > 0)}
      defaultWidth={360}
      application={app}
    >
      <Gtk.Box
        class="popups"
        valign={START}
        hexpand
        halign={END}
        orientation={VERTICAL}
      >
        <For each={pops}>
          {(pop: AstalNotifd.Notification) => (
            <Gtk.Box hexpand class="row">
              <Notification notification={pop} />
            </Gtk.Box>
          )}
        </For>
      </Gtk.Box>
    </window>
  );
};
