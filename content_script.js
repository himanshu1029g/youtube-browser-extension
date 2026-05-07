// ─── State ───────────────────────────────────────
let video = null;
let pausedByUs = false;  // kya extension ne pause kiya?

// ─── Extension alive check ────────────────────────
function isAlive() {
  try { chrome.runtime.id; return true; }
  catch (e) { return false; }
}

function safeMsg(msg) {
  if (!isAlive()) return;
  chrome.runtime.sendMessage(msg).catch(() => { });
}

// ─── Wait for YouTube video element ──────────────
function waitForVideo(cb) {
  const check = () => {
    const v = document.querySelector('video');
    if (v) { video = v; cb(v); }
    else setTimeout(check, 500);
  };
  check();
}

// ─────────────────────────────────────────────────
waitForVideo((v) => {

  safeMsg({ type: 'REGISTER_TAB' });

  // ── User manually plays video ─────────────────
  v.addEventListener('play', () => {
    if (!isAlive()) return;
    // Sirf user action pe bhejo — extension-triggered play pe nahi
    if (pausedByUs) { pausedByUs = false; return; }
    safeMsg({ type: 'VIDEO_PLAYING' });
  });



  // ── User manually pauses video ────────────────
  v.addEventListener('pause', () => {
    if (!isAlive()) return;
    // Sirf user action pe bhejo — extension-triggered pause pe nahi
    if (pausedByUs) return;
    safeMsg({ type: 'VIDEO_PAUSED' });
  });

  // FEATURE 1A: Cursor leaves browser window
  document.addEventListener('mouseleave', () => {
    if (!isAlive() || v.paused) return;
    pausedByUs = true;
    v.pause();
    safeMsg({ type: 'VIDEO_PAUSED' }); // trigger music resume
    showToast('⏸ Paused — cursor left');
  });

  // ── Feature 1A: Cursor re-enters window ───────
  document.addEventListener('mouseenter', () => {
    if (!isAlive()) return;
    // Only resume if WE paused it (not user, not dual sync)
    if (v.paused && pausedByUs) {
      // pausedByUs = true already, play event mein false ho jayega
      v.play().catch(() => { });
      safeMsg({ type: 'VIDEO_PLAYING' });
      showToast('▶ Resumed');
    }
  });

  // Commands from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (!isAlive() || !video) return;

    switch (msg.type) {

      // FEATURE 1B: Tab switched away
      case 'AUTO_PAUSE':
        if (!v.paused) {
          pausedByUs = true;
          v.pause();
          safeMsg({ type: 'VIDEO_PAUSED' });
        }
        break;

      // FEATURE 1B: Tab switched back
      case 'AUTO_RESUME':
        if (v.paused && pausedByUs) {
          v.play().catch(() => { });
          safeMsg({ type: 'VIDEO_PLAYING' });
          showToast('▶ Resumed');
        }
        break;

      // FEATURE 2: Other tab started playing → we pause
      case 'DUAL_PAUSE':
        removeOverlay();
        if (!v.paused) {
          pausedByUs = true;
          v.pause();
        }
        break;

      // FEATURE 2: Other tab paused → we try to play
      case 'DUAL_RESUME':
        if (v.paused) {
          pausedByUs = false;
          v.play()
            .then(() => removeOverlay())
            .catch(() => showOverlay(v));
          // Do NOT send VIDEO_PLAYING here — avoid echo loop
        }
        break;
    }
  });

});

// ─── Overlay for autoplay block ──────────────────
function showOverlay(v) {
  removeOverlay();
  const el = document.createElement('div');
  el.id = 'yth-overlay';
  Object.assign(el.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: '999999', cursor: 'pointer',
    backdropFilter: 'blur(3px)',
  });
  el.innerHTML = `
    <div style="width:72px;height:72px;border-radius:50%;
      background:rgba(255,255,255,0.15);
      border:2px solid rgba(255,255,255,0.4);
      display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <div style="color:#fff;font-size:15px;font-family:sans-serif;font-weight:600;">Click to resume</div>
    <div style="color:rgba(255,255,255,0.45);font-size:11px;font-family:sans-serif;margin-top:5px;">
      Browser blocked autoplay in background tab
    </div>`;
  el.addEventListener('click', () => { v.play().catch(() => { }); removeOverlay(); });
  document.body.appendChild(el);
}

function removeOverlay() {
  document.getElementById('yth-overlay')?.remove();
}

// ─── Feature 3: Screenshot → Clipboard ───────────
document.addEventListener('keydown', async (e) => {
  if (!e.ctrlKey || e.code !== 'CapsLock') return;
  e.preventDefault();
  if (!isAlive()) return;
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
});

// ─── Toast ────────────────────────────────────────
function showToast(msg) {
  document.getElementById('yth-toast')?.remove();
  const t = document.createElement('div');
  t.id = 'yth-toast';
  t.innerText = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.85)', color: '#fff',
    padding: '10px 20px', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'sans-serif',
    zIndex: '99999', pointerEvents: 'none',
    opacity: '1', transition: 'opacity 0.3s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  });
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
}