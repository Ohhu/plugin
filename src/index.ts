/**
 * QQ playlist import-only plugin for MusicFree.
 *
 * This plugin only imports QQ Music playlists. Playback is intentionally
 * delegated to MusicFree's in-app source redirection.
 */

declare const module: {
  exports: IPlugin.IPluginDefine;
};

import axios from 'axios';

const PLATFORM = "QQ歌单导入";
const PROVIDER = "qqmusic";
const QQ_MUSIC_API_URLS = [
  "https://u6.y.qq.com/cgi-bin/musics.fcg",
  "https://u.y.qq.com/cgi-bin/musics.fcg"
];
const QQ_MUSIC_PLATFORMS = ["-1", "android", "iphone", "h5", "wxfshare", "iphone_wx", "windows"];
const PAGE_SIZE = 30;
const MAX_TOTAL_SONGS = 10000;
const REQUEST_TIMEOUT_MS = 10000;
const QQ_MUSIC_ERROR_RESPONSE_LENGTH = 108;
const COVER_BASE_URL = "https://y.qq.com/music/photo_new/T002R300x300M000";
const LYRIC_URL = "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg";

interface QQMusicSinger {
  id?: number | string;
  mid?: string;
  name?: string;
}

interface QQMusicSong {
  id?: number | string;
  songid?: number | string;
  mid?: string;
  songmid?: string;
  name?: string;
  title?: string;
  singer?: QQMusicSinger[];
  album?: {
    id?: number | string;
    mid?: string;
    pmid?: string;
    name?: string;
    title?: string;
  };
  albumname?: string;
  albummid?: string;
  interval?: number;
  duration?: number;
  time_public?: string;
  pay?: {
    pay_play?: number;
  };
}

interface QQMusicPlaylistResponse {
  code?: number;
  req_0?: {
    code?: number;
    data?: {
      dirinfo?: Record<string, any>;
      songlist?: QQMusicSong[];
    };
  };
}

interface ImportedPlaylist {
  id: string;
  title: string;
  description?: string;
  cover?: string;
  creator?: string;
  playCount?: number;
  songCount: number;
  songs: IMusic.IMusicItem[];
}

function add32(a: number, b: number): number {
  return (a + b) & 0xffffffff;
}

function rol(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return add32(rol(add32(add32(a, q), add32(x, t)), s), b);
}

function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}

function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}

function md5Cycle(x: number[], k: number[]): void {
  let [a, b, c, d] = x;

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
}

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  const encoded = unescape(encodeURIComponent(input));
  for (let i = 0; i < encoded.length; i += 1) {
    bytes.push(encoded.charCodeAt(i));
  }
  return bytes;
}

function md5Blocks(input: string): number[][] {
  const bytes = utf8Bytes(input);
  const originalBitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 8) >> 6) + 1) * 64;
  const padded = new Array(paddedLength).fill(0);

  bytes.forEach((byte, index) => {
    padded[index] = byte;
  });
  padded[bytes.length] = 0x80;

  for (let i = 0; i < 8; i += 1) {
    padded[paddedLength - 8 + i] = Math.floor(originalBitLength / Math.pow(256, i)) & 0xff;
  }

  const blocks: number[][] = [];
  for (let i = 0; i < paddedLength; i += 64) {
    const block: number[] = [];
    for (let j = 0; j < 64; j += 4) {
      block.push(
        padded[i + j] |
        (padded[i + j + 1] << 8) |
        (padded[i + j + 2] << 16) |
        (padded[i + j + 3] << 24)
      );
    }
    blocks.push(block);
  }
  return blocks;
}

function md5(input: string): string {
  const state = [1732584193, -271733879, -1732584194, 271733878];
  md5Blocks(input).forEach((block) => md5Cycle(state, block));

  const hex: string[] = [];
  state.forEach((n) => {
    for (let i = 0; i < 4; i += 1) {
      hex.push(((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0"));
    }
  });
  return hex.join("");
}

function selectChars(str: string, indices: number[]): string {
  return indices.map((index) => str[index]).join("");
}

function getQQMusicSign(param: string): string {
  const l1 = [212, 45, 80, 68, 195, 163, 163, 203, 157, 220, 254, 91, 204, 79, 104, 6];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const md5Str = md5(param).toUpperCase();

  const t1 = selectChars(md5Str, [21, 4, 9, 26, 16, 20, 27, 30]);
  const t3 = selectChars(md5Str, [18, 11, 3, 2, 1, 7, 6, 25]);
  const ls2: number[] = [];

  for (let i = 0; i < 16; i += 1) {
    const x1 = parseInt(md5Str[i * 2], 16);
    const x2 = parseInt(md5Str[i * 2 + 1], 16);
    ls2.push(((x1 * 16) ^ x2) ^ l1[i]);
  }

  const ls3: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    if (i === 5) {
      const last = ls2[ls2.length - 1];
      ls3.push(chars[last >> 2], chars[(last & 3) << 4]);
    } else {
      const x4 = ls2[i * 3] >> 2;
      const x5 = (ls2[i * 3 + 1] >> 4) ^ ((ls2[i * 3] & 3) << 4);
      const x6 = (ls2[i * 3 + 2] >> 6) ^ ((ls2[i * 3 + 1] & 15) << 2);
      const x7 = 63 & ls2[i * 3 + 2];
      ls3.push(chars[x4] + chars[x5] + chars[x6] + chars[x7]);
    }
  }

  return `zzb${(t1 + ls3.join("").replace("[\\/+\]", "") + t3).toLowerCase()}`;
}

function extractQQMusicPlaylistId(input: string): string | null {
  const value = String(input || "").trim();
  if (/^\d+$/.test(value)) return value;

  try {
    const parsed = new URL(value);
    const id = parsed.searchParams.get("id");
    if (id && /^\d+$/.test(id)) return id;
  } catch (_) {
    // Shared text can contain extra words or partial URLs.
  }

  const patterns = [
    /y\.qq\.com\/n\/ryqq\/playlist\/(\d+)/,
    /\/playlist\/(\d+)/,
    /[?&]id=(\d+)/
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function buildRequestBody(disstid: string, platform: string, songBegin: number, songNum: number): string {
  return JSON.stringify({
    req_0: {
      module: "music.srfDissInfo.aiDissInfo",
      method: "uniform_get_Dissinfo",
      param: {
        disstid: Number(disstid),
        enc_host_uin: "",
        tag: 1,
        userinfo: 1,
        song_begin: songBegin,
        song_num: songNum
      }
    },
    comm: {
      g_tk: 5381,
      uin: 0,
      format: "json",
      platform
    }
  });
}

async function fetchPlaylistPage(disstid: string, songBegin: number, songNum: number): Promise<QQMusicPlaylistResponse> {
  let lastError: any = null;

  for (const apiUrl of QQ_MUSIC_API_URLS) {
    for (const platform of QQ_MUSIC_PLATFORMS) {
      const body = buildRequestBody(disstid, platform, songBegin, songNum);
      const sign = getQQMusicSign(body);
      const url = `${apiUrl}?sign=${encodeURIComponent(sign)}&_=${Date.now()}`;

      try {
        const response = await axios.post<string>(url, body, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          timeout: REQUEST_TIMEOUT_MS,
          responseType: 'text',
          transformResponse: [(data) => data]
        });
        const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        if (text.length === QQ_MUSIC_ERROR_RESPONSE_LENGTH) {
          lastError = new Error(`QQ Music rejected ${apiUrl} platform ${platform}: ${text}`);
          continue;
        }

        const json = JSON.parse(text) as QQMusicPlaylistResponse;
        const songlist = json.req_0?.data?.songlist;
        if (json.code === 0 && json.req_0?.code === 0 && Array.isArray(songlist)) {
          return json;
        }

        lastError = new Error(`Unexpected QQ Music response on ${apiUrl} platform ${platform}`);
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error("All QQ Music playlist requests failed");
}

function isVersionedAlbumMid(albumMid: string): boolean {
  return /_\d+$/.test(albumMid);
}

function getAlbumCover(albumPmid?: string, albumMid?: string): string | undefined {
  const directCoverMid = albumPmid || (albumMid && isVersionedAlbumMid(albumMid) ? albumMid : "");
  if (directCoverMid) return `${COVER_BASE_URL}${directCoverMid}.jpg`;
  return albumMid ? `${COVER_BASE_URL}${albumMid}_5.jpg` : undefined;
}

function parseQQMusicJsonp(text: string): any {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\w$]+\(([\s\S]*)\)$/);
  return JSON.parse(match ? match[1] : trimmed);
}

function decodeBase64Utf8(value?: string): string {
  if (!value) return "";

  const bufferCtor = (globalThis as any).Buffer;
  if (bufferCtor?.from) {
    return bufferCtor.from(value, "base64").toString("utf8");
  }

  const atobFn = (globalThis as any).atob;
  if (typeof atobFn !== "function") return value;

  const binary = atobFn(value);
  const encoded = Array.from(binary, (char) =>
    `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
  ).join("");

  try {
    return decodeURIComponent(encoded);
  } catch (_) {
    return binary;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function mapQQSongToMusicItem(song: QQMusicSong): IMusic.IMusicItem {
  const singers = Array.isArray(song.singer) ? song.singer : [];
  const albumPmid = song.album?.pmid || "";
  const albumMid = song.album?.mid || song.albummid || "";
  const exportedAlbumMid = albumPmid || albumMid;
  const songMid = String(song.mid || song.songmid || "");
  const songId = String(song.id || song.songid || songMid);
  const albumId = String(song.album?.id || "");
  const albumTitle = song.album?.title || song.album?.name || song.albumname || "";
  const artwork = getAlbumCover(albumPmid, albumMid);

  return {
    id: songId,
    songmid: songMid,
    platform: PLATFORM,
    source: PLATFORM,
    title: song.title || song.name || "",
    artist: singers.map((singer) => singer.name).filter(Boolean).join(", "),
    album: albumTitle,
    artwork,
    duration: song.interval || song.duration,
    albumid: albumId,
    albummid: exportedAlbumMid,
    provider: PROVIDER,
    publishDate: song.time_public,
    isVipOnly: song.pay?.pay_play === 1,
    qqmusicRaw: song
  };
}

async function fetchQQMusicPlaylist(input: string): Promise<ImportedPlaylist | null> {
  const playlistId = extractQQMusicPlaylistId(input);
  if (!playlistId) return null;

  const firstPage = await fetchPlaylistPage(playlistId, 0, PAGE_SIZE);
  const firstData = firstPage.req_0?.data;
  const dirinfo = firstData?.dirinfo || {};
  const total = Math.min(Number(dirinfo.songnum) || firstData?.songlist?.length || 0, MAX_TOTAL_SONGS);
  const songs = [...(firstData?.songlist || [])];
  const pageCount = Math.ceil(total / PAGE_SIZE);

  for (let page = 1; page < pageCount; page += 1) {
    const songBegin = page * PAGE_SIZE;
    const songNum = Math.min(PAGE_SIZE, total - songBegin);
    const pageResult = await fetchPlaylistPage(playlistId, songBegin, songNum);
    songs.push(...(pageResult.req_0?.data?.songlist || []));
  }

  return {
    id: playlistId,
    title: dirinfo.title || dirinfo.dissname || "QQ音乐歌单",
    description: dirinfo.desc || dirinfo.dissdesc || "",
    cover: dirinfo.picurl || dirinfo.logo || "",
    creator: dirinfo.nickname || dirinfo.host_nick || "",
    playCount: Number(dirinfo.visitnum) || Number(dirinfo.listennum) || undefined,
    songCount: total,
    songs: songs.map(mapQQSongToMusicItem)
  };
}

const importMusicSheet: IPlugin.IPluginDefine['importMusicSheet'] = async function (urlLike) {
  const playlist = await fetchQQMusicPlaylist(urlLike);
  return playlist?.songs || null;
};

const getMusicSheetInfo: IPlugin.IPluginDefine['getMusicSheetInfo'] = async function (sheetItem, page) {
  const playlist = await fetchQQMusicPlaylist(String(sheetItem.id));
  const songs = playlist?.songs || [];
  const start = Math.max(page - 1, 0) * PAGE_SIZE;

  return {
    isEnd: start + PAGE_SIZE >= songs.length,
    sheetItem: playlist ? {
      id: playlist.id,
      platform: PLATFORM,
      source: PLATFORM,
      title: playlist.title || sheetItem.title,
      description: playlist.description || sheetItem.description,
      artwork: playlist.cover || sheetItem.artwork,
      playCount: playlist.playCount,
      worksNum: playlist.songCount,
      artist: playlist.creator
    } : undefined,
    musicList: songs.slice(start, start + PAGE_SIZE)
  };
};

const getLyric: IPlugin.IPluginDefine['getLyric'] = async function (musicItem) {
  const songMid = String(musicItem.songmid || musicItem.mid || "");
  if (!songMid) return null;

  const response = await axios.get<string>(`${LYRIC_URL}?songmid=${songMid}&g_tk=${Date.now()}`, {
    headers: {
      "Referer": "https://y.qq.com/portal/player.html",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    timeout: REQUEST_TIMEOUT_MS,
    responseType: "text",
    transformResponse: [(data) => data]
  });

  const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
  const payload = parseQQMusicJsonp(text);
  const rawLrc = decodeHtmlEntities(decodeBase64Utf8(payload.lyric));
  if (!rawLrc) return null;

  const translation = decodeHtmlEntities(decodeBase64Utf8(payload.trans));
  return translation ? { rawLrc, translation } as any : { rawLrc };
};

const pluginInstance: IPlugin.IPluginDefine = {
  platform: PLATFORM,
  author: "Ohhu",
  version: "2.1.2",
  cacheControl: "no-store",
  primaryKey: ["id", "songmid", "source"],
  hints: {
    importMusicSheet: [
      "支持 QQ 音乐歌单链接或歌单 ID。",
      "本插件只负责导入歌单；播放请在 MusicFree 中配置音源重定向。"
    ],
    importMusicItem: []
  },
  importMusicSheet,
  getMusicSheetInfo,
  getLyric
};

module.exports = pluginInstance;
