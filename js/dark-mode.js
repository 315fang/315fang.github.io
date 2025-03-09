// 深色模式切换功能
const darkModeToggle = () => {
  const body = document.body;
  const darkModeClass = 'dark-mode';
  const darkModeStorageKey = 'darkMode';

  // 检查本地存储中的深色模式设置
  const isDarkMode = localStorage.getItem(darkModeStorageKey) === 'true';
  if (isDarkMode) {
    body.classList.add(darkModeClass);
  }

  // 创建深色模式切换按钮
  const createToggleButton = () => {
    const button = document.createElement('button');
    button.id = 'dark-mode-toggle';
    button.innerHTML = `<i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>`;
    button.className = 'dark-mode-toggle';
    document.body.appendChild(button);

    // 添加点击事件
    button.addEventListener('click', () => {
      body.classList.toggle(darkModeClass);
      const isDark = body.classList.contains(darkModeClass);
      localStorage.setItem(darkModeStorageKey, isDark);
      button.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
    });
  };

  // 页面加载完成后创建按钮
  document.addEventListener('DOMContentLoaded', createToggleButton);
};

// 初始化深色模式功能
darkModeToggle();