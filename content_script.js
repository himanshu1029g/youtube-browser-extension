// ─────────────────────────────────────────────
//  YT Study Helper — content_script.js
//  Runs on every YouTube tab
//  Handles: video control, screenshot to clipboard
// ─────────────────────────────────────────────

let video = null;
let pausedByExtension = false;
let resumeByExtension = false;

function waitForVideo(callback) {
    const check = () => {
        const v = document.querySelector('video');
        if (v) {
            callback(v);
        } else {
            setTimeout(check, 500);
        }
    };
    check();
}

// ─── INIT ───────────────────────────────────────
waitForVideo((v) => {
    video = v;

    // Tell background we're ready
    chrome.runtime.sendMessage({ type: 'REGISTER_TAB' });

    // Listen to native video events → tell background
    video.addEventListener('play', () => {
        if (!resumeByExtension) {
            // User manually played → tell background (triggers dual sync)
            chrome.runtime.sendMessage({ type: 'VIDEO_PLAYING' });
        }
        resumeByExtension = false;
    });

    video.addEventListener('pause', () => {
        if (!pausedByExtension) {
            // User manually paused → tell background (triggers dual sync)
            chrome.runtime.sendMessage({ type: 'VIDEO_PAUSED' });
        }
        pausedByExtension = false;
    });

    // add some cursor feature ...
    // mouse exit 
    document.addEventListener('mouseleave', () => {
        if (!video.paused) {
            pausedByExtension = true;
            video.pause();
            showToast('⏸ Auto paused');
        }
    });

    // mouse enter 
    document.addEventListener('mouseenter', () => {
        if (!video.paused && pausedByExtension) {
            resumeByExtension = true;
            video.play();
            pausedByExtension = false
            showToast('▶ Resumed');
        }
    });






});

// ─── RECEIVE COMMANDS FROM BACKGROUND ──────────
chrome.runtime.onMessage.addListener((msg) => {
    if (!video) return;

    switch (msg.type) {

        // Feature 1: Auto pause when tab loses focus
        case 'AUTO_PAUSE':
            if (!video.paused) {
                pausedByExtension = true;
                video.pause();
                showToast('⏸ Auto paused');
            }
            break;

        // Feature 1: Auto resume when tab regains focus
        case 'AUTO_RESUME':
            if (video.paused && pausedByExtension) {
                resumeByExtension = true;
                video.play();
                showToast('▶ Resumed');
            }
            break;

        // Feature 3: Dual sync — force pause (music tab)
        case 'FORCE_PAUSE':
            if (!video.paused) {
                pausedByExtension = true;
                video.pause();
            }
            break;

        // Feature 3: Dual sync — force resume (music tab)
        case 'FORCE_RESUME':
            if (video.paused) {
                resumeByExtension = true;
                video.play().catch(() => {
                    // Autoplay blocked — ignore, user can click play
                });
            }
            break;
    }
});

// ─── FEATURE 2: Screenshot Video → Clipboard ───
// Shortcut: Ctrl + CapsLock
document.addEventListener('keydown', async (e) => {
    // CapsLock key code is 'CapsLock', keyCode 20
    const isCapsLock = e.code === 'CapsLock' || e.keyCode === 20;

    if (e.ctrlKey && isCapsLock) {
        e.preventDefault();
        e.stopPropagation();
        await captureVideoFrame();
    }
});

async function captureVideoFrame() {
    if (!video) {
        showToast('❌ No video found');
        return;
    }

    try {
        // Create a canvas the same size as the video
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob (PNG, no disk save)
        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/png')
        );

        if (!blob) {
            showToast('❌ Screenshot failed');
            return;
        }

        // Write directly to clipboard — no file saved anywhere
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);

        showToast('📋 Frame copied! Ctrl+V to paste');

    } catch (err) {
        console.error('[YT Study Helper] Screenshot error:', err);
        showToast('❌ Clipboard error — check permissions');
    }
}

// ─── TOAST NOTIFICATION ─────────────────────────
// Small non-intrusive overlay on the video
function showToast(message) {
    // Remove existing toast
    const existing = document.getElementById('yt-study-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'yt-study-toast';
    toast.innerText = message;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        zIndex: '99999',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        opacity: '1',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    });

    document.body.appendChild(toast);

    // Auto remove after 2.5s
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}