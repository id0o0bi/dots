import { For, createComputed, createState } from "ags";
import { Astal, Gtk, Gdk } from "ags/gtk4";
import AstalApps from "gi://AstalApps";
import Gio from "gi://Gio";
import app from "ags/gtk4/app";
import { CENTER } from "../services/vars";

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;
const { HORIZONTAL, VERTICAL } = Gtk.Orientation;

const cols = 6;
const rows = 4;

export default function Launcher() {
  let searchentry: Gtk.Entry;
  let win: Astal.Window;
  let lastScrollTime = 0;
  const SCROLL_DEBOUNCE_MS = 300; // Minimum time between scroll-triggered page changes

  const apps = new AstalApps.Apps();
  const [page, setPage] = createState(1);
  const [data, setData] = createState(apps.get_list());

  const pages = createComputed(() =>
    Array.from(
      { length: Math.ceil(data().length / (cols * rows)) },
      (_, i) => i + 1,
    ),
  );

  // sort apps, clean FlowBox, rerender list
  const pageData = createComputed(() => {
    let [p, d] = [page(), data()];
    d.sort((a, b) => b.frequency - a.frequency);
    return d.slice((p - 1) * cols * rows, p * cols * rows);
  });

  function search(text: string) {
    if (text.trim() !== "") setData(apps.fuzzy_query(text));
    else setData(apps.get_list());
    setPage(1);
    // renderGrid(1);
  }

  function launch(app?: AstalApps.Application) {
    if (app) {
      win.hide();
      app.launch();
    }
  }

  // close on ESC
  // handle alt + number key
  function onKey(
    _e: Gtk.EventControllerKey,
    keyval: number,
    _: number,
    mod: number,
  ) {
    if (keyval === Gdk.KEY_Escape) {
      win.visible = false;
      return;
    }

    if (mod !== Gdk.ModifierType.ALT_MASK) {
      return;
    }

    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
      if (keyval === Gdk[`KEY_${i}`]) {
        return launch(data()[i - 1]);
      }
    }

    if (keyval === Gdk.KEY_Left) {
      if (page() > 1) setPage(page() - 1);
      return;
    }

    if (keyval === Gdk.KEY_Right) {
      if (page() + 1 <= (pages().at(-1) ?? 1)) setPage(page() + 1);
      return;
    }
  }

  // handle swipe gesture for page navigation
  function onSwipe(_controller: Gtk.GestureSwipe, velocity_x: number, _velocity_y: number) {
    const SWIPE_THRESHOLD = 300;

    // Only process horizontal swipes with sufficient velocity
    if (Math.abs(velocity_x) < SWIPE_THRESHOLD) {
      return;
    }

    // velocity_x > 0 = swipe right (finger moves left to right) = previous page
    // velocity_x < 0 = swipe left (finger moves right to left) = next page
    if (velocity_x > 0) {
      if (page() > 1) setPage(page() - 1);
    } else {
      if (page() + 1 <= (pages().at(-1) ?? 1)) setPage(page() + 1);
    }
  }

  // Helper to set app icon (handles file paths and themed icons)
  function setAppIcon(image: Gtk.Image, iconName?: string | null) {
    const FALLBACK_ICON = "application-x-executable";

    if (!iconName) {
      image.set_from_icon_name(FALLBACK_ICON);
      return;
    }

    // If it's an absolute path, use the file directly
    if (iconName.startsWith("/")) {
      try {
        const file = Gio.File.new_for_path(iconName);
        if (file.query_exists(null)) {
          image.set_from_file(iconName);
          return;
        }
      } catch (e) {
        // Fall through to themed icon
      }
    }

    // Otherwise, use Gio.ThemedIcon for reliable GTK4 icon lookup
    try {
      const themedIcon = Gio.ThemedIcon.new(iconName);
      image.set_from_gicon(themedIcon);
    } catch (e) {
      // Fallback
      image.set_from_icon_name(iconName);
    }
  }

  // handle scroll wheel/touchpad for page navigation
  function onScroll(
    _controller: Gtk.EventControllerScroll,
    dx: number,
    dy: number,
  ) {
    const now = Date.now();
    const SCROLL_THRESHOLD = 2.0; // Increased to reduce sensitivity

    // Debounce: only allow one page change per debounce period
    if (now - lastScrollTime < SCROLL_DEBOUNCE_MS) {
      return;
    }

    // Handle horizontal scroll (touchpad two-finger swipe)
    if (Math.abs(dx) > SCROLL_THRESHOLD) {
      // dx > 0 = swipe left (fingers move left) = next page
      // dx < 0 = swipe right (fingers move right) = previous page
      if (dx > 0) {
        if (page() + 1 <= (pages().at(-1) ?? 1)) {
          setPage(page() + 1);
          lastScrollTime = now;
        }
      } else {
        if (page() > 1) {
          setPage(page() - 1);
          lastScrollTime = now;
        }
      }
      return;
    }

    // Handle vertical scroll (mouse wheel / touchpad vertical swipe)
    if (Math.abs(dy) > SCROLL_THRESHOLD) {
      // dy < 0 = scroll up = previous page
      // dy > 0 = scroll down = next page
      if (dy < 0) {
        if (page() > 1) {
          setPage(page() - 1);
          lastScrollTime = now;
        }
      } else {
        if (page() + 1 <= (pages().at(-1) ?? 1)) {
          setPage(page() + 1);
          lastScrollTime = now;
        }
      }
    }
  }

  return (
    <window
      $={(ref) => (win = ref)}
      visible={false}
      name="launcher"
      namespace="ags"
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      application={app}
      onNotifyVisible={({ visible }) => {
        if (visible) searchentry.grab_focus();
        else searchentry.set_text("");
      }}
    >
      <Gtk.EventControllerKey onKeyPressed={onKey} />
      <Gtk.GestureSwipe onSwipe={onSwipe} />
      <Gtk.EventControllerScroll flags={Gtk.EventControllerScrollFlags.HORIZONTAL} onScroll={onScroll} />
      <Gtk.CenterBox
        name="launcher-content"
        halign={Gtk.Align.CENTER}
        orientation={VERTICAL}
        // homogeneous={true}
      >
        <Gtk.Box hexpand halign={CENTER} $type="start" orientation={HORIZONTAL}>
          <Gtk.Entry
            $={(ref) => (searchentry = ref)}
            hexpand={false}
            halign={CENTER}
            onNotifyText={({ text }) => search(text)}
            primaryIconName="system-search-symbolic"
            placeholderText="Start typing to search"
          />
        </Gtk.Box>
        <Gtk.Box $type="center" vexpand>
          <Gtk.FlowBox
            homogeneous
            maxChildrenPerLine={6}
            valign={Gtk.Align.START}
          >
            <For each={pageData}>
              {(app, index) => (
                <Gtk.Button class="app-item" onClicked={() => launch(app)}>
                  <Gtk.Box valign={CENTER} orientation={VERTICAL}>
                    <Gtk.Label
                      $type="overlay"
                      class="overlay-tip"
                      hexpand
                      halign={Gtk.Align.START}
                      label={index((i) => (i < 9 ? `󰘳 ${i + 1}` : " "))}
                    />
                    <Gtk.Image
                      pixelSize={72}
                      $={(ref) => setAppIcon(ref, app.iconName) }
                    />
                    <Gtk.Inscription
                      text={app.name}
                      natLines={2}
                      textOverflow={Gtk.InscriptionOverflow.ELLIPSIZE_MIDDLE}
                      hexpand={true}
                      xalign={0.5}
                      yalign={0.5}
                      tooltip-text={app.name}
                    />
                  </Gtk.Box>
                </Gtk.Button>
              )}
            </For>
          </Gtk.FlowBox>
        </Gtk.Box>
        <Gtk.Box $type="end" vexpand halign={CENTER}>
          <Gtk.Button
            class="round-btn"
            valign={CENTER}
            vexpand={false}
            sensitive={page((pg) => pg > 1)}
            onClicked={() => setPage(page() - 1)}
            iconName="go-previous-symbolic"
          />
          <Gtk.Box vexpand={false}>
            <For each={pages}>
              {(p) => (
                <Gtk.ToggleButton
                  valign={CENTER}
                  class="pager"
                  active={page((pg) => pg == p)}
                  label={p.toString()}
                  onClicked={() => setPage(p)}
                />
              )}
            </For>
          </Gtk.Box>
          <Gtk.Button
            class="round-btn"
            valign={CENTER}
            vexpand={false}
            sensitive={page((pg) => pg < pages().length)}
            onClicked={() => setPage(page() + 1)}
            iconName="go-next-symbolic"
          />
        </Gtk.Box>
      </Gtk.CenterBox>
    </window>
  );
}
