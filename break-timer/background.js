// Chrome runs this as a service worker (needs importScripts); Firefox loads
// common.js first via "background.scripts".
if (typeof importScripts === "function") importScripts("common.js");

const { DEFAULT_SETTINGS, STATE_KEY, IDLE_STATE } = BreakTimer;
const PHASE_ALARM = "phase-end";
const BADGE_ALARM = "badge-tick";
const MINUTE_MS = 60 * 1000;
const BADGE_COLORS = { work: "#2563eb", break: "#d97706", paused: "#6b7280" };

async function getSettings() {
  return BreakTimer.normalizeSettings(await chrome.storage.sync.get(DEFAULT_SETTINGS));
}

async function getState() {
  const result = await chrome.storage.local.get(STATE_KEY);
  return BreakTimer.normalizeState(result[STATE_KEY]);
}

async function saveState(state) {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

async function setState(state) {
  await saveState(state);
  await scheduleAlarms(state);
  await updateBadge(state);
}

async function scheduleAlarms(state) {
  await chrome.alarms.clear(PHASE_ALARM);
  await chrome.alarms.clear(BADGE_ALARM);
  if (state.endsAt == null) return;

  const remaining = Math.max(0, state.endsAt - Date.now());
  chrome.alarms.create(PHASE_ALARM, { when: state.endsAt });
  // Tick on whole remaining minutes so the badge never lags behind.
  chrome.alarms.create(BADGE_ALARM, {
    when: Date.now() + (remaining % MINUTE_MS || MINUTE_MS) + 100,
    periodInMinutes: 1,
  });
}

async function updateBadge(state) {
  if (state.phase === "idle") {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: "Break Timer – not running" });
    return;
  }

  const paused = BreakTimer.isPaused(state);
  const minutesLeft = Math.max(1, Math.ceil(BreakTimer.remainingMs(state) / MINUTE_MS));
  const phaseName = state.phase === "work" ? "work" : "break";

  await chrome.action.setBadgeText({ text: String(minutesLeft) });
  await chrome.action.setBadgeBackgroundColor({ color: paused ? BADGE_COLORS.paused : BADGE_COLORS[state.phase] });
  await chrome.action.setTitle({
    title: `Break Timer – ${phaseName}, ${minutesLeft} min left${paused ? " (paused)" : ""}`,
  });
}

async function notify(id, title, message) {
  const options = {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title,
    message,
    priority: 2,
  };
  await chrome.notifications.clear(id).catch(() => {});
  try {
    await chrome.notifications.create(id, { ...options, requireInteraction: true });
  } catch {
    // Firefox does not support requireInteraction.
    await chrome.notifications.create(id, options).catch(() => {});
  }
}

async function openBreakWindow() {
  try {
    const created = await chrome.windows.create({
      url: chrome.runtime.getURL("break.html"),
      type: "popup",
      width: 480,
      height: 320,
      focused: true,
    });
    return created.id ?? null;
  } catch {
    return null;
  }
}

async function closeBreakWindow(windowId) {
  if (windowId == null) return;
  await chrome.windows.remove(windowId).catch(() => {});
}

// announce: show the notification/break window (automatic transitions only,
// not when the user starts or skips a phase by hand).
async function startPhase(phase, { announce }) {
  const settings = await getSettings();
  const previous = await getState();
  const minutes = phase === "work" ? settings.workMinutes : settings.breakMinutes;
  const durationMs = minutes * MINUTE_MS;
  const state = { ...IDLE_STATE, phase, endsAt: Date.now() + durationMs, durationMs };

  if (phase === "work") {
    await closeBreakWindow(previous.breakWindowId);
    await setState(state);
    if (announce) {
      await notify(
        "phase",
        "Break is over – back to work",
        `Work for ${settings.workMinutes} min. Next break at ${BreakTimer.formatTimeOfDay(state.endsAt)}.`,
      );
    }
    return;
  }

  await setState({ ...state, breakWindowId: previous.breakWindowId });
  if (announce) {
    await notify(
      "phase",
      "Time for a break",
      `Take a ${settings.breakMinutes}-minute break. It ends at ${BreakTimer.formatTimeOfDay(state.endsAt)}.`,
    );
    if (settings.openBreakWindow && previous.breakWindowId == null) {
      const breakWindowId = await openBreakWindow();
      await saveState({ ...(await getState()), breakWindowId });
    }
  }
}

async function finishPhase() {
  const state = await getState();
  if (state.endsAt == null || state.endsAt - Date.now() > 1000) {
    // Stale alarm (the phase was paused, skipped or reset in the meantime).
    await scheduleAlarms(state);
    return;
  }

  if (state.phase === "work") {
    await startPhase("break", { announce: true });
    return;
  }

  if (state.phase === "break") {
    const settings = await getSettings();
    if (settings.autoStartWork) {
      await startPhase("work", { announce: true });
      return;
    }
    await closeBreakWindow(state.breakWindowId);
    await setState(IDLE_STATE);
    await notify("phase", "Break is over", "Open Break Timer and click Start when you are back at work.");
  }
}

const ACTIONS = {
  async start() {
    await startPhase("work", { announce: false });
  },
  async pause() {
    const state = await getState();
    if (state.phase === "idle" || state.endsAt == null) return;
    await setState({ ...state, endsAt: null, remainingMs: BreakTimer.remainingMs(state) });
  },
  async resume() {
    const state = await getState();
    if (!BreakTimer.isPaused(state)) return;
    await setState({ ...state, endsAt: Date.now() + state.remainingMs, remainingMs: null });
  },
  async skip() {
    const state = await getState();
    if (state.phase === "idle") return;
    await startPhase(state.phase === "work" ? "break" : "work", { announce: false });
  },
  async reset() {
    const state = await getState();
    await closeBreakWindow(state.breakWindowId);
    await setState(IDLE_STATE);
  },
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const action = ACTIONS[message?.type];
  if (!action) return false;
  action().then(
    () => sendResponse({ ok: true }),
    (error) => sendResponse({ ok: false, error: String(error) }),
  );
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === PHASE_ALARM) await finishPhase();
  if (alarm.name === BADGE_ALARM) await updateBadge(await getState());
});

chrome.notifications.onClicked.addListener((id) => {
  chrome.notifications.clear(id);
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const state = await getState();
  if (state.breakWindowId === windowId) await saveState({ ...state, breakWindowId: null });
});

// Restore alarms and the badge after a browser restart or extension reload. A phase
// that ended while the browser was closed is not announced late – the timer resets.
async function restore() {
  const state = await getState();
  if (state.endsAt != null && state.endsAt <= Date.now()) {
    await setState(IDLE_STATE);
    return;
  }
  await setState({ ...state, breakWindowId: null });
}

chrome.runtime.onStartup.addListener(restore);
chrome.runtime.onInstalled.addListener(restore);
