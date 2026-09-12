# Design Document

## To-Do List Life Dashboard

---

## Overview

The Life Dashboard is a single-page, zero-dependency web application delivered as three static
files: `index.html`, `css/style.css`, and `js/app.js`. It combines four self-contained widgets —
a live greeting, a Pomodoro-style focus timer, a persistent to-do list, and a quick-links launcher
— into one minimal, responsive layout that runs directly from the file system with no build step
or server.

Because the project deliberately avoids frameworks and build tools, the design centres on:
- **Plain DOM APIs** for all rendering (no virtual DOM, no templating engine)
- **IIFE modules** to scope each widget's state without a module bundler
- **`window.localStorage`** for persistence (synchronous, always available, no server required)
- **CSS custom properties** for theming and a consistent visual language

---

## Architecture

### High-Level Structure

```
index.html          ← static shell; defines four <section class="card"> landmarks
css/style.css       ← single stylesheet; CSS custom properties + responsive grid
js/app.js           ← single script; four IIFEs, one per widget
```

### Execution Model

The browser parses `index.html` top-to-bottom. The `<script src="js/app.js">` tag sits at the
bottom of `<body>`, so the DOM is ready when the script executes — no `DOMContentLoaded` listener
required.

Each widget is an IIFE (Immediately Invoked Function Expression) that:
1. Queries its DOM nodes once at startup
2. Loads persisted data from `localStorage` (where applicable)
3. Renders the initial state
4. Attaches event listeners

No widget shares mutable state with another. Cross-cutting concerns (e.g., `pad()` for zero-padded
numbers) are expressed as small pure functions declared inside the relevant IIFE.

### Data Flow

```
User Interaction
      │
      ▼
Event Listener (in IIFE)
      │
      ├─► Pure logic function (addTask, toggleDone, formatTime, …)
      │         │
      │         ▼
      │     Mutate in-memory array / counter
      │
      ├─► saveTasks() / saveLinks()  ──► localStorage.setItem(key, JSON)
      │
      └─► renderTasks() / renderLinks()  ──► innerHTML / createElement DOM updates
```

On page load:
```
localStorage.getItem(key) ──JSON.parse──► in-memory array ──► render()
```

---

## Components and Interfaces

### 0. Theme — `initTheme()`

This IIFE runs **before all other IIFEs** so the correct theme is applied before the browser
paints any widget content, preventing a flash of the wrong colour scheme.

**DOM nodes queried:**
| ID | Role |
|----|------|
| `#theme-toggle` | Button that switches between light and dark mode |

**Internal functions:**

```js
loadTheme()           → "light" | "dark"   // reads "dashboard_theme" from localStorage; defaults to "light"
saveTheme(theme)      → void               // writes theme string to localStorage
applyTheme(theme)     → void               // sets document.documentElement.dataset.theme = theme
                                            // and updates #theme-toggle label/icon
toggleTheme()         → void               // reads current theme, flips it, calls applyTheme + saveTheme
```

**Lifecycle:**
1. On IIFE entry, call `applyTheme(loadTheme())` immediately.
2. Attach `click` listener on `#theme-toggle` → `toggleTheme()`.

**HTML structure (in `index.html`):**
```html
<button id="theme-toggle" aria-label="Switch to dark mode">🌙</button>
```
The button lives in the header or greeting card. `applyTheme` updates the `aria-label` and icon
character (`🌙` for dark, `☀️` for light).

---

### 1. Greeting Widget — `initGreeting()`

**DOM nodes queried:**
| ID | Role |
|----|------|
| `#greeting-text` | Time-of-day greeting label |
| `#clock` | HH:MM:SS live clock |
| `#date-text` | Human-readable date |
| `#name-display` | `<span>` showing the current saved name (hidden when empty) |
| `#name-edit-btn` | Pencil icon button that opens the name input |
| `#name-input` | Text `<input>` for entering / updating the name |
| `#name-save-btn` | Confirm button (✓) that saves the name |
| `#name-cancel-btn` | Cancel button (✕) that discards the edit |

**Internal functions:**

```js
pad(n)                  → String   // zero-pads a number to 2 digits
getGreeting(hour, name) → String   // maps hour [0–23] to greeting text + optional ", {name}!"
tick()                  → void     // reads Date(), updates clock, date, and greeting nodes
loadName()              → String   // reads "dashboard_username" from localStorage; defaults to ""
saveName(name)          → void     // writes trimmed name string (or "") to localStorage
applyName(name)         → void     // updates #name-display and regenerates greeting text
showNameEditor()        → void     // reveals #name-input row, hides display span + edit btn
hideNameEditor()        → void     // hides #name-input row, shows display span + edit btn
```

**Name edit flow:**
1. User clicks `#name-edit-btn` → `showNameEditor()` focuses `#name-input` with current value.
2. User clicks `#name-save-btn` or presses Enter → trims input; calls `saveName` + `applyName`;
   calls `hideNameEditor()`.
3. User clicks `#name-cancel-btn` or presses Escape → calls `hideNameEditor()` without saving.
4. Clearing the input and saving stores `""` and reverts to nameless greeting.

**Lifecycle:** After `setInterval(tick, 1000)`, call `applyName(loadName())` to render the
persisted name on load.

---

### 2. Focus Timer — `initTimer()`

**DOM nodes queried:**
| ID | Role |
|----|------|
| `#timer-display` | MM:SS countdown display |
| `#timer-start` | Start button |
| `#timer-stop` | Stop button |
| `#timer-reset` | Reset button |
| `#timer-duration-input` | Number input for custom duration (1–60 min) |
| `#timer-duration-set` | "Set" button that saves and applies the custom duration |
| `#timer-duration-error` | Inline validation message (`aria-live="polite"`) |

**State variables:**
```js
remaining    : number        // seconds left; initialised from saved or default duration
intervalId   : number | null // setInterval handle; null when stopped
totalSeconds : number        // canonical full duration (saved value × 60; default 1500)
```

**Internal functions:**
```js
formatTime(secs)          → String   // converts seconds to "MM:SS"
render()                  → void     // writes formatTime(remaining) to display
setRunning(bool)          → void     // enables/disables start button
start()                   → void     // clears existing interval, starts new one
stop()                    → void     // clears interval, sets running(false)
reset()                   → void     // calls stop(), restores remaining to totalSeconds
loadDuration()            → number   // reads "dashboard_timer_duration"; defaults to 25
saveDuration(minutes)     → void     // writes integer minutes to localStorage
applyDuration(minutes)    → void     // sets totalSeconds = minutes * 60, calls reset()
validateAndSetDuration()  → void     // reads #timer-duration-input; validates [1,60];
                                      // on valid: clears error, calls saveDuration + applyDuration
                                      // on invalid: shows #timer-duration-error, leaves state unchanged
```

**Custom duration flow:**
1. `initTimer()` reads `loadDuration()` on startup and calls `applyDuration()` to set
   `totalSeconds` and initialise the display.
2. User types in `#timer-duration-input` and clicks `#timer-duration-set` (or presses Enter
   on the input) → `validateAndSetDuration()` runs.
3. If the value is a whole number outside [1, 60], `#timer-duration-error` shows
   "Please enter a whole number between 1 and 60." and the timer is **not** changed.
4. If valid, error is cleared, `saveDuration` persists the value, `applyDuration` updates
   `totalSeconds`, and `reset()` restores the display to the new duration.
5. The `#timer-duration-input` shows the currently active duration as its placeholder.

**Completion path:** When `remaining` reaches 0, the interval is cleared and a
`setTimeout(..., 50)` schedules a `window.alert()` so the display updates before
the alert blocks the main thread.

---

### 3. To-Do List — `initTodo()`

**DOM nodes queried:**
| ID | Role |
|----|------|
| `#todo-form` | Form wrapping input + Add button |
| `#todo-input` | Task text input |
| `#todo-error` | Inline validation message (`aria-live="polite"`) |
| `#todo-list` | `<ul>` task list container |
| `#todo-sort` | `<select>` with four sort options |

**Task data model:**
```js
{ text: String, done: Boolean }
```

**`localStorage` key:** `"dashboard_todos"` (array), `"dashboard_task_sort"` (sort option)

**Internal functions:**
```js
loadTasks()                     → Task[]     // JSON.parse from storage, falls back to []
saveTasks(tasks)                → void       // JSON.stringify to storage
isDuplicate(text, tasks)        → boolean    // true if trimmed/lowercased text matches any task
addTask(text)                   → void       // duplicate-check, then push, save, render
toggleDone(index)               → void       // flip .done, save, render
deleteTask(index)               → void       // splice, save, render
startEdit(index, ...)           → void       // replace <span> with <input>, wire save/blur/keydown
loadSortOption()                → string     // reads "dashboard_task_sort"; defaults to "default"
saveSortOption(option)          → void       // writes sort option to localStorage
getSortedIndices(tasks, option) → number[]   // returns index array for display order;
                                              // does NOT mutate tasks[]
renderTasks(option?)            → void       // builds display-order indices via getSortedIndices,
                                              // then iterates to rebuild #todo-list; tasks[] untouched
```

**Duplicate check flow:**
1. On form submit, `addTask(text)` first calls `isDuplicate(text, tasks)`.
2. `isDuplicate` compares `text.trim().toLowerCase()` against every `tasks[i].text.trim().toLowerCase()`.
3. If a match is found, `#todo-error` shows "Task already exists." and the function returns early
   — `tasks[]` is **not** modified.
4. The error is cleared on the `input` event of `#todo-input` (already handled by existing guard).

**Sort flow:**
1. `initTodo()` reads `loadSortOption()` and sets `#todo-sort` value to match.
2. `#todo-sort` fires a `change` event → `saveSortOption(option)` persists the choice;
   `renderTasks(option)` re-renders immediately.
3. `getSortedIndices(tasks, option)` returns a shallow index array derived as:
   - `"default"` → `[0, 1, 2, …, n-1]`
   - `"az"` → indices sorted by `tasks[i].text.toLowerCase()` ascending
   - `"za"` → indices sorted by `tasks[i].text.toLowerCase()` descending
   - `"completed-last"` → active-task indices first, then completed-task indices
4. `renderTasks` iterates the index array to create DOM nodes; **the `tasks[]` reference is
   never reordered or mutated** by sorting.
1. `startEdit` replaces the `<span class="task-label">` with `<input class="task-edit-input">`
2. Edit button icon changes to 💾; its `onclick` is replaced with a `save()` closure
3. `save()` trims the new value; if non-empty, updates `tasks[index].text` and calls `saveTasks`
4. `renderTasks()` is called on save, Enter key, and (with 150 ms delay) on blur

---

### 4. Quick Links — `initLinks()`

**DOM nodes queried:**
| ID | Role |
|----|------|
| `#link-form` | Form wrapping label + URL inputs + Save button |
| `#link-label` | Link label text input |
| `#link-url` | URL input (`type="url"`) |
| `#link-error` | Inline validation message (`aria-live="polite"`) |
| `#links-grid` | `<div>` chip container |

**Link data model:**
```js
{ label: String, url: String }
```

**`localStorage` key:** `"dashboard_links"`

**Internal functions:**
```js
loadLinks()          → Link[]    // JSON.parse from storage, falls back to []
saveLinks(links)     → void      // JSON.stringify to storage
isValidUrl(value)    → Boolean   // new URL(value) — accepts http: and https: only
addLink(label, url)  → void      // push, save, render
deleteLink(index)    → void      // splice, save, render
renderLinks()        → void      // rebuild #links-grid from links[]
```

**Rendered chip structure (per link):**
```html
<div class="link-chip">
  <a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>
  <button class="chip-delete" aria-label="Remove {label}">×</button>
</div>
```

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string}  text  - Task description (1–200 chars, trimmed)
 * @property {boolean} done  - Completion state
 */
```

**Constraints:**
- `text` must be non-empty after trimming whitespace
- `done` defaults to `false` on creation

**localStorage format:** `JSON.stringify(Task[])` under key `"dashboard_todos"`

---

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} label - Display name (1–50 chars, trimmed)
 * @property {string} url   - Absolute URL; protocol must be http: or https:
 */
```

**Constraints:**
- `label` must be non-empty after trimming
- `url` must pass `new URL()` construction with http/https protocol

**localStorage format:** `JSON.stringify(Link[])` under key `"dashboard_links"`

---

### Timer State (in-memory only, never persisted)

```js
remaining  : number   // [0, totalSeconds] inclusive
intervalId : number | null
totalSeconds : number  // derived from saved duration (default 1500)
```

---

### localStorage Key Reference

| Key | Widget | Value type | Default |
|-----|--------|-----------|---------|
| `"dashboard_todos"` | Todo_List | `JSON.stringify(Task[])` | `"[]"` |
| `"dashboard_links"` | Quick_Links | `JSON.stringify(Link[])` | `"[]"` |
| `"dashboard_theme"` | Theme | `"light"` \| `"dark"` | `"light"` |
| `"dashboard_username"` | Greeting_Widget | `string` (name) | `""` |
| `"dashboard_timer_duration"` | Focus_Timer | `string` (integer minutes, `"1"`–`"60"`) | `"25"` |
| `"dashboard_task_sort"` | Todo_List | `"default"` \| `"az"` \| `"za"` \| `"completed-last"` | `"default"` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a
system — essentially, a formal statement about what the system should do. Properties serve as the
bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Clock formatting is always valid HH:MM:SS

*For any* valid `Date` object, the `pad()` helper produces zero-padded two-digit strings, and
assembling hours, minutes, and seconds with it always yields a string matching the pattern
`/^\d{2}:\d{2}:\d{2}$/` where each segment is within its valid range.

**Validates: Requirements 1.1**

---

### Property 2: Date display contains all required components

*For any* valid `Date` object, the formatted date string must contain a recognized day name
(Sunday–Saturday), a recognized month name (January–December), the numeric day of the month,
and the four-digit year — i.e., all four components are present and correct.

**Validates: Requirements 1.2**

---

### Property 3: Greeting covers all 24 hours without gaps or overlaps

*For any* integer hour in [0, 23], `getGreeting(hour)` returns exactly one of
"Good Morning", "Good Afternoon", "Good Evening", or "Good Night", and the result is
consistent with the boundary rules: Morning for [5, 11], Afternoon for [12, 17],
Evening for [18, 20], Night for [21–23] and [0, 4].

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 4: Timer formatting is always valid MM:SS

*For any* integer `secs` in [0, 1500], `formatTime(secs)` produces a string matching
`/^\d{2}:\d{2}$/` where the minutes part equals `Math.floor(secs / 60)` (zero-padded)
and the seconds part equals `secs % 60` (zero-padded).

**Validates: Requirements 2.2**

---

### Property 5: Adding a valid task always grows the list by exactly one

*For any* tasks array of any length and any non-empty, non-whitespace-only string `text`,
calling `addTask(text)` results in `tasks.length` increasing by exactly 1 and
`tasks[tasks.length - 1].text === text.trim()` and `tasks[tasks.length - 1].done === false`.

**Validates: Requirements 3.1**

---

### Property 6: Whitespace-only input is always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines),
the validation guard must prevent task creation and leave the tasks array unchanged.

**Validates: Requirements 3.2**

---

### Property 7: Toggle done is a true round-trip (idempotence)

*For any* tasks array and valid index `i`, calling `toggleDone(i)` flips `tasks[i].done`
from its current state, and calling it a second time returns `tasks[i].done` to the
original value — i.e., `toggleDone(toggleDone(tasks, i), i)` is identity on the done flag.

**Validates: Requirements 3.3, 3.4**

---

### Property 8: Deleting a task always shrinks the list by exactly one

*For any* tasks array of length `n ≥ 1` and any valid index `i` in [0, n-1],
calling `deleteTask(i)` results in `tasks.length === n - 1`.

**Validates: Requirements 3.5**

---

### Property 9: Task text edit always updates to the saved value

*For any* tasks array, valid index `i`, and any non-empty trimmed string `newText`,
after the edit save path runs, `tasks[i].text === newText`.

**Validates: Requirements 3.6**

---

### Property 10: Tasks localStorage round-trip preserves all data

*For any* valid `Task[]` array, calling `saveTasks(arr)` followed immediately by
`loadTasks()` must return an array that is deep-equal to `arr` — i.e., same length,
same `text` and `done` values in the same order.

**Validates: Requirements 3.7, 3.8**

---

### Property 11: Adding a valid link always grows the list by exactly one

*For any* links array of any length, any non-empty label string, and any URL string
that passes `isValidUrl()`, calling `addLink(label, url)` results in `links.length`
increasing by exactly 1, with the new entry having `label` and `url` equal to the
trimmed inputs.

**Validates: Requirements 4.1**

---

### Property 12: Deleting a link always shrinks the list by exactly one

*For any* links array of length `n ≥ 1` and any valid index `i` in [0, n-1],
calling `deleteLink(i)` results in `links.length === n - 1`.

**Validates: Requirements 4.4**

---

### Property 13: Links localStorage round-trip preserves all data

*For any* valid `Link[]` array, calling `saveLinks(arr)` followed immediately by
`loadLinks()` must return an array that is deep-equal to `arr` — same length,
same `label` and `url` values in the same order.

**Validates: Requirements 4.5, 4.6**

---

### Property 14: Theme toggle is a true round-trip

*For any* theme value in `{"light", "dark"}`, calling `applyTheme(theme)` sets
`document.documentElement.dataset.theme` to exactly that value, and calling
`saveTheme(theme)` followed immediately by `loadTheme()` returns the same theme string.
Toggling twice returns to the original theme — i.e., `toggleTheme(toggleTheme(t)) === t`.

**Validates: Requirements 8.2, 8.3, 8.4**

---

### Property 15: Personalised greeting always contains the saved name

*For any* non-empty name string and *for any* integer hour in [0, 23],
`getGreeting(hour, name)` returns a string that contains the exact trimmed name
as a suffix (e.g., `", Alex!"`). When `name` is the empty string, the returned
greeting must **not** contain a comma-name suffix.

**Validates: Requirements 9.2, 9.5, 9.6**

---

### Property 16: Custom Pomodoro duration validation and application

*For any* integer `m` in [1, 60], calling `applyDuration(m)` sets `totalSeconds === m * 60`
and `formatTime(totalSeconds)` produces a string matching `/^\d{2}:00$/`.
*For any* integer `m` outside [1, 60] (i.e., `m < 1` or `m > 60`),
`validateAndSetDuration()` must leave `totalSeconds` unchanged and must set the
`#timer-duration-error` element to a non-empty message.

**Validates: Requirements 10.2, 10.6**

---

### Property 17: Duplicate task is always rejected

*For any* non-empty `Task[]` array and *for any* string that is a case or whitespace
variant of `tasks[i].text` for some index `i` (i.e., the trimmed, lowercased strings
are equal), calling `addTask(text)` must leave `tasks.length` unchanged — no new task
is pushed — and `#todo-error` must display a non-empty message.

**Validates: Requirements 11.1, 11.2**

---

### Property 18: Sort is non-destructive — insertion order is always preserved

*For any* `Task[]` array of length `n` and *for any* sort option in
`{"default", "az", "za", "completed-last"}`, calling `renderTasks(option)` must
leave the `tasks[]` reference array in its original insertion order — the element at
every index `i` before the call must equal the element at index `i` after the call.
`getSortedIndices(tasks, option)` must return a permutation of `[0, …, n-1]` without
modifying `tasks`.

**Validates: Requirements 12.2**

---

## Error Handling

### Input Validation

| Widget | Invalid condition | Behaviour |
|--------|-------------------|-----------|
| To-Do List | Empty / whitespace-only task | Show `#todo-error` inline message; do not add task; keep focus on input |
| To-Do List | Duplicate task (case-insensitive) | Show `#todo-error` "Task already exists."; do not add task |
| To-Do List | Edit saved with empty text | Discard edit; re-render original task text |
| Quick Links | Missing label or URL | Show `#link-error` inline message; do not add link |
| Quick Links | Non-http/https URL | Show `#link-error` specific message; focus URL input |
| Focus Timer | Duration outside [1, 60] | Show `#timer-duration-error` inline message; do not update timer |

Error messages are cleared as the user types (`input` event) and use `aria-live="polite"` so
screen readers announce them without interrupting the current action.

### localStorage Failures

Both `loadTasks()` and `loadLinks()` wrap `JSON.parse` in a `try/catch` and return `[]` on any
error (corrupt data, `localStorage` unavailable, quota exceeded on read). `saveTasks` and
`saveLinks` write synchronously; if `setItem` throws (e.g., storage quota exceeded), the
in-memory state is still correct for the current session — the user loses persistence silently.
This is acceptable for a local productivity tool with no critical data loss scenario.

### Timer Edge Cases

- **Double-start prevention:** `start()` checks `intervalId !== null` and returns early; the
  Start button is also disabled via `setRunning(true)`, providing defence-in-depth.
- **Alert timing:** A 50 ms `setTimeout` is used before `window.alert()` at session end, allowing
  the display to paint "00:00" before the blocking dialog appears.
- **Rapid stop/reset:** `stop()` always clears the interval before `reset()` restores state,
  preventing a race between the final tick and the reset.

---

## CSS Additions

### Dark Mode — `[data-theme="dark"]` Variable Block

The entire colour scheme is driven by CSS custom properties defined on `:root`.
A single overriding block scoped to `[data-theme="dark"]` on the `<html>` element
flips those properties without touching any component styles.

```css
/* css/style.css */

:root {
  --color-bg:       #f5f5f5;
  --color-surface:  #ffffff;
  --color-text:     #1a1a1a;
  --color-text-muted: #6b7280;
  --color-border:   #e5e7eb;
  --color-primary:  #3b82f6;
  --color-primary-hover: #2563eb;
  --color-success:  #10b981;
  --color-danger:   #ef4444;
  --color-shadow:   rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] {
  --color-bg:       #111827;
  --color-surface:  #1f2937;
  --color-text:     #f9fafb;
  --color-text-muted: #9ca3af;
  --color-border:   #374151;
  --color-primary:  #60a5fa;
  --color-primary-hover: #93c5fd;
  --color-success:  #34d399;
  --color-danger:   #f87171;
  --color-shadow:   rgba(0, 0, 0, 0.4);
}
```

All existing widget styles reference only the custom properties above — no hard-coded colour
values — so the dark theme is applied solely by toggling `data-theme` on `<html>`.

### Theme Toggle Button

The toggle button lives in the page header or the greeting card header row.

```css
#theme-toggle {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 2.25rem;
  height: 2.25rem;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background-color 0.2s, border-color 0.2s;
}

#theme-toggle:hover {
  background-color: var(--color-border);
}

#theme-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Name Editor Row

```css
.name-editor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

#name-input {
  flex: 1;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.9rem;
}

#name-input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/* Hide the editor by default; shown via JS class toggle */
.name-editor[hidden] { display: none; }
```

### Sort Control Row

```css
.todo-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

#todo-sort {
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
}
```

---

## Testing Strategy

### Dual Approach

This project uses a **dual testing approach**: example-based unit tests for specific
scenarios, states, and edge cases, combined with property-based tests for universal
invariants that should hold across all valid inputs.

### Property-Based Testing

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, runs in Node with no
framework dependency)

Each correctness property listed above maps to a single property-based test. Minimum
**100 iterations** per test (fast-check default). Each test is tagged with a comment:

```
// Feature: to-do-list-dashboard, Property N: <property text>
```

| Property | Generator inputs |
|----------|-----------------|
| P1 — Clock formatting | `fc.integer({min:0, max:23})`, `fc.integer({min:0, max:59})` ×2 |
| P2 — Date display | `fc.date()` |
| P3 — Greeting coverage | `fc.integer({min:0, max:23})` |
| P4 — Timer formatting | `fc.integer({min:0, max:1500})` |
| P5 — Add task grows list | `fc.array(taskArb)`, `fc.string({minLength:1}).filter(s => s.trim().length > 0)` |
| P6 — Whitespace rejection | `fc.string({minLength:1}).map(s => s.replace(/\S/g,''))` (whitespace-only) |
| P7 — Toggle round-trip | `fc.array(taskArb, {minLength:1})`, `fc.nat()` (index) |
| P8 — Delete shrinks list | `fc.array(taskArb, {minLength:1})`, `fc.nat()` (index) |
| P9 — Edit updates text | `fc.array(taskArb, {minLength:1})`, `fc.nat()`, `fc.string({minLength:1})` |
| P10 — Tasks round-trip | `fc.array(taskArb)` |
| P11 — Add link grows list | `fc.array(linkArb)`, `fc.string({minLength:1})`, valid URL generator |
| P12 — Delete link shrinks | `fc.array(linkArb, {minLength:1})`, `fc.nat()` |
| P13 — Links round-trip | `fc.array(linkArb)` |
| P14 — Theme round-trip | `fc.constantFrom("light", "dark")` |
| P15 — Personalised greeting | `fc.string({minLength:1}).filter(s => s.trim().length > 0)`, `fc.integer({min:0, max:23})` |
| P16 — Duration validation | `fc.integer({min:1, max:60})` (valid) + `fc.integer().filter(m => m < 1 \|\| m > 60)` (invalid) |
| P17 — Duplicate rejection | `fc.array(taskArb, {minLength:1})`, `fc.nat()` (pick existing index), case-variant generator |
| P18 — Non-destructive sort | `fc.array(taskArb)`, `fc.constantFrom("default","az","za","completed-last")` |

### Example-Based Unit Tests

These cover concrete scenarios that property tests don't address:

| # | Scenario | Assertion |
|---|----------|-----------|
| U1 | Timer initialises at 25:00 | `remaining === 1500`, display === "25:00" |
| U2 | Start disables Start button | `startBtn.disabled === true` after `start()` |
| U3 | Stop pauses at current value | `remaining` unchanged after `stop()` |
| U4 | Reset restores 25:00 from any state | `remaining === 1500` after `reset()` |
| U5 | Countdown to 00:00 fires alert | `window.alert` called when `remaining` hits 0 |
| U6 | Link opens in new tab | anchor has `target="_blank"` and `rel="noopener noreferrer"` |
| U7 | Empty label rejected | error message displayed, links array unchanged |
| U8 | Invalid URL rejected | error message displayed, links array unchanged |
| U9 | Edit with empty text discarded | original task text preserved |
| U10 | Default theme on first load | `loadTheme()` returns `"light"` when localStorage is empty |
| U11 | Saved theme restored on load | `applyTheme` called with stored value before first paint |
| U12 | No-name greeting default | greeting text has no comma-name suffix when localStorage name is absent |
| U13 | Duration default on first load | `loadDuration()` returns `25` when localStorage is empty |
| U14 | Duration resets display | after `applyDuration(30)`, display shows "30:00" |
| U15 | Duplicate message clears on input | `#todo-error` text is empty after typing in `#todo-input` |
| U16 | Default sort on first load | `loadSortOption()` returns `"default"` when localStorage is empty |
| U17 | Sort persisted across reload | after `saveSortOption("az")`, `loadSortOption()` returns `"az"` |

### Smoke Tests

Performed manually (or via Playwright opening `file://` URL):

- Dashboard loads in under 1 second on a standard desktop
- No console errors on initial load
- All five widgets visible at 320 px, 768 px, and 1920 px viewport widths
- Theme toggle button present and functional in the greeting card header
- No external network requests in the Network tab
- No `import` / `require` / CDN `<script>` tags in source
- Dark mode visually correct — all four widget cards use dark surface colour
