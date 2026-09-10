# Paradox Dictation

Paradox Dictation is a focused dictation workspace that runs in a Linux browser or as an installable Linux desktop app. It stores drafts and saved sessions locally on the device.

## Run it in a browser

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. On Chromium-based browsers, use the **Install app** button or the browser menu to install Paradox as a standalone PWA. The PWA shell can load offline after the first visit.

## Run the Linux desktop app during development

```bash
npm install
npm run desktop
```

That builds the app and opens the Electron desktop window. To run with live Vite reload instead:

```bash
npm run desktop:dev
```

Microphone access is requested only when the user starts a recording. Saved sessions and unfinished drafts are persisted locally. Recorded audio can be saved to the browser download folder or, in the desktop app, directly to the user's Linux Downloads folder.

## Linux tray and floating widget

The desktop build stays available in the Linux system tray when its window is closed. Closing the window does not quit Paradox; choose **Quit Paradox** from the tray menu to exit completely. The tray menu also provides:

- **Floating quick widget** — an always-on-top mini launcher for starting dictation or reopening Paradox.
- **Show widget when app closes** — keeps the mini launcher visible after the main window is closed.
- **Start with Linux** — enables autostart where the desktop environment supports it.

The widget can also be toggled with `Ctrl + Shift + Space`. On GNOME, KDE, Cinnamon, and other Linux desktops that support StatusNotifier/AppIndicator, the Paradox icon appears in the panel/system tray. Users can pin **Paradox Dictation** to their taskbar or dock through their desktop environment like any other installed Linux app.

## Build Linux installers

```bash
npm run package:linux
```

The installers are written to `release/`:

- `Paradox Dictation-*.AppImage` — portable Linux app; make executable with `chmod +x` and launch it.
- `paradox-dictation_*.deb` — Debian/Ubuntu package; install with `sudo apt install ./paradox-dictation_*.deb`.

The generated `dist/` and `release/` folders are ignored by Git.

## Dictation support

Live transcription uses the browser or Chromium speech-recognition engine when it is available. The app also captures microphone audio with `MediaRecorder`, supports saving that recording, and always keeps the editable transcript and local-session workflow available. On Linux, Chromium-based browsers generally provide the most consistent speech-recognition permissions.
