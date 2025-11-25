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
  let actTimer: Timer;

  const [act, setAct] = createState("");
  const [tag, setTag] = createState("");
  const [cnt, setCnt] = createState(0);

  act.subscribe(() => {
    let action = actions[act.get()] ?? null;
    if (!action) return clearAll();

    setTag(action[0]);
    setCnt(waitSecond);
    actTicker = interval(1000, () => {
      console.log("tick:", cnt.get());
      let next = cnt.get() - 1;
      if (next >= 0) setCnt(next);
      else actTicker.cancel();
    });

    actTimer = timeout(waitSecond * 1000, () => {
      actTicker.cancel();
      sh([action[2]]);
    });
  });

  function clearAll() {
    if (actTicker) actTicker.cancel();
    if (actTimer) actTimer.cancel();
  }

  function actNow(): void {
    clearAll();
    win.visible = false;
    sh([actions[act.get()][2]]);
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
                  onClicked={() => actNow()}
                  label={cnt((c) => `${tag.get()} ${c.toString()}s`)}
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
