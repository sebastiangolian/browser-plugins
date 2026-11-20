# browser-plugins

A collection of personal browser extensions.

## Structure

Each extension lives in its own folder at the repository root, with its own `manifest.json` (Manifest V3):

```
browser-plugins/
├── <extension-name>/
│   ├── manifest.json
│   └── ...
└── README.md
```

## Loading an extension locally

- **Brave / Chrome / Edge:** open `brave://extensions` (or `chrome://extensions`), enable *Developer mode*, click *Load unpacked* and select the extension folder.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, click *Load Temporary Add-on…* and select the extension's `manifest.json`.

## Versioning

Each plugin's `version` in `manifest.json` is bumped automatically by a `post-commit` hook (`.githooks/`), based on [Conventional Commits](https://www.conventionalcommits.org/):

- `feat!:` / `BREAKING CHANGE` → major (`1.4.2` → `2.0.0`)
- `feat:` → minor (`1.4.2` → `1.5.0`)
- anything else (`fix:`, `chore:`, …) → patch (`1.4.2` → `1.4.3`)

Only plugins whose files changed in the commit are bumped (README-only changes don't count), and the new version is folded into the same commit. A version changed by hand in the commit is left as is. Requires Node.js; enable the hooks once per clone:

```bash
git config core.hooksPath .githooks
```

## Extensions

- [links-bar](links-bar/) – shows a bar with your own links at the top of selected websites.
- [break-timer](break-timer/) – work/break rhythm timer (45 / 15 min by default) with break reminders.

## License

[MIT](LICENSE)
