const autoPauseToggle = document.getElementById('autoPauseToggle');
const dualTabToggle   = document.getElementById('dualTabToggle');
const dot1            = document.getElementById('dot1');
const dot2            = document.getElementById('dot2');

// Update status dot colour
function updateDots() {
  dot1.className = 'status-dot' + (autoPauseToggle.checked ? ' on' : '');
  dot2.className = 'status-dot' + (dualTabToggle.checked   ? ' on' : '');
}

// Load saved settings (default both ON)
chrome.storage.local.get(['autoPause', 'dualTabSync'], (data) => {
  autoPauseToggle.checked = data.autoPause  !== false;
  dualTabToggle.checked   = data.dualTabSync !== false;
  updateDots();
});

// Save on change
autoPauseToggle.addEventListener('change', () => {
  chrome.storage.local.set({ autoPause: autoPauseToggle.checked });
  updateDots();
});

dualTabToggle.addEventListener('change', () => {
  chrome.storage.local.set({ dualTabSync: dualTabToggle.checked });
  updateDots();
});