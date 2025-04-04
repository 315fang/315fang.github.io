var searchFunc = function (path, search_id, content_id) {
    'use strict';
    
    // 缓存DOM元素
    var $input = document.getElementById(search_id);
    var $resultContent = document.getElementById(content_id);
    var searchData = null;
    var searchIndex = null;
    
    // 添加防抖函数
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // 使用Web Worker进行搜索处理，避免阻塞主线程
    function createSearchWorker() {
        const workerCode = `
            self.onmessage = function(e) {
                const { keywords, data } = e.data;
                const keywordArray = keywords.split(/[\s\-]+/);
                const results = [];
                let matchCount = 0;
                
                data.forEach(function(item) {
                    let isMatch = true;
                    let firstOccur = -1;
                    
                    if (item.title && item.content) {
                        keywordArray.forEach(function(keyword) {
                            const indexTitle = item.title.indexOf(keyword);
                            const indexContent = item.content.indexOf(keyword);
                            
                            if (indexTitle < 0 && indexContent < 0) {
                                isMatch = false;
                            } else {
                                if (indexContent >= 0 && firstOccur < 0) {
                                    firstOccur = indexContent;
                                } else if (indexContent < 0 && firstOccur < 0 && indexTitle >= 0) {
                                    firstOccur = 0;
                                }
                            }
                        });
                    } else {
                        isMatch = false;
                    }
                    
                    if (isMatch && matchCount < 10) {
                        matchCount++;
                        let resultItem = {
                            title: item.originalTitle,
                            url: item.url,
                            firstOccur: firstOccur,
                            content: item.originalContent
                        };
                        results.push(resultItem);
                    }
                });
                
                self.postMessage(results);
            };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        // 清理URL对象，避免内存泄漏
        worker.addEventListener('message', function() {
            URL.revokeObjectURL(workerUrl);
        }, { once: true });
        
        return worker;
    }
    
    // 使用IntersectionObserver实现搜索结果的懒加载
    function setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const item = entry.target;
                        // 如果有延迟加载的内容，在这里处理
                        observer.unobserve(item);
                    }
                });
            }, { rootMargin: '100px' });
            
            // 观察搜索结果项
            document.querySelectorAll('.search-result-item').forEach(item => {
                observer.observe(item);
            });
        }
    }
    
    // 使用IndexedDB缓存搜索数据
    function cacheSearchData(data) {
        if ('indexedDB' in window) {
            const request = indexedDB.open('searchCache', 1);
            
            request.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('searchData')) {
                    db.createObjectStore('searchData', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = function(e) {
                const db = e.target.result;
                const transaction = db.transaction(['searchData'], 'readwrite');
                const store = transaction.objectStore('searchData');
                
                // 存储搜索数据，使用时间戳作为ID
                store.put({
                    id: 'searchData_' + Date.now(),
                    data: data,
                    timestamp: Date.now()
                });
            };
        }
    }
    
    // 从缓存获取搜索数据
    function getSearchDataFromCache(callback) {
        if ('indexedDB' in window) {
            const request = indexedDB.open('searchCache', 1);
            
            request.onsuccess = function(e) {
                const db = e.target.result;
                const transaction = db.transaction(['searchData'], 'readonly');
                const store = transaction.objectStore('searchData');
                const index = store.index('timestamp');
                
                // 获取最新的缓存数据
                const getLatest = index.openCursor(null, 'prev');
                
                getLatest.onsuccess = function(e) {
                    const cursor = e.target.result;
                    if (cursor) {
                        callback(cursor.value.data);
                    } else {
                        callback(null);
                    }
                };
            };
            
            request.onerror = function() {
                callback(null);
            };
        } else {
            callback(null);
        }
    }
    
    // 高效渲染搜索结果
    function renderSearchResults(results, keywords) {
        // 清空结果区域
        $resultContent.innerHTML = "";
        
        if (results.length === 0) {
            $resultContent.innerHTML = '<div class="search-result-empty">没有找到相关结果</div>';
            return;
        }
        
        // 使用DocumentFragment减少DOM重绘
        const resultFragment = document.createDocumentFragment();
        const resultList = document.createElement('ul');
        resultList.className = 'search-result-list';
        
        // 分割关键词用于高亮
        const keywordArray = keywords.split(/[\s\-]+/);
        
        // 渲染结果
        results.forEach(function(result) {
            const resultItem = document.createElement('li');
            resultItem.className = 'search-result-item';
            
            // 创建标题链接
            const resultLink = document.createElement('a');
            resultLink.setAttribute('href', result.url);
            resultLink.className = 'search-result-title';
            resultLink.textContent = result.title;
            resultItem.appendChild(resultLink);
            
            // 处理内容预览
            if (result.firstOccur >= 0) {
                const content = result.content.replace(/<[^>]+>/g, "");
                
                // 截取匹配内容周围的文本
                const start = Math.max(0, result.firstOccur - 20);
                const end = Math.min(content.length, result.firstOccur + 80);
                let matchContent = content.substring(start, end);
                
                // 高亮关键词
                keywordArray.forEach(function(keyword) {
                    if (keyword.trim()) {
                        const regS = new RegExp(keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "gi");
                        matchContent = matchContent.replace(regS, function(match) {
                            return '<em class="search-keyword">' + match + '</em>';
                        });
                    }
                });
                
                // 添加内容预览
                const contentPreview = document.createElement('p');
                contentPreview.className = 'search-result';
                contentPreview.innerHTML = matchContent + '...';
                resultItem.appendChild(contentPreview);
            }
            
            resultList.appendChild(resultItem);
        });
        
        resultFragment.appendChild(resultList);
        $resultContent.appendChild(resultFragment);
        
        // 设置懒加载
        setupLazyLoading();
    }
    
    // 初始化搜索功能
    function initSearch() {
        // 尝试从缓存获取数据
        getSearchDataFromCache(function(cachedData) {
            if (cachedData) {
                searchData = cachedData;
                // 预处理搜索数据
                prepareSearchData(searchData);
            } else {
                // 如果没有缓存，从服务器获取
                fetchSearchData();
            }
        });
    }
    
    // 从服务器获取搜索数据
    function fetchSearchData() {
        $.ajax({
            url: path,
            dataType: "xml",
            success: function (xmlResponse) {
                // 获取搜索数据
                searchData = $("entry", xmlResponse).map(function () {
                    return {
                        title: $("title", this).text(),
                        content: $("content", this).text(),
                        url: $("url", this).text()
                    };
                }).get();
                
                // 缓存数据
                cacheSearchData(searchData);
                
                // 预处理搜索数据
                prepareSearchData(searchData);
            },
            error: function() {
                $resultContent.innerHTML = '<div class="search-result-error">加载搜索数据失败</div>';
            }
        });
    }
    
    // 预处理搜索数据，创建搜索索引
    function prepareSearchData(data) {
        searchIndex = data.map(function(item) {
            return {
                originalTitle: item.title,
                originalContent: item.content,
                title: item.title.trim().toLowerCase(),
                content: item.content.trim().replace(/<[^>]+>/g, "").toLowerCase(),
                url: item.url
            };
        });
    }
    
    // 执行搜索
    function performSearch(keywords) {
        if (!searchIndex || searchIndex.length === 0) {
            $resultContent.innerHTML = '<div class="search-result-loading">正在加载搜索数据...</div>';
            return;
        }
        
        if (keywords.length <= 0) {
            $resultContent.innerHTML = "";
            return;
        }
        
        // 使用Web Worker进行搜索
        try {
            const worker = createSearchWorker();
            
            worker.onmessage = function(e) {
                renderSearchResults(e.data, keywords);
                worker.terminate(); // 搜索完成后终止Worker
            };
            
            worker.onerror = function() {
                // 如果Worker失败，回退到主线程搜索
                fallbackSearch(keywords);
                worker.terminate();
            };
            
            worker.postMessage({
                keywords: keywords,
                data: searchIndex
            });
        } catch (e) {
            // 如果不支持Web Worker，回退到主线程搜索
            fallbackSearch(keywords);
        }
    }
    
    // 回退到主线程搜索（当Web Worker不可用时）
    function fallbackSearch(keywords) {
        const keywordArray = keywords.split(/[\s\-]+/);
        const results = [];
        let matchCount = 0;
        
        searchIndex.forEach(function(item) {
            let isMatch = true;
            let firstOccur = -1;
            
            if (item.title && item.content) {
                keywordArray.forEach(function(keyword) {
                    const indexTitle = item.title.indexOf(keyword);
                    const indexContent = item.content.indexOf(keyword);
                    
                    if (indexTitle < 0 && indexContent < 0) {
                        isMatch = false;
                    } else {
                        if (indexContent >= 0 && firstOccur < 0) {
                            firstOccur = indexContent;
                        } else if (indexContent < 0 && firstOccur < 0 && indexTitle >= 0) {
                            firstOccur = 0;
                        }
                    }
                });
            } else {
                isMatch = false;
            }
            
            if (isMatch && matchCount < 10) {
                matchCount++;
                results.push({
                    title: item.originalTitle,
                    url: item.url,
                    firstOccur: firstOccur,
                    content: item.originalContent
                });
            }
        });
        
        renderSearchResults(results, keywords);
    }
    
    // 初始化
    initSearch();
    
    // 添加搜索输入事件监听
    $input.addEventListener('input', debounce(function() {
        const keywords = this.value.trim().toLowerCase();
        performSearch(keywords);
    }, 250)); // 250ms的防抖延迟，比原来的300ms更快响应
};