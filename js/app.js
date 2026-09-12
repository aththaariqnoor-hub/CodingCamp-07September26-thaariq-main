/* =====================================================
   Life Dashboard — app.js
   Plain vanilla JavaScript. No frameworks, no imports.
   ===================================================== */

/* ─────────────────────────────────────────────────────
   0. THEME  — must run FIRST to prevent colour flash
   ───────────────────────────────────────────────────── */
(function initTheme() {
  const STORAGE_KEY = 'dashboard_theme';
  const toggleBtn = document.getElementById('theme-toggle');

  function loadTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    if (theme === 'dark') {
      toggleBtn.setAttribute('aria-label', 'Switch to light mode');
      toggleBtn.textContent = '☀️';
    } else {
      toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      toggleBtn.textContent = '🌙';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  }

  // Apply persisted theme immediately (before any other widget renders)
  applyTheme(loadTheme());

  toggleBtn.addEventListener('click', toggleTheme);
})();


/* ─────────────────────────────────────────────────────
   1. GREETING WIDGET — initGreeting()
   ───────────────────────────────────────────────────── */
(function initGreeting() {

  /* ── DOM nodes ── */
  var greetingEl = document.getElementById('greeting-text');
  var clockEl = document.getElementById('clock');
  var dateEl = document.getElementById('date-text');
  var nameDisplay = document.getElementById('name-display');
  var nameEditBtn = document.getElementById('name-edit-btn');
  var nameEditor = document.querySelector('.name-editor');
  var nameInput = document.getElementById('name-input');
  var nameSaveBtn = document.getElementById('name-save-btn');
  var nameCancelBtn = document.getElementById('name-cancel-btn');

  /* ── Constants ── */
  var DAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /* ── Pure helpers ── */

  /**
   * Zero-pads a number to 2 digits.
   * @param   {number} n
   * @returns {string}  e.g. pad(7) → "07"
   */
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /**
   * Returns a time-of-day greeting, optionally personalised.
   *
   * Boundary rules (spec §3):
   *   Morning   → hour in [5, 11]
   *   Afternoon → hour in [12, 17]
   *   Evening   → hour in [18, 20]
   *   Night     → hour in [21, 23] ∪ [0, 4]
   *
   * @param   {number} hour  - Integer in [0, 23]
   * @param   {string} [name] - Optional saved name (empty string = no suffix)
   * @returns {string}
   */
  function getGreeting(hour, name) {
    var base;
    if (hour >= 5 && hour <= 11) { base = 'Good Morning'; }
    else if (hour >= 12 && hour <= 17) { base = 'Good Afternoon'; }
    else if (hour >= 18 && hour <= 20) { base = 'Good Evening'; }
    else { base = 'Good Night'; }

    var trimmed = (name || '').trim();
    return trimmed.length > 0 ? base + ', ' + trimmed + '!' : base;
  }

  /* ── Clock / date / greeting tick ── */

  /**
   * Reads the current time and refreshes the clock, date, and greeting DOM nodes.
   * Called once immediately and then every 1 000 ms via setInterval.
   */
  function tick() {
    var now = new Date();
    var hour = now.getHours();

    // HH:MM:SS live clock
    clockEl.textContent =
      pad(hour) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

    // "Monday, 7 July 2025" — no leading zero on day (per spec example)
    dateEl.textContent =
      DAYS[now.getDay()] + ', ' +
      now.getDate() + ' ' +
      MONTHS[now.getMonth()] + ' ' +
      now.getFullYear();

    // Greeting — picks up the current saved name each tick so it stays live
    greetingEl.textContent = getGreeting(hour, loadName());
  }

  /* Start the clock immediately, then on a 1-second heartbeat */
  tick();
  setInterval(tick, 1000);

  /* ── Name persistence ── */

  /**
   * Reads the saved display name from localStorage.
   * @returns {string} Stored name, or "" if absent / unreadable.
   */
  function loadName() {
    try {
      return localStorage.getItem('dashboard_username') || '';
    } catch (_) {
      return '';
    }
  }

  /**
   * Persists the display name.
   * Stores the trimmed value, or removes the key when the name is cleared.
   * @param {string} name
   */
  function saveName(name) {
    try {
      var trimmed = name.trim();
      if (trimmed.length > 0) {
        localStorage.setItem('dashboard_username', trimmed);
      } else {
        localStorage.removeItem('dashboard_username');
      }
    } catch (_) { /* storage unavailable — silent */ }
  }

  /**
   * Updates the name display span and regenerates the greeting immediately.
   * @param {string} name
   */
  function applyName(name) {
    var trimmed = name.trim();
    if (trimmed.length > 0) {
      nameDisplay.textContent = trimmed;
      nameDisplay.hidden = false;
    } else {
      nameDisplay.textContent = '';
      nameDisplay.hidden = true;
    }
    // Regenerate greeting right away (tick() will also keep it live)
    var hour = new Date().getHours();
    greetingEl.textContent = getGreeting(hour, trimmed);
  }

  /* ── Name editor show/hide ── */

  function showNameEditor() {
    nameEditor.hidden = false;
    nameEditBtn.hidden = true;
    nameInput.value = loadName();
    nameInput.focus();
    nameInput.select();
  }

  function hideNameEditor() {
    nameEditor.hidden = true;
    nameEditBtn.hidden = false;
  }

  /* ── Name editor event wiring ── */

  nameEditBtn.addEventListener('click', showNameEditor);

  nameSaveBtn.addEventListener('click', function () {
    var value = nameInput.value;
    saveName(value);
    applyName(value);
    hideNameEditor();
  });

  nameCancelBtn.addEventListener('click', function () {
    hideNameEditor();
  });

  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var value = nameInput.value;
      saveName(value);
      applyName(value);
      hideNameEditor();
    }
    if (e.key === 'Escape') {
      hideNameEditor();
    }
  });

  /* ── Startup: apply persisted name ── */
  applyName(loadName());

})();


/* ─────────────────────────────────────────────────────
   2. FOCUS TIMER  — initTimer()
   ───────────────────────────────────────────────────── */
(function initTimer() {
  // ── DOM nodes ──
  const displayEl = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const stopBtn = document.getElementById('timer-stop');
  const resetBtn = document.getElementById('timer-reset');
  const durationInput = document.getElementById('timer-duration-input');
  const durationSetBtn = document.getElementById('timer-duration-set');
  const durationError = document.getElementById('timer-duration-error');

  // ── State ──
  var totalSeconds = 25 * 60;   // 1500 s default; overwritten by applyDuration on startup
  var remaining = totalSeconds;
  var intervalId = null;

  // ── Pure helper ──
  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── Rendering ──
  function render() {
    displayEl.textContent = formatTime(remaining);
  }

  // ── Button state ──
  function setRunning(isRunning) {
    startBtn.disabled = isRunning;
  }

  // ── Timer controls ──
  function start() {
    if (intervalId !== null) return; // guard against double-start

    setRunning(true);

    intervalId = setInterval(function () {
      remaining -= 1;
      render();

      if (remaining <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        remaining = 0;
        render();
        setRunning(false);
        // Delay the alert 50 ms so the "00:00" display paints before the dialog blocks
        setTimeout(function () {
          window.alert('⏰ Focus session complete! Take a well-deserved break.');
        }, 50);
      }
    }, 1000);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    setRunning(false);
  }

  function reset() {
    stop();
    remaining = totalSeconds;
    render();
  }

  // ── Custom duration persistence ──
  function loadDuration() {
    var saved = localStorage.getItem('dashboard_timer_duration');
    var parsed = parseInt(saved, 10);
    return (saved !== null && !isNaN(parsed)) ? parsed : 25;
  }

  function saveDuration(minutes) {
    localStorage.setItem('dashboard_timer_duration', String(parseInt(minutes, 10)));
  }

  function applyDuration(minutes) {
    totalSeconds = minutes * 60;
    if (durationInput) {
      durationInput.placeholder = String(minutes);
    }
    reset();
  }

  function validateAndSetDuration() {
    var raw = durationInput ? durationInput.value : '';
    var value = Number(raw);

    // Must be a whole number (no decimals) within [1, 60]
    if (
      raw.trim() === '' ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 60
    ) {
      if (durationError) {
        durationError.textContent = 'Please enter a whole number between 1 and 60.';
      }
      return;
    }

    // Valid — clear error, persist, apply
    if (durationError) {
      durationError.textContent = '';
    }
    saveDuration(value);
    applyDuration(value);
    if (durationInput) {
      durationInput.value = '';
    }
  }

  // ── Event wiring ──
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  resetBtn.addEventListener('click', reset);

  if (durationSetBtn) {
    durationSetBtn.addEventListener('click', validateAndSetDuration);
  }

  if (durationInput) {
    durationInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        validateAndSetDuration();
      }
    });
  }

  // ── Startup: load saved duration first, then render ──
  // applyDuration calls reset() → stop() + render(), so no extra render() needed
  applyDuration(loadDuration());
})();


/* ─────────────────────────────────────────────────────
   3. TO-DO LIST  — initTodo()
   ───────────────────────────────────────────────────── */
(function initTodo() {
  const STORAGE_KEY = 'dashboard_todos';
  const SORT_STORAGE_KEY = 'dashboard_task_sort';

  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const errorEl = document.getElementById('todo-error');
  const listEl = document.getElementById('todo-list');
  const sortEl = document.getElementById('todo-sort');

  // ── Persistence ──────────────────────────────────────

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadSortOption() {
    return localStorage.getItem(SORT_STORAGE_KEY) || 'default';
  }

  function saveSortOption(option) {
    localStorage.setItem(SORT_STORAGE_KEY, option);
  }

  // ── Sort helpers ─────────────────────────────────────

  /**
   * Returns a shallow index array [0…n-1] sorted according to `option`.
   * Does NOT mutate tasks[].
   */
  function getSortedIndices(tasks, option) {
    const indices = tasks.map(function (_, i) { return i; });

    if (option === 'az') {
      indices.sort(function (a, b) {
        return tasks[a].text.toLowerCase().localeCompare(tasks[b].text.toLowerCase());
      });
    } else if (option === 'za') {
      indices.sort(function (a, b) {
        return tasks[b].text.toLowerCase().localeCompare(tasks[a].text.toLowerCase());
      });
    } else if (option === 'completed-last') {
      indices.sort(function (a, b) {
        return (tasks[a].done === tasks[b].done) ? 0 : tasks[a].done ? 1 : -1;
      });
    }
    // 'default' → natural insertion order; no-op

    return indices;
  }

  // ── Render ───────────────────────────────────────────

  function renderTasks(option) {
    // Fall back to current select value when option is omitted
    var sortOption = option !== undefined ? option : (sortEl ? sortEl.value : 'default');
    listEl.innerHTML = '';

    if (tasks.length === 0) {
      listEl.innerHTML = '<li class="empty-state">No tasks yet — add one above!</li>';
      return;
    }

    var indices = getSortedIndices(tasks, sortOption);

    indices.forEach(function (index) {
      var task = tasks[index];

      var li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.dataset.index = index;

      // Checkbox
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark task as ' + (task.done ? 'incomplete' : 'complete'));
      checkbox.addEventListener('change', function () { toggleDone(index); });

      // Label
      var label = document.createElement('span');
      label.className = 'task-label';
      label.textContent = task.text;

      // Actions container
      var actions = document.createElement('div');
      actions.className = 'task-actions';

      // Edit button
      var editBtn = document.createElement('button');
      editBtn.className = 'btn-icon';
      editBtn.title = 'Edit task';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.textContent = '✏️';

      // Delete button
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon delete-btn';
      deleteBtn.title = 'Delete task';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.textContent = '🗑️';

      // Wire buttons after both are declared so closures capture them
      editBtn.addEventListener('click', function () {
        startEdit(index, li, label, editBtn, deleteBtn);
      });
      deleteBtn.addEventListener('click', function () { deleteTask(index); });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(label);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  }

  // ── Core actions ─────────────────────────────────────

  function isDuplicate(text, taskList) {
    var normalised = text.trim().toLowerCase();
    return taskList.some(function (task) {
      return task.text.trim().toLowerCase() === normalised;
    });
  }

  function addTask(text) {
    if (isDuplicate(text, tasks)) {
      errorEl.textContent = 'Task already exists.';
      input.focus();
      return;
    }
    tasks.push({ text: text.trim(), done: false });
    saveTasks(tasks);
    renderTasks();
  }

  function toggleDone(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks(tasks);
    renderTasks();
  }

  function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
  }

  function startEdit(index, li, labelEl, editBtn, deleteBtn) {  // eslint-disable-line no-unused-vars
    // Replace label <span> with an inline <input>
    var editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = tasks[index].text;
    editInput.maxLength = 200;

    li.replaceChild(editInput, labelEl);
    editInput.focus();
    editInput.select();

    // Swap edit button icon to save
    editBtn.textContent = '💾';
    editBtn.title = 'Save task';
    editBtn.setAttribute('aria-label', 'Save task');

    function save() {
      var newText = editInput.value.trim();
      if (newText.length > 0) {
        tasks[index].text = newText;
        saveTasks(tasks);
      }
      // Empty input → discard; re-render restores original text
      renderTasks();
    }

    // Override the click handler so the save icon commits the edit
    editBtn.onclick = save;

    editInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { renderTasks(); }           // discard
    });

    // Commit on blur (150 ms delay lets a save-button click fire first)
    editInput.addEventListener('blur', function () {
      setTimeout(save, 150);
    });
  }

  // ── Form wiring ──────────────────────────────────────

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();

    if (!text) {
      errorEl.textContent = 'Please enter a task name.';
      input.focus();
      return;
    }

    errorEl.textContent = '';
    addTask(text);
    input.value = '';
    input.focus();
  });

  // Clear validation error as the user types
  input.addEventListener('input', function () {
    if (errorEl.textContent) errorEl.textContent = '';
  });

  // ── Initialise ───────────────────────────────────────

  var tasks = loadTasks();

  // Restore persisted sort selection
  var savedSort = loadSortOption();
  if (sortEl) sortEl.value = savedSort;

  // Wire sort control
  if (sortEl) {
    sortEl.addEventListener('change', function () {
      saveSortOption(sortEl.value);
      renderTasks(sortEl.value);
    });
  }

  renderTasks(savedSort);
})();


/* ─────────────────────────────────────────────────────
   4. QUICK LINKS — initLinks()
   ───────────────────────────────────────────────────── */
(function initLinks() {
  const STORAGE_KEY = 'dashboard_links';

  const form = document.getElementById('link-form');
  const labelInput = document.getElementById('link-label');
  const urlInput = document.getElementById('link-url');
  const errorEl = document.getElementById('link-error');
  const gridEl = document.getElementById('links-grid');

  // ── Persistence ──────────────────────────────────────

  /** Reads persisted links from localStorage; returns [] on any error. */
  function loadLinks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  /** Serialises and writes the current links array to localStorage. */
  function saveLinks(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }

  let links = loadLinks();

  // ── Validation ───────────────────────────────────────

  /**
   * Returns true only when value parses as a URL with http: or https: protocol.
   * Any other value (missing protocol, ftp:, data:, …) returns false.
   */
  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // ── Render ───────────────────────────────────────────

  /**
   * Rebuilds #links-grid from the current links[] array.
   * Each entry produces:
   *   <div class="link-chip">
   *     <a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>
   *     <button class="chip-delete" aria-label="Remove {label}">×</button>
   *   </div>
   */
  function renderLinks() {
    gridEl.innerHTML = '';

    if (links.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No links saved yet — add one above!';
      gridEl.appendChild(empty);
      return;
    }

    links.forEach(function (link, index) {
      const chip = document.createElement('div');
      chip.className = 'link-chip';

      // Anchor — opens in a new tab safely
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;
      anchor.title = link.url;

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'chip-delete';
      deleteBtn.setAttribute('aria-label', 'Remove ' + link.label);
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', function () { deleteLink(index); });

      chip.appendChild(anchor);
      chip.appendChild(deleteBtn);
      gridEl.appendChild(chip);
    });
  }

  // ── Actions ──────────────────────────────────────────

  /**
   * Pushes a new link, persists, and re-renders.
   * @param {string} label - Display name (must be non-empty after trim)
   * @param {string} url   - Absolute http/https URL
   */
  function addLink(label, url) {
    links.push({ label: label.trim(), url: url.trim() });
    saveLinks(links);
    renderLinks();
  }

  /**
   * Removes the link at the given index, persists, and re-renders.
   * @param {number} index - Position in links[]
   */
  function deleteLink(index) {
    links.splice(index, 1);
    saveLinks(links);
    renderLinks();
  }

  // ── Form wiring ───────────────────────────────────────

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const label = labelInput.value.trim();
    const url = urlInput.value.trim();

    // Validate — label required
    if (!label) {
      errorEl.textContent = 'Please enter a label.';
      labelInput.focus();
      return;
    }

    // Validate — URL required and must be http/https
    if (!url || !isValidUrl(url)) {
      errorEl.textContent = 'Please enter a valid URL starting with http:// or https://';
      urlInput.focus();
      return;
    }

    errorEl.textContent = '';
    addLink(label, url);
    labelInput.value = '';
    urlInput.value = '';
    labelInput.focus();
  });

  // Clear error as the user types in either field
  [labelInput, urlInput].forEach(function (el) {
    el.addEventListener('input', function () {
      if (errorEl.textContent) errorEl.textContent = '';
    });
  });

  // Initial render
  renderLinks();
})();
