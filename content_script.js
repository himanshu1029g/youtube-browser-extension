// ─── State ───────────────────────────────────────
let video = null;
let pauseReason = null;
// pauseReason values:
//   null         → user ne khud pause kiya
//   'TAB_SWITCH' → tab change se auto pause
//   'MOUSE_LEAVE'→ cursor window se bahar
//   'DUAL_SYNC'  → dusri tab play hui

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
  chrome.runtime.sendMessage({ type: 'REGISTER_TAB' }).catch(() => {});

  // Video events → background ko batao (sirf user action pe)
  v.addEventListener('play', () => {
    // Agar extension ne resume kiya toh background ko mat batao
    if (pauseReason !== null) return;
    chrome.runtime.sendMessage({ type: 'VIDEO_PLAYING' }).catch(() => {});
  });

  v.addEventListener('pause', () => {
    // Agar extension ne pause kiya toh background ko mat batao
    if (pauseReason !== null) return;
    chrome.runtime.sendMessage({ type: 'VIDEO_PAUSED' }).catch(() => {});
  });

  // ── Feature 1B: Cursor leaves browser window ──
  document.addEventListener('mouseleave', () => {
    if (!v.paused) {
      pauseReason = 'MOUSE_LEAVE';
      v.pause();
      showToast('⏸ Paused — cursor left');
    }
  });

  document.addEventListener('mouseenter', () => {
    if (v.paused && pauseReason === 'MOUSE_LEAVE') {
      pauseReason = null;
      v.play().catch(() => {});
      showToast('▶ Resumed');
    }
  });

  // ── Commands from background ──────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (!video) return;

    switch (msg.type) {

      case 'AUTO_PAUSE': // Tab switch — pause karo
        if (!v.paused) {
          pauseReason = 'TAB_SWITCH';
          v.pause();
        }
        break;

      case 'AUTO_RESUME': // Tab switch — resume karo
        if (v.paused && pauseReason === 'TAB_SWITCH') {
          pauseReason = null;
          v.play().catch(() => {});
          showToast('▶ Resumed');
        }
        break;

      case 'DUAL_PAUSE': // Dusri tab play hui — hum pause ho
        if (!v.paused) {
          pauseReason = 'DUAL_SYNC';
          v.pause();
        }
        break;

      case 'DUAL_RESUME': // Dusri tab pause hui — hum play ho
        if (v.paused && pauseReason === 'DUAL_SYNC') {
          pauseReason = null;
          v.play().catch(() => {});
        }
        break;
    }
  });
});

// ─── Feature 2: Screenshot → Clipboard ──────────
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.code === 'CapsLock') {
    e.preventDefault();
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
      console.error('[YT Helper]', err);
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