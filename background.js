// ─── State ───────────────────────────────────────
let activeTabId = null;
let ytTabs = new Set(); // alive YouTube tabs

// ─── Tab Switch Detection ─────────────────────────
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const prevTabId = activeTabId;
  activeTabId = tabId;

  // Prev tab pause karo
  if (prevTabId && prevTabId !== tabId) {
    safeSend(prevTabId, { type: 'AUTO_PAUSE' });
  }

  // Current tab resume karo
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

    case 'VIDEO_PLAYING':
      // Is tab pe play hua → baaki sab pause
      ytTabs.forEach(tabId => {
        if (tabId !== fromTabId) safeSend(tabId, { type: 'DUAL_PAUSE' });
      });
      break;

    case 'VIDEO_PAUSED':
      // Is tab pe pause hua → baaki sab resume
      ytTabs.forEach(tabId => {
        if (tabId !== fromTabId) safeSend(tabId, { type: 'DUAL_RESUME' });
      });
      break;
  }
});

// ─── Cleanup on tab close ─────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  ytTabs.delete(tabId);
  if (activeTabId === tabId) activeTabId = null;
});

// ─── Safe message sender ──────────────────────────
function safeSend(tabId, message) {
  // Tab exist karti hai tab hi bhejo
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      ytTabs.delete(tabId); // dead tab cleanup
      return;
    }
    chrome.tabs.sendMessage(tabId, message).catch(() => {
      ytTabs.delete(tabId); // message fail → remove
    });
  });
}