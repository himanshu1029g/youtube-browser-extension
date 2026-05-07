// ─── State ───────────────────────────────────────
let activeTabId = null;
let ytTabs = new Set();
let settings = {autoPause:true, dualTabSync:true};



chrome.storage.local.get(['autoPause', 'dualTabSync'], (data) => {
  if (data.autoPause !== undefined) settings.autoPause = data.autoPause;
  if (data.dualTabSync !== undefined) settings.dualTabSync = data.dualTabSync;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoPause)    settings.autoPause   = changes.autoPause.newValue;
  if (changes.dualTabSync)  settings.dualTabSync = changes.dualTabSync.newValue;
});

// ─── Tab Switch (Feature 1 — tab change part) ────
chrome.tabs.onActivated.addListener(({ tabId }) => {
  const prevTabId = activeTabId;
  activeTabId = tabId;

  if (!settings.autoPause) return;

  if (prevTabId && prevTabId !== tabId) {
    safeSend(prevTabId, { type: 'AUTO_PAUSE' });
  }
  safeSend(tabId, { type: 'AUTO_RESUME' });
});

// ─── Messages from content scripts ───────────────
chrome.runtime.onMessage.addListener((msg, sender) => {
  const fromTabId = sender.tab?.id;
  if (!fromTabId) return;

  switch (msg.type) {

    case 'REGISTER_TAB':
      ytTabs.add(fromTabId);
      break;

    // Feature 2: Kisi bhi tab pe video play hua → baaki sab pause
    case 'VIDEO_PLAYING':
      if (!settings.dualTabSync) return;
      ytTabs.forEach(tabId => {
        if (tabId !== fromTabId) safeSend(tabId, { type: 'DUAL_PAUSE' });
      });
      break;

    // Feature 2: Kisi bhi tab pe video paused → baaki sab resume
    case 'VIDEO_PAUSED':
      if (!settings.dualTabSync) return;
      ytTabs.forEach(tabId => {
        if (tabId !== fromTabId) safeSend(tabId, { type: 'DUAL_RESUME' });
      });
      break;
  }
});

// ─── Tab Close Cleanup ────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  ytTabs.delete(tabId);
  if (activeTabId === tabId) activeTabId = null;
});

// ─── Safe message sender ──────────────────────────
function safeSend(tabId, message) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) { ytTabs.delete(tabId); return; }
    chrome.tabs.sendMessage(tabId, message).catch(() => ytTabs.delete(tabId));
  });
}