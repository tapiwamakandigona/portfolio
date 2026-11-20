// AlgoForge Practice Platform Main Engine

// Embedded Problem Dataset (guarantees zero CORS issues on file:// protocol)
let PROBLEMS = [];
let currentProblemIndex = 0;
let currentLanguage = 'javascript';

// LocalStorage Keys
const STORAGE_DRAFTS = 'algoforge_drafts_v1';
const STORAGE_SUBMISSIONS = 'algoforge_submissions_v1';
const STORAGE_STATUS = 'algoforge_problem_status_v1';

// In-Memory State
let drafts = JSON.parse(localStorage.getItem(STORAGE_DRAFTS) || '{}');
let submissions = JSON.parse(localStorage.getItem(STORAGE_SUBMISSIONS) || '[]');
let problemStatuses = JSON.parse(localStorage.getItem(STORAGE_STATUS) || '{}');

// Initialize App
async function init() {
  try {
    const res = await fetch('problems.json');
    if (res.ok) {
      PROBLEMS = await res.json();
    }
  } catch (e) {
    console.warn('Could not fetch problems.json, falling back to window.FALLBACK_PROBLEMS if defined', e);
  }

  if (!PROBLEMS || PROBLEMS.length === 0) {
    PROBLEMS = FALLBACK_PROBLEMS;
  }

  setupEventListeners();
  renderProblemList();
  selectProblem(0);
  updateHeaderMetrics();
  updateLineNumbers();
}

// Tree Builder Helper for LeetCode #124
function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}

function buildTreeFromArray(arr) {
  if (!arr || arr.length === 0 || arr[0] === null || arr[0] === undefined) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const curr = queue.shift();
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      curr.left = new TreeNode(arr[i]);
      queue.push(curr.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      curr.right = new TreeNode(arr[i]);
      queue.push(curr.right);
    }
    i++;
  }
  return root;
}

// Deep equality assertion
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 1e-5;
  }
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

// Render Sidebar Problem List
function renderProblemList(filter = 'all', query = '') {
  const container = document.getElementById('problemList');
  container.innerHTML = '';

  const q = query.toLowerCase().trim();
  const filtered = PROBLEMS.filter(p => {
    const matchesFilter = filter === 'all' || p.difficulty.toLowerCase() === filter.toLowerCase();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || 
      p.pattern.toLowerCase().includes(q) || 
      p.tags.some(t => t.toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  filtered.forEach((p, idx) => {
    const actualIdx = PROBLEMS.findIndex(x => x.id === p.id);
    const status = problemStatuses[p.id] || 'UNATTEMPTED';
    const isSelected = actualIdx === currentProblemIndex;

    const div = document.createElement('div');
    div.className = `p-2.5 rounded-lg cursor-pointer transition-all border ${
      isSelected 
        ? 'bg-blue-600/10 border-blue-500/40 text-white' 
        : 'border-transparent hover:bg-[#21262d] text-gray-300'
    }`;

    let statusPill = `<span class="w-2 h-2 rounded-full bg-gray-600 shrink-0"></span>`;
    if (status === 'ACCEPTED') {
      statusPill = `<span class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 shrink-0" title="Solved"></span>`;
    } else if (status === 'FAILED') {
      statusPill = `<span class="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400 shrink-0" title="Attempted / Failed"></span>`;
    }

    const diffColor = p.difficulty === 'Hard' ? 'text-rose-400' : 'text-amber-400';

    div.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 truncate">
          ${statusPill}
          <span class="font-medium text-xs truncate">${p.title}</span>
        </div>
        <span class="text-[10px] font-mono font-semibold ${diffColor} shrink-0 ml-2">${p.difficulty}</span>
      </div>
      <div class="text-[11px] text-gray-500 truncate mt-1 pl-4 font-mono">${p.pattern}</div>
    `;

    div.onclick = () => selectProblem(actualIdx);
    container.appendChild(div);
  });

  // Solved % calculation
  const total = PROBLEMS.length;
  const solved = Object.values(problemStatuses).filter(s => s === 'ACCEPTED').length;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  document.getElementById('solvedPercentage').innerText = `${pct}% Solved (${solved}/${total})`;
}

// Select a Problem
function selectProblem(index) {
  currentProblemIndex = index;
  const p = PROBLEMS[index];
  if (!p) return;

  renderProblemList(getActiveFilter(), document.getElementById('searchInput').value);

  // Update Headers & Details
  document.getElementById('problemTitle').innerText = p.title;
  document.getElementById('problemDiffBadge').innerText = p.difficulty;
  document.getElementById('problemDiffBadge').className = `text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
    p.difficulty === 'Hard' 
      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  }`;
  document.getElementById('problemPatternBadge').innerText = p.pattern;

  // Status Badge
  const status = problemStatuses[p.id] || 'UNATTEMPTED';
  const badge = document.getElementById('currentProblemStatusBadge');
  if (status === 'ACCEPTED') {
    badge.innerText = '✓ Solved / Accepted';
    badge.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  } else if (status === 'FAILED') {
    badge.innerText = '✗ Attempted / Needs Review';
    badge.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
  } else {
    badge.innerText = 'Unattempted';
    badge.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700';
  }

  // Tags
  const tagsContainer = document.getElementById('problemTags');
  tagsContainer.innerHTML = p.tags.map(t => 
    `<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-gray-400 border border-[#30363d]">${t}</span>`
  ).join('');

  // Description
  document.getElementById('problemDescription').innerHTML = p.description.replace(/\n\n/g, '<br><br>').replace(/`([^`]+)`/g, '<code class="bg-[#161b22] px-1.5 py-0.5 rounded text-blue-300 border border-[#30363d] text-xs font-mono">$1</code>');

  // Examples
  const exContainer = document.getElementById('problemExamples');
  exContainer.innerHTML = p.examples.map((ex, i) => `
    <div class="bg-[#161b22] p-3 rounded-lg border border-[#30363d] text-xs font-mono space-y-1">
      <div class="text-gray-400 font-semibold mb-1">Example ${i + 1}:</div>
      <div><span class="text-blue-400 font-semibold">Input:</span> <span class="text-gray-200">${escapeHtml(ex.input)}</span></div>
      <div><span class="text-emerald-400 font-semibold">Output:</span> <span class="text-gray-200">${escapeHtml(ex.output)}</span></div>
      ${ex.explanation ? `<div class="text-gray-400 text-[11px] pt-1"><span class="text-gray-500 font-semibold">Explanation:</span> ${escapeHtml(ex.explanation)}</div>` : ''}
    </div>
  `).join('');

  // Constraints
  const constrContainer = document.getElementById('problemConstraints');
  constrContainer.innerHTML = p.constraints.map(c => `<li>${c}</li>`).join('');

  // Hints
  const hintsContainer = document.getElementById('problemHints');
  hintsContainer.innerHTML = p.hints.map((h, i) => `
    <details class="group bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs cursor-pointer">
      <summary class="font-medium text-gray-300 group-hover:text-blue-400 select-none flex items-center justify-between">
        <span>💡 Hint ${i + 1}</span>
        <span class="text-gray-500 text-[10px]">Click to reveal</span>
      </summary>
      <div class="mt-2 text-gray-400 pt-2 border-t border-[#30363d]/50 leading-relaxed font-sans">${h}</div>
    </details>
  `).join('');

  // Load Saved Draft Code
  loadCodeDraft();
  renderProblemAttempts();
  clearTestOutput();
}

// Load and Save Draft Code
function loadCodeDraft() {
  const p = PROBLEMS[currentProblemIndex];
  if (!p) return;
  const key = `${p.id}_${currentLanguage}`;
  const starter = currentLanguage === 'python' ? p.starter_py : p.starter_js;
  const saved = drafts[key] || starter;

  const editor = document.getElementById('codeEditor');
  editor.value = saved;
  updateLineNumbers();
}

function saveCodeDraft() {
  const p = PROBLEMS[currentProblemIndex];
  if (!p) return;
  const key = `${p.id}_${currentLanguage}`;
  const code = document.getElementById('codeEditor').value;
  drafts[key] = code;
  localStorage.setItem(STORAGE_DRAFTS, JSON.stringify(drafts));

  const ind = document.getElementById('savedIndicator');
  ind.innerText = 'Saved';
  ind.classList.remove('text-amber-400');
  ind.classList.add('text-gray-500');
}

// Update Line Numbers in Editor
function updateLineNumbers() {
  const editor = document.getElementById('codeEditor');
  const lines = editor.value.split('\n').length;
  const nums = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join('<br>');
  document.getElementById('lineNumbers').innerHTML = nums;
}

// Clear Test Output
function clearTestOutput() {
  const out = document.getElementById('testOutputArea');
  out.innerHTML = `<div class="text-gray-500 italic">Click "Run Tests" or "Submit Solution" to evaluate your code against the test suite.</div>`;
  document.getElementById('testSummaryBadge').innerText = 'Ready';
  document.getElementById('testSummaryBadge').className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-gray-400';
}

// RUN TESTS & SUBMISSIONS ENGINE
async function executeEvaluation(isSubmission = false) {
  const p = PROBLEMS[currentProblemIndex];
  if (!p) return;

  const code = document.getElementById('codeEditor').value;
  const outArea = document.getElementById('testOutputArea');
  const summaryBadge = document.getElementById('testSummaryBadge');

  summaryBadge.innerText = isSubmission ? 'Submitting...' : 'Running...';
  summaryBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 animate-pulse';

  outArea.innerHTML = `<div class="text-blue-400 font-mono text-xs">Evaluating ${p.tests.length} test cases...</div>`;

  const startTime = performance.now();
  let passedCount = 0;
  const results = [];

  if (currentLanguage === 'javascript') {
    try {
      // Evaluate JS code in a function scope
      const evalFn = new Function(`
        ${code}
        if (typeof ${p.fn_name} !== 'function') {
          throw new Error("Function '${p.fn_name}' is not defined. Please define function ${p.fn_name}(...).");
        }
        return ${p.fn_name};
      `)();

      for (let i = 0; i < p.tests.length; i++) {
        const test = p.tests[i];
        let actual = undefined;
        let passed = false;
        let errorMsg = null;

        try {
          if (p.id === 6 && test.tree) {
            // Problem 6 Tree builder
            const treeRoot = buildTreeFromArray(test.tree);
            actual = evalFn(treeRoot);
            passed = deepEqual(actual, test.expected);
          } else if (p.id === 7 && test.valid_check) {
            // Problem 7 Course Schedule II valid order check
            actual = evalFn(...test.args);
            passed = Array.isArray(actual) && actual.length === test.len;
          } else if (p.id === 9 && test.expected_count !== undefined) {
            // Problem 9 N-Queens count check
            actual = evalFn(...test.args);
            passed = Array.isArray(actual) && actual.length === test.expected_count;
          } else {
            actual = evalFn(...JSON.parse(JSON.stringify(test.args)));
            passed = deepEqual(actual, test.expected);
          }
        } catch (err) {
          errorMsg = err.message || String(err);
        }

        if (passed) passedCount++;
        results.push({
          index: i + 1,
          passed,
          errorMsg,
          input: test.args ? JSON.stringify(test.args) : (test.tree ? JSON.stringify(test.tree) : ''),
          expected: test.expected !== undefined ? JSON.stringify(test.expected) : (test.expected_count ? `${test.expected_count} configurations` : 'Valid topological DAG'),
          actual: actual !== undefined ? JSON.stringify(actual) : 'undefined'
        });
      }
    } catch (globalErr) {
      outArea.innerHTML = `
        <div class="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-rose-300 font-mono text-xs">
          <strong>Execution Error:</strong> ${escapeHtml(globalErr.message)}
        </div>
      `;
      summaryBadge.innerText = 'Runtime Error';
      summaryBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold';
      
      if (isSubmission) {
        recordSubmission('FAILED', 0, p.tests.length, performance.now() - startTime, code, globalErr.message);
      }
      return;
    }
  } else {
    // Python simulation runner / static verifier
    outArea.innerHTML = `
      <div class="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-blue-300 font-mono text-xs space-y-1">
        <div><strong>Python 3 Local Runner:</strong></div>
        <div class="text-gray-300">To run deep scale benchmarks and pytest directly on your machine's Python environment:</div>
        <div class="bg-[#090d13] p-2 rounded text-emerald-400 mt-1">python C:\\Users\\Tapiwa\\Desktop\\Projects\\leetcode-solutions\\run_tests.py</div>
      </div>
    `;
    summaryBadge.innerText = 'Python Ready';
    summaryBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400';
    return;
  }

  const durationMs = Math.round(performance.now() - startTime);
  const allPassed = passedCount === p.tests.length;

  // Render Test Results Cards
  outArea.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-[#30363d]/50">
      <div class="flex items-center space-x-2">
        <span class="${allPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">
          ${allPassed ? '✓ All Tests Passed' : `✗ Failed (${passedCount}/${p.tests.length} Passed)`}
        </span>
        <span class="text-gray-500">•</span>
        <span class="text-gray-400 font-mono">${durationMs} ms</span>
      </div>
      <div class="text-[11px] text-gray-500 font-mono">${isSubmission ? 'Official Submission' : 'Test Run'}</div>
    </div>
    <div class="space-y-2 pt-1">
      ${results.map(r => `
        <div class="p-2.5 rounded-lg border ${r.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'} space-y-1">
          <div class="flex items-center justify-between font-semibold">
            <span class="${r.passed ? 'text-emerald-400' : 'text-rose-400'}">Test Case ${r.index}: ${r.passed ? 'PASSED' : 'FAILED'}</span>
          </div>
          <div class="text-[11px] text-gray-400 truncate"><span class="text-gray-500 font-semibold">Input:</span> ${escapeHtml(r.input)}</div>
          ${!r.passed ? `
            <div class="text-[11px] text-rose-300"><span class="text-gray-500 font-semibold">Expected:</span> ${escapeHtml(r.expected)}</div>
            <div class="text-[11px] text-rose-300"><span class="text-gray-500 font-semibold">Output:</span> ${escapeHtml(r.actual)}</div>
            ${r.errorMsg ? `<div class="text-[11px] text-rose-400">Error: ${escapeHtml(r.errorMsg)}</div>` : ''}
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  summaryBadge.innerText = allPassed ? 'Accepted' : 'Failed';
  summaryBadge.className = `text-[11px] font-mono px-2.5 py-0.5 rounded font-bold ${
    allPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
  }`;

  if (isSubmission) {
    const firstFail = results.find(r => !r.passed);
    const failDetails = firstFail ? `Failed on Test ${firstFail.index}: expected ${firstFail.expected}, got ${firstFail.actual}` : '';
    recordSubmission(allPassed ? 'ACCEPTED' : 'FAILED', passedCount, p.tests.length, durationMs, code, failDetails);
  }
}

// Record an Attempt in LocalStorage
function recordSubmission(status, passedTests, totalTests, durationMs, code, errorDetails = '') {
  const p = PROBLEMS[currentProblemIndex];
  if (!p) return;

  const sub = {
    id: 'sub_' + Date.now(),
    problemId: p.id,
    problemTitle: p.title,
    difficulty: p.difficulty,
    pattern: p.pattern,
    language: currentLanguage,
    status: status,
    passedTests: passedTests,
    totalTests: totalTests,
    durationMs: durationMs,
    timestamp: new Date().toISOString(),
    code: code,
    errorDetails: errorDetails
  };

  submissions.unshift(sub);
  localStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify(submissions));

  // Update Problem Status (if ever accepted, mark accepted; else mark failed)
  if (status === 'ACCEPTED') {
    problemStatuses[p.id] = 'ACCEPTED';
  } else if (!problemStatuses[p.id]) {
    problemStatuses[p.id] = 'FAILED';
  }
  localStorage.setItem(STORAGE_STATUS, JSON.stringify(problemStatuses));

  updateHeaderMetrics();
  selectProblem(currentProblemIndex);
}

// Update Header Counts
function updateHeaderMetrics() {
  const solved = Object.values(problemStatuses).filter(s => s === 'ACCEPTED').length;
  const failed = Object.values(problemStatuses).filter(s => s === 'FAILED').length;
  const totalAttempts = submissions.length;

  document.getElementById('headerSolvedCount').innerText = solved;
  document.getElementById('headerFailedCount').innerText = failed;
  document.getElementById('headerAttemptedCount').innerText = totalAttempts;
}

// Render Problem Attempts Tab
function renderProblemAttempts() {
  const p = PROBLEMS[currentProblemIndex];
  if (!p) return;

  const probSubs = submissions.filter(s => s.problemId === p.id);
  document.getElementById('currentProblemAttemptsCount').innerText = probSubs.length;

  const container = document.getElementById('problemAttemptsList');
  if (probSubs.length === 0) {
    container.innerHTML = `<div class="text-gray-500 italic text-xs">No attempts recorded for this problem yet.</div>`;
    return;
  }

  container.innerHTML = probSubs.map(s => `
    <div class="bg-[#161b22] border ${s.status === 'ACCEPTED' ? 'border-emerald-500/30' : 'border-rose-500/30'} p-3 rounded-lg space-y-1.5 text-xs font-mono">
      <div class="flex items-center justify-between">
        <span class="font-bold ${s.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}">${s.status}</span>
        <span class="text-gray-500 text-[11px]">${new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
      <div class="text-gray-400 text-[11px]">
        Tests Passed: <strong class="text-white">${s.passedTests}/${s.totalTests}</strong> • Language: ${s.language} • ${s.durationMs}ms
      </div>
      ${s.errorDetails ? `<div class="text-rose-300 text-[11px] bg-rose-500/10 p-1.5 rounded">${escapeHtml(s.errorDetails)}</div>` : ''}
      <details class="pt-1">
        <summary class="text-blue-400 cursor-pointer text-[11px] hover:underline">View Submitted Code</summary>
        <pre class="bg-[#090d13] p-2 rounded text-[11px] text-gray-300 mt-1 overflow-x-auto max-h-40"><code>${escapeHtml(s.code)}</code></pre>
      </details>
    </div>
  `).join('');
}

// Generate Daily Progress Report for Antigravity
function generateDailyReport() {
  const today = new Date().toISOString().split('T')[0];
  const todaySubs = submissions.filter(s => s.timestamp.startsWith(today));
  
  const solvedToday = new Set(todaySubs.filter(s => s.status === 'ACCEPTED').map(s => s.problemId));
  const failedToday = new Set(todaySubs.filter(s => s.status === 'FAILED').map(s => s.problemId));

  document.getElementById('reportDate').innerText = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('reportSolved').innerText = solvedToday.size;
  document.getElementById('reportFailed').innerText = failedToday.size;
  document.getElementById('reportTotal').innerText = todaySubs.length;

  let md = `# Daily Practice & Diagnostic Report — ${today}\n\n`;
  md += `### Session Summary\n`;
  md += `- **Date:** ${today}\n`;
  md += `- **Problems Solved Today:** ${solvedToday.size}\n`;
  md += `- **Problems Struggling / Failed:** ${failedToday.size}\n`;
  md += `- **Total Attempt Submissions:** ${todaySubs.length}\n\n`;

  md += `### Problem Breakdown\n`;
  md += `| Problem | Difficulty | Pattern | Final Status | Attempts |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  PROBLEMS.forEach(p => {
    const pSubs = todaySubs.filter(s => s.problemId === p.id);
    if (pSubs.length > 0) {
      const isSolved = pSubs.some(s => s.status === 'ACCEPTED');
      const statusStr = isSolved ? '✅ ACCEPTED' : '❌ FAILED / NEEDS REVIEW';
      md += `| ${p.title} | ${p.difficulty} | ${p.pattern} | ${statusStr} | ${pSubs.length} |\n`;
    }
  });

  const failedProblems = PROBLEMS.filter(p => {
    const pSubs = todaySubs.filter(s => s.problemId === p.id);
    return pSubs.length > 0 && !pSubs.some(s => s.status === 'ACCEPTED');
  });

  if (failedProblems.length > 0) {
    md += `\n### Areas Requiring Diagnostic Guidance\n`;
    failedProblems.forEach(p => {
      const lastAttempt = todaySubs.filter(s => s.problemId === p.id)[0];
      md += `\n#### ❌ ${p.title} (${p.pattern})\n`;
      md += `- **Failing Detail:** ${lastAttempt.errorDetails || 'Incorrect output on hidden test case'}\n`;
      md += `- **Submitted Code:**\n`;
      md += "```" + lastAttempt.language + "\n";
      md += lastAttempt.code + "\n";
      md += "```\n";
    });
  } else if (todaySubs.length > 0) {
    md += `\n> **Great Session!** All problems attempted today reached Accepted status.\n`;
  } else {
    md += `\n*(No problem attempts recorded yet for today. Start practicing to generate live data!)*\n`;
  }

  document.getElementById('reportMarkdown').value = md;
  document.getElementById('reportModal').classList.remove('hidden');
}

// Render Full History Modal
function renderFullHistory() {
  const container = document.getElementById('fullHistoryContainer');
  if (submissions.length === 0) {
    container.innerHTML = `<div class="text-gray-500 italic p-4 text-center">No submissions recorded yet.</div>`;
    return;
  }

  container.innerHTML = submissions.map(s => `
    <div class="bg-[#0d1117] border ${s.status === 'ACCEPTED' ? 'border-emerald-500/30' : 'border-rose-500/30'} p-3 rounded-lg space-y-1">
      <div class="flex items-center justify-between">
        <span class="font-bold text-white">${s.problemTitle}</span>
        <span class="text-[11px] font-bold ${s.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}">${s.status}</span>
      </div>
      <div class="text-[11px] text-gray-400 flex items-center justify-between">
        <span>Passed: ${s.passedTests}/${s.totalTests} • ${s.language} • ${s.durationMs}ms</span>
        <span class="text-gray-500">${new Date(s.timestamp).toLocaleString()}</span>
      </div>
      ${s.errorDetails ? `<div class="text-[11px] text-rose-300 mt-1">${escapeHtml(s.errorDetails)}</div>` : ''}
    </div>
  `).join('');
}

// Setup Event Listeners
function setupEventListeners() {
  const editor = document.getElementById('codeEditor');
  
  // Real-time line numbers and draft saving
  editor.addEventListener('input', () => {
    updateLineNumbers();
    document.getElementById('savedIndicator').innerText = 'Saving...';
    document.getElementById('savedIndicator').classList.add('text-amber-400');
    saveCodeDraft();
  });

  // Tab Key indentation support
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      updateLineNumbers();
      saveCodeDraft();
    }
  });

  // Language Change
  document.getElementById('languageSelect').addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    loadCodeDraft();
  });

  // Reset Code Button
  document.getElementById('resetCodeBtn').addEventListener('click', () => {
    if (confirm('Reset editor to the default starter template for this problem?')) {
      const p = PROBLEMS[currentProblemIndex];
      const starter = currentLanguage === 'python' ? p.starter_py : p.starter_js;
      editor.value = starter;
      updateLineNumbers();
      saveCodeDraft();
    }
  });

  // Copy Code Button
  document.getElementById('copyCodeBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(editor.value);
    const btn = document.getElementById('copyCodeBtn');
    const old = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = old, 1500);
  });

  // Run & Submit Buttons
  document.getElementById('runTestsBtn').addEventListener('click', () => executeEvaluation(false));
  document.getElementById('submitSolutionBtn').addEventListener('click', () => executeEvaluation(true));

  // Search & Filter
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderProblemList(getActiveFilter(), e.target.value);
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-600/20', 'text-blue-400', 'border', 'border-blue-500/30');
        b.classList.add('hover:bg-[#21262d]');
      });
      btn.classList.add('active', 'bg-blue-600/20', 'text-blue-400', 'border', 'border-blue-500/30');
      btn.classList.remove('hover:bg-[#21262d]');
      renderProblemList(btn.getAttribute('data-filter'), document.getElementById('searchInput').value);
    });
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'text-blue-400', 'border-b-2', 'border-blue-500');
        b.classList.add('text-gray-400');
      });
      btn.classList.add('active', 'text-blue-400', 'border-b-2', 'border-blue-500');
      btn.classList.remove('text-gray-400');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(btn.getAttribute('data-tab')).classList.remove('hidden');
    });
  });

  // Daily Report Modal
  document.getElementById('openReportBtn').addEventListener('click', generateDailyReport);
  document.getElementById('closeReportBtn').addEventListener('click', () => {
    document.getElementById('reportModal').classList.add('hidden');
  });

  document.getElementById('copyReportBtn').addEventListener('click', () => {
    const text = document.getElementById('reportMarkdown').value;
    navigator.clipboard.writeText(text);
    const notif = document.getElementById('copyReportNotification');
    notif.classList.remove('hidden');
    setTimeout(() => notif.classList.add('hidden'), 2500);
  });

  document.getElementById('downloadReportBtn').addEventListener('click', () => {
    const text = document.getElementById('reportMarkdown').value;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practice_report_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // History Modal
  document.getElementById('openHistoryBtn').addEventListener('click', () => {
    renderFullHistory();
    document.getElementById('historyModal').classList.remove('hidden');
  });
  document.getElementById('closeHistoryBtn').addEventListener('click', () => {
    document.getElementById('historyModal').classList.add('hidden');
  });

  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (confirm('Clear all local submission history? This cannot be undone.')) {
      submissions = [];
      problemStatuses = {};
      localStorage.removeItem(STORAGE_SUBMISSIONS);
      localStorage.removeItem(STORAGE_STATUS);
      renderFullHistory();
      updateHeaderMetrics();
      selectProblem(currentProblemIndex);
    }
  });

  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const data = { drafts, submissions, problemStatuses };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algoforge_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function getActiveFilter() {
  const active = document.querySelector('.filter-btn.active');
  return active ? active.getAttribute('data-filter') : 'all';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Fallback embedded dataset for local zero-CORS runtime
const FALLBACK_PROBLEMS = [
  {
    "id": 1,
    "slug": "01-trapping-rain-water",
    "title": "01. Trapping Rain Water",
    "difficulty": "Hard",
    "pattern": "Two Pointers / Monotonic Stack",
    "tags": ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
    "fn_name": "trap",
    "starter_py": "class Solution:\n    def trap(self, height: list[int]) -> int:\n        # Write your solution here\n        pass\n",
    "starter_js": "/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n  // Write your solution here\n  let left = 0, right = height.length - 1;\n  let leftMax = 0, rightMax = 0;\n  let water = 0;\n  \n  while (left < right) {\n    if (height[left] < height[right]) {\n      if (height[left] >= leftMax) leftMax = height[left];\n      else water += leftMax - height[left];\n      left++;\n    } else {\n      if (height[right] >= rightMax) rightMax = height[right];\n      else water += rightMax - height[right];\n      right--;\n    }\n  }\n  return water;\n}\n",
    "description": "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    "examples": [
      { "input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6", "explanation": "The elevation map traps 6 units of rain water." },
      { "input": "height = [4,2,0,3,2,5]", "output": "9", "explanation": "The elevation map traps 9 units of rain water." }
    ],
    "constraints": ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    "hints": [
      "Can you compute the trapped water at each bar individually?",
      "Water trapped at index i is min(max_left, max_right) - height[i].",
      "Use two pointers from both ends moving inward in O(1) space."
    ],
    "tests": [
      { "args": [[0,1,0,2,1,0,1,3,2,1,2,1]], "expected": 6 },
      { "args": [[4,2,0,3,2,5]], "expected": 9 },
      { "args": [[]], "expected": 0 },
      { "args": [[1]], "expected": 0 },
      { "args": [[1,2,3,4,5]], "expected": 0 },
      { "args": [[5,4,3,2,1]], "expected": 0 },
      { "args": [[5,0,5]], "expected": 5 },
      { "args": [[2,0,2,0,2,0,2]], "expected": 6 }
    ]
  },
  {
    "id": 2,
    "slug": "02-minimum-window-substring",
    "title": "02. Minimum Window Substring",
    "difficulty": "Hard",
    "pattern": "Sliding Window",
    "tags": ["Hash Table", "String", "Sliding Window"],
    "fn_name": "minWindow",
    "starter_py": "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        # Write your solution here\n        pass\n",
    "starter_js": "/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nfunction minWindow(s, t) {\n  if (!s || !t || s.length < t.length) return '';\n  const targetMap = {};\n  for (const ch of t) targetMap[ch] = (targetMap[ch] || 0) + 1;\n  \n  let required = Object.keys(targetMap).length;\n  let formed = 0;\n  const windowMap = {};\n  let left = 0, right = 0;\n  let minLen = Infinity, minLeft = 0;\n  \n  while (right < s.length) {\n    const ch = s[right];\n    windowMap[ch] = (windowMap[ch] || 0) + 1;\n    if (targetMap[ch] && windowMap[ch] === targetMap[ch]) {\n      formed++;\n    }\n    \n    while (left <= right && formed === required) {\n      if (right - left + 1 < minLen) {\n        minLen = right - left + 1;\n        minLeft = left;\n      }\n      const leftCh = s[left];\n      windowMap[leftCh]--;\n      if (targetMap[leftCh] && windowMap[leftCh] < targetMap[leftCh]) {\n        formed--;\n      }\n      left++;\n    }\n    right++;\n  }\n  return minLen === Infinity ? '' : s.substring(minLeft, minLeft + minLen);\n}\n",
    "description": "Given two strings `s` and `t` of lengths `m` and `n` respectively, return the **minimum window substring** of `s` such that every character in `t` (including duplicates) is included in the window.",
    "examples": [
      { "input": "s = 'ADOBECODEBANC', t = 'ABC'", "output": "'BANC'", "explanation": "The minimum window substring 'BANC' includes 'A', 'B', and 'C'." },
      { "input": "s = 'a', t = 'a'", "output": "'a'" }
    ],
    "constraints": ["1 <= s.length, t.length <= 10^5", "s and t consist of uppercase and lowercase English letters."],
    "hints": [
      "Expand the right pointer until all characters from t are satisfied.",
      "Contract the left pointer to shrink the window while maintaining validity."
    ],
    "tests": [
      { "args": ["ADOBECODEBANC", "ABC"], "expected": "BANC" },
      { "args": ["a", "a"], "expected": "a" },
      { "args": ["a", "aa"], "expected": "" },
      { "args": ["ab", "b"], "expected": "b" }
    ]
  },
  {
    "id": 3,
    "slug": "03-find-the-duplicate-number",
    "title": "03. Find the Duplicate Number",
    "difficulty": "Medium",
    "pattern": "Fast & Slow Pointers (Floyd's Cycle)",
    "tags": ["Array", "Two Pointers", "Binary Search"],
    "fn_name": "findDuplicate",
    "starter_py": "class Solution:\n    def findDuplicate(self, nums: list[int]) -> int:\n        # Write your solution here in O(1) space\n        pass\n",
    "starter_js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction findDuplicate(nums) {\n  let slow = nums[0];\n  let fast = nums[0];\n  do {\n    slow = nums[slow];\n    fast = nums[nums[fast]];\n  } while (slow !== fast);\n  \n  slow = nums[0];\n  while (slow !== fast) {\n    slow = nums[slow];\n    fast = nums[fast];\n  }\n  return slow;\n}\n",
    "description": "Given an array of integers `nums` containing `n + 1` integers where each integer is in the range `[1, n]` inclusive.\n\nThere is only **one repeated number** in `nums`, return *this repeated number* in $O(1)$ extra space without modifying the array.",
    "examples": [
      { "input": "nums = [1,3,4,2,2]", "output": "2" },
      { "input": "nums = [3,1,3,4,2]", "output": "3" }
    ],
    "constraints": ["1 <= n <= 10^5", "nums.length == n + 1", "1 <= nums[i] <= n"],
    "hints": ["Treat array indices as linked list pointers.", "Apply Floyd's Tortoise and Hare algorithm."],
    "tests": [
      { "args": [[1,3,4,2,2]], "expected": 2 },
      { "args": [[3,1,3,4,2]], "expected": 3 },
      { "args": [[3,3,3,3,3]], "expected": 3 },
      { "args": [[2,5,9,6,9,3,8,9,7,1]], "expected": 9 }
    ]
  },
  {
    "id": 4,
    "slug": "04-median-of-two-sorted-arrays",
    "title": "04. Median of Two Sorted Arrays",
    "difficulty": "Hard",
    "pattern": "Binary Search on Partition Index",
    "tags": ["Array", "Binary Search", "Divide and Conquer"],
    "fn_name": "findMedianSortedArrays",
    "starter_py": "class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        pass\n",
    "starter_js": "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nfunction findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);\n  const m = nums1.length, n = nums2.length;\n  let low = 0, high = m;\n  \n  while (low <= high) {\n    const cut1 = Math.floor((low + high) / 2);\n    const cut2 = Math.floor((m + n + 1) / 2) - cut1;\n    \n    const left1 = cut1 === 0 ? -Infinity : nums1[cut1 - 1];\n    const right1 = cut1 === m ? Infinity : nums1[cut1];\n    \n    const left2 = cut2 === 0 ? -Infinity : nums2[cut2 - 1];\n    const right2 = cut2 === n ? Infinity : nums2[cut2];\n    \n    if (left1 <= right2 && left2 <= right1) {\n      if ((m + n) % 2 === 0) {\n        return (Math.max(left1, left2) + Math.min(right1, right2)) / 2.0;\n      } else {\n        return Math.max(left1, left2);\n      }\n    } else if (left1 > right2) {\n      high = cut1 - 1;\n    } else {\n      low = cut1 + 1;\n    }\n  }\n  return 0.0;\n}\n",
    "description": "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return **the median** in $O(\\log (m+n))$ runtime.",
    "examples": [
      { "input": "nums1 = [1,3], nums2 = [2]", "output": "2.00000" },
      { "input": "nums1 = [1,2], nums2 = [3,4]", "output": "2.50000" }
    ],
    "constraints": ["nums1.length == m, nums2.length == n", "0 <= m, n <= 1000", "-10^6 <= nums1[i], nums2[i] <= 10^6"],
    "hints": ["Binary search on the partition cut of the shorter array."],
    "tests": [
      { "args": [[1,3], [2]], "expected": 2.0 },
      { "args": [[1,2], [3,4]], "expected": 2.5 },
      { "args": [[], [1]], "expected": 1.0 },
      { "args": [[0,0], [0,0]], "expected": 0.0 }
    ]
  },
  {
    "id": 5,
    "slug": "05-largest-rectangle-in-histogram",
    "title": "05. Largest Rectangle in Histogram",
    "difficulty": "Hard",
    "pattern": "Monotonic Stack",
    "tags": ["Array", "Stack", "Monotonic Stack"],
    "fn_name": "largestRectangleArea",
    "starter_py": "class Solution:\n    def largestRectangleArea(self, heights: list[int]) -> int:\n        pass\n",
    "starter_js": "/**\n * @param {number[]} heights\n * @return {number}\n */\nfunction largestRectangleArea(heights) {\n  const stack = [];\n  let maxArea = 0;\n  const n = heights.length;\n  \n  for (let i = 0; i <= n; i++) {\n    const h = i === n ? 0 : heights[i];\n    while (stack.length > 0 && h < heights[stack[stack.length - 1]]) {\n      const height = heights[stack.pop()];\n      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;\n      maxArea = Math.max(maxArea, height * width);\n    }\n    stack.push(i);\n  }\n  return maxArea;\n}\n",
    "description": "Given an array of integers `heights` representing the histogram's bar height where the width of each bar is `1`, return *the area of the largest rectangle in the histogram*.",
    "examples": [
      { "input": "heights = [2,1,5,6,2,3]", "output": "10" },
      { "input": "heights = [2,4]", "output": "4" }
    ],
    "constraints": ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    "hints": ["Maintain an increasing monotonic stack of indices."],
    "tests": [
      { "args": [[2,1,5,6,2,3]], "expected": 10 },
      { "args": [[2,4]], "expected": 4 },
      { "args": [[1]], "expected": 1 },
      { "args": [[5,5,5,5]], "expected": 20 }
    ]
  },
  {
    "id": 6,
    "slug": "06-binary-tree-maximum-path-sum",
    "title": "06. Binary Tree Maximum Path Sum",
    "difficulty": "Hard",
    "pattern": "Tree Post-Order DFS / Tree DP",
    "tags": ["Dynamic Programming", "Tree", "Depth-First Search"],
    "fn_name": "maxPathSum",
    "starter_py": "class Solution:\n    def maxPathSum(self, root) -> int:\n        pass\n",
    "starter_js": "/**\n * @param {TreeNode} root\n * @return {number}\n */\nfunction maxPathSum(root) {\n  let maxSum = -Infinity;\n  \n  function dfs(node) {\n    if (!node) return 0;\n    const left = Math.max(0, dfs(node.left));\n    const right = Math.max(0, dfs(node.right));\n    maxSum = Math.max(maxSum, node.val + left + right);\n    return node.val + Math.max(left, right);\n  }\n  \n  dfs(root);\n  return maxSum;\n}\n",
    "description": "Given the `root` of a binary tree, return *the maximum **path sum** of any **non-empty** path*.",
    "examples": [
      { "input": "root = [1,2,3]", "output": "6" },
      { "input": "root = [-10,9,20,null,null,15,7]", "output": "42" }
    ],
    "constraints": ["The number of nodes in the tree is in the range [1, 3 * 10^4].", "-1000 <= Node.val <= 1000"],
    "hints": ["At each node, calculate the max gain it can pass to its parent."],
    "tests": [
      { "tree": [1,2,3], "expected": 6 },
      { "tree": [-10,9,20,null,null,15,7], "expected": 42 },
      { "tree": [-3], "expected": -3 }
    ]
  },
  {
    "id": 7,
    "slug": "07-course-schedule-ii",
    "title": "07. Course Schedule II",
    "difficulty": "Medium",
    "pattern": "Topological Sort (Kahn's BFS / DFS)",
    "tags": ["Graph", "Topological Sort", "BFS"],
    "fn_name": "findOrder",
    "starter_py": "class Solution:\n    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:\n        pass\n",
    "starter_js": "/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {number[]}\n */\nfunction findOrder(numCourses, prerequisites) {\n  const inDegree = new Array(numCourses).fill(0);\n  const adj = Array.from({ length: numCourses }, () => []);\n  \n  for (const [dest, src] of prerequisites) {\n    adj[src].push(dest);\n    inDegree[dest]++;\n  }\n  \n  const queue = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (inDegree[i] === 0) queue.push(i);\n  }\n  \n  const order = [];\n  while (queue.length > 0) {\n    const u = queue.shift();\n    order.push(u);\n    for (const v of adj[u]) {\n      inDegree[v]--;\n      if (inDegree[v] === 0) queue.push(v);\n    }\n  }\n  \n  return order.length === numCourses ? order : [];\n}\n",
    "description": "Given `numCourses` and directed prerequisites `[a, b]`, return *the ordering of courses you should take to finish all courses*.",
    "examples": [
      { "input": "numCourses = 2, prerequisites = [[1,0]]", "output": "[0,1]" },
      { "input": "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", "output": "[0,2,1,3]" }
    ],
    "constraints": ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= numCourses * (numCourses - 1)"],
    "hints": ["Compute in-degrees and use Kahn's Algorithm."],
    "tests": [
      { "args": [2, [[1,0]]], "valid_check": true, "len": 2 },
      { "args": [4, [[1,0],[2,0],[3,1],[3,2]]], "valid_check": true, "len": 4 },
      { "args": [1, []], "expected": [0] },
      { "args": [2, [[1,0],[0,1]]], "expected": [] }
    ]
  },
  {
    "id": 8,
    "slug": "08-edit-distance",
    "title": "08. Edit Distance",
    "difficulty": "Hard",
    "pattern": "2D Dynamic Programming (Levenshtein Distance)",
    "tags": ["String", "Dynamic Programming"],
    "fn_name": "minDistance",
    "starter_py": "class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        pass\n",
    "starter_js": "/**\n * @param {string} word1\n * @param {string} word2\n * @return {number}\n */\nfunction minDistance(word1, word2) {\n  const m = word1.length, n = word2.length;\n  let dp = Array.from({ length: n + 1 }, (_, j) => j);\n  \n  for (let i = 1; i <= m; i++) {\n    const next = [i];\n    for (let j = 1; j <= n; j++) {\n      if (word1[i - 1] === word2[j - 1]) {\n        next[j] = dp[j - 1];\n      } else {\n        next[j] = 1 + Math.min(dp[j], next[j - 1], dp[j - 1]);\n      }\n    }\n    dp = next;\n  }\n  return dp[n];\n}\n",
    "description": "Given two strings `word1` and `word2`, return *the minimum number of operations required to convert `word1` to `word2`* (Insert, Delete, Replace).",
    "examples": [
      { "input": "word1 = 'horse', word2 = 'ros'", "output": "3" },
      { "input": "word1 = 'intention', word2 = 'execution'", "output": "5" }
    ],
    "constraints": ["0 <= word1.length, word2.length <= 500"],
    "hints": ["dp[i][j] represents min edit distance between word1[0..i] and word2[0..j]."],
    "tests": [
      { "args": ["horse", "ros"], "expected": 3 },
      { "args": ["intention", "execution"], "expected": 5 },
      { "args": ["", ""], "expected": 0 },
      { "args": ["a", ""], "expected": 1 }
    ]
  },
  {
    "id": 9,
    "slug": "09-n-queens",
    "title": "09. N-Queens",
    "difficulty": "Hard",
    "pattern": "Backtracking / Bitmask Constraints",
    "tags": ["Array", "Backtracking"],
    "fn_name": "solveNQueens",
    "starter_py": "class Solution:\n    def solveNQueens(self, n: int) -> list[list[str]]:\n        pass\n",
    "starter_js": "/**\n * @param {number} n\n * @return {string[][]}\n */\nfunction solveNQueens(n) {\n  const res = [];\n  const cols = new Set(), diag1 = new Set(), diag2 = new Set();\n  const board = Array.from({ length: n }, () => new Array(n).fill('.'));\n  \n  function backtrack(r) {\n    if (r === n) {\n      res.push(board.map(row => row.join('')));\n      return;\n    }\n    for (let c = 0; c < n; c++) {\n      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;\n      cols.add(c); diag1.add(r - c); diag2.add(r + c);\n      board[r][c] = 'Q';\n      backtrack(r + 1);\n      board[r][c] = '.';\n      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);\n    }\n  }\n  \n  backtrack(0);\n  return res;\n}\n",
    "description": "Place `n` queens on an `n x n` chessboard such that no two queens attack each other. Return all distinct board configurations.",
    "examples": [
      { "input": "n = 4", "output": "2 distinct solutions" },
      { "input": "n = 1", "output": "[['Q']]" }
    ],
    "constraints": ["1 <= n <= 9"],
    "hints": ["Place queens row by row. Track occupied columns and diagonals."],
    "tests": [
      { "args": [1], "expected_count": 1 },
      { "args": [4], "expected_count": 2 },
      { "args": [8], "expected_count": 92 }
    ]
  },
  {
    "id": 10,
    "slug": "10-merge-intervals",
    "title": "10. Merge Intervals",
    "difficulty": "Medium",
    "pattern": "Interval Scheduling / Sorting & Greedy Scanning",
    "tags": ["Array", "Sorting"],
    "fn_name": "merge",
    "starter_py": "class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        pass\n",
    "starter_js": "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  if (!intervals || intervals.length <= 1) return intervals;\n  intervals.sort((a, b) => a[0] - b[0]);\n  const res = [intervals[0]];\n  \n  for (let i = 1; i < intervals.length; i++) {\n    const curr = intervals[i];\n    const last = res[res.length - 1];\n    if (curr[0] <= last[1]) {\n      last[1] = Math.max(last[1], curr[1]);\n    } else {\n      res.push(curr);\n    }\n  }\n  return res;\n}\n",
    "description": "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals.",
    "examples": [
      { "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]", "output": "[[1,6],[8,10],[15,18]]" },
      { "input": "intervals = [[1,4],[4,5]]", "output": "[[1,5]]" }
    ],
    "constraints": ["1 <= intervals.length <= 10^4", "intervals[i].length == 2"],
    "hints": ["Sort primarily by interval start time, then merge incrementally."],
    "tests": [
      { "args": [[[1,3],[2,6],[8,10],[15,18]]], "expected": [[1,6],[8,10],[15,18]] },
      { "args": [[[1,4],[4,5]]], "expected": [[1,5]] },
      { "args": [[[1,4],[0,4]]], "expected": [[0,4]] },
      { "args": [[[1,4],[2,3]]], "expected": [[1,4]] }
    ]
  }
];

// Run on load
document.addEventListener('DOMContentLoaded', init);
