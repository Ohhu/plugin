/**
 * ChKSz 网易云后端：搜索 / 解析播放地址 / 歌词 / 歌单导入。
 *
 * 对应接口：
 * - GET /api/163_search?keyword=&limit=&offset=
 * - GET /api/163_music?id=&level=
 * - GET /api/163_lyric?id=
 * - GET /api/163_playlist?id=
 */

import { CHKSZ_LARGE_TIMEOUT_MS, ChKSzApiError, chkszGet } from "./client";
import { ChKSzPluginDefine, ChKSzPluginSelf, ChKSzUserVariableDecl } from "./types";
import { asRecord, deepFindHttpUrl, findSongList, firstDefined, firstNumber, firstString, joinArtists, toDurationMs } from "./util";

export const NETEASE_PLATFORM = "ChKSz·网易云";
export const NETEASE_PAGE_SIZE = 30;

/** MusicFree 音质 -> 网易云 level（服务端原生值） */
const NETEASE_QUALITY_LEVEL: Record<string, string> = {
  low: "standard",
  standard: "exhigh",
  high: "lossless",
  super: "jymaster",
};

const USER_VARIABLES: ChKSzUserVariableDecl[] = [
  {
    key: "apikey",
    name: "ChKSz API Key",
    hint: "以 chksz_ 开头；访问 https://api.chksz.com/login 登录后，在账户页复制",
  },
];

export function mapNeteaseSong(raw: Record<string, any>): IMusic.IMusicItem {
  const album = asRecord(firstDefined(raw.album, raw.al));
  const artists = firstDefined(raw.artists, raw.singers, raw.ar, raw.artist);
  return {
    id: String(firstDefined(raw.id, raw.songId, raw.song_id, raw.musicId) ?? ""),
    title: firstString(raw.name, raw.title, raw.songName) ?? "",
    artist: joinArtists(artists) ?? "",
    album:
      (album ? firstString(album.name, album.title) : undefined) ??
      firstString(raw.albumName, raw.albumname, raw.album) ??
      "",
    artwork:
      (album ? firstString(album.picUrl, album.cover, album.coverImgUrl) : undefined) ??
      firstString(raw.picUrl, raw.cover, raw.coverImgUrl),
    duration: toDurationMs(raw.duration, raw.dt, raw.interval),
    platform: NETEASE_PLATFORM,
    source: NETEASE_PLATFORM,
  };
}

async function searchNetease(
  this: ChKSzPluginSelf,
  query: string,
  page: number,
  type: string
): Promise<IPlugin.ISearchResult<any>> {
  if (type !== "music") {
    return { isEnd: true, data: [] };
  }
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const offset = (safePage - 1) * NETEASE_PAGE_SIZE;

  const data = await chkszGet({
    path: "/api/163_search",
    params: { keyword: query, limit: NETEASE_PAGE_SIZE, offset },
    self: this,
  });

  const list = findSongList(data);
  const root = asRecord(data) || {};
  const inner = asRecord(root.data) || root;
  const total = firstNumber(
    root.total,
    root.count,
    root.songCount,
    inner.total,
    inner.count,
    asRecord(root.result)?.songCount,
    asRecord(inner.result)?.songCount
  );

  return {
    // 返回不足一页或已知总数已取完，都视为末页
    isEnd: list.length < NETEASE_PAGE_SIZE || (total !== undefined && offset + list.length >= total),
    data: list.map((item) => mapNeteaseSong(asRecord(item) || {})),
  };
}

async function getNeteaseMediaSource(
  this: ChKSzPluginSelf,
  musicItem: IMusic.IMusicItemPartial,
  quality: IMusic.IQualityKey
): Promise<IPlugin.IMediaSourceResult | null> {
  const level = NETEASE_QUALITY_LEVEL[quality] || "jymaster";
  const data = await chkszGet({
    path: "/api/163_music",
    params: { id: musicItem.id, level },
    self: this,
  });

  const root = asRecord(data);
  const url =
    firstString(root?.url, asRecord(root?.data)?.url, deepFindHttpUrl(data));
  if (!url) {
    throw new ChKSzApiError("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
  }
  return { url, quality };
}

function lyricTextOf(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() ? value : undefined;
  }
  const record = asRecord(value);
  if (record) {
    return firstString(record.lyric, record.content, record.text, record.lrc);
  }
  return undefined;
}

async function getNeteaseLyric(
  this: ChKSzPluginSelf,
  musicItem: IMusic.IMusicItemPartial
): Promise<ILyric.ILyricSource | null> {
  const data = await chkszGet({
    path: "/api/163_lyric",
    params: { id: musicItem.id },
    self: this,
  });

  const root = asRecord(data) || {};
  const inner = asRecord(root.data) || root;
  // 原文 > 翻译；罗马音不参与合并，避免时间轴错乱
  const lrc =
    lyricTextOf(inner.lrc) ??
    lyricTextOf(root.lrc) ??
    lyricTextOf(inner.lyric) ??
    lyricTextOf(root.lyric) ??
    lyricTextOf(inner.tlyric) ??
    lyricTextOf(root.tlyric);
  return lrc ? { lrc } : null;
}

/** 从歌单链接或纯数字中提取网易云歌单 ID */
export function extractNeteasePlaylistId(input: string): string | null {
  const value = String(input || "").trim();
  if (!value) {
    return null;
  }
  if (/^\d+$/.test(value)) {
    return value;
  }
  const patterns = [/[?&]id=(\d+)/, /playlist\/(\d+)/];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

interface ParsedNeteasePlaylist {
  id: string;
  title: string;
  description: string;
  cover?: string;
  creator?: string;
  songCount: number;
  songs: Record<string, any>[];
}

async function fetchNeteasePlaylist(this: ChKSzPluginSelf, playlistId: string): Promise<ParsedNeteasePlaylist> {
  const data = await chkszGet({
    path: "/api/163_playlist",
    params: { id: playlistId },
    self: this,
    timeoutMs: CHKSZ_LARGE_TIMEOUT_MS,
  });

  const root = asRecord(data) || {};
  const playlist =
    asRecord(root.playlist) ?? asRecord(asRecord(root.data)?.playlist) ?? asRecord(root.data) ?? root;
  const songs = findSongList(playlist).length ? findSongList(playlist) : findSongList(data);
  const creator = asRecord(playlist.creator);

  return {
    id: playlistId,
    title: firstString(playlist.title, playlist.name) ?? "网易云音乐歌单",
    description: firstString(playlist.description, playlist.desc) ?? "",
    cover: firstString(playlist.coverImgUrl, playlist.picUrl, playlist.coverImg, playlist.cover, playlist.logo),
    creator:
      (creator ? firstString(creator.nickname, creator.name) : undefined) ??
      firstString(playlist.nickname, playlist.userName, playlist.creator),
    songCount: firstNumber(playlist.trackCount, playlist.songCount) ?? songs.length,
    songs,
  };
}

async function importNeteaseMusicSheet(
  this: ChKSzPluginSelf,
  urlLike: string
): Promise<IMusic.IMusicItem[] | null> {
  const playlistId = extractNeteasePlaylistId(urlLike);
  if (!playlistId) {
    throw new ChKSzApiError("无法识别网易云歌单：请传入 music.163.com 歌单链接或纯数字歌单 ID");
  }
  const playlist = await fetchNeteasePlaylist.call(this, playlistId);
  return playlist.songs.map((item) => mapNeteaseSong(asRecord(item) || {}));
}

async function getNeteaseMusicSheetInfo(
  this: ChKSzPluginSelf,
  sheetItem: IMusic.IMusicSheetItem,
  page: number
): Promise<IPlugin.ISheetInfoResult | null> {
  const playlist = await fetchNeteasePlaylist.call(this, String(sheetItem.id));
  const songs = playlist.songs.map((item) => mapNeteaseSong(asRecord(item) || {}));
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const start = (safePage - 1) * NETEASE_PAGE_SIZE;

  return {
    isEnd: start + NETEASE_PAGE_SIZE >= songs.length,
    sheetItem: {
      id: playlist.id,
      platform: NETEASE_PLATFORM,
      source: NETEASE_PLATFORM,
      title: playlist.title || sheetItem.title,
      description: playlist.description || sheetItem.description,
      artwork: playlist.cover || sheetItem.coverImg,
      artist: playlist.creator,
      worksNum: playlist.songCount,
    },
    musicList: songs.slice(start, start + NETEASE_PAGE_SIZE),
  };
}

export function createNeteasePlugin(): ChKSzPluginDefine {
  return {
    platform: NETEASE_PLATFORM,
    author: "Ohhu",
    version: "1.0.0",
    cacheControl: "no-cache",
    primaryKey: ["id"],
    supportedSearchType: ["music"],
    hints: {
      importMusicSheet: [
        "支持网易云歌单链接（music.163.com）或纯数字歌单 ID。",
        "使用前请在插件设置中填写 ChKSz API Key。",
      ],
      importMusicItem: [],
    },
    userVariables: USER_VARIABLES,
    search: searchNetease as any,
    getMediaSource: getNeteaseMediaSource,
    getLyric: getNeteaseLyric,
    importMusicSheet: importNeteaseMusicSheet,
    getMusicSheetInfo: getNeteaseMusicSheetInfo,
  };
}
