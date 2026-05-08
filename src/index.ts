/**
 * QQ 音乐 MusicFree 插件
 *
 * 功能分类:
 * - native.ts: API 原生支持的功能 (搜索、详情、音源、歌词、导入歌单)
 * - simulated.ts: 模拟功能 (专辑详情、艺术家作品)
 * - constants.ts: 常量定义
 */

declare const module: {
  exports: IPlugin.IPluginDefine;
};

// 导入 API 原生支持的功能
import {
  search,
  getMusicInfo,
  getMediaSource,
  getLyric,
  importMusicSheet,
  getMusicSheetInfo
} from './native';

// 导入模拟功能
import {
  getAlbumInfo,
  getArtistWorks
} from './simulated';

// 插件定义
const pluginInstance: IPlugin.IPluginDefine = {
  platform: "QQ音乐",
  author: "Ohhu",
  version: "3.0.0",
  defaultSearchType: "music",
  supportedSearchType: ["music", "album", "artist"],
  cacheControl: "no-store",
  primaryKey: ["id", "source"],
  srcUrl: "",

  // API 原生支持的功能
  search,
  getMusicInfo,
  getMediaSource,
  getLyric,
  importMusicSheet,
  getMusicSheetInfo,

  // 模拟功能
  getAlbumInfo,
  getArtistWorks
};

// 使用 CommonJS 导出方式
module.exports = pluginInstance;
