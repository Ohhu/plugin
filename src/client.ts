/**
 * ChKSz API 请求核心。
 *
 * - 所有业务接口通过 URL 查询参数携带 apikey；
 * - 统一超时与错误映射（400/401/402/403/404/429/503）；
 * - 429 时按 Retry-After 等待后最多重试一次；
 * - 错误信息绝不回显 apikey。
 */

import axios from "axios";

import { ChKSzPluginSelf } from "./types";

export const CHKSZ_BASE_URL = "https://api.chksz.com";
export const CHKSZ_DEFAULT_TIMEOUT_MS = 12000;
/** 大型歌单响应可能较大，放宽超时 */
export const CHKSZ_LARGE_TIMEOUT_MS = 25000;
/** Retry-After 超过该秒数时不阻塞等待，直接抛错 */
const CHKSZ_MAX_RETRY_AFTER_SECONDS = 10;

const API_KEY_VARIABLE_NAMES = ["apikey", "apiKey", "key", "API Key"];

export class ChKSzApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChKSzApiError";
    this.status = status;
  }
}

declare function setTimeout(handler: () => void, timeout: number): unknown;

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readUserVariables(self?: ChKSzPluginSelf): Record<string, string> {
  const raw = self?.userVariables;
  if (Array.isArray(raw)) {
    // 用户尚未填写时，MusicFree 可能传入原始声明数组
    const declared: Record<string, string> = {};
    raw.forEach((item) => {
      if (item && typeof item === "object" && typeof (item as any).key === "string") {
        declared[(item as any).key] = "";
      }
    });
    return declared;
  }
  if (raw && typeof raw === "object") {
    return raw as Record<string, string>;
  }
  return {};
}

/** 从插件 this.userVariables 读取用户填写的 API Key，未配置时抛出可读错误 */
export function getChKSzApiKey(self?: ChKSzPluginSelf): string {
  const variables = readUserVariables(self);
  for (const name of API_KEY_VARIABLE_NAMES) {
    const value = variables[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  throw new ChKSzApiError(
    "尚未配置 ChKSz API Key：请在 MusicFree 的插件设置中填写个人 Key" +
      "（访问 https://api.chksz.com/login 登录后，在账户页复制以 chksz_ 开头的 Key）"
  );
}

export interface ChKSzRequestParams {
  [key: string]: string | number | undefined;
}

export interface ChKSzGetOptions {
  /** 形如 /api/163_music 的接口路径 */
  path: string;
  params?: ChKSzRequestParams;
  /** 插件方法的 this，用于读取用户变量 */
  self?: ChKSzPluginSelf;
  timeoutMs?: number;
}

function buildUrl(path: string, params: ChKSzRequestParams | undefined, apikey: string): string {
  const query: string[] = [];
  const append = (key: string, value: string): void => {
    query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  };
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    append(key, String(value));
  });
  append("apikey", apikey);
  return `${CHKSZ_BASE_URL}${path}?${query.join("&")}`;
}

function maskSecret(text: string, secret: string): string {
  return secret ? text.split(secret).join("chksz_***") : text;
}

function pickDetail(data: unknown): string {
  if (data && typeof data === "object") {
    const source = data as Record<string, unknown>;
    const message = source.msg ?? source.message ?? source.error;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
    return "";
  }
  if (typeof data === "string" && data.trim()) {
    return data.trim().slice(0, 120);
  }
  return "";
}

function toStatusError(status: number, detail: string): ChKSzApiError {
  const suffix = detail ? `：${detail}` : "";
  switch (status) {
    case 400:
      return new ChKSzApiError(`ChKSz 请求参数错误${suffix}`, status);
    case 401:
      return new ChKSzApiError(`ChKSz API Key 无效或登录失效${suffix}，请在插件设置中检查 Key`, status);
    case 402:
      return new ChKSzApiError(
        "ChKSz 免费和付费额度均已用尽：北京时间次日凌晨重置免费额度，或使用 LDC 兑换付费额度",
        status
      );
    case 403:
      return new ChKSzApiError(`ChKSz 拒绝访问（用户、Key 或 IP 可能被封禁）${suffix}`, status);
    case 404:
      return new ChKSzApiError(`ChKSz 接口或资源不存在${suffix}`, status);
    case 429:
      return new ChKSzApiError(`ChKSz 速率限制（每个 Key 每分钟 20 次）${suffix}，请稍后重试`, status);
    case 503:
      return new ChKSzApiError(`ChKSz 服务暂不可用或已被管理员停用${suffix}，请稍后重试`, status);
    default:
      return new ChKSzApiError(`ChKSz 请求失败（HTTP ${status}）${suffix}`, status);
  }
}

function parseRetryAfterSeconds(headerValue: unknown): number | null {
  const value = Number(headerValue);
  if (!isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
}

/** 发起 GET 请求并返回解析后的 JSON；失败时抛出 ChKSzApiError */
export async function chkszGet<T = any>(options: ChKSzGetOptions): Promise<T> {
  const apikey = getChKSzApiKey(options.self);
  const url = buildUrl(options.path, options.params, apikey);
  const timeoutMs = options.timeoutMs ?? CHKSZ_DEFAULT_TIMEOUT_MS;

  const requestOnce = async (): Promise<any> => {
    try {
      return await axios.get(url, {
        timeout: timeoutMs,
        responseType: "json",
        validateStatus: () => true,
      });
    } catch (error: any) {
      const reason =
        error && typeof error === "object" && typeof error.message === "string" ? error.message : String(error);
      throw new ChKSzApiError(`ChKSz 网络请求失败：${maskSecret(reason, apikey)}`);
    }
  };

  let response = await requestOnce();

  // 429：按 Retry-After 等待后最多重试一次，等待过久则直接报错交给用户处理
  if (response && response.status === 429) {
    const retryAfter = parseRetryAfterSeconds(response.headers?.["retry-after"]);
    if (retryAfter !== null && retryAfter <= CHKSZ_MAX_RETRY_AFTER_SECONDS) {
      await sleep((retryAfter + 1) * 1000);
      response = await requestOnce();
    }
  }

  const status = response?.status ?? 0;
  if (status >= 200 && status < 300) {
    return (response?.data ?? null) as T;
  }
  throw toStatusError(status, pickDetail(response?.data));
}
