// API 基础 URL
export const BASE_URL = "https://music-dl.sayqz.com";

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
