/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message:', request);

  if (request.action === 'pushToGitHub') {
    handlePushToGitHub(request.data)
      .then(result => {
        console.log('✅ Success! Sending response:', result);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('❌ Error caught:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }
});

/**
 * Main function to push code to GitHub
 */
async function handlePushToGitHub(data) {
  console.log('🔄 Starting GitHub push...');
  console.log('📦 Data received:', data);

  try {
    // Step 1: Get settings
    console.log('⚙️ Getting settings...');
    const settings = await getSettings();
    console.log('⚙️ Settings retrieved:', {
      hasToken: !!settings.githubToken,
      tokenLength: settings.githubToken?.length,
      repoName: settings.repoName,
      branch: settings.branch
    });

    if (!settings.githubToken || !settings.repoName) {
      throw new Error('Please configure GitHub settings first! Click the extension icon.');
    }

    // Step 2: Format file
    console.log('📝 Formatting file...');
    const fileContent = formatSolutionFile(data);
    console.log('📝 File content length:', fileContent.length);

    // Step 3: Generate path
    console.log('📂 Generating file path...');
    const filePath = generateFilePath(data);
    console.log('📂 File path:', filePath);

    // Step 4: Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    const result = await pushToGitHub(
      settings.githubToken,
      settings.repoName,
      settings.branch || 'main',
      filePath,
      fileContent,
      data
    );

    console.log('✅ Successfully pushed!', result);

    // Update README with the new problem
    await updateReadme(settings.githubToken, settings.repoName, settings.branch || 'main', data);

    return result;

  } catch (error) {
    console.error('💥 Error in handlePushToGitHub:', error);
    throw error;
  }
}

/**
 * Get settings from Chrome storage
 */
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['githubToken', 'repoName', 'branch'], (result) => {
      resolve(result);
    });
  });
}

/**
 * Format the solution file
 */
function formatSolutionFile(data) {
  const { title, difficulty, url, language, code } = data;
  const extension = getFileExtension(language);
  const comment = getCommentSyntax(language);

  const content = `${comment.start}
${comment.line} Problem: ${title}
${comment.line} Difficulty: ${difficulty}
${comment.line} Link: ${url}
${comment.line} Language: ${language}
${comment.line} Date: ${new Date().toISOString().split('T')[0]}
${comment.end}

${code}
`;

  return content;
}

/**
 * Get file extension
 */
function getFileExtension(language) {
  const lang = language.toLowerCase();

  const extensions = {

    'python': 'py',
    'python3': 'py',
    'c++': 'cpp',
    'c#': 'cs',
    'javascript': 'js',
    'java': 'java',
    'c': 'c',

    'cpp': 'cpp',
    'csharp': 'cs',
    'golang': 'go',
    'php': 'php',
    'ruby': 'rb',
    'swift': 'swift',
    'kotlin': 'kt',
    'rust': 'rs',
    'scala': 'scala',
    'typescript': 'ts',
    'mysql': 'sql',
    'mssql': 'sql'
  };

  return extensions[lang] || 'txt';
}

/**
 * Get comment syntax
 */
function getCommentSyntax(language) {
  const lang = language.toLowerCase();

  if (lang.includes('python') || lang.includes('ruby')) {
    return { start: '#', line: '#', end: '' };
  }

  if (lang.includes('java') || lang.includes('c++') || lang.includes('c#') ||
    lang.includes('javascript') || lang.includes('typescript') ||
    lang.includes('swift') || lang.includes('go') || lang.includes('rust') ||
    lang.includes('kotlin') || lang.includes('scala')) {
    return { start: '/*', line: ' *', end: ' */' };
  }

  return { start: '/*', line: ' *', end: ' */' };
}

/**
 * Generate file path
 */
function generateFilePath(data) {
  const { title, language } = data; // title is "1. Two Sum"
  const extension = getFileExtension(language);

  // Clean filename (keep dots and spaces, remove illegal chars)
  // "1. Two Sum" -> "1. Two Sum"
  const safeName = title.replace(/[^a-z0-9\s\-\.]/gi, '').trim();

  // Result: "1. Two Sum/1. Two Sum.py"
  return `${safeName}/${safeName}.${extension}`;
}

/**
 * Push to GitHub via API
 */
async function pushToGitHub(token, repoName, branch, filePath, content, data) {
  console.log('🔍 Push Configuration:');
  console.log('  - Repo:', repoName);
  console.log('  - Branch:', branch);
  console.log('  - File Path:', filePath);
  console.log('  - Token present:', !!token);
  console.log('  - Token length:', token?.length);

  const [owner, repo] = repoName.split('/');

  if (!owner || !repo) {
    throw new Error('Invalid repository format. Should be: username/repo-name');
  }

  console.log('  - Owner:', owner);
  console.log('  - Repo name:', repo);

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  console.log('📤 API URL:', apiUrl);

  // Check if file exists
  console.log('🔍 Checking if file exists...');
  let sha = null;

  try {
    const checkResponse = await fetch(apiUrl + `?ref=${branch}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LeetCode-GitHub-Extension'
      }
    });

    console.log('🔍 Check response status:', checkResponse.status);

    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
      console.log('📝 File exists, SHA:', sha);
    } else {
      console.log('📄 File does not exist (will create new)');
    }
  } catch (error) {
    console.log('📄 File check error (will create new):', error.message);
  }

  // Encode content
  console.log('🔐 Encoding content to base64...');
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  console.log('🔐 Base64 length:', base64Content.length);

  // Create commit message
  const commitMessage = sha
    ? `Update solution: ${data.title}`
    : `Add solution: ${data.title}`;
  console.log('💬 Commit message:', commitMessage);

  // Prepare request body
  const requestBody = {
    message: commitMessage,
    content: base64Content,
    branch: branch
  };

  if (sha) {
    requestBody.sha = sha;
  }

  console.log('📦 Request body (without content):', { ...requestBody, content: '[base64 data]' });

  // Push to GitHub
  console.log('🚀 Sending PUT request to GitHub...');

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'LeetCode-GitHub-Extension'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response headers:', Object.fromEntries([...response.headers.entries()]));

  if (!response.ok) {
    console.error('❌ Request failed!');

    let errorMessage = '';
    let errorData = null;

    try {
      errorData = await response.json();
      console.error('❌ Error data:', errorData);
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      const errorText = await response.text();
      console.error('❌ Error text:', errorText);
      errorMessage = errorText;
    }

    // Specific error messages
    if (response.status === 401) {
      throw new Error('❌ GitHub token is invalid or expired. Please update your token in settings.');
    } else if (response.status === 404) {
      throw new Error(`❌ Repository '${repoName}' not found.\n\nPlease check:\n1. Repository exists on GitHub\n2. Name is spelled correctly (case-sensitive)\n3. You have access to it\n\nVisit: https://github.com/${repoName}`);
    } else if (response.status === 403) {
      throw new Error('❌ Permission denied. Make sure your token has "repo" permission.');
    } else if (response.status === 422) {
      throw new Error(`❌ Invalid request: ${errorMessage}`);
    } else {
      throw new Error(`❌ GitHub API Error (${response.status}): ${errorMessage}`);
    }
  }

  const result = await response.json();
  console.log('✅ Success! GitHub response:', result);

  return {
    url: result.content?.html_url || `https://github.com/${repoName}/blob/${branch}/${filePath}`,
    message: commitMessage
  };
}

/**
 * Update or create README.md with problem list
 */
async function updateReadme(token, repoName, branch, newProblem) {
  console.log('📝 Updating README...');

  const [owner, repo] = repoName.split('/');
  const readmePath = 'README.md';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${readmePath}`;

  try {
    // Get existing README (if it exists)
    let existingContent = '';
    let sha = null;

    try {
      const response = await fetch(apiUrl + `?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        sha = data.sha;
        existingContent = atob(data.content);
        console.log('📖 Existing README found');
      }
    } catch (e) {
      console.log('📄 No existing README, will create new');
    }

    // Parse existing problems or create new structure
    let problems = parseReadmeProblems(existingContent);

    // Add new problem (avoid duplicates)
    const problemKey = `${newProblem.problemSlug}-${newProblem.language}`;
    if (!problems.some(p => p.key === problemKey)) {
      problems.push({
        key: problemKey,
        title: newProblem.title,
        difficulty: newProblem.difficulty,
        language: newProblem.language,
        url: newProblem.url,
        slug: newProblem.problemSlug,
        date: new Date().toISOString().split('T')[0]
      });
    }

    // Sort by difficulty and title
    problems.sort((a, b) => {
      const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      if (diffOrder[a.difficulty] !== diffOrder[b.difficulty]) {
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      }
      return a.title.localeCompare(b.title);
    });

    // Generate new README content
    const readmeContent = generateReadmeContent(problems, repoName);

    // Push to GitHub
    const base64Content = btoa(unescape(encodeURIComponent(readmeContent)));

    await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: sha ? 'Update README' : 'Create README',
        content: base64Content,
        branch: branch,
        ...(sha && { sha })
      })
    });

    console.log('✅ README updated!');

  } catch (error) {
    console.error('⚠️ Failed to update README:', error);
    // Don't throw - README update is optional
  }
}

/**
 * Parse problems from existing README
 */
function parseReadmeProblems(content) {
  const problems = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // UPDATED REGEX: 
    // 1. Handles Emojis/Text in difficulty column ([^|]+)
    // 2. Handles the extra Date column at the end
    const match = line.match(/\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);

    if (match) {
      const title = match[1].trim();
      const url = match[2].trim();
      const difficultyRaw = match[3].trim(); // This captures "🟢 Easy"
      const language = match[4].trim();
      const date = match[5].trim();

      // Logic to strip the emoji back to just "Easy"
      let difficulty = 'Medium';
      if (difficultyRaw.includes('Easy')) difficulty = 'Easy';
      else if (difficultyRaw.includes('Medium')) difficulty = 'Medium';
      else if (difficultyRaw.includes('Hard')) difficulty = 'Hard';

      const slug = url.split('/').filter(Boolean).pop();

      problems.push({
        key: `${slug}-${language}`,
        title,
        url,
        difficulty,
        language,
        slug,
        date
      });
    }
  }
  return problems;
}

/**
 * Generate README content
 */
function generateReadmeContent(problems, repoName) {
  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length
  };

  let content = `# 🚀 LeetCode Solutions

My LeetCode solutions, automatically synced from [LeetCode](https://leetcode.com/)!

## 📊 Statistics

- **Total Problems Solved:** ${stats.total}
- **Easy:** ${stats.easy} 🟢
- **Medium:** ${stats.medium} 🟡
- **Hard:** ${stats.hard} 🔴

## 📝 Problems

| Problem | Difficulty | Language | Date |
|---------|-----------|----------|------|
`;

  for (const problem of problems) {
    const diffEmoji = problem.difficulty === 'Easy' ? '🟢' :
      problem.difficulty === 'Medium' ? '🟡' : '🔴';
    content += `| [${problem.title}](${problem.url}) | ${diffEmoji} ${problem.difficulty} | ${problem.language} | ${problem.date || 'N/A'} |\n`;
  }

  content += `
---

*Generated automatically by [LeetCode to GitHub Extension](https://github.com/${repoName})*
`;

  return content;
}
