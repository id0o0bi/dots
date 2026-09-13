import { createBinding, createState, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalTray from "gi://AstalTray";
import GLib from "gi://GLib";

/**
 * WeChat's tray icon.
 *
 * WeChat animates its tray icon while there are unread messages and sends
 * nothing once they are read - it never sets SNI status, and its frames carry
 * no red badge (all verified with a probe), so animation IS the unread signal:
 * any frame -> attention, none for QUIET_MS -> back to normal.
 *
 * We swap in a symbolic icon from our own theme (`assets/icons`, added to the
 * icon search path in init()) so GTK tints it with the bar colour; the
 * attention variant just adds a <circle class="error"> dot. Other apps keep
 * their own (colored) gicon.
 */

const WECHAT_ICON = "ags-wechat-symbolic";
const WECHAT_ATTENTION_ICON = "ags-wechat-attention-symbolic";
const QUIET_MS = 1000; // no frames this long -> read (frames come every ~0.4s)

function WechatIcon({ item }: { item: AstalTray.TrayItem }) {
  // WeChat only sends frames while unread, so "flickering" is the whole state;
  // the icon is a pure function of it.
  const [flickering, setFlickering] = createState(false);

  return (
    <Gtk.Image
      iconName={flickering.as((f) =>
        f ? WECHAT_ATTENTION_ICON : WECHAT_ICON,
      )}
      $={(self: Gtk.Image) => {
        let timer = 0;

        const onFrame = () => {
          setFlickering(true);
          if (timer) GLib.source_remove(timer);
          timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, QUIET_MS, () => {
            timer = 0;
            setFlickering(false);
            return GLib.SOURCE_REMOVE;
          });
        };

        const ids = [
          item.connect("notify::icon-pixbuf", onFrame),
          item.connect("notify::gicon", onFrame),
        ];

        self.connect("destroy", () => {
          ids.forEach((id) => item.disconnect(id));
          if (timer) GLib.source_remove(timer);
        });
      }}
    />
  );
}

function TrayItemIcon({ item }: { item: AstalTray.TrayItem }) {
  if (item.id === "wechat") return <WechatIcon item={item} />;
  return <Gtk.Image gicon={createBinding(item, "gicon")} />;
}

export default function Tray() {
  const tray = AstalTray.get_default();

  const filter = (
    items: Array<AstalTray.TrayItem>,
  ): Array<AstalTray.TrayItem> => {
    return items.filter((item) => item.id);
  };

  const init = (btn: Gtk.Button, item: AstalTray.TrayItem) => {
    // popover showing the app's dbusmenu, anchored to the button
    const popover = new Gtk.PopoverMenu();
    popover.set_has_arrow(false);
    popover.set_position(Gtk.PositionType.BOTTOM);
    popover.set_parent(btn);
    popover.set_menu_model(item.menuModel);

    // actions used by the menu items (named "dbusmenu.*")
    const insertActions = () => {
      btn.insert_action_group("dbusmenu", item.actionGroup);
    };
    insertActions();
    item.connect("notify::action-group", insertActions);

    // keep the popover in sync if the app swaps its menu
    item.connect("notify::menu-model", () => {
      popover.set_menu_model(item.menuModel);
    });

    const showMenu = () => {
      if (!item.menuModel) return;
      // let the app update its menu before showing it
      item.about_to_show();
      popover.popup();
    };

    const activate = () => {
      // SNI "Activate": ask the app to show its main window
      item.activate(0, 0);
    };

    // left/right/middle click handling
    const gesture = new Gtk.GestureClick({ button: 0 });
    gesture.connect("pressed", (_g, _n, x, y) => {
      switch (gesture.get_current_button()) {
        case 1: // left click: restore window, or menu if app only has a menu
          if (item.isMenu) showMenu();
          else activate();
          break;
        case 2: // middle click
          item.secondary_activate(x, y);
          break;
        case 3: // right click: context menu
          showMenu();
          break;
      }
    });
    btn.add_controller(gesture);
  };

  return (
    <Gtk.Box class="sysTray">
      <For each={createBinding(tray, "items")(filter)}>
        {(item: AstalTray.TrayItem) => (
          <Gtk.Button
            class="unset"
            tooltipText={createBinding(item, "tooltipText")}
            $={(self) => init(self, item)}
          >
            <TrayItemIcon item={item} />
          </Gtk.Button>
        )}
      </For>
    </Gtk.Box>
  );
}
