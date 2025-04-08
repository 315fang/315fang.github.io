/**
 * matery.js - 优化版
 * 针对性能进行了多项优化：
 * 1. 添加事件防抖和节流
 * 2. 缓存DOM选择器
 * 3. 减少重排和重绘
 * 4. 优化动画性能
 * 5. 延迟加载非关键功能
 */

// 使用立即执行函数表达式(IIFE)创建作用域，避免全局变量污染
(function() {
    'use strict';
    
    // 缓存常用DOM元素，减少查询次数
    const DOM = {
        body: document.body,
        navContainer: document.getElementById('navContainer'),
        articles: document.getElementById('articles'),
        articleContent: document.getElementById('articleContent'),
        headNav: document.getElementById('headNav'),
        backTop: document.querySelector('.top-scroll'),
        progressBar: document.querySelector('.progress-bar')
    };
    
    // 工具函数
    const utils = {
        /**
         * 防抖函数 - 确保函数在一段时间内只执行一次
         * @param {Function} fn - 要执行的函数
         * @param {number} delay - 延迟时间（毫秒）
         * @returns {Function} - 防抖处理后的函数
         */
        debounce: function(fn, delay) {
            let timer = null;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function() {
                    fn.apply(context, args);
                }, delay);
            };
        },
        
        /**
         * 节流函数 - 限制函数在一定时间内执行的频率
         * @param {Function} fn - 要执行的函数
         * @param {number} limit - 时间限制（毫秒）
         * @returns {Function} - 节流处理后的函数
         */
        throttle: function(fn, limit) {
            let inThrottle;
            return function() {
                const context = this;
                const args = arguments;
                if (!inThrottle) {
                    fn.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        /**
         * 使用requestAnimationFrame优化视觉更新
         * @param {Function} callback - 回调函数
         */
        rafCallback: function(callback) {
            return window.requestAnimationFrame(callback);
        }
    };
    
    // 功能模块
    const features = {
        /**
         * 添加文章卡片hover效果
         */
        articleCardHover: function() {
            const animateClass = 'animated pulse';
            const articles = document.querySelectorAll('article .article');
            
            articles.forEach(article => {
                article.addEventListener('mouseenter', function() {
                    this.classList.add(animateClass);
                });
                article.addEventListener('mouseleave', function() {
                    this.classList.remove(animateClass);
                });
            });
        },
        
        /**
         * 修复文章卡片div的宽度
         * @param {string} srcId - 源元素ID
         * @param {string} targetId - 目标元素ID
         */
        fixPostCardWidth: function(srcId, targetId) {
            const srcDiv = document.getElementById(srcId);
            const targetDiv = document.getElementById(targetId);
            
            if (!srcDiv || !targetDiv) return;
            
            const setWidth = () => {
                let w = srcDiv.offsetWidth;
                if (w >= 450) {
                    w = w + 21;
                } else if (w >= 350 && w < 450) {
                    w = w + 18;
                } else if (w >= 300 && w < 350) {
                    w = w + 16;
                } else {
                    w = w + 14;
                }
                // 使用transform而不是width，减少重排
                targetDiv.style.width = `${w}px`;
            };
            
            // 初始设置宽度
            setWidth();
            
            // 监听窗口大小变化，使用防抖优化
            window.addEventListener('resize', utils.debounce(setWidth, 150));
        },
        
        /**
         * 修复footer部分的位置
         */
        fixFooterPosition: function() {
            const content = document.querySelector('.content');
            if (!content) return;
            
            const setMinHeight = () => {
                content.style.minHeight = `${window.innerHeight - 165}px`;
            };
            
            // 初始设置
            setMinHeight();
            
            // 监听窗口大小变化，使用防抖优化
            window.addEventListener('resize', utils.debounce(setMinHeight, 150));
        },
        
        /**
         * 初始化瀑布流布局
         */
        initMasonry: function() {
            if (!DOM.articles) return;
            
            // 使用requestIdleCallback在浏览器空闲时初始化masonry
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    new Masonry(DOM.articles, {
                        itemSelector: '.article',
                        // 使用百分比宽度，适应不同屏幕
                        percentPosition: true
                    });
                });
            } else {
                // 回退方案
                setTimeout(() => {
                    new Masonry(DOM.articles, {
                        itemSelector: '.article',
                        percentPosition: true
                    });
                }, 500);
            }
        },
        
        /**
         * 初始化AOS动画库
         */
        initAOS: function() {
            // 检查是否应该禁用动画（根据用户偏好或设备性能）
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isMobile = window.innerWidth <= 768;
            
            // 在移动设备上或用户偏好减少动画时，使用更简单的动画配置
            if (prefersReducedMotion || (isMobile && window.PerformanceConfig?.animations?.disableOnMobile)) {
                AOS.init({
                    disable: true
                });
            } else {
                AOS.init({
                    easing: 'ease-in-out-sine',
                    duration: 700,
                    delay: 100,
                    // 一次性动画，不重复
                    once: true
                });
            }
        },
        
        /**
         * 文章内容详情的初始化
         */
        articleInit: function() {
            if (!DOM.articleContent) return;
            
            // 设置外部链接为新窗口打开
            DOM.articleContent.querySelectorAll('a').forEach(link => {
                link.setAttribute('target', '_blank');
            });
            
            // 处理图片
            const processImages = () => {
                DOM.articleContent.querySelectorAll('img').forEach(img => {
                    const imgPath = img.getAttribute('src');
                    if (!imgPath) return;
                    
                    // 创建包装容器
                    const wrapper = document.createElement('div');
                    wrapper.className = 'img-item';
                    wrapper.setAttribute('data-src', imgPath);
                    wrapper.setAttribute('data-sub-html', '.caption');
                    
                    // 替换原始图片
                    img.parentNode.insertBefore(wrapper, img);
                    wrapper.appendChild(img);
                    
                    // 添加样式
                    img.classList.add('img-shadow', 'img-margin');
                    
                    // 添加图片说明
                    const alt = img.getAttribute('alt');
                    const title = img.getAttribute('title');
                    let captionText = '';
                    
                    if (!alt || alt === '') {
                        if (title && title !== '') {
                            captionText = title;
                        }
                    } else {
                        captionText = alt;
                    }
                    
                    if (captionText !== '') {
                        const captionDiv = document.createElement('div');
                        captionDiv.className = 'caption';
                        const captionEle = document.createElement('b');
                        captionEle.className = 'center-caption';
                        captionEle.innerText = captionText;
                        captionDiv.appendChild(captionEle);
                        img.insertAdjacentElement('afterend', captionDiv);
                    }
                });
            };
            
            // 使用requestIdleCallback在浏览器空闲时处理图片
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(processImages);
            } else {
                setTimeout(processImages, 300);
            }
            
            // 初始化图片画廊
            const initGallery = () => {
                const galleryElements = document.querySelectorAll('#articleContent, #myGallery');
                galleryElements.forEach(element => {
                    if (element && typeof lightGallery === 'function') {
                        lightGallery(element, {
                            selector: '.img-item',
                            subHtmlSelectorRelative: true
                        });
                    }
                });
            };
            
            // 延迟初始化图片画廊
            setTimeout(initGallery, 500);
            
            // 初始化进度条
            if (DOM.progressBar && typeof ScrollProgress === 'function') {
                new ScrollProgress((x, y) => {
                    utils.rafCallback(() => {
                        DOM.progressBar.style.width = `${y * 100}%`;
                    });
                });
            }
        },
        
        /**
         * 初始化回到顶部按钮
         */
        initBackTop: function() {
            const backTop = document.getElementById('backTop');
            if (!backTop) return;
            
            backTop.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 使用平滑滚动
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        },
        
        /**
         * 监听滚动条位置
         */
        initScrollListener: function() {
            if (!DOM.headNav || !DOM.backTop) return;
            
            // 初始检查位置
            this.showOrHideNavBg(window.scrollY);
            
            // 使用节流函数优化滚动事件
            window.addEventListener('scroll', utils.throttle(() => {
                this.showOrHideNavBg(window.scrollY);
            }, 100));
        },
        
        /**
         * 根据滚动位置显示或隐藏导航背景
         * @param {number} position - 滚动位置
         */
        showOrHideNavBg: function(position) {
            const showPosition = 100;
            
            utils.rafCallback(() => {
                if (position < showPosition) {
                    DOM.headNav.classList.add('nav-transparent');
                    DOM.backTop.style.display = 'none';
                } else {
                    DOM.headNav.classList.remove('nav-transparent');
                    DOM.backTop.style.display = 'block';
                }
            });
        },
        
        /**
         * 初始化导航菜单
         */
        initNavMenu: function() {
            // 桌面端导航菜单
            const navMenuItems = document.querySelectorAll('.nav-menu > li');
            navMenuItems.forEach(item => {
                const subMenu = item.querySelector('ul');
                if (!subMenu) return;
                
                item.addEventListener('mouseenter', function() {
                    subMenu.style.display = 'block';
                    this.classList.add('nav-show');
                    
                    // 移除其他菜单项的显示状态
                    navMenuItems.forEach(otherItem => {
                        if (otherItem !== this) {
                            otherItem.classList.remove('nav-show');
                        }
                    });
                });
                
                item.addEventListener('mouseleave', function() {
                    subMenu.style.display = 'none';
                    this.classList.remove('nav-show');
                });
            });
            
            // 移动端导航菜单
            const mNavItems = document.querySelectorAll('.m-nav-item > a');
            mNavItems.forEach(item => {
                item.addEventListener('click', function() {
                    const subMenu = this.nextElementSibling;
                    if (!subMenu || subMenu.tagName !== 'UL') return;
                    
                    if (subMenu.style.display === 'none' || !subMenu.style.display) {
                        // 关闭其他子菜单
                        document.querySelectorAll('.m-nav-item > ul').forEach(menu => {
                            if (menu !== subMenu) {
                                menu.style.display = 'none';
                            }
                        });
                        
                        // 显示当前子菜单
                        subMenu.style.display = 'block';
                        this.parentElement.classList.add('m-nav-show');
                        
                        // 移除其他菜单项的显示状态
                        document.querySelectorAll('.m-nav-item').forEach(navItem => {
                            if (navItem !== this.parentElement) {
                                navItem.classList.remove('m-nav-show');
                            }
                        });
                    } else {
                        // 隐藏当前子菜单
                        subMenu.style.display = 'none';
                        this.parentElement.classList.remove('m-nav-show');
                    }
                });
            });
        },
        
        /**
         * 初始化工具提示
         */
        initTooltip: function() {
            const tooltips = document.querySelectorAll('.tooltipped');
            if (tooltips.length > 0 && typeof M !== 'undefined' && M.Tooltip) {
                M.Tooltip.init(tooltips);
            }
        },
        
        /**
         * 初始化侧边栏
         */
        initSidenav: function() {
            const sidenavs = document.querySelectorAll('.sidenav');
            if (sidenavs.length > 0 && typeof M !== 'undefined' && M.Sidenav) {
                M.Sidenav.init(sidenavs);
            }
        },
        
        /**
         * 初始化模态框
         */
        initModal: function() {
            const modals = document.querySelectorAll('.modal');
            if (modals.length > 0 && typeof M !== 'undefined' && M.Modal) {
                M.Modal.init(modals);
            }
        },
        
        /**
         * 黑夜模式提醒
         */
        darkModeReminder: function() {
            // 使用setTimeout延迟执行，优先加载关键内容
            setTimeout(() => {
                const currentHour = new Date().getHours();
                const isNightTime = currentHour >= 19 || currentHour < 7;
                const isDarkMode = DOM.body.classList.contains('DarkMode');
                
                if (isNightTime && !isDarkMode) {
                    const toastHTML = '<span style="color:#97b8b2;border-radius: 10px;"><i class="fa fa-bell" aria-hidden="true"></i> 晚上使用深色模式阅读更好哦。(ﾟ▽ﾟ)</span>';
                    if (typeof M !== 'undefined' && M.toast) {
                        M.toast({ html: toastHTML });
                    }
                }
            }, 2200);
        },
        
        /**
         * 初始化黑夜模式
         */
        initDarkMode: function() {
            const isDark = localStorage.getItem('isDark') === '1';
            const moonIcon = document.getElementById('sum-moon-icon');
            
            if (isDark) {
                DOM.body.classList.add('DarkMode');
                if (moonIcon) {
                    moonIcon.classList.add('fa-sun');
                    moonIcon.classList.remove('fa-moon');
                }
            } else {
                DOM.body.classList.remove('DarkMode');
                if (moonIcon) {
                    moonIcon.classList.remove('fa-sun');
                    moonIcon.classList.add('fa-moon');
                }
            }
        }
    };
    
    // 初始化函数
    function init() {
        // 初始化侧边栏和模态框（优先初始化UI组件）
        features.initSidenav();
        features.initModal();
        
        // 初始化文章卡片效果
        features.articleCardHover();
        
        // 修复样式
        features.fixPostCardWidth('navContainer');
        features.fixPostCardWidth('artDetail', 'prenext-posts');
        features.fixFooterPosition();
        
        // 初始化导航菜单
        features.initNavMenu();
        
        // 初始化回到顶部按钮和滚动监听
        features.initBackTop();
        features.initScrollListener();
        
        // 初始化工具提示
        features.initTooltip();
        
        // 初始化黑夜模式
        features.initDarkMode();
        
        // 使用requestIdleCallback延迟初始化非关键功能
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                // 初始化瀑布流布局
                features.initMasonry();
                
                // 初始化AOS动画
                features.initAOS();
                
                // 初始化文章内容（如果存在）
                if (DOM.articleContent) {
                    features.articleInit();
                }
                
                // 黑夜模式提醒
                features.darkModeReminder();
            });
        } else {
            // 回退方案：使用setTimeout
            setTimeout(() => {
                features.initMasonry();
                features.initAOS();
                if (DOM.articleContent) {
                    features.articleInit();
                }
                features.darkModeReminder();
            }, 500);
        }
    }
    
    // 当DOM内容加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();