# 📺 YT Study Helper — Browser Extension

> Built by a student, for students. No more manually pausing videos every time you switch tabs.

---

## 😤 The Problem

I study from YouTube lectures while taking notes in Word/Notion. Every few minutes I had to:
- Press Space to pause the video
- Switch to Word, write the note
- Switch back, press Space again to resume

For screenshots it was even worse — Snipping Tool → crop → paste. Just to capture one diagram.

This extension solves all of that automatically.

---

## ✨ Features

### ⏸ Feature 1 — Auto Pause / Resume
- Video **pauses automatically** when your cursor leaves the browser window (e.g., you click on Word)
- Video **resumes automatically** when you come back
- Also works on tab switch — switch to another tab → lecture pauses, come back → resumes
- Toggle ON/OFF from the extension popup

### 🎵 Feature 2 — Dual Tab Sync
- Have a **music YouTube tab** open alongside your lecture tab?
- Lecture **pauses** → music **auto plays**
- Music **pauses** → lecture **auto plays**
- Works with any pause trigger — cursor leave, tab switch, or manual Space bar
- If no second YouTube tab is open, everything works normally — no issues
- Toggle ON/OFF from the extension popup

### 📋 Feature 3 — Video Screenshot to Clipboard
- Press **`Ctrl + CapsLock`** anywhere on the YouTube tab
- Only the **video frame** is captured (not your whole screen)
- Goes straight to clipboard — just **`Ctrl+V`** in Word, Notion, Paint, anywhere
- **Nothing is saved to disk** — pure clipboard, pure RAM

---

## 🌐 Browser Support

| Browser | Supported |
|---|---|
| Google Chrome | ✅ |
| Brave | ✅ |
| Microsoft Edge | ✅ |
| Opera / Vivaldi | ✅ |
| Firefox | ❌ (different extension API) |

Works on any **Chromium-based** browser.

---

## 📁 Project Structure

```
yt-study-extension/
├── manifest.json       ← Extension config + permissions (Manifest V3)
├── background.js       ← Tab tracking, dual sync routing, settings
├── content_script.js   ← Video control, screenshot, toast notifications
├── popup.html          ← Extension popup UI with toggles
├── popup.js            ← Toggle state saved to chrome.storage
└── icons/
    └── icon128.png
```

---

## 🚀 Installation (No Store Required)

This extension is not on the Chrome Web Store. Load it manually in Developer Mode — takes under a minute.

### Step 1 — Get the code

**Clone:**
```bash
git clone https://github.com/himanshu1029g/youtube-browser-extension.git
```

**Or download ZIP** → Code → Download ZIP → Extract it

---

### Step 2 — Open Extensions page

| Browser | Address bar URL |
|---|---|
| Chrome | `chrome://extensions/` |
| Brave | `brave://extensions/` |
| Edge | `edge://extensions/` |

---

### Step 3 — Enable Developer Mode

Top-right corner → toggle **"Developer mode" ON**

---

### Step 4 — Load the extension

Click **"Load unpacked"** → select the `yt-study-extension` folder  
*(the one containing `manifest.json` — not the ZIP, not a parent folder)*

---

### Step 5 — Done ✅

Extension icon appears in toolbar. Open any YouTube video — it works immediately.

> **First time using Dual Sync?** Reload both YouTube tabs once (`Ctrl+R`) after installing.

---

## ⌨️ Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + CapsLock` | Capture video frame → clipboard |

---

## ⚠️ Known Behaviour

**Dual Sync + Autoplay:** Browsers block autoplay in background tabs. If the music tab hasn't been interacted with recently, a **"Click to resume"** overlay will appear on the music tab — just click it once and music starts. This is a browser security restriction, not a bug.

**After extension reload:** Both YouTube tabs need a manual `Ctrl+R` refresh to re-register with the extension.

---

## 🔒 Privacy

- Zero data collected — ever
- No network requests made by this extension
- Screenshot stays in clipboard (RAM) only — never written to disk
- All logic runs 100% locally in your browser

---

## 🛠 Tech Stack

| Part | Technology |
|---|---|
| Extension API | Chrome Manifest V3 |
| Tab Management | `chrome.tabs` + `chrome.tabs.onActivated` |
| Video Control | HTML5 `<video>` DOM API |
| Screenshot | Canvas API + Clipboard API (`ClipboardItem`) |
| State | `chrome.storage.local` |
| Communication | `chrome.runtime.sendMessage` / `onMessage` |

---

## 👤 Author

**Himanshu Gupta**  
B.Tech CSE | Full Stack + DevOps  
📧 ft.himanshu10@gmail.com  
🐙 [@himanshu1029g](https://github.com/himanshu1029g)

---

## 📄 License

MIT — free to use, fork, and modify.