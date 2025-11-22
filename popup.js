// popup.js - Handles the settings popup

// Wait for the page to load
document.addEventListener('DOMContentLoaded', function () {
  // Get references to our HTML elements
  const githubTokenInput = document.getElementById('githubToken');
  const repoNameInput = document.getElementById('repoName');
  const branchInput = document.getElementById('branch');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings when popup opens
  loadSettings();

  // Save settings when button is clicked
  saveBtn.addEventListener('click', saveSettings);

  /**
   * Load settings from Chrome storage
   * Chrome provides chrome.storage API to save data
   */
  function loadSettings() {
    // chrome.storage.sync - syncs across devices if user is signed in
    chrome.storage.sync.get(['githubToken', 'repoName', 'branch'], function (result) {
      // If settings exist, fill in the inputs
      if (result.githubToken) {
        githubTokenInput.value = result.githubToken;
      }
      if (result.repoName) {
        repoNameInput.value = result.repoName;
      }
      if (result.branch) {
        branchInput.value = result.branch;
      }
    });
  }

  /**
   * Save settings to Chrome storage
   */
  function saveSettings() {
    // Get values from inputs
    const token = githubTokenInput.value.trim();
    const repo = repoNameInput.value.trim();
    const branch = branchInput.value.trim() || 'main';

    // Validate inputs
    if (!token || !repo) {
      showStatus('Please fill in all required fields!', 'error');
      return;
    }

    // Check repo format (should be: username/repo-name)
    if (!repo.includes('/')) {
      showStatus('Repository format should be: username/repo-name', 'error');
      return;
    }

    // Save to Chrome storage
    chrome.storage.sync.set({
      githubToken: token,
      repoName: repo,
      branch: branch
    }, function () {
      // Check if there was an error
      if (chrome.runtime.lastError) {
        showStatus('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('✅ Settings saved successfully!', 'success');

        // Hide success message after 2 seconds
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 2000);
      }
    });
  }

  /**
   * Show status message to user
   * @param {string} message - The message to show
   * @param {string} type - 'success' or 'error'
   */
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
  }
});