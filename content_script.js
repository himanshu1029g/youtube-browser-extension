// ─── State ───────────────────────────────────────
let video = null;
let pauseReason = null;
// pauseReason:
//   null          → user action
//   'TAB_SWITCH'  → tab change
//   'MOUSE_LEAVE' → cursor bahar
//   'DUAL_SYNC'   → dusri tab se

// ─── Extension context check ─────────────────────
function isExtensionAlive() {
  try { chrome.runtime.id; return true; }
  catch (e) { return false; }
}

function safeSendMessage(msg) {
  if (!isExtensionAlive()) return;
  chrome.runtime.sendMessage(msg).catch(() => {});
}

// ─── Wait for video ──────────────────────────────
function waitForVideo(callback) {
  const check = () => {
    const v = document.querySelector('video');
    if (v) { video = v; callback(v); }
    else setTimeout(check, 500);
  };
  check();
}

// ─── Init ────────────────────────────────────────
waitForVideo((v) => {
  safeSendMessage({ type: 'REGISTER_TAB' });

  // ── Video events → background ────────────────────
  v.addEventListener('play', () => {
    if (!isExtensionAlive()) return;
    if (pauseReason === 'TAB_SWITCH' || pauseReason === 'MOUSE_LEAVE') return;
    pauseReason = null;
    safeSendMessage({ type: 'VIDEO_PLAYING' });
  });

  v.addEventListener('pause', () => {
    if (!isExtensionAlive()) return;
    if (pauseReason === 'TAB_SWITCH' || pauseReason === 'MOUSE_LEAVE') return;
    pauseReason = null;
    safeSendMessage({ type: 'VIDEO_PAUSED' });
  });

  // ── Cursor leaves window ─────────────────────────
  document.addEventListener('mouseleave', () => {
    if (!isExtensionAlive()) return;
    if (!v.paused) {
      pauseReason = 'MOUSE_LEAVE';
      v.pause();
      showToast('⏸ Paused — cursor left');
    }
  });

  document.addEventListener('mouseenter', () => {
    if (!isExtensionAlive()) return;
    if (v.paused && pauseReason === 'MOUSE_LEAVE') {
      pauseReason = null;
      v.play().catch(() => {});
      showToast('▶ Resumed');
    }
  });

  // ── Commands from background ─────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (!isExtensionAlive()) return;
    if (!video) return;

    switch (msg.type) {

      case 'AUTO_PAUSE':
        if (!v.paused) {
          pauseReason = 'TAB_SWITCH';
          v.pause();
        }
        break;

      case 'AUTO_RESUME':
        if (v.paused && pauseReason === 'TAB_SWITCH') {
          pauseReason = null;
          v.play().catch(() => {});
          showToast('▶ Resumed');
        }
        break;

      case 'DUAL_PAUSE':
        removeResumeOverlay(); // agar overlay tha toh hatao
        if (!v.paused) {
          pauseReason = 'DUAL_SYNC';
          v.pause();
        }
        break;

      case 'DUAL_RESUME':
        // Browser background tab mein autoplay block karta hai
        // Solution: user ko ek click overlay dikhao
        if (v.paused && pauseReason === 'DUAL_SYNC') {
          pauseReason = null;

          // Pehle seedha play try karo (kabhi kabhi kaam karta hai)
          v.play().then(() => {
            // Play ho gaya — overlay ki zaroorat nahi
            removeResumeOverlay();
          }).catch(() => {
            // Browser ne block kiya → overlay dikhao
            showResumeOverlay(v);
          });
        }
        break;
    }
  });
});

// ─── Resume Overlay ──────────────────────────────
// Jab browser autoplay block kare, ek big play button dikhao
function showResumeOverlay(v) {
  removeResumeOverlay(); // duplicate mat banao

  const overlay = document.createElement('div');
  overlay.id = 'yt-resume-overlay';

  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '999999',
    cursor: 'pointer',
    backdropFilter: 'blur(2px)',
  });

  overlay.innerHTML = `
    <div style="
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      width: 80px; height: 80px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    ">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>
    <div style="color:white; font-size:16px; font-family:sans-serif; font-weight:600;">
      Click to resume music
    </div>
    <div style="color:rgba(255,255,255,0.5); font-size:12px; font-family:sans-serif; margin-top:6px;">
      Browser needs a click to autoplay
    </div>
  `;

  overlay.addEventListener('click', () => {
    v.play().catch(() => {});
    removeResumeOverlay();
  });

  document.body.appendChild(overlay);
}

function removeResumeOverlay() {
  const existing = document.getElementById('yt-resume-overlay');
  if (existing) existing.remove();
}

// ─── Feature 2: Screenshot → Clipboard ──────────
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.code === 'CapsLock') {
    e.preventDefault();
    if (!isExtensionAlive()) return;
    const v = document.querySelector('video');
    if (!v) { showToast('❌ No video found'); return; }

    try {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth * scale;
      canvas.height = v.videoHeight * scale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);
      ctx.drawImage(v, 0, 0);

      const blob = await new Promise(res => canvas.toBlob(res, 'image/png', 1.0));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📋 Frame copied! Ctrl+V to paste');
    } catch (err) {
      showToast('❌ Screenshot failed');
    }
  }
});

// ─── Toast ───────────────────────────────────────
function showToast(message) {
  const existing = document.getElementById('yt-study-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'yt-study-toast';
  toast.innerText = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.85)', color: '#fff',
    padding: '10px 20px', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'sans-serif',
    zIndex: '99999', pointerEvents: 'none',
    opacity: '1', transition: 'opacity 0.3s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}