const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开新标签页
  openNewTab: (url) => {
    ipcRenderer.send('open-new-tab', url);
    return new Promise((resolve) => {
      ipcRenderer.once('open-tab-reply', (_, arg) => {
        resolve(arg);
      });
    });
  },
  
  // 导航操作
  navigate: (action, url) => {
    ipcRenderer.send('navigate', { action, url });
    return new Promise((resolve) => {
      ipcRenderer.once('navigate-reply', (_, arg) => {
        resolve(arg);
      });
    });
  },
  
  // 添加书签
  addBookmark: (title, url) => {
    ipcRenderer.send('add-bookmark', { title, url });
    return new Promise((resolve) => {
      ipcRenderer.once('add-bookmark-reply', (_, arg) => {
        resolve(arg);
      });
    });
  },
  
  // 获取书签
  getBookmarks: () => {
    ipcRenderer.send('get-bookmarks');
    return new Promise((resolve) => {
      ipcRenderer.once('get-bookmarks-reply', (_, arg) => {
        resolve(arg);
      });
    });
  },
  
  // 上下文菜单
  showContextMenu: (params) => {
    ipcRenderer.send('show-context-menu', params);
  },
  
  // 监听在新标签页中打开链接
  onOpenLinkInNewTab: (callback) => {
    ipcRenderer.on('open-link-in-new-tab', (_, url) => {
      callback(url);
    });
  }
}); 