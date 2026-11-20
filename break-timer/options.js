const inputs = {
  workMinutes: document.getElementById("workMinutes"),
  breakMinutes: document.getElementById("breakMinutes"),
  autoStartWork: document.getElementById("autoStartWork"),
  openBreakWindow: document.getElementById("openBreakWindow"),
};
const status = document.getElementById("status");

function fill(settings) {
  inputs.workMinutes.value = settings.workMinutes;
  inputs.breakMinutes.value = settings.breakMinutes;
  inputs.autoStartWork.checked = settings.autoStartWork;
  inputs.openBreakWindow.checked = settings.openBreakWindow;
  renderRatio();
}

function read() {
  return BreakTimer.normalizeSettings({
    workMinutes: inputs.workMinutes.value,
    breakMinutes: inputs.breakMinutes.value,
    autoStartWork: inputs.autoStartWork.checked,
    openBreakWindow: inputs.openBreakWindow.checked,
  });
}

function renderRatio() {
  const { workMinutes, breakMinutes } = read();
  const total = workMinutes + breakMinutes;
  const workShare = Math.round((workMinutes / total) * 100);
  document.getElementById("ratio-work").style.width = `${workShare}%`;
  document.getElementById("ratio-break").style.width = `${100 - workShare}%`;
  document.getElementById("ratio-text").textContent =
    `${workMinutes} min work + ${breakMinutes} min break = ${total} min cycle (${workShare}% / ${100 - workShare}%)`;
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = type;
  if (type === "ok") {
    setTimeout(() => {
      if (status.textContent === message) status.textContent = "";
    }, 2000);
  }
}

async function save() {
  const settings = read();
  fill(settings);
  try {
    await chrome.storage.sync.set(settings);
    showStatus("Saved.", "ok");
  } catch (error) {
    showStatus(`Save failed: ${error.message}`, "error");
  }
}

chrome.storage.sync.get(BreakTimer.DEFAULT_SETTINGS).then((stored) => fill(BreakTimer.normalizeSettings(stored)));
inputs.workMinutes.addEventListener("input", renderRatio);
inputs.breakMinutes.addEventListener("input", renderRatio);
document.getElementById("save").addEventListener("click", save);
document.getElementById("reset").addEventListener("click", () => fill(BreakTimer.DEFAULT_SETTINGS));
