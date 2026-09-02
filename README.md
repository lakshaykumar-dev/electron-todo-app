# TaskFlow - Project Manager Desktop Application (Electron)

A modern desktop Project & Task Management application built with **Electron**, **HTML5**, **CSS3**, and **JavaScript**. Designed for project managers to organize workflows, assign tasks to projects, monitor completion rates, and meet milestones.

---

## ✨ Key Features

### 📁 Project Management
- **Create & Edit Projects**: Define project names, project descriptions/goals, custom accent colors, and target deadlines.
- **Project Switcher**: Instantly switch between projects in the sidebar to work within dedicated project scopes.
- **Project Progress Dashboard**: Real-time progress bars showing completion percentage and ratio (`X of Y tasks completed • Z%`).
- **Deadline Tracking**: Target deadlines with status badges.
- **Delete Project**: Confirmation modal with cascade cleanup of associated tasks.

### 📝 Project-Scoped Tasks
- **Context-Aware Quick Add**: The quick-add bar automatically assigns new tasks to whichever project is currently active.
- **Comprehensive Task Modal**: Set task title, detailed notes, priority (High, Medium, Low), due date, and assign to any project.
- **Interactive Checklists**: Animated checkmarks that update project health metrics in real-time.
- **Undo Deletion**: Instant toast notification with one-click undo if a task is deleted.
- **Clear Completed**: Archive or remove completed tasks per project or globally.

### 🔍 Unified Views & Search
- **Smart Views**:
  - **All Projects**: Consolidated list of all tasks across projects with color-coded project pills.
  - **Due Today**: High-priority deadline tracking for the day.
  - **High Priority**: Urgent deliverables needing immediate focus.
  - **Completed**: Archive of finished milestones.
- **Search & Sort**: Real-time keyword filter across titles, notes, and project names; sort by Priority, Due Date, or Creation time.

### 💻 Desktop Experience
- Frameless custom title bar with minimize, maximize/restore, and close buttons.
- Light and Dark mode toggle with persistent state.
- Keyboard shortcuts for power users.
- Local JSON persistence in the operating system's `userData` directory.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + N` | Open New Task modal |
| `Ctrl + P` | Open New Project modal |
| `Ctrl + F` | Jump to search input |
| `Enter` | Submit quick task / save modal |
| `Escape` | Close any open modal |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm start
```

### 3. Build Windows Executable (.exe)
You can double-click **`build-exe.bat`** directly from File Explorer, or run:
```bash
npm run package:win
```
The output `.exe` and standalone package will be created at:
`dist/TaskFlow-win32-x64/TaskFlow.exe`
