/* ─────────────────────────────────────────────────────
   4. QUICK LINKS — initLinks()
   Extracted IIFE for composition into app.js (task 11.1)
   Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   ───────────────────────────────────────────────────── */
(function initLinks() {
  const STORAGE_KEY = 'dashboard_links';

  const form       = document.getElementById('link-form');
  const labelInput = document.getElementById('link-label');
  const urlInput   = document.getElementById('link-url');
  const errorEl    = document.getElementById('link-error');
  const gridEl     = document.getElementById('links-grid');

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
    const url   = urlInput.value.trim();

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
