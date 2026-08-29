import { For, createComputed, createState } from "ags";
import { execAsync } from "ags/process";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import AstalHyprland from "gi://AstalHyprland";
import AstalApps from "gi://AstalApps";
import Gio from "gi://Gio";
import { VERTICAL } from "../services/vars";

// Exposed to the app request handler so the Hyprland `Super+Tab` bind can
// open-or-advance instead of blindly toggling (which closed the switcher on
// every repeated Tab press while holding Super).
export const switcherControl = {
  win: null as Astal.Window | null,
  toggleOrStep: () => {},
};

const hyprland = AstalHyprland.get_default();
let apps: AstalApps.Apps | null = null;

function getApps(): AstalApps.Apps {
  if (!apps) apps = new AstalApps.Apps();
  return apps;
}

interface SwitcherEntry {
  iconName: string | null;
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
    clients().map((c, i) => ({
      iconName: _matchApp(c.class)?.iconName ?? null,
      selected: i === selectedIndex(),
    })),
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
        return b.focusHistoryId - a.focusHistoryId;
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

  // Advance to the next window (used by the request handler when the
  // switcher is already open and Super+Tab is pressed again).
  function step() {
    const max = clients().length;
    if (max > 0) setSelectedIndex((selectedIndex() + 1) % max);
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
    win.visible = false;
    focusAddress(current.address);
  }

  // Focus a Hyprland client by its address. AstalHyprland reports the
  // address WITHOUT the "0x" prefix (e.g. "55685c2ccb00"), while hyprctl
  // dispatchers expect the full "address:0x..." form. Hyprland >= 0.46
  // replaced the old `focuswindow` syntax with lua dispatchers; hyprctl
  // prints dispatch errors to stdout while still exiting 0, so this is
  // best-effort and never throws.
  function focusAddress(address: string) {
    execAsync([
      "sh",
      "-c",
      `hyprctl dispatch 'hl.dsp.focus({ window = "address:0x${address}" })'`,
    ]).catch(() => undefined);
  }

  function onKey(
    _e: Gtk.EventControllerKey,
    keyval: number,
    _keycode: number,
    mod: number,
  ) {
    if (keyval !== Gdk.KEY_Tab && keyval !== Gdk.KEY_ISO_Left_Tab) return;
    const max = clients().length;
    if (max === 0) return;

    const shift = mod & Gdk.ModifierType.SHIFT_MASK;

    // Plain Super+Tab is handled by the Hyprland bind via the request
    // handler (step forward). Super+Shift+Tab is unbound, so it reaches us
    // and steps backward here.
    if ((mod & Gdk.ModifierType.SUPER_MASK) && !shift) return;

    setSelectedIndex(shift
      ? (selectedIndex() - 1 + max) % max
      : (selectedIndex() + 1) % max);
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
      $={(self) => {
        win = self;
        switcherControl.win = self;
        switcherControl.toggleOrStep = () => {
          if (self.visible) step();
          else self.visible = true;
        };
      }}
      onNotifyVisible={({ visible }) => {
        if (visible) snapshotClients();
      }}
    >
      <Gtk.EventControllerKey
        onKeyPressed={onKey}
        onKeyReleased={(_e, keyval) => {
          // Releasing Super while the switcher is open confirms the
          // selection. Only Super matters here — Tab/Shift+Tab releases
          // are ignored.
          if (
            win.visible &&
            (keyval === Gdk.KEY_Super_L || keyval === Gdk.KEY_Super_R)
          ) {
            focusSelected();
          }
        }}
        propagationPhase={Gtk.PropagationPhase.CAPTURE}
      />
      <Gtk.CenterBox name="switcher-backdrop" hexpand vexpand>
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
              label="Release to close"
            />
          </Gtk.Box>
        </Gtk.Box>
      </Gtk.CenterBox>
    </window>
  );
}
