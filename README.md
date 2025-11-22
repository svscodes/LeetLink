# 🚀 LeetLink - LeetCode to GitHub Sync

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Chrome](https://img.shields.io/badge/Chrome-988C89?style=for-the-badge&logo=google-chrome&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

**LeetLink** is a Chrome Extension that automatically pushes your LeetCode solutions to a GitHub repository. It seamlessly integrates into the LeetCode UI, enabling you to build a coding portfolio automatically while you practice.

> **Current Version:** 1.1.0
> **Manifest:** V3

## ✨ Features

* **🔌 Seamless Integration:** Adds a "Push to GitHub" button directly to the LeetCode toolbar. matches LeetCode's native Dark Mode UI.
* **🤖 Auto-Push Mode:** (Optional) Automatically pushes your code when your submission status is "Accepted".
* **🧠 Smart Language Detection:** Uses the Monaco Editor API to detect the exact language used (e.g., distinguishing Python from Python3 or C++ from C).
* **📁 Organized File Structure:** Saves solutions in a clean format: `Problem Number. Title / Title.extension` (e.g., `1. Two Sum/1. Two Sum.py`).
* **📚 Dynamic README Generation:** Automatically updates the repository's `README.md` with a table of contents containing all solved problems, their difficulty, and links.
* **🔐 Secure:** Your GitHub Personal Access Token is stored locally in your browser (Chrome Storage) and never sent to external servers.

## 🛠️ Technical Implementation

This project overcomes specific challenges related to Chrome's **Isolated World** security model:

1.  **Script Injection Strategy:**
    * **Challenge:** Chrome content scripts cannot access the page's JavaScript variables (like the `monaco` editor instance) directly.
    * **Solution:** LeetLink injects a script (`inject.js`) into the page's "Main World" context to access the editor's model. It captures the code and language ID, then passes data back to the extension via `window.postMessage`.

2.  **GitHub REST API Integration:**
    * Handles SHA checks to update existing files without errors.
    * Manages Base64 encoding/decoding for file transfers.
    * Parses and regenerates the remote `README.md` to maintain a cumulative history of solutions.

3.  **Robust DOM Scraping:**
    * Uses `MutationObserver` to detect dynamic page changes (like successful submissions).
    * Implements fallback logic to scrape metadata (Difficulty, Title) even if LeetCode updates their CSS class names.

## 🚀 Installation (Developer Mode)

Since this is a developer tool, you can install it directly from the source:

1.  **Clone this repository:**
    ```bash
    git clone [https://github.com/your-username/LeetLink.git](https://github.com/your-username/LeetLink.git)
    ```
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** (top right corner).
4.  Click **Load unpacked**.
5.  Select the directory where you cloned this project.

## ⚙️ Configuration

1.  Click the **LeetLink** extension icon in your toolbar.
2.  **GitHub Token:** Generate a Personal Access Token (Classic) on GitHub with `repo` permissions.
3.  **Repository Name:** Enter the name of the repo you want to sync to (e.g., `your-username/leetcode-solutions`).
    * *Note: You must create this repository on GitHub first.*
4.  **Branch:** (Optional) Defaults to `main`.
5.  Click **Save Settings**.

## 📂 Project Structure

```text
LeetLink/
├── manifest.json      # Extension configuration (Permissions, Host matches)
├── background.js      # Handles GitHub API calls & README generation
├── content.js         # UI manipulation & DOM scraping logic
├── inject.js          # Bridge to access Monaco Editor API
├── popup.html         # Extension settings UI
├── popup.js           # Saves user preferences to Chrome Storage
└── icons/             # App icons
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <h3>👤 Built by S Vyaas Sundar</h3>
  <p>If you found this project helpful, let's connect!</p>
  
  <br />

  <a href="https://www.linkedin.com/in/vyaas-sundar-s/">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Connect on LinkedIn" />
  </a>

  &nbsp;&nbsp;&nbsp;&nbsp; <a href="https://github.com/svscodes">
    <img src="https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white" alt="Follow on GitHub" />
  </a>
  
  <br />
  <br />
</div>
