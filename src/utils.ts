import axios, { AxiosRequestConfig } from 'axios';
import { API_KEY } from './constants';
import { MethodConfig, MethodResponse } from './types';

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 带重试的 HTTP 请求 (自动添加 API Key)
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
    // 自动添加 API Key 到请求头
    const headers = {
      ...config.headers,
      'X-API-Key': API_KEY
    };

    const response = await axios({
      ...config,
      headers
    });
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

// ========== 新版 API 工具函数 ==========

/**
 * 获取方法下发配置
 * @param baseUrl API 基础地址
 * @param platform 平台
 * @param functionName 功能名称
 */
export async function getMethodConfig(
  baseUrl: string,
  platform: string,
  functionName: string
): Promise<MethodConfig | null> {
  try {
    const response = await requestWithRetry<MethodResponse>({
      method: 'GET',
      url: `${baseUrl}/v1/methods/${platform}/${functionName}`
    });

    if (response.code === 0) {
      return response.data;
    }
  } catch (e) {
    console.error(`Get method config error (${platform}/${functionName}):`, e);
  }
  return null;
}

/**
 * 替换模板变量（支持表达式求值，保留原始类型）
 * @param template 模板字符串或对象
 * @param variables 变量映射
 */
export function replaceTemplateVariables(
  template: string | Record<string, any>,
  variables: Record<string, string | number>
): any {
  if (typeof template === 'string') {
    // 检查是否整个字符串就是一个模板表达式 (如 "{{parseInt(id)}}")
    const fullMatch = template.match(/^\{\{([^}]+)\}\}$/);
    if (fullMatch) {
      // 整个字符串是单个表达式，保留原始类型
      try {
        const func = new Function(...Object.keys(variables), `return ${fullMatch[1]};`);
        return func(...Object.values(variables));
      } catch (e) {
        console.error('Template expression error:', fullMatch[1], e);
        return '';
      }
    }

    // 部分替换，结果为字符串
    return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
      try {
        const func = new Function(...Object.keys(variables), `return ${expr};`);
        const result = func(...Object.values(variables));
        return String(result);
      } catch (e) {
        console.error('Template expression error:', expr, e);
        return '';
      }
    });
  } else if (typeof template === 'object' && template !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = replaceTemplateVariables(value, variables);
    }
    return result;
  }
  return template;
}

/**
 * 执行方法下发配置
 * @param config 方法配置
 * @param variables 模板变量
 */
export async function executeMethodConfig<T = any>(
  config: MethodConfig,
  variables: Record<string, string | number> = {}
): Promise<T | null> {
  try {
    // 替换 URL 中的变量
    const url = replaceTemplateVariables(config.url, variables);

    // 替换 params 中的变量
    const params = config.params
      ? replaceTemplateVariables(config.params, variables)
      : undefined;

    // 替换 body 中的变量
    const body = config.body
      ? replaceTemplateVariables(config.body, variables)
      : undefined;

    // 发起请求 (不使用 requestWithRetry，因为这是请求上游平台，不需要 API Key)
    const response = await axios({
      method: config.method,
      url,
      params,
      data: body,
      headers: config.headers || {}
    });

    let data = response.data;

    // 如果有 transform 函数，执行转换
    if (config.transform) {
      try {
        // API 返回的是完整函数定义 "function(response) { ... }"
        // 使用 eval 解析完整函数定义
        const transformFunc = eval('(' + config.transform + ')');
        data = transformFunc(data);
      } catch (e) {
        console.error('Transform function error:', e);
      }
    }

    return data;
  } catch (e) {
    console.error('Execute method config error:', e);
    return null;
  }
}
