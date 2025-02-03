let popupButton = null;
let selectedRange = null;
let isMouseUp = false;

// Add selection change event listener
document.addEventListener("selectionchange", function () {
  if (!isMouseUp) {
    const selection = window.getSelection();
    if (!selection.toString().trim() && popupButton) {
      popupButton.classList.remove("show");
      popupButton.style.display = "none";

      selectedRange = null;
    }
  }
});

document.addEventListener("mouseup", function (e) {
  isMouseUp = true;
  const selection = window.getSelection();
  const selectionText = selection.toString().trim();

  if (selectionText) {
    if (!popupButton) {
      popupButton = document.createElement("div");
      popupButton.className = "note-add-button";
      popupButton.innerHTML = `
         <div class="note-popup">
          <img id="notes-png" src="${chrome.runtime.getURL(
            "icons/sticky-notes-reminder-png.webp"
          )}" width="26" height="26" alt="Add note" />
        </div>
      `;

      selectedRange = selection.getRangeAt(0);

      popupButton.style.position = "absolute";
      popupButton.style.zIndex = "10000";
      document.body.appendChild(popupButton);
    }

    popupButton.style.top = e.pageY - 50 + "px";
    popupButton.style.left = e.pageX + "px";
    popupButton.style.display = "block";

    // Store the selected text in a data attribute
    popupButton.setAttribute("data-selection", selectionText);

    setTimeout(() => {
      popupButton.classList.add("show");
    }, 50);

    popupButton.onclick = function () {
      popupButton.classList.remove("show");
      popupButton.style.display = "none";

      // Get the stored selection text from data attribute
      const savedSelection = popupButton.getAttribute("data-selection");

      try {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(
            [window.location.hostname],
            function (result) {
              const currentNotes = result[window.location.hostname] || "";
              const newNote =
                currentNotes + (currentNotes ? "\n" : "") + savedSelection;

              chrome.storage.local.set(
                {
                  [window.location.hostname]: newNote,
                },
                function () {}
              );
            }
          );
        } else {
          console.error("Chrome storage API not available");
        }
      } catch (error) {
        console.error("Error saving note:", error);
      }
      popupButton.classList.remove("show");
      popupButton.style.display = "none";
    };
  } else if (popupButton) {
    popupButton.classList.remove("show");
    popupButton.style.display = "none";
    selectedRange = null;
  }
});

// Add copy event listener
document.addEventListener("copy", function () {
  const selection = window.getSelection();
  const selectionText = selection.toString().trim();

  if (selectionText) {
    chrome.runtime.sendMessage({
      type: "saveCopy",
      text: selectionText,
    });
  }
});
