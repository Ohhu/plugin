/**
 * ChKSz 点歌系后端（QQ 音乐 / 酷狗）。
 *
 * 两个平台的接口形态一致：
 * - 搜索：GET /api/qq_music?msg=  /  GET /api/kugou_music?msg=
 * - 详情：带 n（序号）或 mid/id（直解）再请求一次，响应含 url/lrc/cover 等
 * 仅支持 GET，无分页；size 使用音乐源原生值，不做别名映射。
 */

import { chkszError, chkszGet } from "./client";
import { ChKSzPluginDefine, ChKSzPluginSelf, ChKSzUserVariableDecl } from "./types";
import { asRecord, deepFindHttpUrl, firstDefined, firstString, joinArtists, toDurationMs } from "./util";

const POINT_SONG_SEARCH_LIMIT = 30;

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

    const data = await chkszGet({ path: options.endpoint, params, self });
    return asRecord(data) || {};
  }

  async function getMediaSource(
    this: ChKSzPluginSelf,
    musicItem: IMusic.IMusicItemPartial,
    quality: IMusic.IQualityKey
  ): Promise<IPlugin.IMediaSourceResult | null> {
    const size = SIZE_BY_QUALITY[quality] || "flac";
    const detail = await fetchDetail(this, musicItem, size);

    const detailData = asRecord(detail.data);
    const url = firstString(detail.url, detailData ? detailData.url : undefined, deepFindHttpUrl(detail));
    if (!url) {
      throw chkszError("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
    }
    return { url, quality };
  }

  async function getLyric(
    this: ChKSzPluginSelf,
    musicItem: IMusic.IMusicItemPartial
  ): Promise<ILyric.ILyricSource | null> {
    const detail = await fetchDetail(this, musicItem);
    const detailData = asRecord(detail.data);
    const lrc = firstString(detail.lrc, detailData ? detailData.lrc : undefined);
    return lrc ? { lrc } : null;
  }

  return {
    platform: options.platform,
    author: "Ohhu",
    version: "1.0.3",
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
  };
}

/** ChKSz QQ 音乐插件 */
export function createQQPlugin(): ChKSzPluginDefine {
  return createPointSongPlugin({
    platform: "ChKSz·QQ音乐",
    endpoint: "/api/qq_music",
    idParam: "mid",
    searchLimitParam: "num",
    srcUrl: "https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v1.0.3/dist/ChKSzQQ.js",
  });
}

/** ChKSz 酷狗音乐插件 */
export function createKugouPlugin(): ChKSzPluginDefine {
  return createPointSongPlugin({
    platform: "ChKSz·酷狗",
    endpoint: "/api/kugou_music",
    idParam: "id",
    srcUrl: "https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v1.0.3/dist/ChKSzKugou.js",
  });
}
