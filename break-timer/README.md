# Break Timer

Keeps a healthy work/break rhythm. By default: **45 minutes of work, then a 15-minute break**, in a loop.

## How it works

- Click the extension icon and press **Start work**. The icon badge shows the minutes left (blue = work, orange = break, grey = paused).
- When a work period ends, a system notification says it is time for a break and a small reminder window opens with a countdown.
- When the break ends, you get a notification and the next work period starts (or the timer stops – see settings).
- The popup also lets you **Pause / Resume**, start the break now (**Break now**), end a break early (**End break**) and **Reset**.

The timer runs in the background (`chrome.alarms`), so it keeps going with all tabs closed. If the browser was closed when a phase ended, the timer resets instead of showing a late reminder.

## Settings

Open them from the popup (**Settings**) or the extension's *Options*:

- work period length (1–240 min) and break length (1–120 min),
- start the next work period automatically after a break (default: on),
- open a reminder window when a break starts (default: on).

New durations apply from the next work period or break.

> On macOS, Chrome notifications may be muted in *System Settings → Notifications → Google Chrome*. The reminder window works regardless.

## Install locally

- **Brave / Chrome / Edge:** `brave://extensions` (or `chrome://extensions`) → enable *Developer mode* → *Load unpacked* → select this `break-timer` folder.
- **Firefox:** `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → select `break-timer/manifest.json`.
