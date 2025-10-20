import { createComputed } from "ags";
import { Gtk } from "ags/gtk4";
import { CENTER, DTTIME, HORIZONTAL } from "../../services/vars";

const _map = [
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1], // 0
  [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1], // 1
  [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1], // 2
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1], // 3
  [1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1], // 4
  [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1], // 5
  [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1], // 6
  [1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0], // 7
  [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1], // 9
];

const getGridCube = (col: number, row: number, seq: number): Gtk.Label => {
  let cls = createComputed([DTTIME], (d) => {
    let tmp = [] as Array<string>;
    let tStr = d.slice(11, 19).split(":");
    let hh = tStr[0];
    let mm = tStr[1];
    let ss = tStr[2];

    let txt = parseInt([hh[0], hh[1], mm[0], mm[1]][seq]);
    if (_map[txt][row + col * 5]) tmp.push("on");

    if (parseInt(ss) == row + col * 5 + seq * 15) tmp.push("blink");
    return tmp;
  });

  return (<Gtk.Label class={cls((c) => c.join(" "))} label="" />) as Gtk.Label;
};

const initGrid = (grid: Gtk.Grid, seq: number) => {
  grid.columnHomogeneous = true;
  grid.rowHomogeneous = true;
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 5; row++) {
      grid.attach(getGridCube(col, row, seq), col, row, 1, 1);
    }
  }
};

export default function DashClock() {
  return (
    <Gtk.Box halign={CENTER} orientation={HORIZONTAL} class="dashClock">
      <Gtk.Grid $={(self) => initGrid(self, 0)}></Gtk.Grid>
      <Gtk.Grid $={(self) => initGrid(self, 1)}></Gtk.Grid>
      <Gtk.Separator />
      <Gtk.Grid $={(self) => initGrid(self, 2)}></Gtk.Grid>
      <Gtk.Grid $={(self) => initGrid(self, 3)}></Gtk.Grid>
    </Gtk.Box>
  );
}
