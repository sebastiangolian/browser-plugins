# Links Bar

Shows a bar with your own links at the top of selected websites.

## Configuration

Click the extension icon in the toolbar (or open the extension's *Options*) to configure:

- **Sites** – one pattern per line; the bar appears only on matching pages:
  - `example.com` – exact host (any port)
  - `localhost:8124` – host with a specific port
  - `*.example.com` – the domain and all its subdomains
  - `github.com/my-org/*` – host and path; `*` matches anything
- **Links** – label + URL pairs shown in the bar from left to right (http/https only).
- **Appearance** – colors (background, bottom border, link text, hover background, hover text, icons), font size and bar height, with a live preview. *Reset to default style* restores the original dark look.

Settings are stored in `chrome.storage.sync`, so they follow your browser profile. Changes apply to open tabs immediately.

On the right side of the bar:

- the reload icon reloads the extension (picks up code changes from disk, like ↻ in `chrome://extensions`) and refreshes the current tab,
- the gear icon opens these settings,
- the `×` button hides the bar until the page is reloaded.

## Install locally

- **Chrome / Edge:** `chrome://extensions` → enable *Developer mode* → *Load unpacked* → select this `links-bar` folder.
- **Firefox:** `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → select `links-bar/manifest.json`.
