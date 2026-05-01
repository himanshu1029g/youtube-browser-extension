// create popup ..

const autoPauseToggle = document.getElementById("autoPauseToggle");
const dualTabToggle = document.getElementById("dualTabToggle");

// Load saved settings
chrome.storage.local.get(['autoPause', 'dualTabSync'], (data) => {
    // Default: both ON
    autoPauseToggle.checked = data.autoPause !== false;
    dualTabToggle.checked = data.dualTabSync !== false;
});

// Save on change
autoPauseToggle.addEventListener('change', () => {
    chrome.storage.local.set({ autoPause: autoPauseToggle.checked });
});

dualTabToggle.addEventListener('change', () => {
    chrome.storage.local.set({ dualTabSync: dualTabToggle.checked });
});
