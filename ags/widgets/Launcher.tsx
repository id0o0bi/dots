import { For, createComputed, createState } from "ags";
import { Astal, Gtk, Gdk } from "ags/gtk4";
import AstalApps from "gi://AstalApps";
import app from "ags/gtk4/app";
import { CENTER } from "../services/vars";

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;
const { HORIZONTAL, VERTICAL } = Gtk.Orientation;

const cols = 6;
const rows = 4;

export default function Launcher() {
  let searchentry: Gtk.Entry;
  let flowbox: Gtk.FlowBox;
  let win: Astal.Window;

  const apps = new AstalApps.Apps();
  const [page, setPage] = createState(1);
  const [data, setData] = createState(apps.get_list());

  const pages = createComputed([data], () =>
    Array.from(
      { length: Math.ceil(data.get().length / (cols * rows)) },
      (_, i) => i + 1,
    ),
  );

  const pageData = createComputed([page, data], (p, d) => {
    // sort apps, clean FlowBox, rerender list
    d.sort((a, b) => b.frequency - a.frequency);
    flowbox?.remove_all();
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
        return launch(data.get()[i - 1]);
      }
    }

    if (keyval === Gdk.KEY_Left) {
      if (page.get() > 1) setPage(page.get() - 1);
      return;
    }

    if (keyval === Gdk.KEY_Right) {
      if (page.get() + 1 <= (pages.get().at(-1) ?? 1)) setPage(page.get() + 1);
      return;
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
      <Gtk.CenterBox
        name="launcher-content"
        hexpand={true}
        valign={Gtk.Align.START}
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
            $={(ref) => (flowbox = ref)}
            homogeneous
            maxChildrenPerLine={6}
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
                    <Gtk.Image iconName={app.iconName} pixelSize={72} />
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
            onClicked={() => setPage(page.get() - 1)}
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
            sensitive={page((pg) => pg < pages.get().length)}
            onClicked={() => setPage(page.get() + 1)}
            iconName="go-next-symbolic"
          />
        </Gtk.Box>
      </Gtk.CenterBox>
    </window>
  );
}
