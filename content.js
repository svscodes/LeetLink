// Wait for the page to fully load
window.addEventListener('load', function () {
  // Reset auto-push flag for new page
  window.hasAutoPushed = false;

  // Give LeetCode a moment to render everything
  setTimeout(initializeExtension, 2000);
});

/**
 * Main initialization function
 */
function initializeExtension() {
  console.log('Initializing extension...');

  // Add our custom button to the page
  addPushButton();

  // Start watching for "Accepted" status
  //watchForAccepted();
}

/**
 * Watch for "Accepted" status and auto-push
 */
function watchForAccepted() {
  console.log('👀 Watching for Accepted status...');

  // Check if auto-push is enabled in settings
  chrome.storage.sync.get(['autoPush'], function (result) {
    if (result.autoPush === false) {
      console.log('Auto-push is disabled');
      return;
    }

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      // Look for "Accepted" text with green/success styling
      const allElements = document.querySelectorAll('*');

      for (const el of allElements) {
        const text = el.textContent?.trim() || '';

        // Only check elements that contain "Accepted" text
        if (!text.includes('Accepted')) continue;

        // Safely get className as a string
        let classStr = '';
        if (typeof el.className === 'string') {
          classStr = el.className;
        } else if (el.className && typeof el.className.baseVal === 'string') {
          classStr = el.className.baseVal;
        } else if (el.getAttribute) {
          classStr = el.getAttribute('class') || '';
        }

        // Check if it says exactly "Accepted" and has green/success styling
        if (text === 'Accepted' && (
          classStr.includes('text-green') ||
          classStr.includes('text-success') ||
          classStr.includes('text-olive') ||
          classStr.includes('bg-green') ||
          classStr.includes('success')
        )) {
          if (!window.hasAutoPushed) {
            console.log('🎉 Accepted detected! Auto-pushing...');
            window.hasAutoPushed = true;

            // Wait a moment for the page to fully update
            setTimeout(() => {
              handlePushToGitHub();
            }, 1500);
          }
          break;
        }
      }
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    console.log('✅ Auto-push watcher started');
  });
}

/**
 * Add "Push to GitHub" button to the LeetCode page
 */
function addPushButton() {
  // 1. Find the Submit button
  const submitButton = document.querySelector('[data-e2e-locator="console-submit-button"]')
    || Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Submit'));

  if (!submitButton) {
    setTimeout(addPushButton, 1000);
    return;
  }

  // 2. Prevent duplicates
  if (document.getElementById('github-push-btn')) return;

  // 3. INTELLIGENT PLACEMENT LOGIC
  // The Submit button is often inside a tooltip wrapper <div>. 
  // We want to append to the *main toolbar* (the flex container), not the tight wrapper.

  let targetContainer = submitButton.parentElement;
  let siblingNode = submitButton; // The element we want to be next to

  const parentStyle = window.getComputedStyle(targetContainer);
  // If the immediate parent isn't a Flex row, it's likely a wrapper. Move up one level.
  if (!parentStyle.display.includes('flex')) {
    if (targetContainer.parentElement) {
      siblingNode = targetContainer; // We will insert after the wrapper, not the button
      targetContainer = targetContainer.parentElement;
    }
  }

  // 4. Create the button
  const button = document.createElement('button');
  button.id = 'github-push-btn';

  button.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px;">
      <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      <span>Push to GitHub</span>
    </div>
  `;

  // 5. Apply Native Styles
  const computedStyle = window.getComputedStyle(submitButton);

  button.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${computedStyle.height};
    padding: 0 12px;
    margin-left: 8px;
    
    font-family: ${computedStyle.fontFamily};
    font-size: 13px;
    font-weight: 500;
    color: inherit; /* Inherit text color from toolbar for better theme support */
    
    background-color: transparent;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap; /* Prevent text wrapping */
  `;

  // Handle Dark/Light mode text color manually if inherit fails
  button.style.color = computedStyle.color || 'white';

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'transparent';
  });

  button.addEventListener('click', handlePushToGitHub);

  // 6. Insert into the correct container
  // We insert AFTER the sibling (which might be the button or its wrapper)
  if (siblingNode.nextSibling) {
    targetContainer.insertBefore(button, siblingNode.nextSibling);
  } else {
    targetContainer.appendChild(button);
  }

  console.log('✅ Button added to flex container');
}

/**
 * Handle the "Push to GitHub" button click
 */
async function handlePushToGitHub() {
  const button = document.getElementById('github-push-btn');
  const originalText = button.innerHTML;
  button.innerHTML = '<span>⏳ Pushing...</span>';
  button.disabled = true;
  button.style.cursor = 'wait';

  try {
    // 1. Get basic details (Title, Difficulty, Slug)
    // Note: The language here might be wrong, but we will fix it in step 2
    let problemData = getProblemDetails();

    // 2. Get Code AND Accurate Language from Editor
    const editorData = await getCodeFromEditor();
    const code = editorData.code;
    const activeLanguage = editorData.language; // e.g., 'python', 'cpp'

    // ✅ OVERRIDE the language with the correct one from the editor
    if (activeLanguage) {
      console.log('Detected active language:', activeLanguage);
      problemData.language = activeLanguage;
    }

    if (!code) throw new Error('No code found');

    // 3. Send to background
    chrome.runtime.sendMessage({
      action: 'pushToGitHub',
      data: {
        ...problemData,
        code: code
      }
    }, function (response) {
      // ... (Keep the rest of your existing success logic here) ...
      if (response && response.success) {
        button.innerHTML = '<span style="color: #2cbb5d; font-weight: bold;">✅ Pushed!</span>';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
          button.style.cursor = 'pointer';
        }, 3000);
      } else {
        throw new Error(response?.error || 'Failed');
      }
    });

  } catch (error) {
    // ... (Keep your error handling logic) ...
    console.error(error);
    button.innerHTML = '<span style="color: #f63636;">❌ Failed</span>';
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
      button.style.cursor = 'pointer';
    }, 3000);
  }
}

/**
 * Get the problem details from the page
 */
function getProblemDetails() {
  // 1. Get Title
  // Try multiple selectors for robustness
  let fullTitle = document.title.split(' - ')[0].trim();

  // Validation: ensure title starts with a number (e.g., "1. Two Sum")
  // If page title is generic, scrape the DOM
  if (!fullTitle || fullTitle === 'LeetCode' || !/^\d/.test(fullTitle)) {
    const titleElement = document.querySelector('[data-cy="question-title"]')
      || document.querySelector('.text-title-large')
      || document.querySelector('div.flex.items-center > div.text-lg.font-medium');

    if (titleElement) {
      fullTitle = titleElement.textContent.trim();
    } else {
      fullTitle = 'Unknown Problem';
    }
  }

  // 2. Get Difficulty (ROBUST TEXT CHECK)
  // We don't trust colors anymore. We look for the specific text.
  let difficulty = 'Medium'; // Default

  // Get all divs/spans that might contain the difficulty text
  // We target the container that usually holds these labels
  const candidates = document.querySelectorAll('div, span, p');

  for (const el of candidates) {
    // Strict check: Text must be EXACTLY one of the 3 difficulties
    const text = el.textContent.trim();
    if (text === 'Easy') {
      difficulty = 'Easy';
      break;
    } else if (text === 'Medium') {
      difficulty = 'Medium';
      break;
    } else if (text === 'Hard') {
      difficulty = 'Hard';
      break;
    }
  }

  // 3. Get Language
  const langBtn = document.querySelector('#editor-language-layout button, button.rounded.items-center.whitespace-nowrap');
  const language = langBtn ? langBtn.textContent.trim() : 'python3';

  return {
    title: fullTitle,
    difficulty: difficulty,
    problemSlug: window.location.pathname.split('/problems/')[1].split('/')[0],
    language: language,
    url: window.location.href
  };
}

/**
 * Inject script to access the full Monaco editor model
 */
function getCodeFromEditor() {
  return new Promise((resolve, reject) => {
    console.log('💉 Injecting script to extract full code...');

    // 1. Inject the script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function () {
      this.remove(); // Clean up the tag after injection
    };
    (document.head || document.documentElement).appendChild(script);

    // 2. Set up the listener for the response
    const handleMessage = (event) => {
      // Only accept messages from the same window
      if (event.source !== window) return;

      // Check if it's our response
      if (event.data.type && event.data.type === 'GET_CODE_RESPONSE') {
        console.log('📦 Received code from page context');

        // Clean up listener
        window.removeEventListener('message', handleMessage);

        // ✅ MODIFIED: Check for code and resolve with BOTH code and language
        if (event.data.code) {
          resolve({
            code: event.data.code,
            language: event.data.language // Capture the language ID from Monaco
          });
        } else {
          reject(new Error('Code object was empty'));
        }
      }
    };

    // Listen for the response
    window.addEventListener('message', handleMessage);

    // 3. Trigger the request (wait 100ms to ensure script loaded)
    setTimeout(() => {
      window.postMessage({ type: 'GET_CODE_REQUEST' }, '*');
    }, 100);

    // 4. Timeout fallback (in case injection fails)
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      // Fallback to DOM scraping if injection fails
      const lines = document.querySelectorAll('.view-line');
      if (lines.length > 0) {
        console.log('⚠️ Injection timed out, falling back to DOM scrape (incomplete code warning)');
        const code = Array.from(lines).map(line => line.innerText).join('\n');

        // ✅ MODIFIED: Return consistent object structure even on fallback
        resolve({
          code: code,
          language: null // Fallback cannot detect language reliably
        });
      } else {
        reject(new Error('Timeout: Could not retrieve code'));
      }
    }, 2000);
  });
}