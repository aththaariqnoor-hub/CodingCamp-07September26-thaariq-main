/* ─────────────────────────────────────────────────────
   GREETING WIDGET — initGreeting() IIFE
   Task 3.1: clock, date, and greeting text
   Task 3.2: custom-name functionality (stubs wired here)
   ───────────────────────────────────────────────────── */
(function initGreeting() {

  /* ── DOM nodes ── */
  var greetingEl   = document.getElementById('greeting-text');
  var clockEl      = document.getElementById('clock');
  var dateEl       = document.getElementById('date-text');
  var nameDisplay  = document.getElementById('name-display');
  var nameEditBtn  = document.getElementById('name-edit-btn');
  var nameEditor   = document.querySelector('.name-editor');
  var nameInput    = document.getElementById('name-input');
  var nameSaveBtn  = document.getElementById('name-save-btn');
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
    if (hour >= 5  && hour <= 11) { base = 'Good Morning'; }
    else if (hour >= 12 && hour <= 17) { base = 'Good Afternoon'; }
    else if (hour >= 18 && hour <= 20) { base = 'Good Evening'; }
    else                                { base = 'Good Night'; }

    var trimmed = (name || '').trim();
    return trimmed.length > 0 ? base + ', ' + trimmed + '!' : base;
  }

  /* ── Clock / date / greeting tick ── */

  /**
   * Reads the current time and refreshes the clock, date, and greeting DOM nodes.
   * Called once immediately and then every 1 000 ms via setInterval.
   */
  function tick() {
    var now  = new Date();
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
      nameDisplay.hidden      = false;
    } else {
      nameDisplay.textContent = '';
      nameDisplay.hidden      = true;
    }
    // Regenerate greeting right away (tick() will also keep it live)
    var hour = new Date().getHours();
    greetingEl.textContent = getGreeting(hour, trimmed);
  }

  /* ── Name editor show/hide ── */

  function showNameEditor() {
    nameEditor.hidden   = false;
    nameEditBtn.hidden  = true;
    nameInput.value     = loadName();
    nameInput.focus();
    nameInput.select();
  }

  function hideNameEditor() {
    nameEditor.hidden  = true;
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
