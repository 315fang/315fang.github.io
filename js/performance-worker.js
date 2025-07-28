/**
 * 性能优化Web Worker
 * 处理计算密集型任务，释放主线程性能
 */

// 任务类型定义
const TASK_TYPES = {
  IMAGE_PROCESSING: 'IMAGE_PROCESSING',
  TEXT_ANALYSIS: 'TEXT_ANALYSIS',
  DATA_COMPRESSION: 'DATA_COMPRESSION',
  RECOMMENDATION_CALCULATION: 'RECOMMENDATION_CALCULATION',
  SEARCH_INDEX: 'SEARCH_INDEX',
  PERFORMANCE_ANALYSIS: 'PERFORMANCE_ANALYSIS'
};

// 消息处理器
self.addEventListener('message', async function(event) {
  const { type, data, taskId } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case TASK_TYPES.IMAGE_PROCESSING:
        result = await processImages(data);
        break;
        
      case TASK_TYPES.TEXT_ANALYSIS:
        result = await analyzeText(data);
        break;
        
      case TASK_TYPES.DATA_COMPRESSION:
        result = await compressData(data);
        break;
        
      case TASK_TYPES.RECOMMENDATION_CALCULATION:
        result = await calculateRecommendations(data);
        break;
        
      case TASK_TYPES.SEARCH_INDEX:
        result = await buildSearchIndex(data);
        break;
        
      case TASK_TYPES.PERFORMANCE_ANALYSIS:
        result = await analyzePerformance(data);
        break;
        
      default:
        throw new Error(`未知任务类型: ${type}`);
    }
    
    // 发送成功结果
    self.postMessage({
      taskId,
      type: 'SUCCESS',
      result
    });
    
  } catch (error) {
    // 发送错误结果
    self.postMessage({
      taskId,
      type: 'ERROR',
      error: error.message
    });
  }
});

/**
 * 图片处理任务
 */
async function processImages(data) {
  const { images, options } = data;
  const processedImages = [];
  
  for (const image of images) {
    try {
      // 图片压缩和优化
      const optimized = await optimizeImage(image, options);
      
      // 生成响应式图片尺寸
      const responsiveVersions = await generateResponsiveVersions(optimized, options);
      
      // 提取图片元数据
      const metadata = extractImageMetadata(image);
      
      processedImages.push({
        original: image,
        optimized,
        responsive: responsiveVersions,
        metadata,
        compressionRatio: calculateCompressionRatio(image, optimized)
      });
      
    } catch (error) {
      console.warn(`图片处理失败: ${image.name}`, error);
    }
  }
  
  return {
    processedImages,
    totalSavings: calculateTotalSavings(processedImages),
    processingTime: Date.now()
  };
}

/**
 * 优化单张图片
 */
async function optimizeImage(image, options) {
  const { quality = 85, format = 'webp', maxWidth = 1920 } = options;
  
  // 创建Canvas进行图片处理
  const canvas = new OffscreenCanvas(maxWidth, maxWidth);
  const ctx = canvas.getContext('2d');
  
  // 加载图片
  const bitmap = await createImageBitmap(image);
  
  // 计算新尺寸
  const { width, height } = calculateOptimalSize(bitmap, maxWidth);
  canvas.width = width;
  canvas.height = height;
  
  // 绘制优化后的图片
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  // 转换为指定格式
  const blob = await canvas.convertToBlob({
    type: `image/${format}`,
    quality: quality / 100
  });
  
  return blob;
}

/**
 * 生成响应式图片版本
 */
async function generateResponsiveVersions(image, options) {
  const breakpoints = options.breakpoints || [480, 768, 1024, 1200];
  const versions = {};
  
  for (const breakpoint of breakpoints) {
    const canvas = new OffscreenCanvas(breakpoint, breakpoint);
    const ctx = canvas.getContext('2d');
    const bitmap = await createImageBitmap(image);
    
    const { width, height } = calculateOptimalSize(bitmap, breakpoint);
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    versions[`${breakpoint}w`] = await canvas.convertToBlob({
      type: 'image/webp',
      quality: 0.8
    });
  }
  
  return versions;
}

/**
 * 文本分析任务
 */
async function analyzeText(data) {
  const { texts, options } = data;
  const analysisResults = [];
  
  for (const text of texts) {
    const analysis = {
      wordCount: countWords(text),
      readingTime: calculateReadingTime(text),
      sentiment: analyzeSentiment(text),
      keywords: extractKeywords(text),
      summary: generateSummary(text, options.summaryLength || 150),
      complexity: analyzeComplexity(text),
      seoScore: calculateSEOScore(text)
    };
    
    analysisResults.push(analysis);
  }
  
  return {
    results: analysisResults,
    aggregateStats: calculateAggregateStats(analysisResults)
  };
}

/**
 * 计算阅读时间
 */
function calculateReadingTime(text) {
  const wordsPerMinute = 200; // 平均阅读速度
  const wordCount = countWords(text);
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return {
    minutes,
    words: wordCount,
    characters: text.length
  };
}

/**
 * 提取关键词
 */
function extractKeywords(text) {
  // 简化的关键词提取算法
  const words = text.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 保留中英文字符
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // 词频统计
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // 排序并返回前10个关键词
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, freq]) => ({ word, frequency: freq }));
}

/**
 * 数据压缩任务
 */
async function compressData(data) {
  const { content, algorithm = 'gzip' } = data;
  
  let compressed;
  let compressionRatio;
  
  switch (algorithm) {
    case 'gzip':
      compressed = await gzipCompress(content);
      break;
    case 'lz4':
      compressed = await lz4Compress(content);
      break;
    default:
      compressed = await defaultCompress(content);
  }
  
  compressionRatio = compressed.length / content.length;
  
  return {
    original: content,
    compressed,
    compressionRatio,
    savings: 1 - compressionRatio,
    algorithm
  };
}

/**
 * 推荐算法计算
 */
async function calculateRecommendations(data) {
  const { articles, userPreferences, currentArticle } = data;
  const recommendations = [];
  
  for (const article of articles) {
    if (article.id === currentArticle.id) continue;
    
    // 计算相似度分数
    const similarity = calculateSimilarity(currentArticle, article);
    
    // 计算用户偏好分数
    const preferenceScore = calculatePreferenceScore(article, userPreferences);
    
    // 计算时间衰减分数
    const timeScore = calculateTimeScore(article);
    
    // 综合分数
    const totalScore = (similarity * 0.4) + (preferenceScore * 0.4) + (timeScore * 0.2);
    
    if (totalScore > 0.3) { // 阈值过滤
      recommendations.push({
        article,
        score: totalScore,
        reasons: {
          similarity,
          preference: preferenceScore,
          time: timeScore
        }
      });
    }
  }
  
  // 排序并返回前5个推荐
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * 计算文章相似度
 */
function calculateSimilarity(article1, article2) {
  // 标签相似度
  const tagSimilarity = calculateTagSimilarity(article1.tags, article2.tags);
  
  // 分类相似度
  const categorySimilarity = article1.category === article2.category ? 1 : 0;
  
  // 内容相似度（简化版TF-IDF）
  const contentSimilarity = calculateContentSimilarity(article1.content, article2.content);
  
  return (tagSimilarity * 0.4) + (categorySimilarity * 0.3) + (contentSimilarity * 0.3);
}

/**
 * 构建搜索索引
 */
async function buildSearchIndex(data) {
  const { articles } = data;
  const index = {
    documents: {},
    terms: {},
    metadata: {
      totalDocuments: articles.length,
      buildTime: Date.now()
    }
  };
  
  for (const article of articles) {
    const docId = article.id;
    
    // 提取文档词汇
    const terms = extractTerms(article.title + ' ' + article.content);
    
    // 计算TF-IDF
    const tfIdf = calculateTFIDF(terms, articles);
    
    // 存储文档信息
    index.documents[docId] = {
      title: article.title,
      url: article.url,
      terms: tfIdf,
      boost: calculateDocumentBoost(article)
    };
    
    // 更新词汇索引
    for (const [term, score] of Object.entries(tfIdf)) {
      if (!index.terms[term]) {
        index.terms[term] = {};
      }
      index.terms[term][docId] = score;
    }
  }
  
  return index;
}

/**
 * 性能分析任务
 */
async function analyzePerformance(data) {
  const { metrics, timeRange } = data;
  
  const analysis = {
    summary: calculatePerformanceSummary(metrics),
    trends: analyzePerformanceTrends(metrics, timeRange),
    bottlenecks: identifyBottlenecks(metrics),
    recommendations: generatePerformanceRecommendations(metrics),
    score: calculatePerformanceScore(metrics)
  };
  
  return analysis;
}

/**
 * 工具函数
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function calculateOptimalSize(bitmap, maxSize) {
  const { width, height } = bitmap;
  const aspectRatio = width / height;
  
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  
  if (width > height) {
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio)
    };
  } else {
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize
    };
  }
}

function extractImageMetadata(image) {
  return {
    name: image.name,
    size: image.size,
    type: image.type,
    lastModified: image.lastModified
  };
}

function calculateCompressionRatio(original, compressed) {
  return compressed.size / original.size;
}

function calculateTotalSavings(processedImages) {
  let originalSize = 0;
  let compressedSize = 0;
  
  processedImages.forEach(img => {
    originalSize += img.original.size;
    compressedSize += img.optimized.size;
  });
  
  return {
    originalSize,
    compressedSize,
    savings: originalSize - compressedSize,
    ratio: compressedSize / originalSize
  };
}

// 简化的压缩函数（实际应用中应使用专业库）
async function gzipCompress(data) {
  // 这里应该使用真实的gzip压缩算法
  return new TextEncoder().encode(data);
}

async function lz4Compress(data) {
  // 这里应该使用真实的LZ4压缩算法
  return new TextEncoder().encode(data);
}

async function defaultCompress(data) {
  return new TextEncoder().encode(data);
}

function analyzeSentiment(text) {
  // 简化的情感分析
  const positiveWords = ['好', '棒', '优秀', '喜欢', 'good', 'great', 'excellent'];
  const negativeWords = ['坏', '差', '糟糕', '讨厌', 'bad', 'terrible', 'awful'];
  
  let score = 0;
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  return {
    score,
    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
  };
}

function generateSummary(text, maxLength) {
  // 简化的摘要生成
  const sentences = text.split(/[.!?。！？]/);
  let summary = '';
  
  for (const sentence of sentences) {
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence + '。';
    } else {
      break;
    }
  }
  
  return summary.trim();
}

function analyzeComplexity(text) {
  const sentences = text.split(/[.!?。！？]/).filter(s => s.trim());
  const words = text.split(/\s+/);
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgCharsPerWord = text.length / words.length;
  
  return {
    sentences: sentences.length,
    words: words.length,
    avgWordsPerSentence,
    avgCharsPerWord,
    complexity: avgWordsPerSentence > 20 ? 'high' : avgWordsPerSentence > 15 ? 'medium' : 'low'
  };
}

function calculateSEOScore(text) {
  // 简化的SEO评分
  let score = 0;
  
  // 长度检查
  if (text.length > 300) score += 20;
  if (text.length > 1000) score += 10;
  
  // 关键词密度检查
  const keywords = extractKeywords(text);
  if (keywords.length > 5) score += 20;
  
  // 结构检查（标题、段落等）
  if (text.includes('#')) score += 15;
  if (text.includes('\n\n')) score += 10;
  
  return Math.min(score, 100);
}

console.log('🔧 性能优化Web Worker已启动');

// 发送就绪信号
self.postMessage({
  type: 'WORKER_READY',
  capabilities: Object.keys(TASK_TYPES)
});