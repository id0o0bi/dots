import app from "ags/gtk4/app";
import { cli, init } from "./services/core";
import { SCSS_CACHE } from "./services/vars";
import Bar from "./widgets/Bar";
import Launcher from "./widgets/Launcher";
import PowerMenu from "./widgets/PowerMenu";
import OSD from "./widgets/OSD";
import ASR from "./widgets/ASR";
import WindowSwitcher, { switcherControl } from "./widgets/WindowSwitcher";
import { Popups } from "./widgets/Components/Notification";

app.start({
  css: SCSS_CACHE,

  main() {
    init();
    app.get_monitors().map(Bar);
    Popups();
    Launcher();
    PowerMenu();
    OSD();
    ASR();
    WindowSwitcher();
  },

  // Handles `ags request <cmd> [args...]` calls (e.g. from Hyprland binds)
  requestHandler(args: string[], res: (response: unknown) => void) {
    const [cmd, ...rest] = args;

    switch (cmd) {
      case "switcher": // Super+Tab: open the switcher, or advance if open
        switcherControl.toggleOrStep();
        return res("ok");

      case "func": // generic command bridge (e.g. `ags request func sysUpdate`)
        return res(cli(rest[0]));

      default:
        return res(`unknown command: ${cmd ?? "(none)"}`);
    }
  },
});
