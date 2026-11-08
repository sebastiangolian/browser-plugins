(function () {
  const HOST_ID = "links-bar-extension-root";
  const OFFSET_STYLE_ID = "links-bar-extension-offset";
  const DEFAULTS = { sites: [], links: [], style: LinksBarUI.DEFAULT_STYLE };

  let dismissed = false;

  // After the extension is reloaded, content scripts left in already open tabs lose
  // their connection to it; reloading the page injects the fresh one.
  function sendToExtension(message) {
    try {
      chrome.runtime.sendMessage(message);
    } catch {
      window.location.reload();
    }
  }

  function removeBar() {
    document.getElementById(HOST_ID)?.remove();
    document.getElementById(OFFSET_STYLE_ID)?.remove();
  }

  function renderBar(links, style) {
    removeBar();

    const host = LinksBarUI.createBar(links, style, {
      onReload: () => sendToExtension({ type: "reload-extension" }),
      onSettings: () => sendToExtension({ type: "open-options" }),
      onClose: () => {
        dismissed = true;
        removeBar();
      },
    });
    host.id = HOST_ID;
    host.style.cssText += "position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;";
    document.documentElement.appendChild(host);

    const offset = document.createElement("style");
    offset.id = OFFSET_STYLE_ID;
    offset.textContent = `html { margin-top: ${style.height}px !important; }`;
    document.head?.appendChild(offset) ?? document.documentElement.appendChild(offset);
  }

  function update(config) {
    const sites = Array.isArray(config.sites) ? config.sites : [];
    const links = Array.isArray(config.links) ? config.links : [];

    if (dismissed || links.length === 0 || !LinksBarMatch.matchesAnySite(sites, window.location)) {
      removeBar();
      return;
    }
    renderBar(links, LinksBarUI.normalizeStyle(config.style));
  }

  function load() {
    chrome.storage.sync.get(DEFAULTS, update);
  }

  if (window.top !== window) return;

  load();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes.sites || changes.links || changes.style)) load();
  });
})();
