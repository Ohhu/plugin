/**
 * API 响应类型定义
 */

// 基础响应结构
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
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
