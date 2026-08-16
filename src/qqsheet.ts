/**
 * QQ 音乐歌单导入（参考 qq-playlist-importer 分支的已验证实现移植）。
 *
 * ChKSz API 没有 QQ 歌单接口，这里直连 QQ 官方 u.y.qq.com 网关拉取歌单
 * （带 sign 签名，不消耗 ChKSz 额度）；导入的歌曲以 mid 为主键落到
 * `ChKSz·QQ音乐` 平台，播放走 ChKSz 点歌接口的 mid 直解。
 *
 * 语法遵循仓库白名单：无 class/??/?./rest/async 箭头；全部 async function 声明。
 */

import axios from "axios";

import { ChKSzPluginDefine } from "./types";
import { QQ_PLATFORM } from "./pointsong";
import { asRecord, firstDefined, firstNumber, firstString, joinArtists, toDurationMs } from "./util";

const QQ_SHEET_API_URLS = [
    "https://u6.y.qq.com/cgi-bin/musics.fcg",
    "https://u.y.qq.com/cgi-bin/musics.fcg",
];
const QQ_SHEET_PLATFORMS = ["-1", "android", "iphone", "h5", "wxfshare", "iphone_wx", "windows"];
const QQ_SHEET_PAGE_SIZE = 30;
const QQ_SHEET_MAX_TOTAL = 10000;
const QQ_SHEET_TIMEOUT_MS = 10000;
/** QQ 网关拒绝请求时的固定响应长度（哨兵值，参考分支实测） */
const QQ_SHEET_ERROR_LENGTH = 108;

/***************************************************************************
 * 签名算法：对请求体做 MD5 后按固定混淆表重排（QQ 网关 sign 参数）。
 * 纯整数运算实现，与 qq-playlist-importer 分支逐行等价（该实现已在 App 验证可用）。
 ***************************************************************************/

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
  let a = x[0];
  let b = x[1];
  let c = x[2];
  let d = x[3];

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

function md5Bytes(input: string): number[] {
  const encoded = unescape(encodeURIComponent(input));
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i += 1) {
    bytes.push(encoded.charCodeAt(i));
  }
  return bytes;
}

function md5(input: string): string {
  const bytes = md5Bytes(input);
  const originalBitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 8) >> 6) + 1) * 64;
  const padded: number[] = [];
  for (let i = 0; i < paddedLength; i += 1) {
    padded.push(0);
  }
  for (let i = 0; i < bytes.length; i += 1) {
    padded[i] = bytes[i];
  }
  padded[bytes.length] = 0x80;
  for (let i = 0; i < 8; i += 1) {
    padded[paddedLength - 8 + i] = Math.floor(originalBitLength / Math.pow(256, i)) & 0xff;
  }

  const state = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < paddedLength; i += 64) {
    const block: number[] = [];
    for (let j = 0; j < 64; j += 4) {
      block.push(padded[i + j] | (padded[i + j + 1] << 8) | (padded[i + j + 2] << 16) | (padded[i + j + 3] << 24));
    }
    md5Cycle(state, block);
  }

  const hex: string[] = [];
  for (let i = 0; i < state.length; i += 1) {
    const n = state[i];
    for (let j = 0; j < 4; j += 1) {
      const byte = (n >>> (j * 8)) & 0xff;
      const text = byte.toString(16);
      hex.push(text.length < 2 ? "0" + text : text);
    }
  }
  return hex.join("");
}

function selectChars(str: string, indices: number[]): string {
  let result = "";
  for (let i = 0; i < indices.length; i += 1) {
    result += str[indices[i]];
  }
  return result;
}

function qqSheetSign(param: string): string {
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

  // 注意：参考实现此处是 replace("[\\\\/+]", "") 字符串字面量（非正则），
  // 实际不替换任何字符——保持逐字节一致，不做"修正"。
  const combined = ls3.join("");
  return ("zzb" + (t1 + combined + t3).toLowerCase());
}
/***************************************************************************
 * 歌单 ID 提取与网关请求
 ***************************************************************************/

/** 从歌单链接、分享文本或纯数字中提取 QQ 歌单 ID */
export function extractQQPlaylistId(input: string): string | null {
  const value = String(input || "").trim();
  if (/^\d+$/.test(value)) {
    return value;
  }
  const patterns = [
    /y\.qq\.com\/n\/ryqq\/playlist\/(\d+)/,
    /\/playlist\/(\d+)/,
    /[?&]id=(\d+)/,
  ];
  for (let i = 0; i < patterns.length; i += 1) {
    const match = value.match(patterns[i]);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function buildSheetRequestBody(disstid: string, platform: string, songBegin: number, songNum: number): string {
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
        song_num: songNum,
      },
    },
    comm: {
      g_tk: 5381,
      uin: 0,
      format: "json",
      platform: platform,
    },
  });
}

/** 请求一页歌单；在 网关×platform 组合间轮换重试（QQ 拒绝时响应长度固定 108） */
async function fetchSheetPage(disstid: string, songBegin: number, songNum: number): Promise<Record<string, any>> {
  let lastError: Error | null = null;
  for (let u = 0; u < QQ_SHEET_API_URLS.length; u += 1) {
    for (let p = 0; p < QQ_SHEET_PLATFORMS.length; p += 1) {
      const bodyText = buildSheetRequestBody(disstid, QQ_SHEET_PLATFORMS[p], songBegin, songNum);
      const sign = qqSheetSign(bodyText);
      const url = QQ_SHEET_API_URLS[u] + "?sign=" + encodeURIComponent(sign) + "&_=" + Date.now();
      try {
        const response = await axios.post(url, bodyText, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: QQ_SHEET_TIMEOUT_MS,
          responseType: "text" as any,
          transformResponse: [function (data: unknown) { return data; }] as any,
        });
        const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
        if (text.length === QQ_SHEET_ERROR_LENGTH) {
          lastError = new Error("QQ 音乐网关拒绝了该请求组合");
          continue;
        }
        const json = asRecord(JSON.parse(text));
        const req0 = asRecord(json ? json.req_0 : undefined);
        const req0Data = asRecord(req0 ? req0.data : undefined);
        if (json && json.code === 0 && req0 && req0.code === 0 && Array.isArray(req0Data ? req0Data.songlist : undefined)) {
          return json;
        }
        lastError = new Error("QQ音乐歌单响应格式异常");
      } catch (error: any) {
        lastError = error && error.message ? error : new Error(String(error));
      }
    }
  }
  throw lastError || new Error("QQ音乐歌单请求全部失败");
}

/**
 * QQ 专辑封面（导入即有封面，无需等播放回填）。
 * 注意：参考实现的 `…M000{pmid}_5.jpg` 带尾缀且用 y.qq.com 域——实测 404（封面全挂），
 * 正确形态是 y.gtimg.cn 域、无尾缀：`…M000{pmid}.jpg`（多专辑实测 200）。
 */
function qqAlbumCover(albumMid: string): string | undefined {
  return albumMid ? "https://y.gtimg.cn/music/photo_new/T002R300x300M000" + albumMid + ".jpg" : undefined;
}

/** 网易歌曲 → `ChKSz·QQ音乐` 条目：mid 主键 + 关键词兜底，播放走 ChKSz mid 直解 */
function mapSheetSong(song: Record<string, any>): IMusic.IMusicItem {
  const album = asRecord(song.album);
  const albumMid = firstString(
    album ? album.pmid : undefined,
    album ? album.mid : undefined,
    song.albummid
  ) || "";
  const mid = String(firstDefined(song.mid, song.songmid) || "");
  const title = firstString(song.title, song.name) || "";
  const artist = joinArtists(song.singer) || "";
  return {
    id: mid,
    mid: mid,
    title: title,
    artist: artist,
    album: firstString(album ? album.title : undefined, album ? album.name : undefined, song.albumname) || "",
    artwork: qqAlbumCover(albumMid),
    duration: toDurationMs(firstDefined(song.interval, song.duration)),
    platform: QQ_PLATFORM,
    source: QQ_PLATFORM,
    keyword: (title + " " + artist).trim(),
  };
}

interface FetchedQQSheet {
  id: string;
  title: string;
  description: string;
  cover?: string;
  creator?: string;
  playCount?: number;
  songCount: number;
  songs: IMusic.IMusicItem[];
}

async function fetchQQSheet(input: string): Promise<FetchedQQSheet> {
  const playlistId = extractQQPlaylistId(input);
  if (!playlistId) {
    throw new Error("无法识别 QQ 音乐歌单：请传入 y.qq.com 歌单链接或纯数字歌单 ID");
  }

  const firstPage = await fetchSheetPage(playlistId, 0, QQ_SHEET_PAGE_SIZE);
  const req0 = asRecord(firstPage.req_0);
  const firstData = asRecord(req0 ? req0.data : undefined) || {};
  const dirinfo = asRecord(firstData.dirinfo) || {};
  const firstList = Array.isArray(firstData.songlist) ? firstData.songlist : [];
  const total = Math.min(firstNumber(dirinfo.songnum) || firstList.length || 0, QQ_SHEET_MAX_TOTAL);
  const songs: IMusic.IMusicItem[] = firstList.map(function (item: unknown) {
    return mapSheetSong(asRecord(item) || {});
  });
  const pageCount = Math.ceil(total / QQ_SHEET_PAGE_SIZE);

  for (let page = 1; page < pageCount; page += 1) {
    const songBegin = page * QQ_SHEET_PAGE_SIZE;
    const songNum = Math.min(QQ_SHEET_PAGE_SIZE, total - songBegin);
    const pageResult = await fetchSheetPage(playlistId, songBegin, songNum);
    const req0Next = asRecord(pageResult.req_0);
    const dataNext = asRecord(req0Next ? req0Next.data : undefined) || {};
    const listNext = Array.isArray(dataNext.songlist) ? dataNext.songlist : [];
    for (let i = 0; i < listNext.length; i += 1) {
      songs.push(mapSheetSong(asRecord(listNext[i]) || {}));
    }
  }

  return {
    id: playlistId,
    title: firstString(dirinfo.title, dirinfo.dissname) || "QQ音乐歌单",
    description: firstString(dirinfo.desc, dirinfo.dissdesc) || "",
    cover: firstString(dirinfo.picurl, dirinfo.logo),
    creator: firstString(dirinfo.nickname, dirinfo.host_nick),
    playCount: firstNumber(dirinfo.visitnum, dirinfo.listennum),
    songCount: total,
    songs: songs,
  };
}

async function importQQMusicSheet(this: any, urlLike: string): Promise<IMusic.IMusicItem[] | null> {
  const sheet = await fetchQQSheet(urlLike);
  return sheet.songs;
}

async function getQQMusicSheetInfo(
  this: any,
  sheetItem: IMusic.IMusicSheetItem,
  page: number
): Promise<IPlugin.ISheetInfoResult | null> {
  const sheet = await fetchQQSheet(String(sheetItem.id));
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const start = (safePage - 1) * QQ_SHEET_PAGE_SIZE;
  return {
    isEnd: start + QQ_SHEET_PAGE_SIZE >= sheet.songs.length,
    sheetItem: {
      id: sheet.id,
      platform: QQ_PLATFORM,
      source: QQ_PLATFORM,
      title: sheet.title || sheetItem.title,
      description: sheet.description || sheetItem.description,
      artwork: sheet.cover || sheetItem.coverImg,
      artist: sheet.creator,
      playCount: sheet.playCount,
      worksNum: sheet.songCount,
    },
    musicList: sheet.songs.slice(start, start + QQ_SHEET_PAGE_SIZE),
  };
}

/** 把歌单导入能力挂到 QQ 插件上（ChKSz QQ 入口调用） */
export function attachQQPlaylistImport(plugin: ChKSzPluginDefine): ChKSzPluginDefine {
  plugin.importMusicSheet = importQQMusicSheet;
  plugin.getMusicSheetInfo = getQQMusicSheetInfo;
  if (plugin.hints) {
    plugin.hints.importMusicSheet = [
      "支持 QQ 音乐歌单链接（y.qq.com）或纯数字歌单 ID。",
      "歌单通过 QQ 官方接口直连获取，不消耗 ChKSz 额度；播放时走 ChKSz 解析。",
    ];
  }
  return plugin;
}
