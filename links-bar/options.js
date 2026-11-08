const DEFAULTS = { sites: [], links: [], style: LinksBarUI.DEFAULT_STYLE };
const PREVIEW_LINKS = [
  { label: "Example link", url: "https://example.com/" },
  { label: "Another link", url: "https://example.org/" },
];

const sitesInput = document.getElementById("sites");
const linksContainer = document.getElementById("links");
const rowTemplate = document.getElementById("link-row");
const styleInputs = document.querySelectorAll("[data-style]");
const preview = document.getElementById("preview");
const status = document.getElementById("status");

function addLinkRow(link = { label: "", url: "" }) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".label").value = link.label;
  row.querySelector(".url").value = link.url;

  row.querySelector(".up").addEventListener("click", () => {
    row.previousElementSibling?.before(row);
    renderPreview();
  });
  row.querySelector(".down").addEventListener("click", () => {
    row.nextElementSibling?.after(row);
    renderPreview();
  });
  row.querySelector(".remove").addEventListener("click", () => {
    row.remove();
    renderPreview();
  });

  linksContainer.appendChild(row);
  return row;
}

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function readSites() {
  return sitesInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readLinks() {
  const links = [];
  let valid = true;

  for (const row of linksContainer.querySelectorAll(".link-row")) {
    const labelInput = row.querySelector(".label");
    const urlInput = row.querySelector(".url");
    const label = labelInput.value.trim();
    const url = urlInput.value.trim();

    urlInput.classList.remove("invalid");
    if (!label && !url) continue;

    if (!isValidUrl(url)) {
      urlInput.classList.add("invalid");
      valid = false;
      continue;
    }
    links.push({ label, url });
  }

  return { links, valid };
}

function readPreviewLinks() {
  const links = [...linksContainer.querySelectorAll(".link-row")]
    .map((row) => ({
      label: row.querySelector(".label").value.trim(),
      url: row.querySelector(".url").value.trim(),
    }))
    .filter((link) => isValidUrl(link.url));
  return links.length > 0 ? links : PREVIEW_LINKS;
}

function readStyle() {
  const raw = {};
  styleInputs.forEach((input) => {
    raw[input.dataset.style] = input.value;
  });
  return LinksBarUI.normalizeStyle(raw);
}

function fillStyle(style) {
  styleInputs.forEach((input) => {
    input.value = style[input.dataset.style];
  });
}

function renderPreview() {
  const noop = () => {};
  const bar = LinksBarUI.createBar(readPreviewLinks(), readStyle(), {
    onReload: noop,
    onSettings: noop,
    onClose: noop,
  });
  bar.addEventListener("click", (event) => event.preventDefault());
  preview.replaceChildren(bar);
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

function save() {
  const sites = readSites();
  const { links, valid } = readLinks();
  const style = readStyle();

  if (!valid) {
    showStatus("Fix the highlighted URLs (http or https only).", "error");
    return;
  }

  fillStyle(style);
  chrome.storage.sync.set({ sites, links, style }, () => {
    if (chrome.runtime.lastError) {
      showStatus(`Save failed: ${chrome.runtime.lastError.message}`, "error");
      return;
    }
    showStatus("Saved.", "ok");
  });
}

chrome.storage.sync.get(DEFAULTS, (config) => {
  sitesInput.value = config.sites.join("\n");
  config.links.forEach((link) => addLinkRow(link));
  if (config.links.length === 0) addLinkRow();
  fillStyle(LinksBarUI.normalizeStyle(config.style));
  renderPreview();
});

document.getElementById("add-link").addEventListener("click", () => {
  addLinkRow().querySelector(".label").focus();
});
document.getElementById("reset-style").addEventListener("click", () => {
  fillStyle(LinksBarUI.DEFAULT_STYLE);
  renderPreview();
});
document.getElementById("save").addEventListener("click", save);
linksContainer.addEventListener("input", renderPreview);
styleInputs.forEach((input) => input.addEventListener("input", renderPreview));
