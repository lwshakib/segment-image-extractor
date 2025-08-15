// Background script to handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Simply open the sidepanel - Chrome will handle the toggle behavior
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error("Error opening sidepanel:", error);
  }
});
