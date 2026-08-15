/**
 * 诊断插件 T2：最小骨架 + axios 依赖 + 常规字段。
 *
 * 判定：
 * - T1 成功、T2 失败 → App 内置 axios 不可用（require("axios") 白名单问题）；
 * - T2 成功 → 继续测 T3。
 */

declare const module: { exports: IPlugin.IPluginDefine };

import axios from "axios";

const plugin: IPlugin.IPluginDefine = {
  platform: "T2·最小axios",
  author: "Ohhu",
  version: "0.0.2",
  cacheControl: "no-store",
  primaryKey: ["id"],
  supportedSearchType: ["music"],
  hints: {
    importMusicSheet: [],
    importMusicItem: [],
  },
  search: async function (query, page, type) {
    if (type !== "music") {
      return { isEnd: true, data: [] };
    }
    // 真实触发一次 axios 调用，验证 App 注入的 axios 可用
    try {
      await axios.get("https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-test/dist/T2-axios.js", {
        timeout: 3000,
      });
    } catch (error) {
      // 网络失败不影响判定——只要不抛"axios is not a function"类错误即可
    }
    return { isEnd: true, data: [] };
  },
};

module.exports = plugin;
