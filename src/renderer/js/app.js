/**
 * TaskFlow - Project Manager Renderer Logic
 */

(function () {
  'use strict';

  // Application State
  const state = {
    projects: [],
    todos: [],
    activeProjectId: null, // null when in global views
    activeView: 'all-projects', // 'all-projects', 'today', 'important', 'completed', 'project'
    searchQuery: '',
    sortBy: 'created-desc',
    theme: localStorage.getItem('taskflow-theme') || 'dark',
    lastDeleted: null,
    projectToDeleteId: null
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

    // Sidebar Projects
    projectsList: document.getElementById('projectsList'),
    openNewProjectModalBtn: document.getElementById('openNewProjectModalBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    badgeAllProjects: document.getElementById('badgeAllProjects'),
    badgeToday: document.getElementById('badgeToday'),
    badgeImportant: document.getElementById('badgeImportant'),
    badgeCompleted: document.getElementById('badgeCompleted'),

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

    // Quick Add
    quickAddForm: document.getElementById('quickAddForm'),
    quickAddInput: document.getElementById('quickAddInput'),
    quickAddDueDate: document.getElementById('quickAddDueDate'),

    // Task List
    taskSectionTitle: document.getElementById('taskSectionTitle'),
    taskCountBadge: document.getElementById('taskCountBadge'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateMsg: document.getElementById('emptyStateMsg'),
    emptyStateAddBtn: document.getElementById('emptyStateAddBtn'),

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
    closeTaskModalBtn: document.getElementById('closeTaskModalBtn'),
    cancelTaskBtn: document.getElementById('cancelTaskBtn'),

    // Delete Confirmation Modal
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    deleteConfirmMsg: document.getElementById('deleteConfirmMsg'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

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
    }
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  async function init() {
    applyTheme(state.theme);
    setupWindowControls();
    setupEventListeners();
    if (elements.quickAddDueDate) {
      elements.quickAddDueDate.value = getTodayString();
    }
    await loadInitialData();
    render();
  }

  async function loadInitialData() {
    const data = await api.loadData();
    if (data && Array.isArray(data.projects)) {
      state.projects = data.projects;
      state.todos = Array.isArray(data.todos) ? data.todos : [];
    } else {
      // Fallback sample data if empty
      state.projects = [
        {
          id: 'proj-1',
          name: 'Main Project',
          description: 'General project space',
          color: '#6366f1',
          deadline: '',
          createdAt: new Date().toISOString()
        }
      ];
      state.todos = [];
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

      const newTodo = {
        id: 'task-' + Date.now(),
        projectId: targetProjectId,
        title: title,
        description: '',
        priority: state.activeView === 'important' ? 'High' : 'Medium',
        dueDate: dueDate,
        completed: false,
        createdAt: new Date().toISOString()
      };

      state.todos.unshift(newTodo);
      elements.quickAddInput.value = '';
      if (elements.quickAddDueDate) {
        elements.quickAddDueDate.value = getTodayString();
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

  function getCurrentProject() {
    if (!state.activeProjectId) return null;
    return state.projects.find(p => p.id === state.activeProjectId) || null;
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------
  async function persistAndRender() {
    render();
    await api.saveData({
      projects: state.projects,
      todos: state.todos
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
      // Remove all tasks in this project
      state.todos = state.todos.filter(t => t.projectId !== projId);

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

    if (editId) {
      const task = state.todos.find(t => t.id === editId);
      if (task) {
        task.title = title;
        task.description = desc;
        task.projectId = projectId;
        task.priority = priority;
        task.dueDate = dueDate;
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
        const { label, className } = formatDueDate(task.dueDate);
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
  // Helpers
  // --------------------------------------------------------------------------
  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDueDate(dueDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dueDateStr.split('-');
    const due = new Date(parts[0], parts[1] - 1, parts[2]);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue (${dueDateStr})`, className: 'overdue' };
    } else if (diffDays === 0) {
      return { label: 'Today', className: 'today' };
    } else if (diffDays === 1) {
      return { label: 'Tomorrow', className: '' };
    } else {
      return { label: dueDateStr, className: '' };
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

  // Kick off application
  window.addEventListener('DOMContentLoaded', init);
})();
