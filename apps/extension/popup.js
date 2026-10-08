(() => {
  "use strict";

  const loadingEl = document.getElementById("loading-state");
  const emptyEl = document.getElementById("empty-state");
  const previewEl = document.getElementById("preview-state");
  const platformBadge = document.getElementById("platform-badge");
  const titleEl = document.getElementById("job-title");
  const companyEl = document.getElementById("job-company");
  const wordCountEl = document.getElementById("word-count");
  const targetAtsContainer = document.getElementById("target-ats-container");
  const targetAtsEl = document.getElementById("target-ats");
  const snippetEl = document.getElementById("preview-snippet");
  const btnAnalyze = document.getElementById("btn-analyze");
  const btnCopy = document.getElementById("btn-copy");
  const hostSelect = document.getElementById("host-select");

  let currentJob = null;

  // Restore saved host setting
  if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(["preferredHost"], (items) => {
      if (items.preferredHost) {
        hostSelect.value = items.preferredHost;
      }
    });
  }

  hostSelect.addEventListener("change", () => {
    if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ preferredHost: hostSelect.value });
    }
  });

  function showState(state) {
    loadingEl.classList.add("hidden");
    emptyEl.classList.add("hidden");
    previewEl.classList.add("hidden");

    if (state === "loading") loadingEl.classList.remove("hidden");
    if (state === "empty") emptyEl.classList.remove("hidden");
    if (state === "preview") previewEl.classList.remove("hidden");
  }

  function displayJob(job) {
    if (!job || !job.text || job.text.trim().length < 20) {
      showState("empty");
      platformBadge.textContent = "No job ad";
      platformBadge.classList.remove("detected");
      return;
    }

    currentJob = job;
    titleEl.textContent = job.title || "Job Posting";
    companyEl.textContent = job.company || "Company";
    wordCountEl.textContent = String(job.wordCount || 0);

    platformBadge.textContent = job.platform;
    platformBadge.classList.add("detected");

    if (job.targetAts) {
      targetAtsEl.textContent = job.targetAts;
      targetAtsContainer.classList.remove("hidden");
    } else {
      targetAtsContainer.classList.add("hidden");
    }

    snippetEl.textContent = job.text.slice(0, 240) + (job.text.length > 240 ? "..." : "");
    showState("preview");
  }

  // Request active tab extraction
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      showState("empty");
      return;
    }

    // Try messaging the content script first
    chrome.tabs.sendMessage(tab.id, { action: "extract_job" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        // Fallback: inject content script on the fly if needed
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["content.js"]
          },
          () => {
            if (chrome.runtime.lastError) {
              showState("empty");
              return;
            }
            chrome.tabs.sendMessage(tab.id, { action: "extract_job" }, (retryResponse) => {
              if (retryResponse && retryResponse.data) {
                displayJob(retryResponse.data);
              } else {
                showState("empty");
              }
            });
          }
        );
      } else {
        displayJob(response.data);
      }
    });
  });

  // Action: Analyze
  btnAnalyze.addEventListener("click", () => {
    if (!currentJob || !currentJob.text) return;

    const host = hostSelect.value.replace(/\/$/, "");
    const targetUrl = `${host}/en/analyze?jobAd=${encodeURIComponent(currentJob.text)}`;

    chrome.tabs.create({ url: targetUrl });
  });

  // Action: Copy
  btnCopy.addEventListener("click", async () => {
    if (!currentJob || !currentJob.text) return;

    try {
      await navigator.clipboard.writeText(currentJob.text);
      const originalText = btnCopy.textContent;
      btnCopy.textContent = "Copied to clipboard!";
      setTimeout(() => {
        btnCopy.textContent = originalText;
      }, 2000);
    } catch {
      // Fallback
    }
  });
})();
