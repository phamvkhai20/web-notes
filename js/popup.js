document.addEventListener("DOMContentLoaded", async function () {
  const loginButton = document.getElementById("loginButton");
  const userInfo = document.getElementById("userInfo");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  const noteInput = document.getElementById("noteInput");
  const domainElement = document.getElementById("domain");

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-btn");

  // Load last active tab
  chrome.storage.local.get(["lastActiveTab"], function (result) {
    if (result.lastActiveTab) {
      document
        .querySelectorAll(".tab-btn")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));

      const lastTab = document.querySelector(
        `[data-tab="${result.lastActiveTab}"]`
      );
      if (lastTab) {
        lastTab.classList.add("active");
        document.getElementById(result.lastActiveTab).classList.add("active");
      }
    }
  });

  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const paneId = tab.getAttribute("data-tab");
      document.getElementById(paneId).classList.add("active");

      // Save active tab
      chrome.storage.local.set({ lastActiveTab: paneId });
    });
  });

  if (loginButton) {
    loginButton.addEventListener("click", async () => {
      try {
        const auth = new GoogleAuth();
        const user = await auth.signIn();
        loginButton.style.display = "none";
        userInfo.style.display = "flex";
        userAvatar.src = user.picture;
        userName.textContent = user.name;
        syncNotes();
      } catch (error) {
        console.error("Login failed:", error);
      }
    });
  }

  // Setup domain handling
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentHostname = new URL(tabs[0].url).hostname;
    const domainSelect = document.getElementById("domainSelect");

    // Get all domains with notes
    chrome.storage.local.get(null, function (result) {
      const domains = Object.keys(result).filter(
        (key) => key !== "lastActiveTab" && key !== "copyHistory" && result[key]
      );

      domainSelect.innerHTML = domains
        .map(
          (domain) => `
          <option value="${domain}" ${
            domain === currentHostname ? "selected" : ""
          }>
            ${domain}
          </option>`
        )
        .join("");

      loadNotes(currentHostname);
    });

    // Handle domain change
    domainSelect.addEventListener("change", function () {
      loadNotes(this.value);
    });

    // Add input event listener for notes
    noteInput.addEventListener("input", function () {
      chrome.storage.local.set({
        [currentHostname]: this.value,
      });
    });
  });

  function loadNotes(hostname) {
    chrome.storage.local.get([hostname], function (result) {
      document.getElementById("noteInput").value = result[hostname] || "";
    });
  }

  // Add sync functionality
  async function syncNotes() {
    const hostname = document.getElementById("domain").textContent;
    const notes = document.getElementById("noteInput").value;
    await auth.syncNotes({
      [hostname]: notes,
    });
  }

  // Tab switching
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const panes = document.querySelectorAll(".tab-pane");
      panes.forEach((pane) => pane.classList.remove("active"));
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // Load copy history
  function loadCopyHistory() {
    chrome.storage.local.get(["copyHistory"], function (result) {
      const history = result.copyHistory || [];
      const historyContainer = document.getElementById("copyHistory");
      historyContainer.innerHTML = "";

      history.forEach((text, index) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
          <div class="history-text">${text}</div>
          <div class="history-actions">
            <button class="copy-btn" title="Copy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
              </svg>
            </button>
            <button class="delete-btn" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        `;

        // Add event listeners
        item.querySelector(".copy-btn").addEventListener("click", () => {
          navigator.clipboard.writeText(text);
        });

        item.querySelector(".delete-btn").addEventListener("click", () => {
          chrome.storage.local.get(["copyHistory"], function (result) {
            const history = result.copyHistory || [];
            const newHistory = history.filter((item) => item !== text);
            chrome.storage.local.set({ copyHistory: newHistory }, () => {
              loadCopyHistory(); // Reload the history after deletion
            });
          });
        });

        historyContainer.appendChild(item);
      });
    });
  }

  // Add after loadCopyHistory();

  // Tools functionality
  function initializeTools() {
    const transformBtn = document.getElementById("transformBtn");
    const formatJsonBtn = document.getElementById("formatJsonBtn");
    const minifyJsonBtn = document.getElementById("minifyJsonBtn");

    transformBtn.addEventListener("click", () => {
      const input = document.getElementById("transformInput").value;
      const type = document.getElementById("textTransform").value;
      let result = input;

      switch (type) {
        case "camelCase":
          result = input
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
          break;
        case "snakeCase":
          result = input.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_");
          break;
        case "kebabCase":
          result = input.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
          break;
        case "pascalCase":
          result = input
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/^./, (str) => str.toUpperCase());
          break;
      }
      document.getElementById("transformInput").value = result;
    });

    formatJsonBtn.addEventListener("click", () => {
      try {
        const input = document.getElementById("transformInput").value;
        const formatted = JSON.stringify(JSON.parse(input), null, 2);
        document.getElementById("transformInput").value = formatted;
      } catch (e) {
        alert("Invalid JSON");
      }
    });

    minifyJsonBtn.addEventListener("click", () => {
      try {
        const input = document.getElementById("transformInput").value;
        const minified = JSON.stringify(JSON.parse(input));
        document.getElementById("transformInput").value = minified;
      } catch (e) {
        alert("Invalid JSON");
      }
    });
  }

  initializeTools();
  loadCopyHistory();
});
