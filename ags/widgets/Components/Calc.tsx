import { Gtk } from "ags/gtk4";
import { createState, For } from "ags";
import Pango from "gi://Pango?version=1.0";
import GLib from "gi://GLib?version=2.0";
import { HORIZONTAL, START, VERTICAL } from "../../services/vars";
import { debounce, timeElapsed } from "../../services/util";
import {
  cleanError,
  evalNumbat,
  isSameCalc,
  isTrivialCalc,
  loadCalcHistory,
  saveCalcEntry,
  CalcEntry,
} from "../../services/numbat";

const [expr, setExpr] = createState("");
const [result, setResult] = createState("");
const [error, setError] = createState("");
const [history, setHistory] = createState<CalcEntry[]>([]);
const [showHistory, setShowHistory] = createState(false);
const [saved, setSaved] = createState(false);
let savedTimer: ReturnType<typeof setTimeout> | null = null;

/** brief "saved" note in the button row */
function flashSaved() {
  setSaved(true);
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => setSaved(false), 2000);
}

// numbat is a process per evaluation, so results can land out of order
let seq = 0;
let entry: Gtk.Entry;

function setInputText(text: string) {
  if (entry) entry.text = text;
}

async function evaluate(text: string) {
  const mine = ++seq;

  if (!text.trim()) {
    setResult("");
    setError("");
    return;
  }

  try {
    const out = await evalNumbat(text);
    if (mine !== seq) return;
    setResult(out.trim());
    setError("");
  } catch (e) {
    if (mine !== seq) return;
    setResult("");
    setError(cleanError(e));
  }
}

const evaluateDebounced = debounce((text: string) => void evaluate(text), 250);

/** Enter records the current expression — only successful ones. */
async function commit() {
  const text = expr().trim();
  if (!text) return;

  await evaluate(text);
  // errors never go to history
  if (error()) return;
  const value = result();
  if (!value) return;
  // nor do no-ops like "123 = 123"
  if (isTrivialCalc(text, value)) return;
  // nor a repeat of the expression already at the top of the list
  if (isSameCalc(loadCalcHistory()[0], text)) return;

  saveCalcEntry({ expr: text, result: value });
  setHistory(loadCalcHistory());
  flashSaved();
}

function reset() {
  setInputText("");
  setResult("");
  setError("");
  setShowHistory(false);
}

function HistoryList() {
  return (
    <Gtk.ScrolledWindow
      class="history-scroll"
      vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
      hscrollbarPolicy={Gtk.PolicyType.NEVER}
    >
      <Gtk.Box orientation={VERTICAL} spacing={2}>
        <For each={history}>
          {(item) => (
            <Gtk.Button
              class="history-item"
              onClicked={() => {
                setInputText(item.expr);
                setShowHistory(false);
              }}
            >
              <Gtk.Box orientation={VERTICAL} spacing={2} hexpand>
                <Gtk.Label
                  label={item.expr}
                  halign={START}
                  xalign={0}
                  ellipsize={Pango.EllipsizeMode.END}
                  hexpand
                  class="history-query"
                />
                <Gtk.Label
                  label={`= ${item.result}`}
                  halign={START}
                  xalign={0}
                  ellipsize={Pango.EllipsizeMode.END}
                  hexpand
                  class="history-answer"
                />
                <Gtk.Label
                  label={
                    timeElapsed(
                      GLib.DateTime.new_now_local(),
                      item.timestamp / 1000,
                    ) ?? ""
                  }
                  halign={START}
                  xalign={0}
                  class="history-time"
                />
              </Gtk.Box>
            </Gtk.Button>
          )}
        </For>
      </Gtk.Box>
    </Gtk.ScrolledWindow>
  );
}

export default function Calc() {
  return (
    <Gtk.Box orientation={VERTICAL} spacing={6} class="calc-panel">
      <Gtk.Frame>
        <Gtk.Entry
          $={(ref) => (entry = ref as Gtk.Entry)}
          hexpand
          xalign={0.5}
          onNotifyText={({ text }) => {
            setExpr(text);
            evaluateDebounced(text);
          }}
          onActivate={() => void commit()}
        />
      </Gtk.Frame>

      <Gtk.Label
        class="calc-hint"
        label="2 + 3  ·  100 km/h -> m/s  ·  Enter to save"
        halign={START}
        xalign={0}
      />

      {/* result / error */}
      <Gtk.Label
        class="calc-result"
        label={result}
        visible={result.as((r) => r.length > 0)}
        maxWidthChars={26}
        selectable
        wrap
        xalign={0}
        halign={START}
      />
      <Gtk.Label
        class="calc-error"
        label={error}
        visible={error.as((e) => e.length > 0)}
        maxWidthChars={40}
        wrap
        xalign={0}
        halign={START}
      />

      {/* bottom bar: saved note + reset + history */}
      <Gtk.Separator orientation={HORIZONTAL} />
      <Gtk.Box orientation={HORIZONTAL} spacing={6} hexpand>
        <Gtk.Revealer
          hexpand
          revealChild={saved}
          transitionType={Gtk.RevealerTransitionType.CROSSFADE}
          transitionDuration={200}
        >
          <Gtk.Label class="calc-saved" label="saved" halign={START} xalign={0} />
        </Gtk.Revealer>
        <Gtk.Button
          class="round-btn"
          label={"\u{F039F}"}
          tooltipText="Reset"
          onClicked={reset}
        />
        <Gtk.ToggleButton
          class="round-btn"
          iconName="document-open-recent-symbolic"
          tooltipText={showHistory.as((s) =>
            s ? "Hide History" : "Show History",
          )}
          active={showHistory}
          onClicked={() => {
            const next = !showHistory();
            setShowHistory(next);
            if (next) setHistory(loadCalcHistory());
          }}
        />
      </Gtk.Box>

      <Gtk.Revealer
        revealChild={showHistory}
        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      >
        <HistoryList />
      </Gtk.Revealer>
    </Gtk.Box>
  );
}
