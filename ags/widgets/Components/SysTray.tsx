import { createBinding, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalTray from "gi://AstalTray";

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
            <Gtk.Image gicon={createBinding(item, "gicon")} />
          </Gtk.Button>
        )}
      </For>
    </Gtk.Box>
  );
}
