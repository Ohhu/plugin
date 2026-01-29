/**
 * API 响应类型定义 (TuneHub V3)
 */

// 基础响应结构
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

// ========== 新版 API 类型定义 ==========

// 解析接口请求参数
export interface ParseRequest {
  platform: 'netease' | 'qq' | 'kuwo';
  ids: string; // 支持批量，逗号分隔
  quality: '128k' | '320k' | 'flac' | 'flac24bit';
}

// 解析接口响应 - 单个歌曲数据
export interface ParsedSongData {
  id: string;
  name: string;
  artist: string;
  album?: string;
  pic?: string;
  url?: string;
  lrc?: string;
  size?: number;
  br?: string;
}

// 解析接口响应数据
export interface ParseResponseData {
  [songId: string]: ParsedSongData;
}

// 方法下发配置
export interface MethodConfig {
  type: 'http';
  method: 'GET' | 'POST';
  url: string;
  params?: Record<string, string>;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  transform?: string; // 转换函数字符串
}

// 方法下发响应
export interface MethodResponse {
  code: number;
  data: MethodConfig;
}

// ========== 内部使用的类型 ==========

// 专辑信息（内部使用）
export interface AlbumInfo {
  id: string;
  platform: string;
  source: string;
  title: string;
  artist: string;
  artwork: string;
}

// 艺术家信息（内部使用）
export interface ArtistInfo {
  id: string;
  source: string;
  name: string;
  avatar: string;
}

// 搜索结果中的歌曲项
export interface SearchResultItem {
  id: string;
  platform: string;
  name: string;
  artist: string;
  album?: string;
}

// 聚合搜索响应数据
export interface AggregateSearchData {
  results: SearchResultItem[];
}

// 音乐详情响应数据
export interface MusicInfoData {
  id: string;
  name: string;
  artist: string;
  album?: string;
}

// 排行榜列表项
export interface TopListItem {
  id: string;
  name: string;
  updateFrequency?: string;
}

// 排行榜列表响应数据
export interface TopListsData {
  list: TopListItem[];
}

// 排行榜详情中的歌曲项
export interface TopListDetailItem {
  id: string;
  name: string;
  artist?: string;
  album?: string;
}

// 排行榜详情响应数据
export interface TopListDetailData {
  list: TopListDetailItem[];
}

// 歌单响应数据
export interface PlaylistData {
  list: SearchResultItem[];
}

// 专辑信息（内部使用）
export interface AlbumInfo {
  id: string;
  platform: string;
  source: string;
  title: string;
  artist: string;
  artwork: string;
}

// 艺术家信息（内部使用）
export interface ArtistInfo {
  id: string;
  source: string;
  name: string;
  avatar: string;
}
