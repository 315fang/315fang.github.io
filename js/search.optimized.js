/**
 * 搜索功能优化版
 * 性能优化：
 * 1. 添加防抖处理，减少不必要的搜索操作
 * 2. 使用DocumentFragment减少DOM重绘
 * 3. 预处理搜索数据，加速搜索过程
 * 4. 限制搜索结果数量，避免过多结果影响性能
 * 5. 实现搜索数据缓存
 */

// 使用立即执行函数表达式(IIFE)创建作用域
(function() {
    'use strict';
    
    // 搜索功能配置
    const CONFIG = {
        // 搜索防抖延迟（毫秒）
        debounceTime: 300,
        // 最大搜索结果数量
        maxResults: 30,
        // 搜索结果摘要长度
        summaryLength: 100,
        // 是否启用搜索数据缓存
        enableCache: true,
        // 缓存过期时间（毫秒）
        cacheExpiration: 86400000, // 24小时
        // 是否使用Web Worker进行搜索（如果浏览器支持）
        useWebWorker: true,
        // 搜索结果高亮样式
        highlightClass: 'search-keyword',
        // 搜索结果动画
        animation: {
            enable: true,
            duration: 300
        }
    };
    
    // 搜索状态和缓存
    const state = {
        searchData: null,
        searchIndex: null,
        searchWorker: null,
        isSearching: false,
        lastSearchTime: 0,
        cachedResults: new Map()
    };
    
    /**
     * 防抖函数 - 确保函数在一段时间内只执行一次
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} - 防抖处理后的函数
     */
    function debounce(fn, delay) {
        let timer = null;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    }
    
    /**
     * 初始化搜索功能
     * @param {string} path - 搜索数据路径
     * @param {string} searchId - 搜索输入框ID
     * @param {string} contentId - 搜索结果容器ID
     */
    function initSearch(path, searchId, contentId) {
        const $input = document.getElementById(searchId);
        const $resultContent = document.getElementById(contentId);
        
        if (!$input || !$resultContent) {
            console.error('Search elements not found');
            return;
        }
        
        // 尝试从缓存加载搜索数据
        loadSearchDataFromCache(path).then(cached => {
            if (cached) {
                state.searchData = cached;
                console.log('Search data loaded from cache');
            } else {
                // 如果没有缓存或缓存过期，从服务器加载
                fetchSearchData(path);
            }
        });
        
        // 初始化Web Worker（如果支持）
        initWebWorker();
        
        // 添加输入事件监听器（使用防抖）
        $input.addEventListener('input', debounce(function() {
            const keywords = this.value.trim();
            
            // 清空结果区域
            $resultContent.innerHTML = '';
            
            // 如果输入为空，不执行搜索
            if (keywords.length <= 0) {
                return;
            }
            
            // 执行搜索
            performSearch(keywords, $resultContent);
        }, CONFIG.debounceTime));
    }
    
    /**
     * 从服务器获取搜索数据
     * @param {string} path - 搜索数据路径
     */
    function fetchSearchData(path) {
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                // 解析XML数据
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');
                
                // 提取搜索数据
                const entries = xmlDoc.getElementsByTagName('entry');
                const searchData = Array.from(entries).map(entry => {
                    return {
                        title: entry.getElementsByTagName('title')[0].textContent,
                        content: entry.getElementsByTagName('content')[0].textContent,
                        url: entry.getElementsByTagName('url')[0].textContent
                    };
                });
                
                // 保存搜索数据
                state.searchData = searchData;
                
                // 缓存搜索数据
                if (CONFIG.enableCache) {
                    cacheSearchData(searchData);
                }
                
                console.log('Search data loaded from server');
            })
            .catch(error => {
                console.error('Error fetching search data:', error);
            });
    }
    
    /**
     * 缓存搜索数据
     * @param {Array} data - 搜索数据
     */
    function cacheSearchData(data) {
        if (!window.localStorage) return;
        
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem('hexo-search-data', JSON.stringify(cacheData));
        } catch (e) {
            console.error('Failed to cache search data:', e);
        }
    }
    
    /**
     * 从缓存加载搜索数据
     * @param {string} path - 搜索数据路径（用于缓存键）
     * @returns {Promise<Array|null>} - 搜索数据或null
     */
    function loadSearchDataFromCache(path) {
        return new Promise(resolve => {
            if (!window.localStorage || !CONFIG.enableCache) {
                resolve(null);
                return;
            }
            
            try {
                const cachedData = localStorage.getItem('hexo-search-data');
                if (!cachedData) {
                    resolve(null);
                    return;
                }
                
                const cache = JSON.parse(cachedData);
                const now = Date.now();
                
                // 检查缓存是否过期
                if (now - cache.timestamp > CONFIG.cacheExpiration) {
                    localStorage.removeItem('hexo-search-data');
                    resolve(null);
                    return;
                }
                
                resolve(cache.data);
            } catch (e) {
                console.error('Failed to load search data from cache:', e);
                resolve(null);
            }
        });
    }
    
    /**
     * 初始化Web Worker
     */
    function initWebWorker() {
        if (!CONFIG.useWebWorker || !window.Worker) return;
        
        try {
            // 创建内联Worker
            const workerBlob = new Blob([
                `self.onmessage = function(e) {
                    const { data, keywords } = e.data;
                    const results = searchData(data, keywords);
                    self.postMessage(results);
                };
                
                function searchData(data, keywords) {
                    const keywordList = keywords.toLowerCase().split(/[\s\-]+/);
                    const results = [];
                    
                    data.forEach(function(item) {
                        // 标题和内容都为空则跳过
                        const dataTitle = item.title.trim().toLowerCase();
                        const dataContent = item.content.trim().replace(/<[^>]+>/g, '').toLowerCase();
                        const dataUrl = item.url;
                        
                        if (dataTitle === '' && dataContent === '') {
                            return;
                        }
                        
                        // 匹配关键字
                        let isMatch = true;
                        let firstOccur = -1;
                        let matchTitle = -1;
                        
                        // 只有在标题或内容中找到关键字才添加
                        keywordList.forEach(function(keyword) {
                            matchTitle = dataTitle.indexOf(keyword);
                            const indexContent = dataContent.indexOf(keyword);
                            
                            // 标题和内容都没有找到关键字
                            if (matchTitle < 0 && indexContent < 0) {
                                isMatch = false;
                            } else {
                                if (indexContent < 0) {
                                    indexContent = 0;
                                }
                                if (firstOccur < 0) {
                                    firstOccur = indexContent;
                                }
                            }
                        });
                        
                        if (isMatch) {
                            // 截取匹配到的内容作为摘要
                            let matchContent = '';
                            if (firstOccur >= 0) {
                                // 计算摘要起始位置
                                let start = firstOccur - 20;
                                let end = firstOccur + 80;
                                if (start < 0) start = 0;
                                if (end > dataContent.length) end = dataContent.length;
                                matchContent = dataContent.substring(start, end);
                            }
                            
                            results.push({
                                title: dataTitle,
                                content: matchContent,
                                url: dataUrl,
                                matchTitle: matchTitle >= 0
                            });
                        }
                    });
                    
                    return results;
                }`
            ], { type: 'application/javascript' });
            
            const workerUrl = URL.createObjectURL(workerBlob);
            state.searchWorker = new Worker(workerUrl);
            
            // 释放URL对象
            URL.revokeObjectURL(workerUrl);
        } catch (e) {
            console.error('Failed to initialize Web Worker:', e);
            state.searchWorker = null;
        }
    }
    
    /**
     * 执行搜索
     * @param {string} keywords - 搜索关键词
     * @param {HTMLElement} $resultContent - 结果容器元素
     */
    function performSearch(keywords, $resultContent) {
        // 如果没有搜索数据，显示加载中
        if (!state.searchData) {
            $resultContent.innerHTML = '<div class="search-loading">正在加载搜索数据...</div>';
            return;
        }
        
        // 标记搜索状态
        state.isSearching = true;
        state.lastSearchTime = Date.now();
        const currentSearchTime = state.lastSearchTime;
        
        // 检查缓存中是否有结果
        const cacheKey = keywords.toLowerCase();
        if (CONFIG.enableCache && state.cachedResults.has(cacheKey)) {
            const cachedResult = state.cachedResults.get(cacheKey);
            renderResults(cachedResult, keywords, $resultContent);
            state.isSearching = false;
            return;
        }
        
        // 使用Web Worker进行搜索
        if (state.searchWorker) {
            state.searchWorker.onmessage = function(e) {
                // 确保这是最新的搜索结果
                if (currentSearchTime !== state.lastSearchTime) return;
                
                const results = e.data;
                
                // 缓存结果
                if (CONFIG.enableCache) {
                    state.cachedResults.set(cacheKey, results);
                    
                    // 限制缓存大小
                    if (state.cachedResults.size > 30) {
                        const firstKey = state.cachedResults.keys().next().value;
                        state.cachedResults.delete(firstKey);
                    }
                }
                
                renderResults(results, keywords, $resultContent);
                state.isSearching = false;
            };
            
            state.searchWorker.postMessage({
                data: state.searchData,
                keywords: keywords
            });
        } else {
            // 回退到主线程搜索
            setTimeout(() => {
                // 确保这是最新的搜索结果
                if (currentSearchTime !== state.lastSearchTime) return;
                
                const results = searchData(state.searchData, keywords);
                
                // 缓存结果
                if (CONFIG.enableCache) {
                    state.cachedResults.set(cacheKey, results);
                }
                
                renderResults(results, keywords, $resultContent);
                state.isSearching = false;
            }, 0);
        }
    }
    
    /**
     * 在主线程中搜索数据
     * @param {Array} data - 搜索数据
     * @param {string} keywords - 搜索关键词
     * @returns {Array} - 搜索结果
     */
    function searchData(data, keywords) {
        const keywordList = keywords.toLowerCase().split(/[\s\-]+/);
        const results = [];
        
        // 限制结果数量
        let resultCount = 0;
        
        data.forEach(function(item) {
            // 如果已达到最大结果数，跳过
            if (resultCount >= CONFIG.maxResults) return;
            
            // 标题和内容都为空则跳过
            const dataTitle = item.title.trim().toLowerCase();
            const dataContent = item.content.trim().replace(/<[^>]+>/g, '').toLowerCase();
            const dataUrl = item.url;
            
            if (dataTitle === '' && dataContent === '') {
                return;
            }
            
            // 匹配关键字
            let isMatch = true;
            let firstOccur = -1;
            let matchTitle = -1;
            
            // 只有在标题或内容中找到关键字才添加
            keywordList.forEach(function(keyword) {
                matchTitle = dataTitle.indexOf(keyword);
                const indexContent = dataContent.indexOf(keyword);
                
                // 标题和内容都没有找到关键字
                if (matchTitle < 0 && indexContent < 0) {
                    isMatch = false;
                } else {
                    if (indexContent < 0) {
                        indexContent = 0;
                    }
                    if (firstOccur < 0) {
                        firstOccur = indexContent;
                    }
                }
            });
            
            if (isMatch) {
                // 截取匹配到的内容作为摘要
                let matchContent = '';
                if (firstOccur >= 0) {
                    // 计算摘要起始位置
                    let start = firstOccur - 20;
                    let end = firstOccur + 80;
                    if (start < 0) start = 0;
                    if (end > dataContent.length) end = dataContent.length;
                    matchContent = dataContent.substring(start, end);
                }
                
                results.push({
                    title: dataTitle,
                    content: matchContent,
                    url: dataUrl,
                    matchTitle: matchTitle >= 0
                });
                
                resultCount++;
            }
        });
        
        return results;
    }
    
    /**
     * 渲染搜索结果
     * @param {Array} results - 搜索结果
     * @param {string} keywords - 搜索关键词
     * @param {HTMLElement} $resultContent - 结果容器元素
     */
    function renderResults(results, keywords, $resultContent) {
        if (!results || results.length === 0) {
            $resultContent.innerHTML = '<div class="search-result-empty">没有找到相关结果</div>';
            return;
        }
        
        // 使用DocumentFragment减少DOM操作
        const fragment = document.createDocumentFragment();
        
        // 创建结果摘要
        const summaryDiv = document.createElement('p');
        summaryDiv.className = 'search-result-summary';
        summaryDiv.textContent = `共找到 ${results.length} 条结果`;
        fragment.appendChild(summaryDiv);
        
        // 创建结果列表
        const resultList = document.createElement('ul');
        resultList.className = 'search-result-list';
        
        // 关键词列表
        const keywordList = keywords.toLowerCase().split(/[\s\-]+/);
        
        // 添加结果项
        results.forEach((result, index) => {
            const resultItem = document.createElement('li');
            resultItem.className = 'search-result-item';
            if (CONFIG.animation.enable) {
                resultItem.style.animationDelay = `${index * 50}ms`;
                resultItem.classList.add('animated', 'fadeIn');
            }
            
            // 创建标题链接
            const titleLink = document.createElement('a');
            titleLink.className = 'search-result-title';
            titleLink.href = result.url;
            titleLink.innerHTML = `${index + 1}. ${highlightKeywords(result.title, keywordList)}`;
            resultItem.appendChild(titleLink);
            
            // 创建内容摘要
            if (result.content) {
                const contentDiv = document.createElement('p');
                contentDiv.className = 'search-result';
                contentDiv.innerHTML = highlightKeywords(result.content, keywordList);
                resultItem.appendChild(contentDiv);
            }
            
            resultList.appendChild(resultItem);
        });
        
        fragment.appendChild(resultList);
        
        // 一次性更新DOM
        $resultContent.innerHTML = '';
        $resultContent.appendChild(fragment);
    }
    
    /**
     * 高亮关键词
     * @param {string} text - 原始文本
     * @param {Array} keywords - 关键词列表
     * @returns {string} - 高亮后的HTML
     */
    function highlightKeywords(text, keywords) {
        let result = text;
        keywords.forEach(keyword => {
            if (!keyword) return;
            
            const regExp = new RegExp(keyword, 'gi');
            result = result.replace(regExp, match => {
                return `<em class="${CONFIG.highlightClass}">${match}</em>`;
            });
        });
        return result;
    }
    
    // 导出搜索函数
    window.searchFunc = initSearch;
})();