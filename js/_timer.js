/* ─────────────────────────────────────────────────────
   2. FOCUS TIMER  — initTimer()
   Task 5.1: core countdown, start / stop / reset
   Task 5.2: custom Pomodoro duration
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
