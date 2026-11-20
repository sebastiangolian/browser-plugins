const elements = {
  phase: document.getElementById("phase"),
  clock: document.getElementById("clock"),
  detail: document.getElementById("detail"),
  progress: document.getElementById("progress"),
  actions: document.getElementById("actions"),
  rhythm: document.getElementById("rhythm"),
};

let state = BreakTimer.IDLE_STATE;
let settings = BreakTimer.DEFAULT_SETTINGS;

const PHASE_LABELS = { idle: "Not running", work: "Work", break: "Break" };

function send(type) {
  chrome.runtime.sendMessage({ type });
}

function button(label, type, primary = false) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  if (primary) element.className = "primary";
  element.addEventListener("click", () => send(type));
  return element;
}

function renderActions() {
  const buttons = [];
  if (state.phase === "idle") {
    buttons.push(button("Start work", "start", true));
  } else {
    buttons.push(
      BreakTimer.isPaused(state) ? button("Resume", "resume", true) : button("Pause", "pause"),
      button(state.phase === "work" ? "Break now" : "End break", "skip"),
      button("Reset", "reset"),
    );
  }
  elements.actions.replaceChildren(...buttons);
}

function renderTime() {
  const remaining = BreakTimer.remainingMs(state);
  const paused = BreakTimer.isPaused(state);

  if (state.phase === "idle") {
    elements.clock.textContent = BreakTimer.formatClock(settings.workMinutes * 60 * 1000);
    elements.detail.textContent = "Click Start when you begin working.";
    elements.progress.style.width = "0";
    return;
  }

  elements.clock.textContent = BreakTimer.formatClock(remaining);
  if (paused) {
    elements.detail.textContent = "Paused";
  } else {
    const next = state.phase === "work" ? "Break" : "Back to work";
    elements.detail.textContent = `${next} at ${BreakTimer.formatTimeOfDay(state.endsAt)}`;
  }
  const done = state.durationMs ? 1 - remaining / state.durationMs : 0;
  elements.progress.style.width = `${Math.min(100, Math.max(0, done * 100))}%`;
}

function render() {
  document.body.className = `phase-${state.phase}`;
  elements.phase.textContent = PHASE_LABELS[state.phase] + (BreakTimer.isPaused(state) ? " · paused" : "");
  elements.rhythm.textContent = `${settings.workMinutes} min work / ${settings.breakMinutes} min break`;
  renderActions();
  renderTime();
}

async function load() {
  const [local, sync] = await Promise.all([
    chrome.storage.local.get(BreakTimer.STATE_KEY),
    chrome.storage.sync.get(BreakTimer.DEFAULT_SETTINGS),
  ]);
  state = BreakTimer.normalizeState(local[BreakTimer.STATE_KEY]);
  settings = BreakTimer.normalizeSettings(sync);
  render();
}

chrome.storage.onChanged.addListener(load);
document.getElementById("open-settings").addEventListener("click", (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});
// Same as the reload button on the extensions page; the running timer is restored
// from storage on restart (see restore() in background.js).
document.getElementById("reload-extension").addEventListener("click", () => {
  chrome.runtime.reload();
});

load();
setInterval(renderTime, 500);
