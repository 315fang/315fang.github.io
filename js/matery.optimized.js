$(function () {
    // 缓存常用的jQuery选择器结果
    const $window = $(window);
    const $nav = $('#headNav');
    const $backTop = $('.top-scroll');
    const $content = $('.content');
    
    /**
     * 添加文章卡片hover效果.
     */
    let articleCardHover = function () {
        const animateClass = 'animated pulse';
        // 使用事件委托减少事件监听器数量
        $('article').on('mouseenter', '.article', function () {
            $(this).addClass(animateClass);
        }).on('mouseleave', '.article', function () {
            $(this).removeClass(animateClass);
        });
    };
    
    /**
     * 修复文章卡片 div 的宽度.
     */
    let fixPostCardWidth = function (srcId, targetId) {
        const srcDiv = $('#' + srcId);
        if (srcDiv.length === 0) {
            return;
        }

        const w = srcDiv.width();
        let newWidth = w;
        
        // 使用更简洁的条件判断
        if (w >= 450) newWidth += 21;
        else if (w >= 350) newWidth += 18;
        else if (w >= 300) newWidth += 16;
        else newWidth += 14;
        
        $('#' + targetId).width(newWidth);
    };

    /**
     * 修复footer部分的位置，使得在内容比较少时，footer也会在底部.
     */
    let fixFooterPosition = function () {
        $content.css('min-height', window.innerHeight - 165);
    };

    /**
     * 修复样式.
     */
    let fixStyles = function () {
        fixPostCardWidth('navContainer');
        fixPostCardWidth('artDetail', 'prenext-posts');
        fixFooterPosition();
    };
    
    // 初始化调用一次
    fixStyles();

    // 使用防抖函数处理窗口调整事件，避免频繁触发
    let resizeTimeout;
    $window.resize(function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(fixStyles, 250);
    });

    // 初始化瀑布流布局
    $('#articles').masonry({
        itemSelector: '.article',
        // 添加过渡效果使布局更平滑
        transitionDuration: '0.5s'
    });

    // 使用更高效的AOS配置
    AOS.init({
        easing: 'ease-in-out-sine',
        duration: 700,
        delay: 100,
        once: true // 只触发一次动画，提高性能
    });

    /**
     * 文章内容详情的一些初始化特性
     */
    let articleInit = function () {
        const $articleContent = $('#articleContent');
        
        // 批量设置属性而不是逐个设置
        $articleContent.find('a').attr('target', '_blank');

        // 使用DocumentFragment减少DOM重绘
        const fragment = document.createDocumentFragment();
        
        $articleContent.find('img').each(function () {
            const $this = $(this);
            const imgPath = $this.attr('src');
            const alt = $this.attr('alt');
            const title = $this.attr('title');
            
            // 图片包装和添加类
            $this.wrap('<div class="img-item" data-src="' + imgPath + '" data-sub-html=".caption"></div>');
            $this.addClass("img-shadow img-margin");
            
            // 处理图片字幕
            let captionText = "";
            if (alt === undefined || alt === "") {
                if (title !== undefined && title !== "") {
                    captionText = title;
                }
            } else {
                captionText = alt;
            }
            
            // 只在有字幕时添加DOM元素
            if (captionText !== "") {
                const captionDiv = document.createElement('div');
                captionDiv.className = 'caption';
                const captionEle = document.createElement('b');
                captionEle.className = 'center-caption';
                captionEle.innerText = captionText;
                captionDiv.appendChild(captionEle);
                this.insertAdjacentElement('afterend', captionDiv);
            }
        });
        
        // 初始化图片画廊
        $('#articleContent, #myGallery').lightGallery({
            selector: '.img-item',
            subHtmlSelectorRelative: true
        });

        // 进度条初始化
        const progressElement = window.document.querySelector('.progress-bar');
        if (progressElement) {
            new ScrollProgress((x, y) => {
                // 使用requestAnimationFrame优化性能
                requestAnimationFrame(() => {
                    progressElement.style.width = y * 100 + '%';
                });
            });
        }
    };
    
    // 初始化文章
    articleInit();

    // 初始化模态框
    $('.modal').modal();

    // 回到顶部按钮事件
    $('#backTop').on('click', function () {
        $('body,html').animate({scrollTop: 0}, 400);
        return false;
    });

    // 当页面加载时检查滚动位置
    showOrHideNavBg($window.scrollTop());
    
    // 使用防抖处理滚动事件
    let scrollTimeout;
    $window.on('scroll', function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            showOrHideNavBg($window.scrollTop());
        }, 100);
    });

    function showOrHideNavBg(position) {
        const showPosition = 100;
        if (position < showPosition) {
            $nav.addClass('nav-transparent');
            $backTop.slideUp(300);
        } else {
            $nav.removeClass('nav-transparent');
            $backTop.slideDown(300);
        }
    }

    // 优化导航菜单交互
    $(".nav-menu>li").hover(function() {
        $(this).children('ul').stop(true, true).show();
        $(this).addClass('nav-show').siblings('li').removeClass('nav-show');
    }, function() {
        $(this).children('ul').stop(true, true).hide();
        $('.nav-item.nav-show').removeClass('nav-show');
    });
    
    // 移动端导航菜单点击事件
    $('.m-nav-item>a').on('click', function() {
        const $nextUl = $(this).next('ul');
        if ($nextUl.css('display') == "none") {
            $('.m-nav-item').children('ul').slideUp(300);
            $nextUl.slideDown(100);
            $(this).parent('li').addClass('m-nav-show').siblings('li').removeClass('m-nav-show');
        } else {
            $nextUl.slideUp(100);
            $('.m-nav-item.m-nav-show').removeClass('m-nav-show');
        }
    });

    // 初始化工具提示
    $('.tooltipped').tooltip();
});