// Builds the links bar element. Shared by the content script (real bar on pages)
// and the options page (live preview), so both always look the same.
(function (root) {
  const DEFAULT_STYLE = {
    backgroundColor: "#1f2937",
    borderColor: "#111827",
    textColor: "#e5e7eb",
    hoverBackgroundColor: "#374151",
    hoverTextColor: "#ffffff",
    iconColor: "#9ca3af",
    fontSize: 13,
    height: 32,
  };

  const NUMBER_LIMITS = {
    fontSize: { min: 10, max: 24 },
    height: { min: 24, max: 64 },
  };

  const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

  function normalizeStyle(raw) {
    const style = { ...DEFAULT_STYLE };
    if (!raw || typeof raw !== "object") return style;

    for (const key of Object.keys(DEFAULT_STYLE)) {
      const value = raw[key];
      if (key in NUMBER_LIMITS) {
        const number = Number(value);
        if (Number.isFinite(number)) {
          const { min, max } = NUMBER_LIMITS[key];
          style[key] = Math.min(max, Math.max(min, Math.round(number)));
        }
      } else if (typeof value === "string" && COLOR_PATTERN.test(value)) {
        style[key] = value;
      }
    }
    return style;
  }

  const BAR_CSS = `
    .bar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 4px;
      height: var(--lb-height);
      padding: 0 8px;
      background: var(--lb-background);
      border-bottom: 1px solid var(--lb-border);
      font: var(--lb-font-size)/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--lb-text);
    }
    .links {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      height: 100%;
      overflow-x: auto;
      scrollbar-width: none;
    }
    a {
      flex-shrink: 0;
      padding: 6px 10px;
      border-radius: 4px;
      color: var(--lb-text);
      text-decoration: none;
      white-space: nowrap;
    }
    a:hover { background: var(--lb-hover-background); color: var(--lb-hover-text); }
    button {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: calc(var(--lb-height) - 6px);
      height: calc(var(--lb-height) - 6px);
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: var(--lb-icon);
      font: inherit;
      font-size: 16px;
      cursor: pointer;
    }
    button:hover { background: var(--lb-hover-background); color: var(--lb-hover-text); }
    button svg { width: 16px; height: 16px; }
  `;

  function cssVariables(style) {
    return [
      `--lb-background: ${style.backgroundColor};`,
      `--lb-border: ${style.borderColor};`,
      `--lb-text: ${style.textColor};`,
      `--lb-hover-background: ${style.hoverBackgroundColor};`,
      `--lb-hover-text: ${style.hoverTextColor};`,
      `--lb-icon: ${style.iconColor};`,
      `--lb-font-size: ${style.fontSize}px;`,
      `--lb-height: ${style.height}px;`,
    ].join(" ");
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICONS = {
    settings: [
      ["circle", { cx: "12", cy: "12", r: "3" }],
      [
        "path",
        {
          d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
        },
      ],
    ],
    reload: [
      ["polyline", { points: "23 4 23 10 17 10" }],
      ["polyline", { points: "1 20 1 14 7 14" }],
      ["path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" }],
    ],
  };

  function createSvgElement(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  }

  function createIcon(shapes) {
    const svg = createSvgElement("svg", {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    });
    svg.append(...shapes.map(([tag, attributes]) => createSvgElement(tag, attributes)));
    return svg;
  }

  function createIconButton(title, content, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.append(content);
    button.addEventListener("click", onClick);
    return button;
  }

  function isSafeUrl(url) {
    try {
      return ["http:", "https:"].includes(new URL(url).protocol);
    } catch {
      return false;
    }
  }

  // Returns the bar host element (styles isolated in a shadow root). The caller
  // decides where and how to position it.
  function createBar(links, style, handlers) {
    const host = document.createElement("div");
    host.style.cssText = `all: initial; display: block; height: ${style.height}px;`;

    const shadow = host.attachShadow({ mode: "closed" });
    const css = document.createElement("style");
    css.textContent = `:host { all: initial; display: block; ${cssVariables(style)} } ${BAR_CSS}`;

    const bar = document.createElement("nav");
    bar.className = "bar";

    const list = document.createElement("div");
    list.className = "links";
    for (const link of links) {
      if (!isSafeUrl(link.url)) continue;
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.textContent = link.label || new URL(link.url).hostname;
      anchor.title = link.url;
      list.appendChild(anchor);
    }

    bar.append(
      list,
      createIconButton("Reload Links Bar extension", createIcon(ICONS.reload), handlers.onReload),
      createIconButton("Links Bar settings", createIcon(ICONS.settings), handlers.onSettings),
      createIconButton("Hide until page reload", "×", handlers.onClose),
    );
    shadow.append(css, bar);
    return host;
  }

  root.LinksBarUI = { DEFAULT_STYLE, NUMBER_LIMITS, normalizeStyle, createBar };
})(this);
