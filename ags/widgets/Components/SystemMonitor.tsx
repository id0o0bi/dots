import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio";
import { createState } from "ags";
import { HORIZONTAL, VERTICAL } from "../../services/vars";

const METER_WIDTH = 16; // pixels

interface SystemStats {
  cpu: number;
  mem: number;
}

// Reactive state for system stats
export const [stats, setStats] = createState<SystemStats>({ cpu: 0, mem: 0 });

// Store previous CPU stats for delta calculation
let prevCpuTotal = 0;
let prevCpuIdle = 0;

function readProcFile(path: string): string {
  try {
    const file = Gio.File.new_for_path(path);
    const [success, contents] = file.load_contents(null);
    if (success && contents) {
      return imports.byteArray.toString(contents);
    }
  } catch (e) {
    console.error(`Failed to read ${path}:`, e);
  }
  return "";
}

function updateStats() {
  // CPU usage - read /proc/stat
  const cpuContents = readProcFile("/proc/stat");
  const cpuLine = cpuContents.split("\n")[0] || "";
  const parts = cpuLine.split(/\s+/).slice(1).map(Number);
  const total = parts.reduce((a, b) => a + b, 0);
  const idle = (parts[3] || 0) + (parts[4] || 0); // idle + iowait

  let cpu = 0;
  if (prevCpuTotal > 0) {
    const totalDelta = total - prevCpuTotal;
    const idleDelta = idle - prevCpuIdle;
    if (totalDelta > 0) {
      cpu = Math.round(((totalDelta - idleDelta) / totalDelta) * 100);
      cpu = Math.max(0, Math.min(100, cpu));
    }
  }
  prevCpuTotal = total;
  prevCpuIdle = idle;

  // Memory usage - read /proc/meminfo
  const memContents = readProcFile("/proc/meminfo");
  const memLines = memContents.split("\n");
  const memTotalLine = memLines.find((l: string) => l.startsWith("MemTotal:"));
  const memAvailLine = memLines.find((l: string) => l.startsWith("MemAvailable:"));

  const memTotal = parseInt(memTotalLine?.split(/\s+/)[1] || "0");
  const memAvail = parseInt(memAvailLine?.split(/\s+/)[1] || "0");

  const mem = memTotal > 0 ? Math.round(((memTotal - memAvail) / memTotal) * 100) : 0;

  setStats({ cpu, mem });
}

// Update every second
setInterval(updateStats, 1000);
// Initial update
updateStats();

function getColor(percent: number): string {
  if (percent < 60) {
    return `var(--rpt-pine)`;
  } else if (percent < 80) {
    return `var(--rpt-gold)`;
  } else {
    return `var(--rpt-love)`;
  }
}

export default function SystemMonitor() {
  const meterCss = (percent: number) => {
    const width = Math.max(1, (percent / 100) * METER_WIDTH);
    const color = getColor(percent);
    return `min-width: ${width}px; background-color: ${color};`;
  };

  return (
    <Gtk.Box
      class="system-monitor"
      orientation={VERTICAL}
      spacing={2}
      valign={Gtk.Align.CENTER}
      tooltipText={stats((s) => `CPU: ${s.cpu}%\nMEM: ${s.mem}%`)}
    >
      {/* CPU Meter */}
      <Gtk.Box overflow={Gtk.Overflow.HIDDEN} class="meter-container">
        <Gtk.Box class="meter-fill cpu" vexpand css={stats((s) => meterCss(s.cpu))} />
      </Gtk.Box>

      {/* Memory Meter */}
      <Gtk.Box overflow={Gtk.Overflow.HIDDEN} class="meter-container">
        <Gtk.Box class="meter-fill mem" vexpand css={stats((s) => meterCss(s.mem))} />
      </Gtk.Box>
    </Gtk.Box>
  );
}
