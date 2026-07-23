import { For, createComputed, createState } from "ags";
import { exec } from "ags/process";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import AstalHyprland from "gi://AstalHyprland";
import AstalApps from "gi://AstalApps";
import Gio from "gi://Gio";
import { VERTICAL } from "../services/vars";

const hyprland = AstalHyprland.get_default();
let apps: AstalApps.Apps | null = null;

function getApps(): AstalApps.Apps {
  if (!apps) apps = new AstalApps.Apps();
  return apps;
}

interface SwitcherEntry {
  client: AstalHyprland.Client;
  iconName: string | null;
  appName: string;
  selected: boolean;
}

export default function WindowSwitcher() {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor;
  let win: Astal.Window;

  const [clients, setClients] = createState<AstalHyprland.Client[]>([]);
  const [selectedIndex, setSelectedIndex] = createState(0);

  // Selected window title (shown at top of panel)
  const selectedTitle = createComputed(() => {
    const c = clients()[selectedIndex()];
    return c ? (c.title || c.class) : "";
  });

  const entries = createComputed((): SwitcherEntry[] =>
    clients().map((c, i) => {
      const match = _matchApp(c.class);
      return {
        client: c,
        iconName: match?.iconName ?? null,
        appName: match?.name ?? c.class,
        selected: i === selectedIndex(),
      };
    }),
  );

  // Match a Hyprland client class to an AstalApps entry for proper icon + name
  function _matchApp(wmClass: string): AstalApps.Application | null {
    const lower = wmClass.toLowerCase();
    const list = getApps().get_list();

    // Direct name match first
    let found = list.find((a) => a.name.toLowerCase() === lower);
    if (found) return found;

    // Match by desktop entry filename (e.g. "firefox.desktop" ~ "firefox")
    found = list.find((a) => {
      const entry = a.get_entry();
      return entry?.toLowerCase() === `${lower}.desktop`;
    });
    if (found) return found;

    // Substring match as fallback
    found = list.find((a) => a.name.toLowerCase().includes(lower));
    return found ?? null;
  }

  function snapshotClients() {
    const focusedWs = hyprland.get_focused_workspace();

    const all = hyprland
      .get_clients()
      .filter((c) => c.class !== "")
      .sort((a, b) => {
        const aOnCurrent = a.workspace.id === focusedWs.id ? 0 : 1;
        const bOnCurrent = b.workspace.id === focusedWs.id ? 0 : 1;
        if (aOnCurrent !== bOnCurrent) return aOnCurrent - bOnCurrent;
        if (a.workspace.id !== b.workspace.id) return a.workspace.id - b.workspace.id;
        return b.focusHistoryID - a.focusHistoryID;
      });

    const focused = hyprland.get_focused_client();
    let startIndex = 0;
    if (focused) {
      const idx = all.findIndex((c) => c.address === focused.address);
      if (idx >= 0) startIndex = (idx + 1) % Math.max(all.length, 1);
    }

    setClients(all);
    setSelectedIndex(startIndex);
  }

  function focusSelected() {
    const client = clients()[selectedIndex()];
    if (!client) {
      win.visible = false;
      return;
    }
    const current = hyprland.get_clients().find((c) => c.address === client.address);
    if (!current) {
      win.visible = false;
      return;
    }
    const addr = `address:0x${current.address}`;
    win.visible = false;
    exec(["sh", "-c", `hyprctl dispatch focuswindow '${addr}'`]);
  }

  function onKey(
    _e: Gtk.EventControllerKey,
    keyval: number,
    _keycode: number,
    mod: number,
  ) {
    const max = clients().length;

    if (keyval === Gdk.KEY_Escape) {
      win.visible = false;
      return;
    }

    if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) {
      if (max > 0) focusSelected();
      return;
    }

    if (max === 0) return;

    const shift = mod & Gdk.ModifierType.SHIFT_MASK;

    if (keyval === Gdk.KEY_Tab || keyval === Gdk.KEY_ISO_Left_Tab) {
      setSelectedIndex(shift
        ? (selectedIndex() - 1 + max) % max
        : (selectedIndex() + 1) % max);
      return;
    }

    if (keyval === Gdk.KEY_Right) {
      setSelectedIndex((selectedIndex() + 1) % max);
      return;
    }

    if (keyval === Gdk.KEY_Left) {
      setSelectedIndex((selectedIndex() - 1 + max) % max);
      return;
    }
  }

  // Proper icon resolution matching the Launcher's approach
  function setAppIcon(image: Gtk.Image, iconName: string | null) {
    const FALLBACK = "application-x-executable";

    if (!iconName) {
      image.set_from_icon_name(FALLBACK);
      return;
    }

    // Absolute file path
    if (iconName.startsWith("/")) {
      try {
        const file = Gio.File.new_for_path(iconName);
        if (file.query_exists(null)) {
          image.set_from_file(iconName);
          return;
        }
      } catch (_e) { /* fall through */ }
    }

    // Themed icon via Gio
    try {
      const themedIcon = Gio.ThemedIcon.new(iconName);
      image.set_from_gicon(themedIcon);
    } catch (_e) {
      image.set_from_icon_name(FALLBACK);
    }
  }

  return (
    <window
      visible={false}
      name="win-switcher"
      namespace="ags"
      css="background: transparent;"
      anchor={TOP | LEFT | RIGHT | BOTTOM}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      keymode={Astal.Keymode.EXCLUSIVE}
      layer={Astal.Layer.TOP}
      application={app}
      $={(self) => (win = self)}
      onNotifyVisible={({ visible }) => {
        if (visible) snapshotClients();
      }}
    >
      <Gtk.EventControllerKey
        onKeyPressed={onKey}
        propagationPhase={Gtk.PropagationPhase.CAPTURE}
      />
      <Gtk.CenterBox
        name="switcher-backdrop"
        hexpand
        vexpand
        $={(self) => {
          const gesture = new Gtk.GestureClick();
          gesture.connect("pressed", () => {
            win.visible = false;
          });
          self.add_controller(gesture);
        }}
      >
        <Gtk.Box $type="start" />
        <Gtk.Box $type="center" css="margin-top: 30px;">
          {/* Panel */}
          <Gtk.Box
            class="switcher-panel"
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            orientation={VERTICAL}
            visible={clients((c) => c.length > 0)}
          >
            {/* Horizontal icon row */}
            <Gtk.Box class="switcher-icons" halign={Gtk.Align.CENTER} spacing={6}>
              <For each={entries}>
                {(entry: SwitcherEntry) => (
                  <Gtk.Button
                    canFocus={false}
                    class="switcher-icon"
                    valign={Gtk.Align.END}
                    onClicked={() => {
                      const current = hyprland
                        .get_clients()
                        .find((c) => c.address === entry.client.address);
                      if (!current) {
                        win.visible = false;
                        return;
                      }
                      const addr = `address:0x${current.address}`;
                      win.visible = false;
                      exec(["sh", "-c", `hyprctl dispatch focuswindow '${addr}'`]);
                    }}
                  >
                    <Gtk.Image
                      pixelSize={entry.selected ? 96 : 48}
                      $={(ref) => setAppIcon(ref, entry.iconName)}
                    />
                  </Gtk.Button>
                )}
              </For>
            </Gtk.Box>

            {/* Window title below icons */}
            <Gtk.Label
              class="switcher-title"
              halign={Gtk.Align.CENTER}
              label={selectedTitle}
              ellipsize={3}
              maxWidthChars={60}
              justify={Gtk.Justification.CENTER}
            />
          </Gtk.Box>

          {/* Empty state */}
          <Gtk.Box
            class="switcher-panel empty"
            orientation={VERTICAL}
            visible={clients((c) => c.length === 0)}
          >
            <Gtk.Label
              css="font-size: 48px; opacity: 0.4;"
              halign={Gtk.Align.CENTER}
              label="󰵀"
            />
            <Gtk.Label sensitive={false} halign={Gtk.Align.CENTER} label="No windows" />
            <Gtk.Label
              halign={Gtk.Align.CENTER}
              sensitive={false}
              css="font-size: 0.8em; opacity: 0.6;"
              label="Esc to close"
            />
          </Gtk.Box>
        </Gtk.Box>
      </Gtk.CenterBox>
    </window>
  );
}
