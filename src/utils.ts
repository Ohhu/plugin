import axios, { AxiosRequestConfig } from 'axios';

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 带重试的 HTTP 请求
 * @param config axios 请求配置
 * @param retryCount 重试次数，默认 3 次
 * @param retryDelay 重试延迟，默认 150ms
 */
export async function requestWithRetry<T = any>(
  config: AxiosRequestConfig,
  retryCount: number = 3,
  retryDelay: number = 150
): Promise<T> {
  try {
    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    // 如果还有重试次数，则重试
    if (retryCount > 0) {
      await delay(retryDelay);
      return requestWithRetry<T>(config, retryCount - 1, retryDelay);
    }
    // 重试次数用尽，抛出错误
    throw error;
  }
}

/**
 * 构建 API URL
 * @param baseUrl 基础 URL
 * @param platform 平台
 * @param id 资源 ID
 * @param type 类型 (pic, url, lrc, info)
 * @param br 比特率（可选）
 */
export function buildApiUrl(
  baseUrl: string,
  platform: string,
  id: string | number,
  type: 'pic' | 'url' | 'lrc' | 'info',
  br?: string
): string {
  let url = `${baseUrl}/api/?source=${platform}&id=${id}&type=${type}`;
  if (br) {
    url += `&br=${br}`;
  }
  return url;
}

/**
 * 计算字符串相似度分数
 * @param text 要匹配的文本
 * @param query 搜索关键词
 * @param isSplit 是否支持分词匹配（用于艺术家名称）
 */
export function calculateSimilarityScore(
  text: string,
  query: string,
  isSplit: boolean = false
): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // 1. 完全匹配 (最高优先级)
  if (lowerText === lowerQuery) {
    return 1000;
  }

  // 2. 开头匹配
  if (lowerText.startsWith(lowerQuery)) {
    return 500;
  }

  // 3. 包含关键词
  if (lowerText.includes(lowerQuery)) {
    // 关键词越靠前,分数越高
    const position = lowerText.indexOf(lowerQuery);
    return 300 - position;
  }

  // 4. 分词匹配 (处理多个艺术家的情况,如 "周杰伦、李硕、张鑫")
  if (isSplit) {
    const parts = lowerText.split(/[、,，]/).map(p => p.trim());
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === lowerQuery) {
        return 800 - i * 100; // 第一个分数最高
      } else if (parts[i].startsWith(lowerQuery)) {
        return 400 - i * 50;
      } else if (parts[i].includes(lowerQuery)) {
        return 200 - i * 20;
      }
    }
  }

  return 0;
}

/**
 * 根据相似度分数排序数组
 * @param items 要排序的数组
 * @param query 搜索关键词
 * @param getTextField 获取用于匹配的文本字段的函数
 * @param isSplit 是否支持分词匹配
 */
export function sortBySimilarity<T>(
  items: T[],
  query: string,
  getTextField: (item: T) => string,
  isSplit: boolean = false
): T[] {
  // 计算每个项目的相似度分数
  const itemsWithScore = items.map(item => ({
    item,
    score: calculateSimilarityScore(getTextField(item), query, isSplit)
  }));

  // 按分数降序排序
  itemsWithScore.sort((a, b) => b.score - a.score);

  // 返回排序后的项目
  return itemsWithScore.map(({ item }) => item);
}
