/**
 * QQ 音乐代理 API 响应类型定义
 */

// 基础响应结构
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

export interface ApiArtist {
  id: string;
  name: string;
}

export interface ApiAlbum {
  id: string;
  title: string;
  cover?: string;
}

export interface ApiSong {
  id: string;
  artist: string;
  artists?: ApiArtist[];
  album?: ApiAlbum | string;
  cover?: string;
  durationSeconds?: number;
  isVipOnly?: boolean;
  playable?: boolean;
  provider?: string;
  publishDate?: string;
  title: string;
}

export interface SearchSongsData {
  hasMore?: boolean;
  items?: ApiSong[];
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface SongUrlData {
  audio?: {
    expiresInSeconds?: number;
    format?: string;
    quality?: string;
    sizeBytes?: number;
    url?: string;
  };
  song?: ApiSong;
}

export interface LyricData {
  lyric?: {
    lrc?: string;
    qrc?: string;
    roma?: string;
    trans?: string;
  };
  song?: ApiSong;
}

export interface PlaylistData {
  cover?: string;
  creator?: {
    avatar?: string;
    id?: string;
    nickname?: string;
  };
  description?: string;
  hasMore?: boolean;
  id: string;
  playCount?: number;
  provider?: string;
  songCount?: number;
  songs?: ApiSong[];
  title?: string;
}

export interface AlbumDetailData {
  cover?: string;
  ext?: Record<string, any>;
  id: string;
  name?: string;
  picUrl?: string;
  provider?: string;
  songs?: ApiSong[];
  title?: string;
}

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
  platform?: string;
  source: string;
  name: string;
  avatar: string;
}
