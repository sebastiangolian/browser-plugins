const title = document.getElementById("title");
const clock = document.getElementById("clock");
const detail = document.getElementById("detail");
const progress = document.getElementById("progress");
const skipButton = document.getElementById("skip");

let state = BreakTimer.IDLE_STATE;

function render() {
  if (state.phase !== "break") {
    document.body.className = "phase-idle";
    title.textContent = "Break is over";
    clock.textContent = "00:00";
    detail.textContent = "";
    progress.style.width = "100%";
    skipButton.hidden = true;
    return;
  }

  const remaining = BreakTimer.remainingMs(state);
  document.body.className = "phase-break";
  title.textContent = BreakTimer.isPaused(state) ? "Break (paused)" : "Time for a break";
  clock.textContent = BreakTimer.formatClock(remaining);
  const done = state.durationMs ? 1 - remaining / state.durationMs : 0;
  progress.style.width = `${Math.min(100, Math.max(0, done * 100))}%`;
  skipButton.hidden = false;
}

async function load() {
  const result = await chrome.storage.local.get(BreakTimer.STATE_KEY);
  state = BreakTimer.normalizeState(result[BreakTimer.STATE_KEY]);
  render();
}

skipButton.addEventListener("click", () => chrome.runtime.sendMessage({ type: "skip" }));
document.getElementById("close").addEventListener("click", () => window.close());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[BreakTimer.STATE_KEY]) load();
});

load();
setInterval(render, 500);
