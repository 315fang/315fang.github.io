var searchFunc = function (path, search_id, content_id) {
    'use strict';
    
    // 缓存DOM元素
    var $input = document.getElementById(search_id);
    var $resultContent = document.getElementById(content_id);
    
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
    
    $.ajax({
        url: path,
        dataType: "xml",
        success: function (xmlResponse) {
            // 获取搜索数据并缓存
            var datas = $("entry", xmlResponse).map(function () {
                return {
                    title: $("title", this).text(),
                    content: $("content", this).text(),
                    url: $("url", this).text()
                };
            }).get();
            
            // 创建搜索索引，预处理数据以加速搜索
            var dataPreprocessed = datas.map(function(data) {
                return {
                    original: data,
                    title: data.title.trim().toLowerCase(),
                    content: data.content.trim().replace(/<[^>]+>/g, "").toLowerCase()
                };
            });
            
            // 使用防抖处理输入事件，减少不必要的搜索操作
            $input.addEventListener('input', debounce(function () {
                var keywords = this.value.trim().toLowerCase();
                
                // 清空结果区域
                $resultContent.innerHTML = "";
                
                // 如果输入为空，直接返回
                if (keywords.length <= 0) {
                    return;
                }
                
                // 分割关键词
                var keywordArray = keywords.split(/[\s\-]+/);
                
                // 使用DocumentFragment减少DOM重绘
                var resultFragment = document.createDocumentFragment();
                var resultList = document.createElement('ul');
                resultList.className = 'search-result-list';
                resultFragment.appendChild(resultList);
                
                // 执行搜索
                var matchCount = 0;
                dataPreprocessed.forEach(function (data) {
                    var isMatch = true;
                    var dataTitle = data.title;
                    var dataContent = data.content;
                    var dataUrl = data.original.url;
                    var indexTitle = -1;
                    var indexContent = -1;
                    var firstOccur = -1;
                    
                    // 只匹配非空的文章
                    if (dataTitle && dataContent) {
                        // 检查所有关键词
                        keywordArray.forEach(function (keyword) {
                            indexTitle = dataTitle.indexOf(keyword);
                            indexContent = dataContent.indexOf(keyword);
                            
                            // 标题和内容都不匹配
                            if (indexTitle < 0 && indexContent < 0) {
                                isMatch = false;
                            } else {
                                // 内容不匹配但标题匹配
                                if (indexContent < 0) {
                                    indexContent = 0;
                                }
                                if (firstOccur < 0) {
                                    firstOccur = indexContent;
                                }
                            }
                        });
                    } else {
                        isMatch = false;
                    }
                    
                    // 显示搜索结果
                    if (isMatch) {
                        matchCount++;
                        
                        // 创建结果项
                        var resultItem = document.createElement('li');
                        var resultLink = document.createElement('a');
                        resultLink.setAttribute('href', dataUrl);
                        resultLink.className = 'search-result-title';
                        resultLink.textContent = data.original.title;
                        resultItem.appendChild(resultLink);
                        
                        // 处理内容预览
                        if (firstOccur >= 0) {
                            // 截取匹配内容周围的文本
                            var start = Math.max(0, firstOccur - 20);
                            var end = Math.min(dataContent.length, firstOccur + 80);
                            
                            // 调整截取范围
                            if (start === 0) {
                                end = 100;
                            }
                            
                            var matchContent = dataContent.substring(start, end);
                            
                            // 高亮关键词
                            keywordArray.forEach(function (keyword) {
                                var regS = new RegExp(keyword, "gi");
                                matchContent = matchContent.replace(regS, function(match) {
                                    return '<em class="search-keyword">' + match + '</em>';
                                });
                            });
                            
                            // 添加内容预览
                            var contentPreview = document.createElement('p');
                            contentPreview.className = 'search-result';
                            contentPreview.innerHTML = matchContent + '...';
                            resultItem.appendChild(contentPreview);
                        }
                        
                        resultList.appendChild(resultItem);
                        
                        // 限制结果数量，避免过多结果影响性能
                        if (matchCount >= 10) {
                            return false; // 跳出forEach循环
                        }
                    }
                });
                
                // 一次性添加所有结果到DOM
                $resultContent.appendChild(resultFragment);
            }, 300)); // 300ms的防抖延迟
        }
    });
};