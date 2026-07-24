import { Gtk, Gdk } from "ags/gtk4";
import { HORIZONTAL, VERTICAL, END } from "../../services/vars";
import { createState, For } from "ags";
import {
  translateText,
  ocrImage,
  captureScreenshot,
  saveToHistory,
  loadHistory,
  TranslationEntry,
} from "../../services/translator";

const [inputText, setInputText] = createState("");
const [outputText, setOutputText] = createState("");
const [loading, setLoading] = createState(false);
const [showHistory, setShowHistory] = createState(false);
const [history, setHistory] = createState<TranslationEntry[]>([]);
const [canTranslate, setCanTranslate] = createState(false);
const [selectedImage, setSelectedImage] = createState("");
const [isStatusMessage, setIsStatusMessage] = createState(false);
const [canCopy, setCanCopy] = createState(false);

// Keep translate button sensitivity in sync with both inputText and loading
inputText.subscribe(() => setCanTranslate(inputText().trim().length > 0 && !loading()));
loading.subscribe(() => setCanTranslate(inputText().trim().length > 0 && !loading()));

// Copy button visible only for real (non-status) output
outputText.subscribe(() => setCanCopy(outputText().length > 0 && !isStatusMessage()));
isStatusMessage.subscribe(() => setCanCopy(outputText().length > 0 && !isStatusMessage()));

// Input buffer — text lives here, state follows via notify::text
const inputBuffer = new Gtk.TextBuffer();
inputBuffer.connect("notify::text", () => {
  const start = inputBuffer.get_start_iter();
  const end = inputBuffer.get_end_iter();
  setInputText(inputBuffer.get_text(start, end, true));
});

// Output buffer — synced from outputText state
const outputBuffer = new Gtk.TextBuffer();
outputText.subscribe(() => outputBuffer.set_text(outputText(), -1));

let clipButton: Gtk.Button;
let imagePicture: Gtk.Picture;
let copyButton: Gtk.Button;

// ---- helpers ----

function setBufferText(text: string) {
  inputBuffer.set_text(text, -1);
}

function resetAll() {
  setBufferText("");
  setOutputText("");
  setSelectedImage("");
  setShowHistory(false);
}

async function doOcr(imagePath: string) {
  setLoading(true);
  setIsStatusMessage(true);
  setOutputText("OCR in progress…");
  const text = await ocrImage(imagePath);
  setBufferText(text);
  setIsStatusMessage(false);
  setOutputText("");
  setLoading(false);
}

function selectImageDialog(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const root = clipButton?.get_root();

      const win = new Gtk.Window({
        title: "Select Image",
        modal: true,
        transient_for: (root as Gtk.Window) ?? undefined,
        resizable: false,
        defaultWidth: 800,
        defaultHeight: 480,
      });

      const chooser = new Gtk.FileChooserWidget({
        action: Gtk.FileChooserAction.OPEN,
        vexpand: true,
        hexpand: true,
      });

      const openBtn = new Gtk.Button({ label: "_Open", useUnderline: true });
      openBtn.add_css_class("suggested-action");

      const cancelBtn = new Gtk.Button({ label: "_Cancel", useUnderline: true });

      const actionBar = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6,
        halign: Gtk.Align.END,
      });
      actionBar.append(openBtn);
      actionBar.append(cancelBtn);

      const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
        marginTop: 6,
        marginBottom: 6,
        marginStart: 6,
        marginEnd: 6,
        vexpand: true,
      });
      box.append(chooser);
      box.append(actionBar);

      win.set_child(box);

      function pick() {
        const file = chooser.get_file();
        resolve(file ? file.get_path() || "" : "");
        win.destroy();
      }

      function cancel() {
        resolve("");
        win.destroy();
      }

      openBtn.connect("clicked", pick);
      cancelBtn.connect("clicked", cancel);
      win.connect("close-request", cancel);

      win.present();
    } catch (e) {
      console.error("[translator] selectImageDialog error:", e);
      reject(e);
    }
  });
}

async function doSelectImage() {
  if (loading()) return;

  let path: string;
  try {
    path = await selectImageDialog();
  } catch (e) {
    console.error("[translator] doSelectImage failed:", e);
    return;
  }
  if (!path) return;

  setSelectedImage(path);

  await doOcr(path);
}

async function doClipCapture() {
  if (loading()) return;

  // Close the parent popover so slurp can take over the screen
  let parent: Gtk.Widget | null = clipButton;
  while (parent) {
    if (parent instanceof Gtk.Popover) {
      (parent as Gtk.Popover).popdown();
      break;
    }
    parent = parent.get_parent();
  }
  await new Promise((r) => setTimeout(r, 150));

  setLoading(true);
  setIsStatusMessage(true);
  setOutputText("Capturing…");

  const imagePath = await captureScreenshot();
  if (!imagePath) {
    setLoading(false);
    setIsStatusMessage(false);
    setOutputText("");
    return;
  }

  setSelectedImage(imagePath);

  setOutputText("OCR in progress…");
  const text = await ocrImage(imagePath);
  setBufferText(text);
  setIsStatusMessage(false);
  setOutputText("");
  setLoading(false);
}

async function doTranslate() {
  const text = inputText().trim();
  if (!text || loading()) return;

  setLoading(true);
  setIsStatusMessage(true);
  setOutputText("Translating…");

  const result = await translateText(text);
  setIsStatusMessage(false);
  setOutputText(result);
  setLoading(false);

  saveToHistory({ inputText: text, outputText: result, imagePath: selectedImage() || undefined });
  setHistory(loadHistory());
}

function copyToClipboard(text: string) {
  const display = Gdk.Display.get_default();
  if (!display) return;
  const clipboard = display.get_clipboard();
  if (!clipboard) return;
  clipboard.set(text);

  // brief feedback: show checkmark then revert
  if (copyButton) copyButton.iconName = "emblem-ok-symbolic";
  setTimeout(() => {
    if (copyButton) copyButton.iconName = "edit-copy-symbolic";
  }, 1500);
}

// ---- Sub-components ----

function HistoryList() {
  return (
    <Gtk.ScrolledWindow
      class="history-scroll"
      vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
      hscrollbarPolicy={Gtk.PolicyType.NEVER}
    >
      <Gtk.Box orientation={VERTICAL} spacing={2}>
        <For each={history}>
          {(entry) => (
            <Gtk.Button
              class="history-item"
              onClicked={() => {
                setBufferText(entry.inputText);
                setOutputText(entry.outputText);
                if (entry.imagePath) setSelectedImage(entry.imagePath);
                setShowHistory(false);
              }}
            >
              <Gtk.Box orientation={VERTICAL} spacing={2} hexpand>
                <Gtk.Label
                  label={(entry.imagePath ? "📷 | " : "") + entry.inputText.replace(/\n/g, " ⏎ ")}
                  halign={Gtk.Align.START}
                  xalign={0}
                  ellipsize={3}
                  hexpand
                  css="color: var(--rpt-subtle);"
                  class="history-label"
                />
                <Gtk.Label
                  label={entry.outputText.replace(/\n/g, " ⏎ ")}
                  halign={Gtk.Align.START}
                  xalign={0}
                  ellipsize={3}
                  hexpand
                  class="history-label"
                />
              </Gtk.Box>
            </Gtk.Button>
          )}
        </For>
      </Gtk.Box>
    </Gtk.ScrolledWindow>
  );
}

// ---- Main export ----

export default function Translator() {
  // Subscribe to selectedImage changes so Gtk.Picture stays in sync
  selectedImage.subscribe(() => {
    const path = selectedImage();
    if (imagePicture && path) imagePicture.set_filename(path);
  });

  return (
    <Gtk.Box orientation={VERTICAL} spacing={6} class="translator-panel">
      {/* Top toolbar: select image + reset */}
      <Gtk.Box orientation={HORIZONTAL} spacing={6} halign={END}>
        <Gtk.Button
          class="round-btn"
          iconName="document-open-symbolic"
          tooltipText="Select Image"
          sensitive={loading.as((l) => !l)}
          onClicked={doSelectImage}
        />
        <Gtk.Button
          class="round-btn"
          label="󰎟"
          tooltipText="Reset"
          sensitive={loading.as((l) => !l)}
          onClicked={resetAll}
        />
      </Gtk.Box>

      {/* Image preview */}
      <Gtk.Revealer
        revealChild={selectedImage.as((p) => p.length > 0)}
        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      >
        <Gtk.ScrolledWindow
          maxContentHeight={200}
          propagateNaturalHeight
          vscrollbarPolicy={Gtk.PolicyType.NEVER}
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
        >
          <Gtk.Box class="image-preview-box">
            <Gtk.Picture
              $={(ref) => (imagePicture = ref as Gtk.Picture)}
              keepAspectRatio
              canShrink
              contentFit={Gtk.ContentFit.CONTAIN}
            />
          </Gtk.Box>
        </Gtk.ScrolledWindow>
      </Gtk.Revealer>

      {/* Input area (editable text / OCR result) */}
      <Gtk.Frame>
        <Gtk.ScrolledWindow
          minContentHeight={70}
          maxContentHeight={140}
          vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
        >
          <Gtk.TextView
            buffer={inputBuffer}
            wrapMode={Gtk.WrapMode.WORD_CHAR}
            $={(ref) => {
              (ref as any).placeholder_text =
                "Enter text to translate, or select an image to OCR…";
            }}
          />
        </Gtk.ScrolledWindow>
      </Gtk.Frame>

      {/* Translate button */}
      <Gtk.Button
        class="translate-btn"
        label="Translate"
        sensitive={canTranslate}
        onClicked={doTranslate}
      />

      {/* Output area */}
      <Gtk.Separator
        orientation={HORIZONTAL}
        visible={outputText.as((t) => t.length > 0)}
      />
      <Gtk.ScrolledWindow
        minContentHeight={80}
        maxContentHeight={300}
        vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
        visible={outputText.as((t) => t.length > 0)}
      >
        <Gtk.TextView
          buffer={outputBuffer}
          editable={false}
          wrapMode={Gtk.WrapMode.WORD_CHAR}
          class="output-textview"
        />
      </Gtk.ScrolledWindow>

      {/* Bottom bar: clip, copy, history */}
      <Gtk.Box orientation={HORIZONTAL} spacing={6} halign={END}>
        <Gtk.Button
          $={(ref) => (clipButton = ref as Gtk.Button)}
          class="round-btn"
          iconName="camera-photo-symbolic"
          tooltipText="Clip to OCR"
          sensitive={loading.as((l) => !l)}
          onClicked={doClipCapture}
        />
        <Gtk.Button
          $={(ref) => (copyButton = ref as Gtk.Button)}
          class="round-btn"
          iconName="edit-copy-symbolic"
          tooltipText="Copy translation"
          visible={canCopy}
          onClicked={() => copyToClipboard(outputText())}
        />
        <Gtk.ToggleButton
          class="round-btn"
          iconName="document-open-recent-symbolic"
          tooltipText={showHistory.as((s) => (s ? "Hide History" : "Show History"))}
          active={showHistory}
          onClicked={() => {
            const next = !showHistory();
            setShowHistory(next);
            if (next) setHistory(loadHistory());
          }}
        />
      </Gtk.Box>

      {/* History dropdown */}
      <Gtk.Revealer
        revealChild={showHistory}
        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      >
        <HistoryList />
      </Gtk.Revealer>
    </Gtk.Box>
  );
}
