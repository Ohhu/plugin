/**
 * ChKSz 网易云后端：搜索 / 解析播放地址 / 歌词 / 歌单导入。
 *
 * 对应接口：
 * - GET /api/163_search?keyword=&limit=&offset=
 * - GET /api/163_music?id=&level=
 * - GET /api/163_lyric?id=
 * - GET /api/163_playlist?id=
 */

import { CHKSZ_LARGE_TIMEOUT_MS, chkszError, chkszGet } from "./client";
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
    id: String(firstDefined(raw.id, raw.songId, raw.song_id, raw.musicId) || ""),
    title: firstString(raw.name, raw.title, raw.songName) || "",
    artist: joinArtists(artists) || "",
    album:
      firstString(
        album ? album.name : undefined,
        album ? album.title : undefined,
        raw.albumName,
        raw.albumname,
        raw.album
      ) || "",
    artwork: firstString(
      album ? album.picUrl : undefined,
      album ? album.cover : undefined,
      album ? album.coverImgUrl : undefined,
      raw.picUrl,
      raw.cover
    ),
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
  const rootResult = asRecord(root.result);
  const innerResult = asRecord(inner.result);
  const total = firstNumber(
    root.total,
    root.count,
    root.songCount,
    inner.total,
    firstNumber(
      inner.count,
      rootResult ? rootResult.songCount : undefined,
      innerResult ? innerResult.songCount : undefined
    )
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
  const rootData = asRecord(root ? root.data : undefined);
  const url = firstString(root ? root.url : undefined, rootData ? rootData.url : undefined, deepFindHttpUrl(data));
  if (!url) {
    throw chkszError("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
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
  // 原文与翻译分开返回；罗马音不参与（App 无对应展示字段）
  // 注意：lrc 在 App 侧是 @deprecated 的“歌词 URL”字段，文本必须走 rawLrc/translation
  const rawLrc = firstString(
    lyricTextOf(inner.lrc),
    lyricTextOf(root.lrc),
    lyricTextOf(inner.lyric),
    lyricTextOf(root.lyric)
  );
  const translation = firstString(
    lyricTextOf(inner.tlyric),
    lyricTextOf(root.tlyric)
  );
  if (!rawLrc && !translation) {
    return null;
  }
  // types/ 声明按上游旧快照不得修改，translation 用收窄对象断言补齐
  const result: Record<string, string> = {};
  if (rawLrc) {
    result.rawLrc = rawLrc;
  }
  if (translation) {
    result.translation = translation;
  }
  return result as ILyric.ILyricSource;
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
  const rootData = asRecord(root.data);
  const playlist =
    asRecord(root.playlist) || asRecord(rootData ? rootData.playlist : undefined) || rootData || root;
  const songs = findSongList(playlist).length ? findSongList(playlist) : findSongList(data);
  const creator = asRecord(playlist.creator);

  return {
    id: playlistId,
    title: firstString(playlist.title, playlist.name) || "网易云音乐歌单",
    description: firstString(playlist.description, playlist.desc) || "",
    cover: firstString(playlist.coverImgUrl, playlist.picUrl, playlist.coverImg, playlist.cover, playlist.logo),
    creator: firstString(
      creator ? creator.nickname : undefined,
      creator ? creator.name : undefined,
      playlist.nickname,
      playlist.userName
    ),
    songCount: firstNumber(playlist.trackCount, playlist.songCount) || songs.length,
    songs,
  };
}

async function importNeteaseMusicSheet(
  this: ChKSzPluginSelf,
  urlLike: string
): Promise<IMusic.IMusicItem[] | null> {
  const playlistId = extractNeteasePlaylistId(urlLike);
  if (!playlistId) {
    throw chkszError("无法识别网易云歌单：请传入 music.163.com 歌单链接或纯数字歌单 ID");
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
    version: "1.0.4",
    srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/chksz-v1.0.4/dist/ChKSzNetease.js",
    cacheControl: "no-store",
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
