const PENDING_RELOAD_TAB_KEY = "pendingReloadTabId";

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "open-options") {
    chrome.runtime.openOptionsPage();
  }

  if (message?.type === "reload-extension") {
    // The tab is reloaded after the extension restarts (see onInstalled), so the
    // fresh content script is injected into it.
    const tabId = sender.tab?.id;
    chrome.storage.local.set({ [PENDING_RELOAD_TAB_KEY]: tabId ?? null }, () => {
      chrome.runtime.reload();
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(PENDING_RELOAD_TAB_KEY, (result) => {
    const tabId = result[PENDING_RELOAD_TAB_KEY];
    if (tabId == null) return;
    chrome.storage.local.remove(PENDING_RELOAD_TAB_KEY);
    chrome.tabs.reload(tabId).catch(() => {});
  });
});
