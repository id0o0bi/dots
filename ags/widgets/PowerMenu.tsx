import { createState } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { interval, Timer, timeout } from "ags/time";
import { sh } from "../services/util";
import { CENTER, HORIZONTAL, VERTICAL } from "../services/vars";

const waitSecond = 6;
const actions: Record<string, Array<string>> = {
  sus: ["休眠", "weather-clear-night-symbolic", "systemctl suspend"],
  reb: ["重启", "system-reboot-symbolic", "systemctl reboot"],
  log: ["注销", "system-log-out-symbolic", "pkill Hyprland"],
  pow: ["关机", "system-shutdown-symbolic", "systemctl poweroff"],
};

export default function PowerMenu() {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor;
  let win: Astal.Window;
  let actTicker: Timer;

  const [act, setAct] = createState("");
  const [tag, setTag] = createState("");
  const [cnt, setCnt] = createState(0);

  // action button pressed
  act.subscribe(() => {
    let action = actions[act.peek()] ?? null;
    if (!action) return clearTicker();

    setTag(action[0]);
    setCnt(waitSecond);
    actTicker = interval(1000, () => {
      let next = cnt.peek() - 1;
      next >= 0 ? setCnt(next) : actTicker.cancel();
    });
  });

  // action countdown expired
  cnt.subscribe(() => {
    if (cnt.peek() !== 0) return;
    let action = actions[act.peek()] ?? null;
    if (!action) return;

    doAction();
  });

  // clear action countdown
  function clearTicker() {
    if (actTicker) actTicker.cancel();
  }

  // action button pressed or countdown expired
  function doAction() {
    let cmd = actions[act.peek()][2] ?? null;
    if (!cmd) return false;

    win.visible = false;
    setAct("");
    clearTicker();
    setTimeout(() => { sh([cmd]); }, 300);
  }

  function onKey(_e: Gtk.EventControllerKey, keyval: number) {
    if (keyval === Gdk.KEY_Escape) {
      win.visible = false;
      setAct("");
      return;
    }
  }

  return (
    <window
      visible={false}
      name="powermenu"
      namespace="ags"
      anchor={TOP | LEFT | RIGHT | BOTTOM}
      $={(self) => (win = self)}
      layer={Astal.Layer.TOP}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      application={app}
    >
      <Gtk.EventControllerKey onKeyPressed={onKey} />
      <Gtk.CenterBox orientation={VERTICAL}>
        <Gtk.CenterBox $type="center" orientation={HORIZONTAL}>
          <Gtk.Box $type="center" class="power" homogeneous={true}>
            <Gtk.Box
              class="confirm"
              orientation={VERTICAL}
              visible={act((a) => a.length > 0)}
            >
              <Gtk.Label label={tag((n) => `确定要 ${n} 吗`)} />
              <Gtk.Box orientation={HORIZONTAL} halign={CENTER}>
                <Gtk.Button onClicked={() => setAct("")} label="取消" />
                <Gtk.Button
                  class="error"
                  onClicked={() => setCnt(0)}
                  label={cnt((c) => `${tag.peek()} ${c.toString()}s`)}
                />
              </Gtk.Box>
            </Gtk.Box>
            <Gtk.Box class="sys" visible={act((a) => a.length === 0)}>
              {Object.keys(actions).map((k) => (
                <Gtk.Button onClicked={() => setAct(k)}>
                  <Gtk.Box valign={CENTER} orientation={VERTICAL}>
                    <Gtk.Image iconName={actions[k][1]} />
                    <Gtk.Label label={actions[k][0]} />
                  </Gtk.Box>
                </Gtk.Button>
              ))}
            </Gtk.Box>
          </Gtk.Box>
        </Gtk.CenterBox>
      </Gtk.CenterBox>
    </window>
  );
}
