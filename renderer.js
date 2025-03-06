// DOM元素
const backButton = document.getElementById('back-button');
const forwardButton = document.getElementById('forward-button');
const refreshButton = document.getElementById('refresh-button');
const homeButton = document.getElementById('home-button');
const urlInput = document.getElementById('url-input');
const goButton = document.getElementById('go-button');
const bookmarkButton = document.getElementById('bookmark-button');
const bookmarksMenuButton = document.getElementById('bookmarks-menu-button');
const newTabButton = document.getElementById('new-tab-button');
const tabsBar = document.getElementById('tabs-bar');
const browserContainer = document.getElementById('browser-container');
const bookmarksPanel = document.getElementById('bookmarks-panel');
const bookmarksList = document.getElementById('bookmarks-list');

// 初始标签页ID和计数器
let activeTabId = 'tab-1';
let tabCounter = 1;
const bookmarks = [];

// 创建初始标签页
createTabElement('tab-1', '新标签页');

// 初始网页加载完成后设置标题和地址栏
document.addEventListener('DOMContentLoaded', () => {
  const initialWebview = document.getElementById('webview-1');
  
  // 使用完整的事件设置函数
  setWebviewEvents(initialWebview, 'tab-1');
  
  // 初始webview加载完成时，显示加载状态
  initialWebview.addEventListener('did-start-loading', () => {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = '正在加载...';
    document.body.appendChild(loadingIndicator);
    setTimeout(() => {
      if (document.getElementById('loading-indicator')) {
        document.getElementById('loading-indicator').remove();
      }
    }, 3000);
  });
  
  // 监听在新标签页中打开链接的请求
  window.electronAPI.onOpenLinkInNewTab((url) => {
    createNewTab(url);
  });
});

// 导航按钮事件监听
backButton.addEventListener('click', () => {
  const activeWebview = getActiveWebview();
  if (activeWebview && activeWebview.canGoBack()) {
    activeWebview.goBack();
  }
});

forwardButton.addEventListener('click', () => {
  const activeWebview = getActiveWebview();
  if (activeWebview && activeWebview.canGoForward()) {
    activeWebview.goForward();
  }
});

refreshButton.addEventListener('click', () => {
  const activeWebview = getActiveWebview();
  if (activeWebview) {
    activeWebview.reload();
  }
});

homeButton.addEventListener('click', () => {
  const activeWebview = getActiveWebview();
  if (activeWebview) {
    activeWebview.src = 'https://www.google.com/';
  }
});

// 地址栏事件监听
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    navigateToUrl();
  }
});

goButton.addEventListener('click', navigateToUrl);

// 书签功能
bookmarkButton.addEventListener('click', () => {
  const activeWebview = getActiveWebview();
  if (activeWebview) {
    const url = activeWebview.src;
    const title = activeWebview.getTitle();
    addBookmark(title, url);
  }
});

bookmarksMenuButton.addEventListener('click', () => {
  bookmarksPanel.classList.toggle('hidden');
  renderBookmarks();
});

// 隐藏书签面板当点击其他地方
document.addEventListener('click', (e) => {
  if (!bookmarksPanel.contains(e.target) && e.target !== bookmarksMenuButton) {
    bookmarksPanel.classList.add('hidden');
  }
});

// 新建标签页
newTabButton.addEventListener('click', () => {
  createNewTab();
});

// 辅助函数
function navigateToUrl() {
  let url = urlInput.value.trim();
  
  if (url) {
    // 添加http协议如果没有
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // 判断是否为URL或搜索词
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        // 是搜索词，使用Google搜索
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }
    
    const activeWebview = getActiveWebview();
    if (activeWebview) {
      activeWebview.src = url;
    }
  }
}

function getActiveWebview() {
  const activeTab = document.querySelector(`.browser-tab[data-tab-id="${activeTabId}"]`);
  if (activeTab) {
    return activeTab.querySelector('webview');
  }
  return null;
}

function updateTabInfo(tabId, title, url) {
  // 更新标签标题
  const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (tabElement) {
    const titleElement = tabElement.querySelector('.tab-title');
    if (titleElement) {
      titleElement.textContent = title || '新标签页';
      tabElement.title = title || '新标签页';
    }
  }
  
  // 如果是当前活动标签，更新地址栏
  if (tabId === activeTabId) {
    urlInput.value = url || '';
  }
}

function createTabElement(tabId, title) {
  const tab = document.createElement('div');
  tab.className = 'tab flex items-center px-3 min-w-[180px] max-w-[180px] h-9 bg-gray-200 border-r border-gray-300 cursor-pointer relative overflow-hidden whitespace-nowrap text-ellipsis';
  tab.dataset.tabId = tabId;
  tab.title = title;
  
  const tabTitle = document.createElement('div');
  tabTitle.className = 'tab-title flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs';
  tabTitle.textContent = title;
  
  const closeButton = document.createElement('div');
  closeButton.className = 'tab-close';
  closeButton.textContent = '×';
  
  tab.appendChild(tabTitle);
  tab.appendChild(closeButton);
  tabsBar.appendChild(tab);
  
  // 标签点击事件
  tab.addEventListener('click', (e) => {
    if (e.target !== closeButton) {
      switchToTab(tabId);
    }
  });
  
  // 关闭标签事件
  closeButton.addEventListener('click', () => {
    closeTab(tabId);
  });
  
  return tab;
}

function switchToTab(tabId) {
  // 取消激活当前标签
  const currentActiveTab = document.querySelector('.tab.active');
  if (currentActiveTab) {
    currentActiveTab.classList.remove('active');
    currentActiveTab.classList.remove('bg-white');
    currentActiveTab.classList.add('bg-gray-200');
  }
  
  const currentActiveWebview = document.querySelector('.browser-tab.active');
  if (currentActiveWebview) {
    currentActiveWebview.classList.remove('active');
    currentActiveWebview.classList.add('hidden');
  }
  
  // 激活新标签
  const newTab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (newTab) {
    newTab.classList.add('active');
    newTab.classList.remove('bg-gray-200');
    newTab.classList.add('bg-white');
  }
  
  const newWebviewContainer = document.querySelector(`.browser-tab[data-tab-id="${tabId}"]`);
  if (newWebviewContainer) {
    newWebviewContainer.classList.add('active');
    newWebviewContainer.classList.remove('hidden');
  }
  
  // 更新当前活动标签ID
  activeTabId = tabId;
  
  // 更新地址栏
  const activeWebview = getActiveWebview();
  if (activeWebview) {
    urlInput.value = activeWebview.src;
  }
}

function closeTab(tabId) {
  // 如果只有一个标签，不关闭
  if (tabsBar.children.length <= 1) {
    return;
  }
  
  // 移除标签和webview
  const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  const webviewContainer = document.querySelector(`.browser-tab[data-tab-id="${tabId}"]`);
  
  if (tabElement) {
    tabElement.remove();
  }
  
  if (webviewContainer) {
    webviewContainer.remove();
  }
  
  // 如果关闭的是当前标签，切换到其他标签
  if (tabId === activeTabId) {
    const remainingTabs = document.querySelectorAll('.tab');
    if (remainingTabs.length > 0) {
      const newTabId = remainingTabs[0].dataset.tabId;
      switchToTab(newTabId);
    }
  }
}

function setWebviewEvents(webview, tabId) {
  webview.addEventListener('did-start-loading', () => {
    updateTabInfo(tabId, '加载中...', webview.src);
  });
  
  webview.addEventListener('did-stop-loading', () => {
    updateTabInfo(tabId, webview.getTitle(), webview.src);
  });
  
  webview.addEventListener('dom-ready', () => {
    updateTabInfo(tabId, webview.getTitle(), webview.src);
    
    // 添加右键菜单处理
    webview.addEventListener('context-menu', (event) => {
      window.electronAPI.showContextMenu({
        x: event.params.x,
        y: event.params.y,
        linkURL: event.params.linkURL,
        srcURL: event.params.srcURL
      });
    });
  });
  
  // 导航事件
  webview.addEventListener('will-navigate', (e) => {
    updateTabInfo(tabId, '加载中...', e.url);
  });
  
  // 新窗口请求
  webview.addEventListener('new-window', (e) => {
    // 在当前标签页中打开链接，而不是创建新标签页
    e.preventDefault();
    webview.src = e.url;
    
    // 更新标签信息
    updateTabInfo(tabId, '加载中...', e.url);
  });
}

function addBookmark(title, url) {
  // 检查是否已经存在
  const exists = bookmarks.some(bookmark => bookmark.url === url);
  if (!exists) {
    bookmarks.push({ title, url });
    renderBookmarks();
  }
}

function renderBookmarks() {
  bookmarksList.innerHTML = '';
  
  if (bookmarks.length === 0) {
    const noBookmarks = document.createElement('div');
    noBookmarks.textContent = '暂无书签';
    noBookmarks.className = 'p-2 text-gray-500';
    bookmarksList.appendChild(noBookmarks);
    return;
  }
  
  bookmarks.forEach((bookmark, index) => {
    const bookmarkItem = document.createElement('div');
    bookmarkItem.className = 'flex items-center p-2 rounded cursor-pointer hover:bg-gray-100';
    
    const title = document.createElement('div');
    title.className = 'flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm';
    title.textContent = bookmark.title;
    
    bookmarkItem.appendChild(title);
    bookmarksList.appendChild(bookmarkItem);
    
    // 点击书签导航到URL
    bookmarkItem.addEventListener('click', () => {
      const activeWebview = getActiveWebview();
      if (activeWebview) {
        activeWebview.src = bookmark.url;
      }
      bookmarksPanel.classList.add('hidden');
    });
  });
}

// 新建标签页函数
function createNewTab(url = 'https://www.google.com/') {
  tabCounter++;
  const newTabId = `tab-${tabCounter}`;
  
  // 创建标签页元素
  createTabElement(newTabId, '新标签页');
  
  // 创建webview元素
  const webviewContainer = document.createElement('div');
  webviewContainer.className = 'browser-tab';
  webviewContainer.dataset.tabId = newTabId;
  
  const webview = document.createElement('webview');
  webview.id = `webview-${tabCounter}`;
  webview.setAttribute('src', url);
  webview.setAttribute('nodeintegration', 'false');
  webview.setAttribute('partition', 'persist:main');
  webview.setAttribute('allowpopups', '');
  webview.setAttribute('webpreferences', 'allowRunningInsecureContent=yes');
  
  webviewContainer.appendChild(webview);
  browserContainer.appendChild(webviewContainer);
  
  // 设置事件监听器
  setWebviewEvents(webview, newTabId);
  
  // 激活新标签页
  switchToTab(newTabId);
  
  return { tabId: newTabId, webview };
} 