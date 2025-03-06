const { app, BrowserWindow, Menu, ipcMain, dialog, contextBridge, webContents } = require('electron');
const path = require('path');
const url = require('url');

// 设置开发环境变量
process.env.NODE_ENV = 'development';

// 保持对窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow;
let browserWindows = [];

// 创建浏览器窗口的函数
function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,  // 允许跨域请求
      allowRunningInsecureContent: true,  // 允许https页面运行http内容
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 关闭窗口时触发
  mainWindow.on('closed', function () {
    // 取消引用窗口对象
    mainWindow = null;
    browserWindows = browserWindows.filter(win => win !== mainWindow);
  });

  browserWindows.push(mainWindow);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，应用程序及其菜单栏通常会保持活动状态，直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') app.quit();
});

// 创建应用程序菜单
const createMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建窗口',
          accelerator: 'CmdOrCtrl+N',
          click() {
            createWindow();
          }
        },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'forceReload', label: '强制刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click() {
            dialog.showMessageBox({
              title: '关于',
              message: 'Electron Browser v1.0.0',
              detail: '一个使用Electron构建的简单网页浏览器'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(createMenu);

// IPC通信处理
ipcMain.on('open-new-tab', (event, url) => {
  event.reply('open-tab-reply', { url });
});

ipcMain.on('navigate', (event, { action, url }) => {
  event.reply('navigate-reply', { action, url });
});

ipcMain.on('show-context-menu', (event, params) => {
  const template = [
    {
      label: '在新标签页中打开链接',
      click: () => {
        event.sender.send('open-link-in-new-tab', params.linkURL);
      }
    },
    { type: 'separator' },
    { role: 'copy', label: '复制' },
    { role: 'copyLink', label: '复制链接地址' }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
}); 