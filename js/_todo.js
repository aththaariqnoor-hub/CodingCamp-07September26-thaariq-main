/* ─────────────────────────────────────────────────────
   3. TO-DO LIST  — initTodo()
   Temporary staging file. Composed into js/app.js in task 11.1.
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
