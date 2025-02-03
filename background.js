chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "saveCopy") {
    chrome.storage.local.get(["copyHistory"], function (result) {
      const history = result.copyHistory || [];
      // Add new item at the beginning
      history.unshift(message.text);
      // Keep only last 50 items
      const limitedHistory = history.slice(0, 50);

      chrome.storage.local.set(
        {
          copyHistory: limitedHistory,
        },
        () => {
          console.log("Copy saved to history");
        }
      );
    });
  }
  return true;
});
