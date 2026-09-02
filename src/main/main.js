const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// File persistence path in user data folder
const getDataFilePath = () => {
  return path.join(app.getPath('userData'), 'project_todos.json');
};

// Default initial data if none exists
const getInitialData = () => {
  const proj1Id = 'proj-1';
  const proj2Id = 'proj-2';

  const defaultProjects = [
    {
      id: proj1Id,
      name: 'Client Portal Redesign',
      description: 'Modernizing client dashboard, onboarding flow, and analytics widgets.',
      color: '#6366f1',
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: proj2Id,
      name: 'Mobile App Launch',
      description: 'Preparing MVP release for iOS and Android app stores.',
      color: '#06b6d4',
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ];

  const defaultTodos = [
    {
      id: 'task-1',
      projectId: proj1Id,
      title: 'Review wireframes with stakeholders 🎨',
      description: 'Present the updated layout mockups and collect feedback.',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      projectId: proj1Id,
      title: 'Integrate authentication endpoints 🔐',
      description: 'Connect login and sign-up forms with the REST API backend.',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      projectId: proj1Id,
      title: 'Design system tokens approved ✅',
      description: 'Export color palette, typography and elevation tokens.',
      priority: 'Low',
      dueDate: '',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      projectId: proj2Id,
      title: 'Prepare App Store screenshots and description 📱',
      description: 'Generate 6.5" and 5.5" display graphics with promotional text.',
      priority: 'High',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-5',
      projectId: proj2Id,
      title: 'Configure crash reporting & telemetry 📊',
      description: 'Set up error boundary alerts and analytics hooks.',
      priority: 'Medium',
      dueDate: '',
      completed: true,
      createdAt: new Date().toISOString()
    }
  ];

  return { projects: defaultProjects, todos: defaultTodos };
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0f19',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC: Project & Todo Storage
ipcMain.handle('todos:load', async () => {
  const filePath = getDataFilePath();
  const oldFilePath = path.join(app.getPath('userData'), 'todos.json');

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.projects)) {
        return parsed;
      }
    }

    // Check if legacy flat todos file exists to migrate
    if (fs.existsSync(oldFilePath)) {
      const oldData = fs.readFileSync(oldFilePath, 'utf8');
      const oldTodos = JSON.parse(oldData);
      if (Array.isArray(oldTodos)) {
        const defaultProj = {
          id: 'proj-migrated',
          name: 'General Project',
          description: 'Tasks imported from initial setup',
          color: '#6366f1',
          createdAt: new Date().toISOString()
        };
        const migrated = {
          projects: [defaultProj],
          todos: oldTodos.map(t => ({ ...t, projectId: t.projectId || defaultProj.id }))
        };
        fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2), 'utf8');
        return migrated;
      }
    }

    // First run with no data: initialize defaults
    const initial = getInitialData();
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  } catch (error) {
    console.error('Error loading project todos data:', error);
    return getInitialData();
  }
});

ipcMain.handle('todos:save', async (_, data) => {
  const filePath = getDataFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: error.message };
  }
});

// IPC: Export Backup Data
ipcMain.handle('data:export', async (_, payload) => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const today = new Date().toISOString().split('T')[0];
    const defaultFilename = `taskflow-backup-${today}.json`;

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export TaskFlow Backup',
      defaultPath: defaultFilename,
      filters: [
        { name: 'JSON Backup Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return { success: true, filePath };
  } catch (err) {
    console.error('Error exporting backup:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Import Backup Data
ipcMain.handle('data:import', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select TaskFlow Backup File',
      properties: ['openFile'],
      filters: [
        { name: 'JSON Backup Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const rawContent = fs.readFileSync(filePaths[0], 'utf8');
    const parsed = JSON.parse(rawContent);

    // Validate: must contain projects array or todos array
    if (!parsed || (!Array.isArray(parsed.projects) && !Array.isArray(parsed.todos))) {
      return { success: false, error: 'Invalid backup file format. Expected projects or tasks array.' };
    }

    return {
      success: true,
      filePath: filePaths[0],
      data: {
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        todos: Array.isArray(parsed.todos) ? parsed.todos : []
      }
    };
  } catch (err) {
    console.error('Error importing backup:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Window Controls
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
