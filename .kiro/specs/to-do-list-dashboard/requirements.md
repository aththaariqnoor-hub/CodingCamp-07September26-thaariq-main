# Requirements Document

## Introduction

A personal productivity dashboard built as a plain HTML/CSS/JavaScript single-page website.
The dashboard brings together four widgets — a time-based greeting, a Pomodoro-style focus timer,
a persistent to-do list, and a quick-links launcher — in a clean, minimal interface that requires
no build tools, frameworks, or external dependencies.

## Glossary

- **Dashboard**: The single HTML page that hosts all four widgets.
- **Greeting_Widget**: The section that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The countdown timer widget set to 25 minutes by default.
- **Todo_List**: The widget that manages the user's task items.
- **Task**: A single to-do item that can be added, edited, marked complete, or deleted.
- **Quick_Links**: The widget that stores and displays user-defined URL shortcuts.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's built-in key-value persistence mechanism (`window.localStorage`).

---

## Requirements

### Requirement 1: Time and Greeting Display

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I immediately feel oriented and welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM:SS format, updating every second.
2. THE Greeting_Widget SHALL display the current local date in a human-readable format (e.g., "Monday, 7 July 2025").
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can time focused work sessions without leaving the dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise the countdown at 25 minutes (25:00) when the page loads.
2. WHEN the user activates the Start control, THE Focus_Timer SHALL count down one second at a time, updating the displayed MM:SS value each second.
3. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current value without resetting it.
4. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any running countdown and restore the display to 25:00.
5. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a browser alert notifying the user that the session is complete.
6. WHILE the timer is running, THE Focus_Timer SHALL disable the Start control to prevent duplicate intervals.

---

### Requirement 3: To-Do List Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks that persist across browser sessions, so that I can track my work without losing data on page refresh.

#### Acceptance Criteria

1. WHEN the user submits the task-input field with a non-empty value, THE Todo_List SHALL add a new Task and display it in the list.
2. IF the task-input field is empty when submitted, THEN THE Todo_List SHALL not add a Task and SHALL display an inline validation message prompting the user to enter a task name.
3. WHEN the user activates the complete toggle on a Task, THE Todo_List SHALL mark the Task as done and apply a visual completed style (e.g., strikethrough text).
4. WHEN the user activates the complete toggle on an already-completed Task, THE Todo_List SHALL remove the completed style and restore the Task to an active state.
5. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list permanently.
6. WHEN the user activates the edit control on a Task, THE Todo_List SHALL allow the user to modify the Task's text inline and save the updated value.
7. WHEN a Task is added, updated, or removed, THE Todo_List SHALL write the current task array to Local_Storage so that the data persists across page reloads.
8. WHEN the Dashboard loads, THE Todo_List SHALL read any previously saved tasks from Local_Storage and render them.

---

### Requirement 4: Quick Links Management

**User Story:** As a user, I want to save and launch favourite website shortcuts from the dashboard, so that I can open frequently visited pages in one click without manually typing URLs.

#### Acceptance Criteria

1. WHEN the user submits the add-link form with both a label and a valid URL, THE Quick_Links widget SHALL add a new Link and display it as a clickable button.
2. IF the label or URL field is empty when submitted, THEN THE Quick_Links widget SHALL not add a Link and SHALL display an inline validation message.
3. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the corresponding URL in a new browser tab.
4. WHEN the user activates the delete control on a Link, THE Quick_Links widget SHALL remove the Link from the display permanently.
5. WHEN a Link is added or removed, THE Quick_Links widget SHALL write the current links array to Local_Storage so that the data persists across page reloads.
6. WHEN the Dashboard loads, THE Quick_Links widget SHALL read any previously saved links from Local_Storage and render them.

---

### Requirement 5: Non-Functional — Simplicity

**User Story:** As a user, I want the dashboard to work immediately in any modern browser without installation, so that there is zero setup friction.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and vanilla JavaScript with no external frameworks, libraries, or build tools.
2. THE Dashboard SHALL load and function correctly by opening `index.html` directly in a modern browser (Chrome, Firefox, Edge, Safari) without a local server.

---

### Requirement 6: Non-Functional — Performance

**User Story:** As a user, I want the dashboard to respond instantly to my interactions so that I am not slowed down.

#### Acceptance Criteria

1. THE Dashboard SHALL complete its initial render within 1 second on a standard desktop browser with no network throttling.
2. WHEN the user interacts with any widget control, THE Dashboard SHALL reflect the updated state within 100 milliseconds.

---

### Requirement 7: Non-Functional — Visual Design

**User Story:** As a user, I want a clean, readable layout so that I can use the dashboard comfortably for extended periods.

#### Acceptance Criteria

1. THE Dashboard SHALL use a single CSS file located at `css/style.css`.
2. THE Dashboard SHALL maintain a clear visual hierarchy by grouping each widget in a visually distinct card.
3. THE Dashboard SHALL use a readable font size of at least 14 px for body text and at least 24 px for the primary time display.
4. THE Dashboard SHALL be responsive and remain usable on viewport widths from 320 px to 1920 px.

---

### Requirement 8: Light / Dark Mode

**User Story:** As a user, I want to toggle between a light theme and a dark theme, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control that switches the visual theme between light mode and dark mode.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected theme immediately without a page reload.
3. WHEN the user selects a theme, THE Dashboard SHALL write the chosen theme value to Local_Storage so that the preference persists across page reloads.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved theme value from Local_Storage and apply it before rendering any content.
5. IF no theme preference has been saved, THEN THE Dashboard SHALL render in its default theme (light mode).

---

### Requirement 9: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so the greeting is personalised, so that the dashboard feels more welcoming and tailored to me.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide an input control that allows the user to enter their name.
2. WHEN the user enters a name and confirms it, THE Greeting_Widget SHALL incorporate the name into the greeting text (e.g., "Good Morning, Alex!").
3. WHEN the user saves a name, THE Greeting_Widget SHALL write the name value to Local_Storage so that it persists across page reloads.
4. WHEN the Dashboard loads and a saved name exists in Local_Storage, THE Greeting_Widget SHALL restore and display the personalised greeting using the saved name.
5. IF no name has been saved, THEN THE Greeting_Widget SHALL display the greeting without a name (e.g., "Good Morning").
6. IF the user clears the saved name, THEN THE Greeting_Widget SHALL revert to displaying the greeting without a name.

---

### Requirement 10: Custom Pomodoro Duration

**User Story:** As a user, I want to configure the focus timer duration, so that I can adapt the timer to work sessions of different lengths.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide a settings input that allows the user to set the timer duration in whole minutes within the range of 1 to 60 minutes inclusive.
2. WHEN the user saves a custom duration, THE Focus_Timer SHALL update the countdown default to the new duration and reset the display to the new value in MM:SS format.
3. WHEN the user saves a custom duration, THE Focus_Timer SHALL write the duration value to Local_Storage so that it persists across page reloads.
4. WHEN the Dashboard loads, THE Focus_Timer SHALL read the saved duration from Local_Storage and initialise the countdown to that value.
5. IF no custom duration has been saved, THEN THE Focus_Timer SHALL initialise at 25 minutes (25:00) as the default.
6. IF the user enters a value outside the 1–60 minute range, THEN THE Focus_Timer SHALL display an inline validation message and not update the timer duration.

---

### Requirement 11: Prevent Duplicate Tasks

**User Story:** As a user, I want the system to prevent me from adding a task that already exists, so that my task list stays clean and free of duplicates.

#### Acceptance Criteria

1. WHEN the user submits the task-input field, THE Todo_List SHALL compare the trimmed, case-insensitive input text against the text of all existing Tasks.
2. IF the submitted task text matches an existing Task text (case-insensitive, trimmed comparison), THEN THE Todo_List SHALL not add the Task and SHALL display an inline validation message indicating that the task already exists.
3. WHEN the duplicate-task validation message is displayed, THE Todo_List SHALL clear the message as soon as the user modifies the input field.

---

### Requirement 12: Sort Tasks

**User Story:** As a user, I want to sort my task list in different ways, so that I can quickly find and prioritise the tasks I need to work on.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a sort control that offers the following four sort options: (a) Default — insertion order, (b) A–Z — alphabetical ascending by task text, (c) Z–A — alphabetical descending by task text, (d) Completed Last — active tasks before completed tasks.
2. WHEN the user selects a sort option, THE Todo_List SHALL re-render the task list immediately using the selected order without modifying the underlying stored task array.
3. WHEN the user selects a sort option, THE Todo_List SHALL write the selected sort option value to Local_Storage so that it persists across page reloads.
4. WHEN the Dashboard loads, THE Todo_List SHALL read the saved sort option from Local_Storage and apply it when rendering the initial task list.
5. IF no sort preference has been saved, THEN THE Todo_List SHALL render tasks in the default insertion order.
