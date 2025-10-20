import app from "ags/gtk4/app";
import { cli, init } from "./services/core";
import { SCSS_CACHE } from "./services/vars";
import Bar from "./widgets/Bar";
import Launcher from "./widgets/Launcher";
import PowerMenu from "./widgets/PowerMenu";
import OSD from "./widgets/OSD";
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
  },
  requestHandler(args: string[], res: (res: any) => void) {
    return res(args[0] == "func" ? cli(args[1]) : "unknown command");
  },
});
