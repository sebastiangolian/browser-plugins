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

- **Chrome / Edge:** open `chrome://extensions`, enable *Developer mode*, click *Load unpacked* and select the extension folder.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, click *Load Temporary Add-on…* and select the extension's `manifest.json`.

## Extensions

_None yet._
