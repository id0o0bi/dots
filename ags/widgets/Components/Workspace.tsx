import { createBinding, createComputed, createState } from "ags";
import { Gtk } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";
import Pango from "gi://Pango?version=1.0";
import { BASELINE_CENTER, CENTER } from "../../services/vars";

const hyprland = AstalHyprland.get_default();

export function WorkSpaces() {
  const labels = ["󰎤", "󰎧", "󰎪", "󰎭", "󰎱", "󰎳", "󰎶", "󱗜"];
  const fws = createBinding(hyprland, "focusedWorkspace");
  const wss = createBinding(hyprland, "workspaces");

  return (
    <Gtk.Box>
      {labels.map((label, index) => {
        let idx = index + 1;
        let _ws = wss((p) => p.find((w) => w.name == idx.toString()));
        let cls = createComputed(() => {
          let cls = [];
          if (_ws()?.get_clients()) cls.push("occupied");
          if (fws().name == idx.toString()) cls.push("focused");
          return cls;
        });

        return (
          <Gtk.Button
            valign={CENTER}
            class={cls((s) => s.join(" "))}
            label={label}
            onClicked={() => hyprland.dispatch("workspace", `${idx}`)}
          />
        );
      })}
    </Gtk.Box>
  );
}

export function ClientTitle() {
  let [title, setTitle] = createState("");
  let cur: AstalHyprland.Client | null = null;
  let sid: number | null = null;

  const bind = () => {
    if (cur && sid !== null) cur.disconnect(sid);
    cur = hyprland.get_focused_client();
    setTitle(cur?.title ?? "");
    sid = cur?.connect("notify::title", () => setTitle(cur!.title ?? "")) ?? null;
  };

  bind();
  hyprland.connect("notify::focused-client", bind);

  return (
    <Gtk.Inscription
      class="clientTitle"
      hexpand={true}
      wrapMode={Pango.WrapMode.NONE}
      textOverflow={Gtk.InscriptionOverflow.ELLIPSIZE_END}
      valign={BASELINE_CENTER}
      text={title}
      tooltip-text={title}
    />
  );
}
