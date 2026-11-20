// Shared by the background script, popup, break window and options page.
(function (root) {
  const DEFAULT_SETTINGS = {
    workMinutes: 45,
    breakMinutes: 15,
    autoStartWork: true,
    openBreakWindow: true,
  };

  const LIMITS = {
    workMinutes: { min: 1, max: 240 },
    breakMinutes: { min: 1, max: 120 },
  };

  const STATE_KEY = "timerState";

  // phase: "idle" | "work" | "break"
  // Running: endsAt is set. Paused: endsAt is null and remainingMs is set.
  const IDLE_STATE = {
    phase: "idle",
    endsAt: null,
    remainingMs: null,
    durationMs: null,
    breakWindowId: null,
  };

  function normalizeSettings(raw) {
    const settings = { ...DEFAULT_SETTINGS };
    if (!raw || typeof raw !== "object") return settings;

    for (const [key, { min, max }] of Object.entries(LIMITS)) {
      const number = Number(raw[key]);
      if (Number.isFinite(number)) settings[key] = Math.min(max, Math.max(min, Math.round(number)));
    }
    for (const key of ["autoStartWork", "openBreakWindow"]) {
      if (typeof raw[key] === "boolean") settings[key] = raw[key];
    }
    return settings;
  }

  function normalizeState(raw) {
    return { ...IDLE_STATE, ...(raw && typeof raw === "object" ? raw : {}) };
  }

  function isPaused(state) {
    return state.phase !== "idle" && state.endsAt == null;
  }

  function remainingMs(state, now = Date.now()) {
    if (state.phase === "idle") return 0;
    if (state.endsAt == null) return Math.max(0, state.remainingMs ?? 0);
    return Math.max(0, state.endsAt - now);
  }

  function formatClock(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => String(value).padStart(2, "0");
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  }

  function formatTimeOfDay(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  root.BreakTimer = {
    DEFAULT_SETTINGS,
    LIMITS,
    STATE_KEY,
    IDLE_STATE,
    normalizeSettings,
    normalizeState,
    isPaused,
    remainingMs,
    formatClock,
    formatTimeOfDay,
  };
})(globalThis);
