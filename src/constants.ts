// QQ 音乐代理 API 基础 URL
export const BASE_URL = "https://gateway.karpov.cn/api/proxy";

// API Key
export const API_KEY = "mk_";

export const PROVIDER = "qqmusic";

// 音质映射
export const QUALITY_MAP: Record<string, string> = {
  low: "MP3_128",
  standard: "MP3_320",
  high: "FLAC",
  super: "FLAC"
};

// 分页配置
export const PAGE_SIZE = 30; // 每页显示数量
