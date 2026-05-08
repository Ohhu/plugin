import axios, { AxiosRequestConfig } from 'axios';
import { API_KEY, BASE_URL, PROVIDER } from './constants';
import { ApiAlbum, ApiResponse, ApiSong } from './types';

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

/**
 * 请求 QQ 音乐代理接口。
 */
export async function requestProxy<T = any>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T | null> {
  const response = await requestWithRetry<ApiResponse<T>>({
    method: 'GET',
    url: `${BASE_URL}/${PROVIDER}${path}`,
    params
  });

  if (response.code !== 200) {
    console.error(`QQ Music API error: ${response.code} ${response.message || ''}`);
    return null;
  }

  return response.data;
}

export function getAlbumTitle(album?: ApiAlbum | string): string {
  if (!album) return "";
  return typeof album === 'string' ? album : album.title || "";
}

export function getAlbumCover(song: ApiSong): string {
  if (song.cover) return song.cover;
  return typeof song.album === 'object' && song.album?.cover ? song.album.cover : "";
}

export function getAlbumId(album?: ApiAlbum | string): string {
  return typeof album === 'object' && album?.id ? album.id : "";
}

export function mapSongToMusicItem(song: ApiSong): IMusic.IMusicItem {
  return {
    id: song.id,
    platform: PROVIDER,
    source: PROVIDER,
    title: song.title || "",
    artist: song.artist || song.artists?.map((artist) => artist.name).join(", ") || "",
    album: getAlbumTitle(song.album),
    artwork: getAlbumCover(song),
    duration: song.durationSeconds,
    url: "",
    qqmusicRaw: song
  };
}

export function mapSongToAlbumItem(song: ApiSong): IAlbum.IAlbumItem | null {
  const albumTitle = getAlbumTitle(song.album);
  if (!albumTitle) return null;

  return {
    id: getAlbumId(song.album) || albumTitle,
    platform: PROVIDER,
    source: PROVIDER,
    title: albumTitle,
    artist: song.artist || "",
    artwork: getAlbumCover(song),
    description: "",
    qqmusicRaw: song.album
  };
}

export function mapSongArtists(song: ApiSong): IArtist.IArtistItem[] {
  if (Array.isArray(song.artists) && song.artists.length > 0) {
    return song.artists.map((artist) => ({
      id: artist.id || artist.name,
      platform: PROVIDER,
      source: PROVIDER,
      name: artist.name,
      avatar: ""
    }));
  }

  if (!song.artist) {
    return [];
  }

  return song.artist.split(/[、,，/]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      id: name,
      platform: PROVIDER,
      source: PROVIDER,
      name,
      avatar: ""
    }));
}

export function uniqueById<T extends { id: string | number }>(items: T[]): T[] {
  const itemMap = new Map<string | number, T>();

  items.forEach((item) => {
    if (!itemMap.has(item.id)) {
      itemMap.set(item.id, item);
    }
  });

  return Array.from(itemMap.values());
}
