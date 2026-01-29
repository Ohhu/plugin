// API 基础 URL (TuneHub V3)
export const BASE_URL = "https://tunehub.sayqz.com/api";

// API Key
export const API_KEY = "th_dfa1e5bfcc678aed18ee30657d5f260ff5a5be2fb15af6f3";

// 平台名称映射
export const PLATFORM_NAMES: Record<string, string> = {
  netease: "网易云音乐",
  kuwo: "酷我音乐",
  qq: "QQ音乐"
};

// 音质映射
export const QUALITY_MAP: Record<string, string> = {
  low: "128k",
  standard: "320k",
  high: "flac",
  super: "flac24bit"
};

// 分页配置
export const PAGE_SIZE = 30; // 每页显示数量
