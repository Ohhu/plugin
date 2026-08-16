/**
 * ChKSz 点歌系后端（QQ 音乐 / 酷狗）。
 *
 * 两个平台的接口形态一致：
 * - 搜索：GET /api/qq_music?msg=  /  GET /api/kugou_music?msg=
 * - 详情：带 n（序号）或 mid/id（直解）再请求一次，一次返回 url/cover/lrc/album 等全部字段
 * 仅支持 GET，无分页；size 使用音乐源原生值，不做别名映射。
 *
 * 详情按 mid/id 做内存缓存：App 播放成功后自动回调 getMusicInfo 回填封面等元数据、
 * 缓存命中时 getLyric 直接复用歌词，均不额外消耗额度；
 * 播放地址会过期且随音质变化，永远现请求、不从缓存复用。
 */

import { CHKSZ_LARGE_TIMEOUT_MS, chkszError, chkszGet } from "./client";
import { ChKSzPluginDefine, ChKSzPluginSelf, ChKSzUserVariableDecl } from "./types";
import { asRecord, deepFindHttpUrl, firstDefined, firstNumber, firstString, joinArtists, toDurationMs } from "./util";

const POINT_SONG_SEARCH_LIMIT = 30;

/** 详情缓存条数上限：插件在 App 内常驻，防内存无界增长；插件重载/应用重启后自然清空 */
const DETAIL_CACHE_LIMIT = 100;

/** 详情响应中可复用的元数据（缓存条目；url 仅留存参考，取流永远现请求） */
interface PointSongDetail {
  url?: string;
  cover?: string;
  lrc?: string;
  album?: string;
  title?: string;
  artist?: string;
  interval?: number;
}

/** MusicFree 音质 -> 音乐源原生 size（服务端不做别名/降级映射） */
const SIZE_BY_QUALITY: Record<string, string> = {
  low: "128k",
  standard: "320k",
  high: "flac",
  super: "master",
};

export interface PointSongBackendOptions {
  /** 插件名（MusicFree 音源名） */
  platform: string;
  /** 接口路径：/api/qq_music 或 /api/kugou_music */
  endpoint: string;
  /** 详情直解参数：QQ 用 mid，酷狗用 id */
  idParam: "mid" | "id";
  /** 搜索数量参数名（QQ 支持 num/g，酷狗文档未提供） */
  searchLimitParam?: "num" | "g";
  /** 插件更新地址（App 内检查更新用） */
  srcUrl?: string;
}

const USER_VARIABLES: ChKSzUserVariableDecl[] = [
  {
    key: "apikey",
    name: "ChKSz API Key",
    hint: "以 chksz_ 开头；访问 https://api.chksz.com/login 登录后，在账户页复制",
  },
];

function mapPointSongItem(options: PointSongBackendOptions, raw: Record<string, any>, keyword: string): IMusic.IMusicItem {
  const item: IMusic.IMusicItem = {
    id: String(firstDefined(raw.mid, raw.id, raw.hash, raw.n) || ""),
    title: firstString(raw.name, raw.title, raw.songName) || "",
    artist: joinArtists(raw.singer, raw.singers, raw.artist) || "",
    album: firstString(raw.album, raw.albumName, raw.albumname) || "",
    duration: toDurationMs(raw.duration, raw.interval),
    platform: options.platform,
    source: options.platform,
    // 详情解析时 msg 是主参数，mid/id 是选择器，保留关键词避免二次搜索
    keyword,
  };
  if (options.idParam === "mid") {
    item.mid = String(firstDefined(raw.mid, raw.songmid, raw.id) || "");
  }
  return item;
}

function createPointSongPlugin(options: PointSongBackendOptions): ChKSzPluginDefine {
  // 详情缓存：详情响应一次带全 url/cover/lrc/album，按 mid/id 缓存后，
  // getMusicInfo（App 播放成功后自动调用）与缓存命中的 getLyric 均零额外额度
  const detailCache: Record<string, PointSongDetail> = {};
  const detailCacheOrder: string[] = [];

  function cacheKeyOf(record: Record<string, any>): string | null {
    const key = firstString(
      record[options.idParam],
      options.idParam === "mid" ? record.songmid : undefined,
      record.id
    );
    return key || null;
  }

  /** 提取详情元数据并写缓存；请求侧没带 key 时尝试用响应自带的 mid/id 回填 */
  function rememberDetail(key: string | null, detail: Record<string, any>): PointSongDetail {
    const detailData = asRecord(detail.data);
    const info: PointSongDetail = {
      url: firstString(detail.url, detailData ? detailData.url : undefined),
      cover: firstString(detail.cover, detailData ? detailData.cover : undefined),
      lrc: firstString(detail.lrc, detailData ? detailData.lrc : undefined),
      album: firstString(detail.album, detailData ? detailData.album : undefined),
      title: firstString(detail.name, detailData ? detailData.name : undefined),
      artist: joinArtists(detail.singer, detailData ? detailData.singer : undefined),
      interval: firstNumber(detail.interval, detailData ? detailData.interval : undefined),
    };
    const cacheKey = key || cacheKeyOf(detail);
    if (cacheKey) {
      if (!detailCache[cacheKey]) {
        detailCacheOrder.push(cacheKey);
        while (detailCacheOrder.length > DETAIL_CACHE_LIMIT) {
          const oldest = detailCacheOrder.shift();
          if (oldest && detailCache[oldest]) {
            delete detailCache[oldest];
          }
        }
      }
      detailCache[cacheKey] = info;
    }
    return info;
  }

  async function search(
    this: ChKSzPluginSelf,
    query: string,
    page: number,
    type: string
  ): Promise<IPlugin.ISearchResult<any>> {
    if (type !== "music") {
      return { isEnd: true, data: [] };
    }
    // 点歌接口无分页，只返回第一页
    if (Math.floor(Number(page)) > 1) {
      return { isEnd: true, data: [] };
    }

    const params: Record<string, string | number> = { msg: query };
    if (options.searchLimitParam) {
      params[options.searchLimitParam] = POINT_SONG_SEARCH_LIMIT;
    }

    const data = await chkszGet({
      path: options.endpoint,
      params,
      self: this,
    });

    const root = asRecord(data);
    const rootData = asRecord(root ? root.data : undefined);
    const list = Array.isArray(root && root.list)
      ? root.list
      : Array.isArray(rootData && rootData.list)
        ? rootData.list
        : [];
    return {
      isEnd: true,
      data: list.map((item: unknown) => mapPointSongItem(options, asRecord(item) || {}, query)),
    };
  }

  async function fetchDetail(self: ChKSzPluginSelf, musicItem: IMusic.IMusicItemPartial, size?: string): Promise<Record<string, any>> {
    const record = asRecord(musicItem) || {};
    const keyword = firstString(
      record.keyword,
      `${firstString(record.title) || ""} ${firstString(record.artist) || ""}`.trim()
    );
    const directId = firstString(
      record[options.idParam],
      record.id,
      options.idParam === "mid" ? record.songmid : undefined
    );

    const params: Record<string, string | number> = {};
    if (keyword) {
      params.msg = keyword;
    }
    if (directId) {
      params[options.idParam] = directId;
    }
    if (size) {
      params.size = size;
    }
    if (!keyword && !directId) {
      throw chkszError("缺少歌曲标识（mid/id）与关键词，无法解析歌曲");
    }

    // 无损/母带解析在服务端可能较慢：超时过短会导致 App 端静默降档音质
    const data = await chkszGet({ path: options.endpoint, params, self, timeoutMs: CHKSZ_LARGE_TIMEOUT_MS });
    return asRecord(data) || {};
  }

  async function getMediaSource(
    this: ChKSzPluginSelf,
    musicItem: IMusic.IMusicItemPartial,
    quality: IMusic.IQualityKey
  ): Promise<IPlugin.IMediaSourceResult | null> {
    const size = SIZE_BY_QUALITY[quality] || "flac";
    const record = asRecord(musicItem) || {};
    const detail = await fetchDetail(this, musicItem, size);
    // 播放地址会过期且随音质变化，永远取新的；元数据顺带入缓存
    const info = rememberDetail(cacheKeyOf(record), detail);
    const url = firstString(info.url, deepFindHttpUrl(detail));
    if (!url) {
      throw chkszError("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
    }
    return { url, quality };
  }

  async function getLyric(
    this: ChKSzPluginSelf,
    musicItem: IMusic.IMusicItemPartial
  ): Promise<ILyric.ILyricSource | null> {
    const record = asRecord(musicItem) || {};
    const key = cacheKeyOf(record);
    const cached = key ? detailCache[key] : undefined;
    if (cached) {
      // 详情已缓存（通常刚解析过播放地址），直接复用，不消耗额度
      return cached.lrc ? { rawLrc: cached.lrc } : null;
    }
    const detail = await fetchDetail(this, musicItem);
    const info = rememberDetail(key, detail);
    // 注意：lrc 在 App 侧是 @deprecated 的“歌词 URL”字段，歌词文本必须走 rawLrc
    return info.lrc ? { rawLrc: info.lrc } : null;
  }

  /**
   * 仅读缓存：App 在播放成功后自动调用（getMediaSource 刚跑完，缓存必热），
   * 用于回填封面/专辑/时长等元数据；冷缓存返回 null，不发请求、不耗额度。
   */
  async function getMusicInfo(
    this: ChKSzPluginSelf,
    musicBase: IMedia.IMediaBase
  ): Promise<Partial<IMusic.IMusicItem> | null> {
    const record = asRecord(musicBase) || {};
    const key = cacheKeyOf(record);
    const cached = key ? detailCache[key] : undefined;
    if (!cached) {
      return null;
    }
    const info: Partial<IMusic.IMusicItem> = {};
    if (cached.title) {
      info.title = cached.title;
    }
    if (cached.artist) {
      info.artist = cached.artist;
    }
    if (cached.album) {
      info.album = cached.album;
    }
    if (cached.cover) {
      info.artwork = cached.cover;
    }
    if (cached.interval) {
      info.duration = toDurationMs(cached.interval);
    }
    return info;
  }

  return {
    platform: options.platform,
    author: "Ohhu",
    version: "1.0.8",
    srcUrl: options.srcUrl,
    cacheControl: "no-store",
    primaryKey: [options.idParam],
    supportedSearchType: ["music"],
    hints: {
      importMusicSheet: [],
      importMusicItem: [],
    },
    userVariables: USER_VARIABLES,
    search: search as any,
    getMediaSource,
    getLyric,
    getMusicInfo,
  };
}

/** QQ 音源名（qqsheet 歌单导入映射用，须与插件 platform 一致） */
export const QQ_PLATFORM = "ChKSz·QQ音乐";

/** ChKSz QQ 音乐插件 */
export function createQQPlugin(): ChKSzPluginDefine {
  return createPointSongPlugin({
    platform: QQ_PLATFORM,
    endpoint: "/api/qq_music",
    idParam: "mid",
    searchLimitParam: "num",
    srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzQQ.js",
  });
}

/** ChKSz 酷狗音乐插件 */
export function createKugouPlugin(): ChKSzPluginDefine {
  return createPointSongPlugin({
    platform: "ChKSz·酷狗",
    endpoint: "/api/kugou_music",
    idParam: "id",
    srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzKugou.js",
  });
}
