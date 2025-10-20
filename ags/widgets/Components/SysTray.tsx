import { createBinding, For } from "ags";
import { Gtk } from "ags/gtk4";
import AstalTray from "gi://AstalTray";

export default function Tray() {
  const tray = AstalTray.get_default();
  // const items = ;

  const filter = (
    items: Array<AstalTray.TrayItem>,
  ): Array<AstalTray.TrayItem> => {
    return items.filter((item) => item.id);
  };

  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel;
    btn.get_popover()?.set_has_arrow(false);
    btn.insert_action_group("dbusmenu", item.actionGroup);
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup);
    });
  };

  return (
    <Gtk.Box class="sysTray">
      <For each={createBinding(tray, "items")(filter)}>
        {(item: AstalTray.TrayItem) => (
          <Gtk.MenuButton class="unset" $={(self) => init(self, item)}>
            <Gtk.Image gicon={createBinding(item, "gicon")} />
          </Gtk.MenuButton>
        )}
      </For>
    </Gtk.Box>
  );
}
