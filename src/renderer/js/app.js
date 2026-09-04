/**
 * TaskFlow - Project Manager Renderer Logic
 */

(function () {
  'use strict';

  // Application State
  const state = {
    projects: [],
    todos: [],
    urls: [],
    activeProjectId: null, // null when in global views
    activeView: 'all-projects', // 'all-projects', 'today', 'important', 'completed', 'project'
    activeTab: 'tasks', // 'tasks' | 'urls'
    searchQuery: '',
    sortBy: 'created-desc',
    theme: localStorage.getItem('taskflow-theme') || 'dark',
    lastDeleted: null,
    projectToDeleteId: null,
    pendingImportData: null,
    remindersEnabled: localStorage.getItem('taskflow-reminders') !== 'false',
    notifiedTasks: {},
    snoozedTasks: {}
  };

  // DOM Elements
  const elements = {
    // Window Controls
    minBtn: document.getElementById('minBtn'),
    maxBtn: document.getElementById('maxBtn'),
    closeBtn: document.getElementById('closeBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),

    // Sidebar & Navigation
    projectsList: document.getElementById('projectsList'),
    openNewProjectModalBtn: document.getElementById('openNewProjectModalBtn'),
    navItems: document.querySelectorAll('.nav-item[data-view]'),
    tabTasksBtn: document.getElementById('tabTasksBtn'),
    tabUrlsBtn: document.getElementById('tabUrlsBtn'),
    badgeAllProjects: document.getElementById('badgeAllProjects'),
    badgeToday: document.getElementById('badgeToday'),
    badgeImportant: document.getElementById('badgeImportant'),
    badgeCompleted: document.getElementById('badgeCompleted'),
    badgeUrls: document.getElementById('badgeUrls'),

    // Toolbar
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    openNewTaskModalBtn: document.getElementById('openNewTaskModalBtn'),

    // Project Banner
    bannerColorDot: document.getElementById('bannerColorDot'),
    bannerTitle: document.getElementById('bannerTitle'),
    bannerDesc: document.getElementById('bannerDesc'),
    projectActions: document.getElementById('projectActions'),
    editProjectBtn: document.getElementById('editProjectBtn'),
    deleteProjectBtn: document.getElementById('deleteProjectBtn'),
    bannerProgressPercent: document.getElementById('bannerProgressPercent'),
    bannerProgressBarFill: document.getElementById('bannerProgressBarFill'),
    bannerProgressRatio: document.getElementById('bannerProgressRatio'),
    bannerDeadlineWrap: document.getElementById('bannerDeadlineWrap'),
    bannerDeadlineText: document.getElementById('bannerDeadlineText'),

    toggleRemindersBtn: document.getElementById('toggleRemindersBtn'),

    // Main Sections
    tasksSection: document.getElementById('tasksSection'),
    urlsSection: document.getElementById('urlsSection'),

    // Quick Add Tasks
    quickAddForm: document.getElementById('quickAddForm'),
    quickAddInput: document.getElementById('quickAddInput'),
    quickAddDueDate: document.getElementById('quickAddDueDate'),
    quickAddDueTime: document.getElementById('quickAddDueTime'),

    // Task List
    taskSectionTitle: document.getElementById('taskSectionTitle'),
    taskCountBadge: document.getElementById('taskCountBadge'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateMsg: document.getElementById('emptyStateMsg'),
    emptyStateAddBtn: document.getElementById('emptyStateAddBtn'),

    // Quick Add Saved URLs
    quickAddUrlForm: document.getElementById('quickAddUrlForm'),
    quickAddUrlInput: document.getElementById('quickAddUrlInput'),
    quickAddUrlSubmitBtn: document.getElementById('quickAddUrlSubmitBtn'),
    urlSubmitBtnText: document.getElementById('urlSubmitBtnText'),
    urlSectionTitle: document.getElementById('urlSectionTitle'),
    urlCountBadge: document.getElementById('urlCountBadge'),
    urlsList: document.getElementById('urlsList'),
    urlsEmptyState: document.getElementById('urlsEmptyState'),
    urlsEmptyTitle: document.getElementById('urlsEmptyTitle'),
    urlsEmptyMsg: document.getElementById('urlsEmptyMsg'),

    // Project Modal
    projectModal: document.getElementById('projectModal'),
    projectModalTitle: document.getElementById('projectModalTitle'),
    projectForm: document.getElementById('projectForm'),
    projectEditId: document.getElementById('projectEditId'),
    projectNameInput: document.getElementById('projectNameInput'),
    projectDescInput: document.getElementById('projectDescInput'),
    projectDeadlineInput: document.getElementById('projectDeadlineInput'),
    closeProjectModalBtn: document.getElementById('closeProjectModalBtn'),
    cancelProjectBtn: document.getElementById('cancelProjectBtn'),

    // Task Modal
    taskModal: document.getElementById('taskModal'),
    taskModalTitle: document.getElementById('taskModalTitle'),
    taskForm: document.getElementById('taskForm'),
    taskEditId: document.getElementById('taskEditId'),
    taskProjectSelect: document.getElementById('taskProjectSelect'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    taskPrioritySelect: document.getElementById('taskPrioritySelect'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskDueTimeInput: document.getElementById('taskDueTimeInput'),
    closeTaskModalBtn: document.getElementById('closeTaskModalBtn'),
    cancelTaskBtn: document.getElementById('cancelTaskBtn'),

    // Edit URL Modal
    urlModal: document.getElementById('urlModal'),
    urlModalTitle: document.getElementById('urlModalTitle'),
    urlForm: document.getElementById('urlForm'),
    urlEditId: document.getElementById('urlEditId'),
    urlProjectSelect: document.getElementById('urlProjectSelect'),
    urlInput: document.getElementById('urlInput'),
    urlTitleInput: document.getElementById('urlTitleInput'),
    closeUrlModalBtn: document.getElementById('closeUrlModalBtn'),
    cancelUrlBtn: document.getElementById('cancelUrlBtn'),

    // Delete Confirmation Modal
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    deleteConfirmMsg: document.getElementById('deleteConfirmMsg'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    // Sidebar Data Backup Actions
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),

    // Import Modal
    importModal: document.getElementById('importModal'),
    importSummaryText: document.getElementById('importSummaryText'),
    importMergeBtn: document.getElementById('importMergeBtn'),
    importReplaceBtn: document.getElementById('importReplaceBtn'),
    closeImportModalBtn: document.getElementById('closeImportModalBtn'),
    cancelImportBtn: document.getElementById('cancelImportBtn'),
    fallbackFileInput: document.getElementById('fallbackFileInput'),

    // Reminder Modal Popup
    reminderModal: document.getElementById('reminderModal'),
    closeReminderModalBtn: document.getElementById('closeReminderModalBtn'),
    reminderSubtext: document.getElementById('reminderSubtext'),
    reminderTasksList: document.getElementById('reminderTasksList'),
    snoozeAllReminderBtn: document.getElementById('snoozeAllReminderBtn'),
    dismissReminderBtn: document.getElementById('dismissReminderBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // Safe IPC communication wrappers
  const api = {
    async loadData() {
      if (window.todoApp && typeof window.todoApp.loadData === 'function') {
        return await window.todoApp.loadData();
      }
      const saved = localStorage.getItem('taskflow-data');
      return saved ? JSON.parse(saved) : null;
    },
    async saveData(data) {
      if (window.todoApp && typeof window.todoApp.saveData === 'function') {
        return await window.todoApp.saveData(data);
      }
      localStorage.setItem('taskflow-data', JSON.stringify(data));
      return { success: true };
    },
    async showNotification(options) {
      if (window.todoApp && typeof window.todoApp.showNotification === 'function') {
        return await window.todoApp.showNotification(options);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title || 'TaskFlow Reminder ⏰', { body: options.body });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(options.title || 'TaskFlow Reminder ⏰', { body: options.body });
          }
        });
      }
    },
    async focusWindow() {
      if (window.todoApp && typeof window.todoApp.focusWindow === 'function') {
        return await window.todoApp.focusWindow();
      }
    },
    onNotificationClick(callback) {
      if (window.todoApp && typeof window.todoApp.onNotificationClick === 'function') {
        return window.todoApp.onNotificationClick(callback);
      }
    },
    async fetchUrlTitle(url) {
      if (window.todoApp && typeof window.todoApp.fetchUrlTitle === 'function') {
        return await window.todoApp.fetchUrlTitle(url);
      }
      try {
        let target = url.trim();
        if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;
        const parsed = new URL(target);
        const domain = parsed.hostname.replace(/^www\./, '');
        return { success: true, title: domain, url: target, domain, favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` };
      } catch (e) {
        return { success: false, error: 'Invalid URL' };
      }
    },
    async openExternalUrl(url) {
      if (window.todoApp && typeof window.todoApp.openExternalUrl === 'function') {
        return await window.todoApp.openExternalUrl(url);
      }
      window.open(url, '_blank');
    }
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  async function init() {
    applyTheme(state.theme);
    updateReminderBellState();
    setupWindowControls();
    setupEventListeners();
    setupReminderEngine();
    if (elements.quickAddDueDate) {
      elements.quickAddDueDate.value = getTodayString();
    }
    await loadInitialData();
    render();
    setTimeout(checkTaskReminders, 3000);
  }

  async function loadInitialData() {
    const data = await api.loadData();
    if (data && Array.isArray(data.projects)) {
      state.projects = data.projects;
      state.todos = Array.isArray(data.todos) ? data.todos : [];
      state.urls = Array.isArray(data.urls) ? data.urls : [];
    } else {
      // Fallback sample data if empty
      const proj1Id = 'proj-1';
      state.projects = [
        {
          id: proj1Id,
          name: 'Main Project',
          description: 'General project space',
          color: '#6366f1',
          deadline: '',
          createdAt: new Date().toISOString()
        }
      ];
      state.todos = [];
      state.urls = [
        {
          id: 'url-1',
          projectId: proj1Id,
          url: 'https://github.com/lakshaykumar-smartdata/electron-todo-app',
          title: 'GitHub - lakshaykumar-smartdata/electron-todo-app',
          domain: 'github.com',
          favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Default to the first project if available
    if (state.projects.length > 0) {
      state.activeProjectId = state.projects[0].id;
      state.activeView = 'project';
    } else {
      state.activeProjectId = null;
      state.activeView = 'all-projects';
    }
  }

  // --------------------------------------------------------------------------
  // Window Controls & Theming
  // --------------------------------------------------------------------------
  function setupWindowControls() {
    if (window.todoApp) {
      elements.minBtn?.addEventListener('click', () => window.todoApp.minimizeWindow());
      elements.maxBtn?.addEventListener('click', () => window.todoApp.maximizeWindow());
      elements.closeBtn?.addEventListener('click', () => window.todoApp.closeWindow());
    }

    elements.themeToggleBtn?.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('taskflow-theme', state.theme);
      applyTheme(state.theme);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      elements.sunIcon?.classList.remove('hidden');
      elements.moonIcon?.classList.add('hidden');
    } else {
      elements.sunIcon?.classList.add('hidden');
      elements.moonIcon?.classList.remove('hidden');
    }
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Desktop Reminder Toggle
    elements.toggleRemindersBtn?.addEventListener('click', () => {
      state.remindersEnabled = !state.remindersEnabled;
      localStorage.setItem('taskflow-reminders', state.remindersEnabled ? 'true' : 'false');
      updateReminderBellState();
      showToast(`Desktop Reminders ${state.remindersEnabled ? 'Enabled 🔔' : 'Disabled 🔕'}`);
    });

    // Smart Views navigation
    elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
      });
    });

    // Quick Add Form
    elements.quickAddForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = elements.quickAddInput.value.trim();
      if (!title) return;

      // Determine which project to add to
      let targetProjectId = state.activeProjectId;
      if (!targetProjectId) {
        if (state.projects.length > 0) {
          targetProjectId = state.projects[0].id;
        } else {
          openProjectModal();
          showToast('Please create a project first! 📂');
          return;
        }
      }

      const dueDate = elements.quickAddDueDate?.value || getTodayString();
      const dueTime = elements.quickAddDueTime?.value || '';

      const newTodo = {
        id: 'task-' + Date.now(),
        projectId: targetProjectId,
        title: title,
        description: '',
        priority: state.activeView === 'important' ? 'High' : 'Medium',
        dueDate: dueDate,
        dueTime: dueTime,
        completed: false,
        createdAt: new Date().toISOString()
      };

      state.todos.unshift(newTodo);
      elements.quickAddInput.value = '';
      if (elements.quickAddDueDate) {
        elements.quickAddDueDate.value = getTodayString();
      }
      if (elements.quickAddDueTime) {
        elements.quickAddDueTime.value = '';
      }
      persistAndRender();
      showToast('Task added to project! 🎯');
    });

    // Search Input
    elements.searchInput?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      elements.clearSearchBtn?.classList.toggle('hidden', !state.searchQuery);
      render();
    });

    elements.clearSearchBtn?.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      elements.searchInput.focus();
      render();
    });

    // Sort Dropdown
    elements.sortSelect?.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      render();
    });

    // Modals Triggers
    elements.openNewProjectModalBtn?.addEventListener('click', () => openProjectModal());
    elements.openNewTaskModalBtn?.addEventListener('click', () => openTaskModal());
    elements.emptyStateAddBtn?.addEventListener('click', () => openTaskModal());

    // Project Modal
    elements.closeProjectModalBtn?.addEventListener('click', closeProjectModal);
    elements.cancelProjectBtn?.addEventListener('click', closeProjectModal);
    elements.projectModal?.addEventListener('click', (e) => {
      if (e.target === elements.projectModal) closeProjectModal();
    });
    elements.projectForm?.addEventListener('submit', handleProjectFormSubmit);

    // Edit & Delete Project
    elements.editProjectBtn?.addEventListener('click', () => {
      const currentProj = getCurrentProject();
      if (currentProj) openProjectModal(currentProj);
    });
    elements.deleteProjectBtn?.addEventListener('click', () => {
      const currentProj = getCurrentProject();
      if (currentProj) openDeleteConfirmModal(currentProj.id);
    });

    // Task Modal
    elements.closeTaskModalBtn?.addEventListener('click', closeTaskModal);
    elements.cancelTaskBtn?.addEventListener('click', closeTaskModal);
    elements.taskModal?.addEventListener('click', (e) => {
      if (e.target === elements.taskModal) closeTaskModal();
    });
    elements.taskForm?.addEventListener('submit', handleTaskFormSubmit);

    // Delete Modal
    elements.closeDeleteModalBtn?.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn?.addEventListener('click', closeDeleteModal);
    elements.deleteConfirmModal?.addEventListener('click', (e) => {
      if (e.target === elements.deleteConfirmModal) closeDeleteModal();
    });
    elements.confirmDeleteBtn?.addEventListener('click', handleConfirmDeleteProject);

    // Clear Completed Tasks
    elements.clearCompletedBtn?.addEventListener('click', clearCompletedTasks);

    // Sidebar Data Backup (Export & Import)
    elements.exportDataBtn?.addEventListener('click', handleExport);
    elements.importDataBtn?.addEventListener('click', handleImportClick);
    elements.importMergeBtn?.addEventListener('click', handleMergeImport);
    elements.importReplaceBtn?.addEventListener('click', handleReplaceImport);
    elements.closeImportModalBtn?.addEventListener('click', closeImportModal);
    elements.cancelImportBtn?.addEventListener('click', closeImportModal);
    elements.importModal?.addEventListener('click', (e) => {
      if (e.target === elements.importModal) closeImportModal();
    });
    elements.fallbackFileInput?.addEventListener('change', handleFallbackFileSelect);

    // Reminder Popup Modal Listeners
    elements.closeReminderModalBtn?.addEventListener('click', closeReminderModal);
    elements.dismissReminderBtn?.addEventListener('click', closeReminderModal);
    elements.snoozeAllReminderBtn?.addEventListener('click', () => snoozeAllReminders(15));
    elements.reminderModal?.addEventListener('click', (e) => {
      if (e.target === elements.reminderModal) closeReminderModal();
    });

    // Native Notification Click Handler from Main Process
    api.onNotificationClick((data) => {
      api.focusWindow();
      openReminderModal();
    });

    // Tab Switcher (Tasks vs Saved URLs)
    elements.tabTasksBtn?.addEventListener('click', () => switchTab('tasks'));
    elements.tabUrlsBtn?.addEventListener('click', () => switchTab('urls'));

    // Quick Add URL Form
    elements.quickAddUrlForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawUrl = elements.quickAddUrlInput.value.trim();
      if (!rawUrl) return;

      let targetProjectId = state.activeProjectId;
      if (!targetProjectId) {
        if (state.projects.length > 0) {
          targetProjectId = state.projects[0].id;
        } else {
          openProjectModal();
          showToast('Please create a project first! 📂');
          return;
        }
      }

      if (elements.urlSubmitBtnText) {
        elements.urlSubmitBtnText.textContent = 'Fetching Title... ⏳';
      }
      if (elements.quickAddUrlSubmitBtn) {
        elements.quickAddUrlSubmitBtn.disabled = true;
      }

      const res = await api.fetchUrlTitle(rawUrl);

      if (elements.urlSubmitBtnText) {
        elements.urlSubmitBtnText.textContent = 'Add URL';
      }
      if (elements.quickAddUrlSubmitBtn) {
        elements.quickAddUrlSubmitBtn.disabled = false;
      }

      if (res && res.success) {
        const newBookmark = {
          id: 'url-' + Date.now(),
          projectId: targetProjectId,
          url: res.url,
          title: res.title || res.domain,
          domain: res.domain,
          favicon: res.favicon,
          createdAt: new Date().toISOString()
        };

        state.urls.unshift(newBookmark);
        elements.quickAddUrlInput.value = '';
        persistAndRender();
        showToast(`Saved link: "${newBookmark.title}" 🔗`);
      } else {
        showToast(`Failed to parse URL: ${res?.error || 'Invalid address'}`);
      }
    });

    // Edit URL Modal
    elements.closeUrlModalBtn?.addEventListener('click', closeUrlModal);
    elements.cancelUrlBtn?.addEventListener('click', closeUrlModal);
    elements.urlModal?.addEventListener('click', (e) => {
      if (e.target === elements.urlModal) closeUrlModal();
    });
    elements.urlForm?.addEventListener('submit', handleUrlFormSubmit);

    // Make clicking anywhere on date or time inputs trigger native picker popup
    document.querySelectorAll('input[type="date"], input[type="time"]').forEach(dateInput => {
      dateInput.addEventListener('click', () => {
        try {
          if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
          }
        } catch (err) {
          // Ignore if already open or unsupported
        }
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ctrl+N: New Task
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openTaskModal();
      }
      // Ctrl+P: New Project
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openProjectModal();
      }
      // Ctrl+F: Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        elements.searchInput?.focus();
        elements.searchInput?.select();
      }
      // Esc: Close Modals
      if (e.key === 'Escape') {
        closeTaskModal();
        closeProjectModal();
        closeDeleteModal();
        closeImportModal();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Navigation & Switching
  // --------------------------------------------------------------------------
  function switchProject(projectId) {
    state.activeProjectId = projectId;
    state.activeView = 'project';
    render();
  }

  function switchView(viewName) {
    state.activeProjectId = null;
    state.activeView = viewName;
    render();
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    elements.tabTasksBtn?.classList.toggle('active', tabName === 'tasks');
    elements.tabUrlsBtn?.classList.toggle('active', tabName === 'urls');
    elements.tasksSection?.classList.toggle('hidden', tabName !== 'tasks');
    elements.urlsSection?.classList.toggle('hidden', tabName !== 'urls');
    render();
  }

  function getCurrentProject() {
    if (!state.activeProjectId) return null;
    return state.projects.find(p => p.id === state.activeProjectId) || null;
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------
  async function persistAndRender() {
    render();
    checkTaskReminders();
    await api.saveData({
      projects: state.projects,
      todos: state.todos,
      urls: state.urls
    });
  }

  // --------------------------------------------------------------------------
  // Project Management
  // --------------------------------------------------------------------------
  function openProjectModal(projectToEdit = null) {
    elements.projectForm.reset();

    if (projectToEdit) {
      elements.projectModalTitle.textContent = 'Edit Project';
      elements.projectEditId.value = projectToEdit.id;
      elements.projectNameInput.value = projectToEdit.name;
      elements.projectDescInput.value = projectToEdit.description || '';
      elements.projectDeadlineInput.value = projectToEdit.deadline || '';

      const colorRadios = elements.projectForm.querySelectorAll('input[name="projectColor"]');
      colorRadios.forEach(radio => {
        radio.checked = (radio.value === projectToEdit.color);
      });
    } else {
      elements.projectModalTitle.textContent = 'Create New Project';
      elements.projectEditId.value = '';
    }

    elements.projectModal.classList.remove('hidden');
    elements.projectNameInput.focus();
  }

  function closeProjectModal() {
    elements.projectModal.classList.add('hidden');
  }

  function handleProjectFormSubmit(e) {
    e.preventDefault();
    const editId = elements.projectEditId.value;
    const name = elements.projectNameInput.value.trim();
    if (!name) return;

    const desc = elements.projectDescInput.value.trim();
    const deadline = elements.projectDeadlineInput.value;
    const selectedColor = elements.projectForm.querySelector('input[name="projectColor"]:checked')?.value || '#6366f1';

    if (editId) {
      // Edit
      const proj = state.projects.find(p => p.id === editId);
      if (proj) {
        proj.name = name;
        proj.description = desc;
        proj.color = selectedColor;
        proj.deadline = deadline;
        showToast(`Project "${name}" updated`);
      }
    } else {
      // Create
      const newProj = {
        id: 'proj-' + Date.now(),
        name: name,
        description: desc,
        color: selectedColor,
        deadline: deadline,
        createdAt: new Date().toISOString()
      };
      state.projects.push(newProj);
      state.activeProjectId = newProj.id;
      state.activeView = 'project';
      showToast(`Project "${name}" created! 🚀`);
    }

    closeProjectModal();
    persistAndRender();
  }

  function openDeleteConfirmModal(projectId) {
    const proj = state.projects.find(p => p.id === projectId);
    if (!proj) return;

    state.projectToDeleteId = projectId;
    const count = state.todos.filter(t => t.projectId === projectId).length;
    elements.deleteConfirmMsg.textContent = `Are you sure you want to delete "${proj.name}"? This will permanently delete the project and all ${count} associated tasks.`;
    elements.deleteConfirmModal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    elements.deleteConfirmModal.classList.add('hidden');
    state.projectToDeleteId = null;
  }

  function handleConfirmDeleteProject() {
    if (!state.projectToDeleteId) return;

    const projId = state.projectToDeleteId;
    const projIndex = state.projects.findIndex(p => p.id === projId);

    if (projIndex !== -1) {
      const removedProj = state.projects.splice(projIndex, 1)[0];
      // Remove all tasks and URLs in this project
      state.todos = state.todos.filter(t => t.projectId !== projId);
      state.urls = state.urls.filter(u => u.projectId !== projId);

      // Reset active view to all-projects
      state.activeProjectId = null;
      state.activeView = 'all-projects';

      showToast(`Deleted project "${removedProj.name}"`);
    }

    closeDeleteModal();
    persistAndRender();
  }

  // --------------------------------------------------------------------------
  // Task Management
  // --------------------------------------------------------------------------
  function openTaskModal(taskToEdit = null) {
    if (state.projects.length === 0) {
      openProjectModal();
      showToast('Please create a project before adding tasks! 📁');
      return;
    }

    elements.taskForm.reset();
    populateTaskProjectOptions();

    if (taskToEdit) {
      elements.taskModalTitle.textContent = 'Edit Task';
      elements.taskEditId.value = taskToEdit.id;
      elements.taskTitleInput.value = taskToEdit.title;
      elements.taskDescInput.value = taskToEdit.description || '';
      elements.taskProjectSelect.value = taskToEdit.projectId;
      elements.taskPrioritySelect.value = taskToEdit.priority || 'Medium';
      elements.taskDueDateInput.value = taskToEdit.dueDate || getTodayString();
      if (elements.taskDueTimeInput) {
        elements.taskDueTimeInput.value = taskToEdit.dueTime || '';
      }
    } else {
      elements.taskModalTitle.textContent = 'Create New Task';
      elements.taskEditId.value = '';

      if (state.activeProjectId) {
        elements.taskProjectSelect.value = state.activeProjectId;
      }
      if (state.activeView === 'important') {
        elements.taskPrioritySelect.value = 'High';
      }
      // Default to today's date
      elements.taskDueDateInput.value = getTodayString();
      if (elements.taskDueTimeInput) {
        elements.taskDueTimeInput.value = '';
      }
    }

    elements.taskModal.classList.remove('hidden');
    elements.taskTitleInput.focus();
  }

  function closeTaskModal() {
    elements.taskModal.classList.add('hidden');
  }

  function populateTaskProjectOptions() {
    elements.taskProjectSelect.innerHTML = state.projects
      .map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
      .join('');
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const editId = elements.taskEditId.value;
    const title = elements.taskTitleInput.value.trim();
    if (!title) return;

    const projectId = elements.taskProjectSelect.value;
    const desc = elements.taskDescInput.value.trim();
    const priority = elements.taskPrioritySelect.value;
    const dueDate = elements.taskDueDateInput.value;
    const dueTime = elements.taskDueTimeInput?.value || '';

    if (editId) {
      const task = state.todos.find(t => t.id === editId);
      if (task) {
        task.title = title;
        task.description = desc;
        task.projectId = projectId;
        task.priority = priority;
        task.dueDate = dueDate;
        task.dueTime = dueTime;
        showToast('Task updated');
      }
    } else {
      const newTask = {
        id: 'task-' + Date.now(),
        projectId: projectId,
        title: title,
        description: desc,
        priority: priority,
        dueDate: dueDate,
        dueTime: dueTime,
        completed: false,
        createdAt: new Date().toISOString()
      };
      state.todos.unshift(newTask);
      showToast('Task created! 🎯');
    }

    closeTaskModal();
    persistAndRender();
  }

  function toggleTaskCompletion(id) {
    const task = state.todos.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      persistAndRender();
      if (task.completed) {
        showToast('Task completed! 🎉');
      }
    }
  }

  function deleteTask(id) {
    const index = state.todos.findIndex(t => t.id === id);
    if (index !== -1) {
      const deleted = state.todos.splice(index, 1)[0];
      state.lastDeleted = { task: deleted, index: index };
      persistAndRender();
      showToast('Task deleted', () => undoDelete());
    }
  }

  function undoDelete() {
    if (state.lastDeleted) {
      state.todos.splice(state.lastDeleted.index, 0, state.lastDeleted.task);
      state.lastDeleted = null;
      persistAndRender();
      showToast('Restored task! ↩️');
    }
  }

  function clearCompletedTasks() {
    let toRemove = [];
    if (state.activeProjectId) {
      toRemove = state.todos.filter(t => t.projectId === state.activeProjectId && t.completed);
      state.todos = state.todos.filter(t => !(t.projectId === state.activeProjectId && t.completed));
    } else {
      toRemove = state.todos.filter(t => t.completed);
      state.todos = state.todos.filter(t => !t.completed);
    }

    if (toRemove.length > 0) {
      persistAndRender();
      showToast(`Cleared ${toRemove.length} completed task${toRemove.length > 1 ? 's' : ''}`);
    }
  }

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------
  function render() {
    renderProjectsList();
    updateNavigationState();
    renderBanner();
    renderTasksList();
    renderUrlsList();
    if (elements.badgeUrls) {
      const count = getFilteredUrls().length;
      elements.badgeUrls.textContent = count;
    }
  }

  function renderProjectsList() {
    elements.projectsList.innerHTML = '';

    if (state.projects.length === 0) {
      elements.projectsList.innerHTML = `
        <div style="padding: 10px; font-size: 12px; color: var(--text-subtle); text-align: center;">
          No projects yet.<br>Click <b>+ New</b> to add one!
        </div>
      `;
      return;
    }

    state.projects.forEach(project => {
      const remainingTasks = state.todos.filter(t => t.projectId === project.id && !t.completed).length;
      const isActive = (state.activeView === 'project' && state.activeProjectId === project.id);

      const item = document.createElement('button');
      item.className = `project-item ${isActive ? 'active' : ''}`;
      item.dataset.id = project.id;
      item.innerHTML = `
        <span class="project-color-dot" style="background-color: ${project.color || '#6366f1'}; color: ${project.color || '#6366f1'}"></span>
        <span class="project-name-label">${escapeHtml(project.name)}</span>
        <span class="project-badge-count">${remainingTasks}</span>
      `;

      item.addEventListener('click', () => {
        switchProject(project.id);
      });

      elements.projectsList.appendChild(item);
    });
  }

  function updateNavigationState() {
    elements.navItems.forEach(item => {
      const view = item.dataset.view;
      item.classList.toggle('active', state.activeView === view && !state.activeProjectId);
    });

    const todayStr = getTodayString();
    const pendingTotal = state.todos.filter(t => !t.completed).length;
    const pendingToday = state.todos.filter(t => t.dueDate === todayStr && !t.completed).length;
    const pendingImportant = state.todos.filter(t => t.priority === 'High' && !t.completed).length;
    const completedTotal = state.todos.filter(t => t.completed).length;

    if (elements.badgeAllProjects) elements.badgeAllProjects.textContent = pendingTotal;
    if (elements.badgeToday) elements.badgeToday.textContent = pendingToday;
    if (elements.badgeImportant) elements.badgeImportant.textContent = pendingImportant;
    if (elements.badgeCompleted) elements.badgeCompleted.textContent = completedTotal;
  }

  function renderBanner() {
    const currentProj = getCurrentProject();

    if (currentProj && state.activeView === 'project') {
      // Viewing a specific project
      elements.bannerColorDot.style.display = 'block';
      elements.bannerColorDot.style.backgroundColor = currentProj.color || '#6366f1';
      elements.bannerTitle.textContent = currentProj.name;
      elements.bannerDesc.textContent = currentProj.description || 'Project tasks and deliverables';
      elements.projectActions.classList.remove('hidden');

      // Quick add placeholder
      elements.quickAddInput.placeholder = `Add a task to "${currentProj.name}" and press Enter...`;

      // Deadline
      if (currentProj.deadline) {
        elements.bannerDeadlineWrap.classList.remove('hidden');
        elements.bannerDeadlineText.textContent = `Target Deadline: ${currentProj.deadline}`;
      } else {
        elements.bannerDeadlineWrap.classList.add('hidden');
      }

      // Progress for this project
      const projTodos = state.todos.filter(t => t.projectId === currentProj.id);
      const total = projTodos.length;
      const completed = projTodos.filter(t => t.completed).length;
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

      elements.bannerProgressRatio.textContent = `${completed} of ${total} tasks done`;
      elements.bannerProgressPercent.textContent = `${pct}%`;
      elements.bannerProgressBarFill.style.width = `${pct}%`;
    } else {
      // Global View (All Projects, Today, etc.)
      elements.bannerColorDot.style.display = 'none';
      elements.projectActions.classList.add('hidden');
      elements.bannerDeadlineWrap.classList.add('hidden');

      const viewHeaders = {
        'all-projects': {
          title: 'All Projects',
          desc: 'Consolidated overview of all deliverables across all your projects',
          placeholder: 'Add a task and press Enter...'
        },
        today: {
          title: 'Due Today',
          desc: 'Deliverables and action items scheduled for today',
          placeholder: 'Add a task due today and press Enter...'
        },
        important: {
          title: 'High Priority',
          desc: 'Critical milestones that require immediate attention',
          placeholder: 'Add a high priority task and press Enter...'
        },
        completed: {
          title: 'Completed',
          desc: 'Archive of finished deliverables across all projects',
          placeholder: 'Add a task and press Enter...'
        }
      };

      const info = viewHeaders[state.activeView] || viewHeaders['all-projects'];
      elements.bannerTitle.textContent = info.title;
      elements.bannerDesc.textContent = info.desc;
      elements.quickAddInput.placeholder = info.placeholder;

      // Overall Progress
      const total = state.todos.length;
      const completed = state.todos.filter(t => t.completed).length;
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

      elements.bannerProgressRatio.textContent = `${completed} of ${total} tasks done`;
      elements.bannerProgressPercent.textContent = `${pct}%`;
      elements.bannerProgressBarFill.style.width = `${pct}%`;
    }
  }

  function getFilteredAndSortedTodos() {
    const todayStr = getTodayString();

    let list = state.todos.filter(task => {
      // Project vs Smart View filter
      if (state.activeView === 'project' && state.activeProjectId) {
        if (task.projectId !== state.activeProjectId) return false;
      } else if (state.activeView === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (state.activeView === 'important') {
        if (task.priority !== 'High') return false;
      } else if (state.activeView === 'completed') {
        if (!task.completed) return false;
      }

      // Keyword search
      if (state.searchQuery) {
        const q = state.searchQuery;
        const proj = state.projects.find(p => p.id === task.projectId);
        const projName = proj ? proj.name.toLowerCase() : '';
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesProj = projName.includes(q);
        if (!matchesTitle && !matchesDesc && !matchesProj) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      // Completed sink to bottom unless in completed view
      if (state.activeView !== 'completed') {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
      }

      switch (state.sortBy) {
        case 'created-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'due-date':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case 'priority': {
          const rank = { High: 3, Medium: 2, Low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created-desc':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return list;
  }

  function renderTasksList() {
    const todos = getFilteredAndSortedTodos();
    elements.taskList.innerHTML = '';

    // Task count & Clear button
    elements.taskCountBadge.textContent = `${todos.length} task${todos.length === 1 ? '' : 's'}`;
    const hasCompleted = todos.some(t => t.completed);
    elements.clearCompletedBtn.classList.toggle('hidden', !hasCompleted);

    if (todos.length === 0) {
      elements.emptyState.classList.remove('hidden');
      if (state.searchQuery) {
        elements.emptyStateTitle.textContent = 'No matching tasks';
        elements.emptyStateMsg.textContent = `No tasks found matching "${state.searchQuery}".`;
      } else if (state.activeView === 'completed') {
        elements.emptyStateTitle.textContent = 'No completed tasks';
        elements.emptyStateMsg.textContent = 'Accomplish some project tasks to view them here!';
      } else if (state.activeView === 'project') {
        const proj = getCurrentProject();
        elements.emptyStateTitle.textContent = 'No tasks in this project';
        elements.emptyStateMsg.textContent = `Get started by adding tasks to ${proj?.name || 'this project'}.`;
      } else {
        elements.emptyStateTitle.textContent = 'All clear!';
        elements.emptyStateMsg.textContent = 'No tasks scheduled in this view. Enjoy your day or create a new task!';
      }
      return;
    }

    elements.emptyState.classList.add('hidden');

    todos.forEach(task => {
      const proj = state.projects.find(p => p.id === task.projectId);
      const li = document.createElement('li');
      li.className = `task-card priority-${(task.priority || 'medium').toLowerCase()} ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;

      // Project pill (shown when viewing all projects or smart views)
      let projectPillHtml = '';
      if (proj && state.activeView !== 'project') {
        projectPillHtml = `
          <span class="meta-pill pill-project" title="Switch to ${escapeHtml(proj.name)}">
            <span class="pill-project-dot" style="background-color: ${proj.color || '#6366f1'}"></span>
            ${escapeHtml(proj.name)}
          </span>
        `;
      }

      // Due date pill
      let dueHtml = '';
      if (task.dueDate) {
        const { label, className } = formatDueDate(task.dueDate, task.dueTime);
        dueHtml = `
          <span class="meta-pill pill-due ${className}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            ${label}
          </span>
        `;
      }

      li.innerHTML = `
        <label class="custom-checkbox">
          <input type="checkbox" ${task.completed ? 'checked' : ''}>
          <span class="checkbox-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </label>

        <div class="task-info">
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
          <div class="task-meta">
            ${projectPillHtml}
            <span class="meta-pill pill-priority-${task.priority || 'Medium'}">${escapeHtml(task.priority || 'Medium')}</span>
            ${dueHtml}
          </div>
        </div>

        <div class="task-actions">
          <button class="action-icon-btn edit-btn" title="Edit Task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="action-icon-btn delete delete-btn" title="Delete Task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Checkbox event
      const checkbox = li.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

      // Edit event
      const editBtn = li.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => openTaskModal(task));

      // Delete event
      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      // Project pill click -> switch to project
      const projectPill = li.querySelector('.pill-project');
      if (projectPill && proj) {
        projectPill.style.cursor = 'pointer';
        projectPill.addEventListener('click', (e) => {
          e.stopPropagation();
          switchProject(proj.id);
        });
      }

      elements.taskList.appendChild(li);
    });
  }

  // --------------------------------------------------------------------------
  // Saved URLs & Bookmarks Logic
  // --------------------------------------------------------------------------
  function getFilteredUrls() {
    return state.urls.filter(item => {
      if (state.activeView === 'project' && state.activeProjectId) {
        if (item.projectId !== state.activeProjectId) return false;
      }

      if (state.searchQuery) {
        const q = state.searchQuery;
        const proj = state.projects.find(p => p.id === item.projectId);
        const projName = proj ? proj.name.toLowerCase() : '';
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesUrl = (item.url || '').toLowerCase().includes(q);
        const matchesProj = projName.includes(q);
        if (!matchesTitle && !matchesUrl && !matchesProj) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function renderUrlsList() {
    const urls = getFilteredUrls();
    elements.urlsList.innerHTML = '';
    if (elements.urlCountBadge) {
      elements.urlCountBadge.textContent = `${urls.length} link${urls.length === 1 ? '' : 's'}`;
    }

    if (urls.length === 0) {
      elements.urlsEmptyState?.classList.remove('hidden');
      return;
    }

    elements.urlsEmptyState?.classList.add('hidden');

    urls.forEach(item => {
      const proj = state.projects.find(p => p.id === item.projectId);
      const card = document.createElement('div');
      card.className = 'url-card';
      card.dataset.id = item.id;

      let projPill = '';
      if (proj && state.activeView !== 'project') {
        projPill = `
          <span class="meta-pill pill-project">
            <span class="pill-project-dot" style="background-color: ${proj.color || '#6366f1'}"></span>
            ${escapeHtml(proj.name)}
          </span>
        `;
      }

      const faviconUrl = item.favicon || `https://www.google.com/s2/favicons?domain=${item.domain || 'google.com'}&sz=64`;

      card.innerHTML = `
        <div class="url-card-icon-wrap">
          <img src="${escapeHtml(faviconUrl)}" class="url-card-favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'">
        </div>

        <div class="url-card-content">
          <h4 class="url-card-title">${escapeHtml(item.title)}</h4>
          <a class="url-card-link" href="#" data-url="${escapeHtml(item.url)}" title="Open link in browser">
            <span>${escapeHtml(item.url)}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <div class="url-card-meta">
            ${projPill}
            <span class="url-card-domain">🌐 ${escapeHtml(item.domain || '')}</span>
          </div>
        </div>

        <div class="url-card-actions">
          <button class="action-icon-btn edit-url-btn" title="Edit Bookmark Title/URL">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="action-icon-btn delete delete-url-btn" title="Delete Bookmark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      card.querySelector('.url-card-link').addEventListener('click', (e) => {
        e.preventDefault();
        api.openExternalUrl(item.url);
      });

      card.querySelector('.edit-url-btn').addEventListener('click', () => {
        openUrlModal(item);
      });

      card.querySelector('.delete-url-btn').addEventListener('click', () => {
        deleteUrl(item.id);
      });

      elements.urlsList.appendChild(card);
    });
  }

  function openUrlModal(urlToEdit = null) {
    elements.urlForm.reset();
    populateUrlProjectOptions();

    if (urlToEdit) {
      elements.urlModalTitle.textContent = 'Edit Saved Bookmark';
      elements.urlEditId.value = urlToEdit.id;
      elements.urlProjectSelect.value = urlToEdit.projectId;
      elements.urlInput.value = urlToEdit.url;
      elements.urlTitleInput.value = urlToEdit.title;
    } else {
      elements.urlModalTitle.textContent = 'Add Saved Bookmark';
      elements.urlEditId.value = '';
      if (state.activeProjectId) elements.urlProjectSelect.value = state.activeProjectId;
    }

    elements.urlModal.classList.remove('hidden');
    elements.urlInput.focus();
  }

  function closeUrlModal() {
    elements.urlModal.classList.add('hidden');
  }

  function populateUrlProjectOptions() {
    elements.urlProjectSelect.innerHTML = state.projects
      .map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
      .join('');
  }

  function handleUrlFormSubmit(e) {
    e.preventDefault();
    const editId = elements.urlEditId.value;
    const urlStr = elements.urlInput.value.trim();
    const title = elements.urlTitleInput.value.trim();
    const projectId = elements.urlProjectSelect.value;
    if (!urlStr || !title) return;

    let target = urlStr;
    if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;
    let domain = '';
    try { domain = new URL(target).hostname.replace(/^www\./, ''); } catch (err) {}
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    if (editId) {
      const item = state.urls.find(u => u.id === editId);
      if (item) {
        item.projectId = projectId;
        item.url = target;
        item.title = title;
        item.domain = domain;
        item.favicon = favicon;
        showToast('Bookmark updated');
      }
    } else {
      const newItem = {
        id: 'url-' + Date.now(),
        projectId: projectId,
        url: target,
        title: title,
        domain: domain,
        favicon: favicon,
        createdAt: new Date().toISOString()
      };
      state.urls.unshift(newItem);
      showToast('Bookmark added 🔗');
    }

    closeUrlModal();
    persistAndRender();
  }

  function deleteUrl(id) {
    const index = state.urls.findIndex(u => u.id === id);
    if (index !== -1) {
      const removed = state.urls.splice(index, 1)[0];
      persistAndRender();
      showToast(`Deleted link "${removed.title}"`);
    }
  }

  // --------------------------------------------------------------------------
  // Reminder Engine & Desktop Notifications
  // --------------------------------------------------------------------------
  let reminderIntervalId = null;

  function updateReminderBellState() {
    if (!elements.toggleRemindersBtn) return;
    elements.toggleRemindersBtn.classList.toggle('active', state.remindersEnabled);
    elements.toggleRemindersBtn.title = `Desktop Task Reminders: ${state.remindersEnabled ? 'ON (Click to disable)' : 'OFF (Click to enable)'}`;
  }

  function setupReminderEngine() {
    if (reminderIntervalId) clearInterval(reminderIntervalId);
    reminderIntervalId = setInterval(checkTaskReminders, 3000);
  }

  function checkTaskReminders() {
    if (!state.remindersEnabled || !state.todos || state.todos.length === 0) return;

    const now = new Date();
    const todayStr = getTodayString();
    const nowMs = now.getTime();

    const dueOrOverdueTasks = state.todos.filter(task => {
      if (task.completed) return false;

      // Skip if snoozed
      if (state.snoozedTasks[task.id] && state.snoozedTasks[task.id] > nowMs) {
        return false;
      }

      if (!task.dueDate) return false;

      // Construct task due timestamp
      let timeStr = task.dueTime || '23:59';
      const taskDateTime = new Date(`${task.dueDate}T${timeStr}:00`);
      const taskMs = taskDateTime.getTime();

      // Check if due today & time reached, or past due date
      const isDueToday = (task.dueDate === todayStr && taskMs <= nowMs);
      const isOverdue = (task.dueDate < todayStr);

      return isDueToday || isOverdue;
    });

    if (dueOrOverdueTasks.length === 0) return;

    // Filter tasks not notified within last 10 minutes
    const unnotifiedTasks = dueOrOverdueTasks.filter(task => {
      const lastNotified = state.notifiedTasks[task.id] || 0;
      return (nowMs - lastNotified) > 10 * 60 * 1000;
    });

    if (unnotifiedTasks.length > 0) {
      const topTask = unnotifiedTasks[0];
      const bodyText = unnotifiedTasks.length > 1
        ? `"${topTask.title}" and ${unnotifiedTasks.length - 1} other tasks need attention!`
        : `Task "${topTask.title}" is due! Don't miss it.`;

      api.showNotification({
        title: '⏰ TaskFlow Reminder',
        body: bodyText,
        taskId: topTask.id
      });

      unnotifiedTasks.forEach(task => {
        state.notifiedTasks[task.id] = nowMs;
      });

      api.focusWindow();
      openReminderModal(dueOrOverdueTasks);
    }
  }

  function openReminderModal(tasksToDisplay = null) {
    const todayStr = getTodayString();
    const nowMs = Date.now();

    let tasks = tasksToDisplay;
    if (!tasks) {
      tasks = state.todos.filter(task => {
        if (task.completed || !task.dueDate) return false;
        let timeStr = task.dueTime || '23:59';
        const taskDateTime = new Date(`${task.dueDate}T${timeStr}:00`);
        return (task.dueDate === todayStr && taskDateTime.getTime() <= nowMs) || (task.dueDate < todayStr);
      });
    }

    if (!tasks || tasks.length === 0) return;

    elements.reminderSubtext.textContent = `You have ${tasks.length} pending task${tasks.length > 1 ? 's' : ''} that need immediate attention!`;

    elements.reminderTasksList.innerHTML = tasks.map(task => {
      const project = state.projects.find(p => p.id === task.projectId);
      const projName = project ? project.name : 'General';
      const projColor = project ? project.color : '#6366f1';
      const isOverdue = task.dueDate < todayStr;

      return `
        <div class="reminder-item-card" data-id="${escapeHtml(task.id)}">
          <div class="reminder-item-main">
            <div class="reminder-item-top">
              <span class="reminder-proj-pill" style="background: ${projColor}">${escapeHtml(projName)}</span>
              <span class="priority-badge priority-${(task.priority || 'medium').toLowerCase()}">${escapeHtml(task.priority || 'Medium')}</span>
            </div>
            <h4 class="reminder-item-title">${escapeHtml(task.title)}</h4>
            ${task.description ? `<p class="reminder-item-desc">${escapeHtml(task.description)}</p>` : ''}
            <div class="reminder-item-meta">
              <span class="reminder-due-tag ${isOverdue ? 'overdue' : 'due'}">
                📅 ${task.dueDate} ${task.dueTime ? `⏰ ${task.dueTime}` : ''} ${isOverdue ? '(Overdue)' : '(Due Now)'}
              </span>
            </div>
          </div>
          <div class="reminder-item-actions">
            <button class="btn-primary reminder-complete-btn" data-id="${escapeHtml(task.id)}">✓ Complete</button>
            <button class="btn-secondary reminder-snooze-btn" data-id="${escapeHtml(task.id)}">💤 15m</button>
          </div>
        </div>
      `;
    }).join('');

    elements.reminderTasksList.querySelectorAll('.reminder-complete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleTaskCompletion(id);
        const card = e.currentTarget.closest('.reminder-item-card');
        card?.remove();
        if (elements.reminderTasksList.children.length === 0) {
          closeReminderModal();
        }
      });
    });

    elements.reminderTasksList.querySelectorAll('.reminder-snooze-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        snoozeTask(id, 15);
        const card = e.currentTarget.closest('.reminder-item-card');
        card?.remove();
        showToast('Snoozed for 15 minutes 💤');
        if (elements.reminderTasksList.children.length === 0) {
          closeReminderModal();
        }
      });
    });

    elements.reminderModal.classList.remove('hidden');
  }

  function closeReminderModal() {
    elements.reminderModal.classList.add('hidden');
  }

  function snoozeTask(taskId, minutes) {
    state.snoozedTasks[taskId] = Date.now() + minutes * 60 * 1000;
  }

  function snoozeAllReminders(minutes = 15) {
    state.todos.forEach(task => {
      state.snoozedTasks[task.id] = Date.now() + minutes * 60 * 1000;
    });
    closeReminderModal();
    showToast(`All reminders snoozed for ${minutes} minutes 💤`);
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDueDate(dueDateStr, dueTimeStr = '') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dueDateStr.split('-');
    const due = new Date(parts[0], parts[1] - 1, parts[2]);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    const timeDisplay = dueTimeStr ? ` ⏰ ${dueTimeStr}` : '';

    if (diffDays < 0) {
      return { label: `Overdue (${dueDateStr}${timeDisplay})`, className: 'overdue' };
    } else if (diffDays === 0) {
      return { label: `Today${timeDisplay}`, className: 'today' };
    } else if (diffDays === 1) {
      return { label: `Tomorrow${timeDisplay}`, className: '' };
    } else {
      return { label: `${dueDateStr}${timeDisplay}`, className: '' };
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, actionCallback = null) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    if (actionCallback) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = 'Undo';
      actionBtn.addEventListener('click', () => {
        actionCallback();
        toast.remove();
      });
      toast.appendChild(actionBtn);
    }

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --------------------------------------------------------------------------
  // Data Backup: Export & Import
  // --------------------------------------------------------------------------
  async function handleExport() {
    const backupData = {
      app: 'TaskFlow',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      projects: state.projects,
      todos: state.todos,
      urls: state.urls
    };

    if (window.todoApp && typeof window.todoApp.exportBackup === 'function') {
      const res = await window.todoApp.exportBackup(backupData);
      if (res && res.success) {
        showToast('Backup exported successfully! 💾');
      } else if (res && !res.canceled && res.error) {
        showToast(`Export error: ${res.error}`);
      }
    } else {
      // Browser fallback
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-backup-${getTodayString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup file downloaded! 💾');
    }
  }

  async function handleImportClick() {
    if (window.todoApp && typeof window.todoApp.importBackup === 'function') {
      const res = await window.todoApp.importBackup();
      if (res && res.success && res.data) {
        promptImportOptions(res.data);
      } else if (res && !res.canceled && res.error) {
        showToast(`Import error: ${res.error}`);
      }
    } else {
      elements.fallbackFileInput?.click();
    }
  }

  function handleFallbackFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || (!Array.isArray(parsed.projects) && !Array.isArray(parsed.todos) && !Array.isArray(parsed.urls))) {
          showToast('Invalid backup file. Missing projects, tasks, or urls.');
          return;
        }
        promptImportOptions({
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          todos: Array.isArray(parsed.todos) ? parsed.todos : [],
          urls: Array.isArray(parsed.urls) ? parsed.urls : []
        });
      } catch (err) {
        showToast('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    elements.fallbackFileInput.value = '';
  }

  function promptImportOptions(data) {
    state.pendingImportData = data;
    const projectCount = (data.projects || []).length;
    const taskCount = (data.todos || []).length;
    const urlCount = (data.urls || []).length;

    elements.importSummaryText.innerHTML = `
      Found <strong>${projectCount}</strong> project${projectCount === 1 ? '' : 's'}, <strong>${taskCount}</strong> task${taskCount === 1 ? '' : 's'}, and <strong>${urlCount}</strong> saved URL${urlCount === 1 ? '' : 's'} in this backup file.
    `;
    elements.importModal.classList.remove('hidden');
  }

  function closeImportModal() {
    elements.importModal.classList.add('hidden');
    state.pendingImportData = null;
  }

  function handleMergeImport() {
    if (!state.pendingImportData) return;
    const { projects = [], todos = [], urls = [] } = state.pendingImportData;

    let addedProjects = 0;
    let addedTasks = 0;
    let addedUrls = 0;

    // Merge projects
    projects.forEach(importedProj => {
      const exists = state.projects.some(p => p.id === importedProj.id || p.name.toLowerCase() === importedProj.name.toLowerCase());
      if (!exists) {
        state.projects.push(importedProj);
        addedProjects++;
      }
    });

    // Merge tasks
    todos.forEach(importedTask => {
      const exists = state.todos.some(t => t.id === importedTask.id);
      if (!exists) {
        state.todos.push(importedTask);
        addedTasks++;
      }
    });

    // Merge URLs
    urls.forEach(importedUrl => {
      const exists = state.urls.some(u => u.id === importedUrl.id || u.url === importedUrl.url);
      if (!exists) {
        state.urls.push(importedUrl);
        addedUrls++;
      }
    });

    closeImportModal();
    persistAndRender();
    showToast(`Merged ${addedProjects} project(s), ${addedTasks} task(s) & ${addedUrls} link(s)! ➕`);
  }

  function handleReplaceImport() {
    if (!state.pendingImportData) return;
    const { projects = [], todos = [], urls = [] } = state.pendingImportData;

    state.projects = projects;
    state.todos = todos;
    state.urls = urls;

    if (state.projects.length > 0) {
      state.activeProjectId = state.projects[0].id;
      state.activeView = 'project';
    } else {
      state.activeProjectId = null;
      state.activeView = 'all-projects';
    }

    closeImportModal();
    persistAndRender();
    showToast(`Workspace restored! (${projects.length} projects, ${todos.length} tasks, ${urls.length} links) 🔄`);
  }

  // Kick off application
  window.addEventListener('DOMContentLoaded', init);
})();
