// inject.js - Runs inside the page context to access window.monaco
(function () {
  // Listen for the request from content.js
  window.addEventListener('message', function (event) {
    // Only accept messages from our extension
    if (event.data.type !== 'GET_CODE_REQUEST') return;

    try {
      let code = null;
      let language = null; // Added variable to hold the language

      // access the Monaco editor global variable
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          const model = models[0];
          // This gets the FULL text, not just the visible lines
          code = model.getValue();
          // This gets the internal language ID (e.g., 'cpp', 'python', 'java')
          language = model.getLanguageId(); 
        }
      }

      // Send the code and language back to content.js
      window.postMessage({
        type: 'GET_CODE_RESPONSE',
        code: code,
        language: language // Added language field
      }, '*');

    } catch (error) {
      console.error('LeetLink Extraction Error:', error);
    }
  });
})();