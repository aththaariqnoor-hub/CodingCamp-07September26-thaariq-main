# Implementation Plan: To-Do List Dashboard

## Overview

Implement the Life Dashboard as three static files (`index.html`, `css/style.css`, `js/app.js`)
using only vanilla HTML, CSS, and JavaScript. The plan builds the four core widgets first, then
layers on the five extended features (Light/Dark Mode, Custom Name, Custom Pomodoro Duration,
Duplicate Prevention, Sort Tasks), and finally wires everything together with property-based and
unit tests.

---

## Tasks

- [x] 1. Scaffold static file structure and CSS foundations
  - [x] 1.1 Create `index.html` shell with four `<section class="card">` landmarks
    - Add `<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`, linked `css/style.css` and `js/app.js` (bottom of `<body>`)
    - Add four sections: `#greeting-card`, `#timer-card`, `#todo-card`, `#links-card`
    - Add theme toggle button `<button id="theme-toggle" aria-label="Switch to dark mode">🌙</button>` in the greeting card header row
    - Add greeting DOM nodes: `#greeting-text`, `#clock`, `#date-text`
    - Add name-editor DOM nodes: `#name-display`, `#name-edit-btn`, `<div class="name-editor" hidden>` containing `#name-input`, `#name-save-btn`, `#name-cancel-btn`
    - Add timer DOM nodes: `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`
    - Add timer-duration DOM nodes: `#timer-duration-input`, `#timer-duration-set`, `#timer-duration-error` (`aria-live="polite"`)
    - Add to-do DOM nodes: `#todo-form`, `#todo-input`, `#todo-error` (`aria-live="polite"`), sort row with `#todo-sort` (`<select>`), `#todo-list` (`<ul>`)
    - Add quick-links DOM nodes: `#link-form`, `#link-label`, `#link-url`, `#link-error` (`aria-live="polite"`), `#links-grid`
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 5.2, 7.1, 8.1, 9.1, 10.1, 12.1_

  - [x] 1.2 Write `css/style.css` with CSS custom properties, responsive grid, and all widget base styles
    - Define `:root` custom properties: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-primary`, `--color-primary-hover`, `--color-success`, `--color-danger`, `--color-shadow`
    - Add `[data-theme="dark"]` override block that flips all custom properties to dark-mode values (see design §CSS Additions)
    - Style `#theme-toggle` button (circular, `border-radius: 50%`, focus-visible ring)
    - Style `.name-editor` row and `#name-input` (flex, gap, hidden state via `[hidden]`)
    - Style `.todo-controls` row and `#todo-sort` select
    - Add responsive CSS grid for the four widget cards (320 px → 1920 px)
    - Set body-text `font-size ≥ 14px`; set `#clock` `font-size ≥ 24px`
    - _Requirements: 5.1, 7.1, 7.2, 7.3, 7.4, 8.1_

- [x] 2. Implement Theme IIFE (`initTheme`)
  - [x] 2.1 Write `initTheme()` IIFE in `js/app.js`
    - Implement `loadTheme()` → reads `"dashboard_theme"` from `localStorage`; defaults to `"light"`
    - Implement `saveTheme(theme)` → writes theme string to `localStorage`
    - Implement `applyTheme(theme)` → sets `document.documentElement.dataset.theme = theme`; updates `#theme-toggle` `aria-label` and icon (`🌙` / `☀️`)
    - Implement `toggleTheme()` → flips current theme, calls `applyTheme` + `saveTheme`
    - On IIFE entry: call `applyTheme(loadTheme())` immediately (before any other IIFE runs), then attach `click` listener on `#theme-toggle` → `toggleTheme()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 2.2 Write property test P14 — Theme toggle round-trip
    - **Property 14: Theme toggle is a true round-trip**
    - For any theme in `{"light","dark"}`: `applyTheme` sets `dataset.theme`; `saveTheme` + `loadTheme` round-trips; double-toggle returns original theme
    - Use `fc.constantFrom("light","dark")`
    - **Validates: Requirements 8.2, 8.3, 8.4**

  - [ ]* 2.3 Write unit tests U10 and U11 for theme defaults and restoration
    - **U10**: `loadTheme()` returns `"light"` when `localStorage` is empty
    - **U11**: `applyTheme` is called with the stored value before first paint (verify `dataset.theme` set on load)
    - _Requirements: 8.4, 8.5_

- [x] 3. Implement Greeting Widget IIFE (`initGreeting`)
  - [x] 3.1 Write core `initGreeting()` IIFE — clock, date, and greeting text
    - Implement `pad(n)` → zero-pads to 2 digits
    - Implement `getGreeting(hour, name)` → maps hour [0–23] to greeting text with optional `, {name}!` suffix
    - Implement `tick()` → reads `new Date()`, updates `#clock` (HH:MM:SS), `#date-text` (human-readable), `#greeting-text`
    - Call `setInterval(tick, 1000)` and call `tick()` once immediately
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 3.2 Extend `initGreeting()` with custom-name functionality
    - Implement `loadName()` → reads `"dashboard_username"` from `localStorage`; defaults to `""`
    - Implement `saveName(name)` → writes trimmed name (or `""`) to `localStorage`
    - Implement `applyName(name)` → updates `#name-display` visibility and text; regenerates greeting
    - Implement `showNameEditor()` / `hideNameEditor()` → toggles `[hidden]` on `.name-editor` row
    - Wire `#name-edit-btn` click → `showNameEditor()` + focus `#name-input` with current value
    - Wire `#name-save-btn` click and Enter keydown → trim, `saveName` + `applyName` + `hideNameEditor()`
    - Wire `#name-cancel-btn` click and Escape keydown → `hideNameEditor()` without saving
    - On IIFE startup: call `applyName(loadName())`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 3.3 Write property test P1 — Clock formatting always valid HH:MM:SS
    - **Property 1: Clock formatting is always valid HH:MM:SS**
    - `pad(h) + ":" + pad(m) + ":" + pad(s)` matches `/^\d{2}:\d{2}:\d{2}$/`
    - Use `fc.integer({min:0,max:23})`, `fc.integer({min:0,max:59})` ×2
    - **Validates: Requirements 1.1**

  - [ ]* 3.4 Write property test P2 — Date display contains all required components
    - **Property 2: Date display contains all required components**
    - Formatted date contains recognized day name, month name, numeric day, four-digit year
    - Use `fc.date()`
    - **Validates: Requirements 1.2**

  - [ ]* 3.5 Write property test P3 — Greeting covers all 24 hours without gaps or overlaps
    - **Property 3: Greeting covers all 24 hours without gaps or overlaps**
    - `getGreeting(hour)` returns exactly one of the four greeting strings for any hour in [0,23]
    - Use `fc.integer({min:0,max:23})`
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [ ]* 3.6 Write property test P15 — Personalised greeting always contains saved name
    - **Property 15: Personalised greeting always contains the saved name**
    - For any non-empty trimmed name + any hour: result contains `, {name}!`; empty name → no suffix
    - Use `fc.string({minLength:1}).filter(s=>s.trim().length>0)`, `fc.integer({min:0,max:23})`
    - **Validates: Requirements 9.2, 9.5, 9.6**

  - [ ]* 3.7 Write unit test U12 — No-name greeting default
    - **U12**: When `localStorage` name is absent, `getGreeting(hour,"")` contains no comma-name suffix
    - _Requirements: 9.5_

- [x] 4. Checkpoint — Greeting and theme foundations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Focus Timer IIFE (`initTimer`)
  - [x] 5.1 Write core `initTimer()` IIFE — countdown, start/stop/reset
    - Declare state: `remaining`, `intervalId`, `totalSeconds`
    - Implement `formatTime(secs)` → `"MM:SS"` string
    - Implement `render()`, `setRunning(bool)`, `start()`, `stop()`, `reset()`
    - `start()`: clears existing interval, starts new 1-second interval; decrements `remaining`; calls `render()`; on `remaining === 0` clears interval and schedules `window.alert()` via `setTimeout(..., 50)`
    - `stop()`: clears interval, calls `setRunning(false)`
    - `reset()`: calls `stop()`, restores `remaining = totalSeconds`, calls `render()`
    - Wire `#timer-start` → `start()`, `#timer-stop` → `stop()`, `#timer-reset` → `reset()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 5.2 Extend `initTimer()` with custom Pomodoro duration
    - Implement `loadDuration()` → reads `"dashboard_timer_duration"`; defaults to `25`
    - Implement `saveDuration(minutes)` → writes integer minutes to `localStorage`
    - Implement `applyDuration(minutes)` → sets `totalSeconds = minutes * 60`, calls `reset()`; updates `#timer-duration-input` placeholder to current duration
    - Implement `validateAndSetDuration()` → reads `#timer-duration-input`; validates whole number in [1,60]; on valid: clears `#timer-duration-error`, calls `saveDuration` + `applyDuration`; on invalid: shows error message, leaves state unchanged
    - Wire `#timer-duration-set` click and Enter keydown on `#timer-duration-input` → `validateAndSetDuration()`
    - On IIFE startup: call `applyDuration(loadDuration())`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 5.3 Write property test P4 — Timer formatting always valid MM:SS
    - **Property 4: Timer formatting is always valid MM:SS**
    - `formatTime(secs)` matches `/^\d{2}:\d{2}$/`; minutes = `Math.floor(secs/60)`, seconds = `secs%60`
    - Use `fc.integer({min:0,max:1500})`
    - **Validates: Requirements 2.2**

  - [ ]* 5.4 Write property test P16 — Custom Pomodoro duration validation and application
    - **Property 16: Custom Pomodoro duration validation and application**
    - Valid `m` in [1,60]: `applyDuration(m)` sets `totalSeconds === m*60`; `formatTime(totalSeconds)` matches `/^\d{2}:00$/`
    - Invalid `m` outside [1,60]: `validateAndSetDuration()` leaves `totalSeconds` unchanged and sets `#timer-duration-error` to non-empty
    - Use `fc.integer({min:1,max:60})` + `fc.integer().filter(m=>m<1||m>60)`
    - **Validates: Requirements 10.2, 10.6**

  - [ ]* 5.5 Write unit tests U1–U5 and U13/U14 for timer behaviour
    - **U1**: `remaining === 1500`, display `"25:00"` on init
    - **U2**: Start disables `#timer-start` button
    - **U3**: Stop leaves `remaining` unchanged
    - **U4**: Reset restores display to current `totalSeconds`
    - **U5**: `window.alert` called when `remaining` hits 0
    - **U13**: `loadDuration()` returns `25` when `localStorage` is empty
    - **U14**: `applyDuration(30)` → display shows `"30:00"`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.4, 10.5_

- [x] 6. Checkpoint — Timer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement To-Do List IIFE (`initTodo`)
  - [x] 7.1 Write core `initTodo()` IIFE — add, toggle, delete, edit, persistence
    - Declare `tasks` array; load from `loadTasks()` on startup
    - Implement `loadTasks()` → `JSON.parse` from `"dashboard_todos"`, falls back to `[]` on error
    - Implement `saveTasks(tasks)` → `JSON.stringify` to `localStorage`
    - Implement `addTask(text)` → validate non-empty; push `{text:text.trim(),done:false}`; `saveTasks`; `renderTasks()`
    - Implement `toggleDone(index)` → flip `tasks[i].done`; `saveTasks`; `renderTasks()`
    - Implement `deleteTask(index)` → `splice`; `saveTasks`; `renderTasks()`
    - Implement `startEdit(index, ...)` → replace `<span class="task-label">` with `<input class="task-edit-input">`; wire save on Enter/blur/button; save trims and calls `saveTasks` + `renderTasks()`; empty edit discards and re-renders original
    - Implement `renderTasks(option?)` → build list from `tasks[]` using display-order indices
    - Wire `#todo-form` submit → trim input, validate, `addTask`; show `#todo-error` on empty; clear error on `#todo-input` `input` event
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 7.2 Add duplicate-task prevention to `initTodo()`
    - Implement `isDuplicate(text, tasks)` → `true` if `text.trim().toLowerCase()` matches any `tasks[i].text.trim().toLowerCase()`
    - In `addTask(text)`: after empty-check, call `isDuplicate`; if match, show `#todo-error` `"Task already exists."` and return early without modifying `tasks[]`
    - Clear `#todo-error` on the `input` event of `#todo-input` (covers both empty and duplicate messages)
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 7.3 Add sort functionality to `initTodo()`
    - Implement `loadSortOption()` → reads `"dashboard_task_sort"`; defaults to `"default"`
    - Implement `saveSortOption(option)` → writes to `localStorage`
    - Implement `getSortedIndices(tasks, option)` → returns index permutation `[0…n-1]` without mutating `tasks[]`:
      - `"default"` → natural order
      - `"az"` → ascending by `text.toLowerCase()`
      - `"za"` → descending by `text.toLowerCase()`
      - `"completed-last"` → active indices first, then completed
    - Extend `renderTasks(option?)` to call `getSortedIndices` and iterate in that order
    - On IIFE startup: read `loadSortOption()`, set `#todo-sort` value, call `renderTasks(option)`
    - Wire `#todo-sort` `change` event → `saveSortOption` + `renderTasks(option)`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 7.4 Write property test P5 — Adding a valid task always grows the list by exactly one
    - **Property 5: Adding a valid task always grows the list by exactly one**
    - `addTask(text)` increases `tasks.length` by 1; last element has correct `text` and `done:false`
    - Use `fc.array(taskArb)`, `fc.string({minLength:1}).filter(s=>s.trim().length>0)`
    - **Validates: Requirements 3.1**

  - [ ]* 7.5 Write property test P6 — Whitespace-only input is always rejected
    - **Property 6: Whitespace-only input is always rejected**
    - Whitespace-only string leaves `tasks.length` unchanged
    - Use `fc.string({minLength:1}).map(s=>s.replace(/\S/g,''))`
    - **Validates: Requirements 3.2**

  - [ ]* 7.6 Write property test P7 — Toggle done is a true round-trip
    - **Property 7: Toggle done is a true round-trip (idempotence)**
    - `toggleDone(i)` twice returns `tasks[i].done` to original value
    - Use `fc.array(taskArb,{minLength:1})`, `fc.nat()` (modulo length for valid index)
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 7.7 Write property test P8 — Deleting a task shrinks the list by exactly one
    - **Property 8: Deleting a task always shrinks the list by exactly one**
    - `deleteTask(i)` → `tasks.length === n-1` for any valid index
    - Use `fc.array(taskArb,{minLength:1})`, `fc.nat()`
    - **Validates: Requirements 3.5**

  - [ ]* 7.8 Write property test P9 — Task text edit always updates to saved value
    - **Property 9: Task text edit always updates to the saved value**
    - After save path: `tasks[i].text === newText`
    - Use `fc.array(taskArb,{minLength:1})`, `fc.nat()`, `fc.string({minLength:1}).filter(s=>s.trim().length>0)`
    - **Validates: Requirements 3.6**

  - [ ]* 7.9 Write property test P10 — Tasks localStorage round-trip preserves all data
    - **Property 10: Tasks localStorage round-trip preserves all data**
    - `saveTasks(arr)` then `loadTasks()` → deep-equal array
    - Use `fc.array(taskArb)`
    - **Validates: Requirements 3.7, 3.8**

  - [ ]* 7.10 Write property test P17 — Duplicate task is always rejected
    - **Property 17: Duplicate task is always rejected**
    - Case/whitespace variant of existing task text → `tasks.length` unchanged; `#todo-error` non-empty
    - Use `fc.array(taskArb,{minLength:1})`, `fc.nat()` (pick existing index), case-variant generator
    - **Validates: Requirements 11.1, 11.2**

  - [ ]* 7.11 Write property test P18 — Sort is non-destructive (insertion order preserved)
    - **Property 18: Sort is non-destructive — insertion order is always preserved**
    - After `renderTasks(option)`, `tasks[i]` at every index equals pre-call value; `getSortedIndices` returns a permutation of `[0…n-1]`
    - Use `fc.array(taskArb)`, `fc.constantFrom("default","az","za","completed-last")`
    - **Validates: Requirements 12.2**

  - [ ]* 7.12 Write unit tests U9, U15, U16, U17 for to-do edge cases
    - **U9**: Edit with empty text discards → original task text preserved
    - **U15**: `#todo-error` cleared after typing in `#todo-input`
    - **U16**: `loadSortOption()` returns `"default"` when `localStorage` is empty
    - **U17**: After `saveSortOption("az")`, `loadSortOption()` returns `"az"`
    - _Requirements: 3.6, 11.3, 12.4, 12.5_

- [x] 8. Checkpoint — To-Do list complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Quick Links IIFE (`initLinks`)
  - [x] 9.1 Write `initLinks()` IIFE — add, delete, open in new tab, persistence
    - Declare `links` array; load from `loadLinks()` on startup
    - Implement `loadLinks()` → `JSON.parse` from `"dashboard_links"`, falls back to `[]`
    - Implement `saveLinks(links)` → `JSON.stringify` to `localStorage`
    - Implement `isValidUrl(value)` → `new URL(value)` succeeds and protocol is `http:` or `https:`
    - Implement `addLink(label, url)` → push `{label:label.trim(),url}`; `saveLinks`; `renderLinks()`
    - Implement `deleteLink(index)` → `splice`; `saveLinks`; `renderLinks()`
    - Implement `renderLinks()` → rebuild `#links-grid` with `.link-chip` elements: `<a href target="_blank" rel="noopener noreferrer">` + `<button class="chip-delete">`
    - Wire `#link-form` submit → validate label (non-empty) and URL (`isValidUrl`); show `#link-error` on failure; clear error on `input` events
    - On startup: call `renderLinks()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 9.2 Write property test P11 — Adding a valid link always grows the list by exactly one
    - **Property 11: Adding a valid link always grows the list by exactly one**
    - `addLink(label,url)` → `links.length` increases by 1; new entry has correct `label` and `url`
    - Use `fc.array(linkArb)`, `fc.string({minLength:1})`, valid-URL generator
    - **Validates: Requirements 4.1**

  - [ ]* 9.3 Write property test P12 — Deleting a link shrinks the list by exactly one
    - **Property 12: Deleting a link always shrinks the list by exactly one**
    - `deleteLink(i)` → `links.length === n-1`
    - Use `fc.array(linkArb,{minLength:1})`, `fc.nat()`
    - **Validates: Requirements 4.4**

  - [ ]* 9.4 Write property test P13 — Links localStorage round-trip preserves all data
    - **Property 13: Links localStorage round-trip preserves all data**
    - `saveLinks(arr)` then `loadLinks()` → deep-equal array
    - Use `fc.array(linkArb)`
    - **Validates: Requirements 4.5, 4.6**

  - [ ]* 9.5 Write unit tests U6, U7, U8 for quick-links behaviour
    - **U6**: Rendered anchor has `target="_blank"` and `rel="noopener noreferrer"`
    - **U7**: Empty label → error displayed, `links` array unchanged
    - **U8**: Invalid URL → error displayed, `links` array unchanged
    - _Requirements: 4.2, 4.3_

- [x] 10. Checkpoint — Quick links complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Wire all IIFEs together and integrate into `js/app.js`
  - [x] 11.1 Compose final `js/app.js` — order and wrap all IIFEs
    - Ensure `initTheme()` is the **first** IIFE executed (prevents flash of wrong colour scheme)
    - Follow with `initGreeting()`, `initTimer()`, `initTodo()`, `initLinks()` in that order
    - Declare shared pure helpers (`pad`, etc.) at module scope only if referenced by more than one IIFE; otherwise keep them inside the relevant IIFE
    - Verify no `import`, `require`, or CDN `<script>` references in the file
    - _Requirements: 5.1, 5.2, 8.4_

  - [x] 11.2 Final integration verification — cross-cutting checks
    - Confirm `initTheme` fires before any widget paints (check script placement at bottom of `<body>`)
    - Confirm `localStorage` reads are wrapped in `try/catch` in `loadTasks()` and `loadLinks()`
    - Confirm all `aria-live="polite"` attributes present on error elements
    - Confirm all link anchors carry `rel="noopener noreferrer"`
    - Confirm no inline `style` attributes; all styling via `css/style.css` custom properties
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1_

- [x] 12. Final checkpoint — all tests pass and the dashboard is complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) (Node, no framework needed); run with `node --test` or any test runner
- Unit tests cover concrete scenarios that property tests do not address (specific defaults, DOM state, alert behaviour)
- Checkpoints at Tasks 4, 6, 8, 10, and 12 ensure incremental validation
- `initTheme()` MUST be placed first in `js/app.js` to prevent a flash of the wrong colour scheme before the page renders

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "7.1", "9.1"] },
    { "id": 2, "tasks": ["3.2", "5.2", "7.2", "7.3"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.3", "3.4", "3.5", "5.3", "7.4", "7.5", "9.2", "9.3", "9.4"] },
    { "id": 4, "tasks": ["3.6", "3.7", "5.4", "5.5", "7.6", "7.7", "7.8", "7.9", "9.5"] },
    { "id": 5, "tasks": ["7.10", "7.11", "7.12"] },
    { "id": 6, "tasks": ["11.1"] },
    { "id": 7, "tasks": ["11.2"] }
  ]
}
```
