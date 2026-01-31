/**
 * TuneHub MusicFree 插件 (V3 API)
 *
 * 功能分类:
 * - native.ts: API 原生支持的功能 (搜索、音源、歌词、排行榜、导入歌单)
 * - simulated.ts: 模拟功能 (专辑详情、艺术家作品)
 * - constants.ts: 常量定义
 */

// 导入 API 原生支持的功能
import {
  search,
  getMediaSource,
  getLyric,
  getTopLists,
  getTopListDetail,
  importMusicSheet
} from './native';

// 导入模拟功能
import {
  getAlbumInfo,
  getArtistWorks
} from './simulated';

// 插件定义
const pluginInstance: IPlugin.IPluginDefine = {
  platform: "TuneHub",
  author: "Ohhu",
  version: "2.1.6",
  defaultSearchType: "music",
  supportedSearchType: ["music", "album", "artist"],
  cacheControl: "no-store",
  primaryKey: ["id", "source"],
  srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/TuneHub/dist/Tunehub.js",

  // API 原生支持的功能
  search,
  getMediaSource,
  getLyric,
  getTopLists,
  getTopListDetail,
  importMusicSheet,

  // 模拟功能
  getAlbumInfo,
  getArtistWorks
};

// 使用 CommonJS 导出方式
module.exports = pluginInstance;
