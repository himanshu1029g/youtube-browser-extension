# 📺 YT Study Helper — Browser Extension

A lightweight browser extension built for students who study from YouTube lectures.  
No more manually pausing videos, cropping screenshots, or losing your music flow.

---

## ✨ Features

### ⏸ 1. Auto Pause on Tab Switch
- Lecture video **automatically pauses** when you switch to another tab (e.g., Word, Notion)
- **Automatically resumes** when you come back to the YouTube tab
- No more pressing Space bar every time

### 📋 2. Video Frame Screenshot → Clipboard
- Press **`Ctrl + CapsLock`** on the YouTube tab
- Only the **video frame** is captured (not the whole screen)
- Directly copied to clipboard — just **`Ctrl+V`** in Word/Notion/anywhere
- **Nothing saved to disk** — pure clipboard only

### 🎵 3. Dual Tab Sync (Lecture ↔ Music)
- Have a music YouTube tab open alongside your lecture tab?
- Lecture **pauses** → music **auto plays**
- Music **pauses** → lecture **auto resumes**
- Seamless, zero manual switching

### 🎛 Popup Toggles
- Click the extension icon to **enable/disable** Auto Pause or Dual Sync anytime

---

## 🌐 Browser Compatibility

| Browser | Supported |
|---|---|
| Google Chrome | ✅ |
| Brave | ✅ |
| Microsoft Edge | ✅ |
| Opera / Vivaldi | ✅ |
| Firefox | ❌ (uses different extension API) |

> Works on any **Chromium-based** browser.

---

## 📁 Folder Structure

```
yt-study-extension/
├── manifest.json        ← Extension config + permissions
├── background.js        ← Tab tracking, pause/resume, dual sync
├── content_script.js    ← Video control + screenshot logic
├── popup.html           ← Toggle UI (click extension icon)
├── popup.js             ← Saves toggle state
└── icons/
    └── icon128.png
```

---

## 🚀 Installation (Developer Mode — No Store Required)

> This extension is not published on Chrome Web Store.  
> Load it manually in **Developer Mode** — takes less than a minute.

### Step 1 — Download / Clone

**Option A — Clone via Git:**
```bash
git clone https://github.com/YOUR_USERNAME/yt-study-extension.git
```

**Option B — Download ZIP:**
- Click **Code → Download ZIP** on this repo
- Extract the ZIP on your computer

---

### Step 2 — Open Extensions Page

Open your browser and go to:

| Browser | URL |
|---|---|
| Chrome | `chrome://extensions/` |
| Brave | `brave://extensions/` |
| Edge | `edge://extensions/` |

---

### Step 3 — Enable Developer Mode

- Look at the **top-right corner** of the Extensions page
- Toggle **"Developer mode"** → **ON**

---

### Step 4 — Load the Extension

- Click **"Load unpacked"** button (appears after enabling dev mode)
- Navigate to and select the **`yt-study-extension`** folder  
  *(the folder containing `manifest.json` — not the ZIP, not the parent folder)*

---

### Step 5 — Done ✅

- The extension icon (▶ red circle) appears in your browser toolbar
- Open any YouTube video and it starts working immediately
- Click the icon to see toggles for each feature

---

## ⌨️ Keyboard Shortcut

| Shortcut | Action |
|---|---|
| `Ctrl + CapsLock` | Capture current video frame → clipboard |

> **Note:** The shortcut only works when your cursor/focus is on the YouTube tab.

---

## ⚠️ Known Limitations

- **Firefox not supported** — Firefox uses Manifest V2 + different APIs
- **Dual sync** may not work if YouTube blocks autoplay (browser restriction). Click play manually once if needed.
- Extension resets if browser is restarted — reload it from `extensions/` page if it stops working (rare)
- Screenshot requires the video to be **loaded and visible** on screen

---

## 🔒 Privacy

- **No data is collected** — ever
- No internet requests made by the extension
- Screenshot stays only in your clipboard (RAM) — never written to disk
- All logic runs locally in your browser

---

## 🛠 Tech Stack

| Part | Technology |
|---|---|
| Extension API | Chrome Manifest V3 |
| Tab Management | `chrome.tabs` API |
| Video Control | HTML5 `<video>` DOM API |
| Screenshot | Canvas API + Clipboard API |
| Storage | `chrome.storage.local` |
| Messaging | `chrome.runtime.sendMessage` |

---

## 👤 Author

**Himanshu Gupta**  
B.Tech Computer Science | DevOps Intern  
GitHub: [@himanshu1029g](https://github.com/himanshu1029g)

---

## 📄 License

MIT License — free to use, modify, and share.
