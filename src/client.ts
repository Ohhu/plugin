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

/**
 * MusicFree 会向插件作用域注入 env（含 getUserVariables / userVariables）。
 * 老版本 App 不一定把用户变量绑到方法 this 上，这里做双通道读取。
 */
declare const env: {
  getUserVariables?: () => unknown;
  userVariables?: unknown;
} | undefined;

export interface ChKSzApiError extends Error {
  status?: number;
}

/**
 * 错误工厂：不用 class extends Error——仓库内已验证可用的插件
 * 产物均不含 class 语法，严格对齐（老 JS 引擎对内建类继承支持不稳）。
 */
export function chkszError(message: string, status?: number): ChKSzApiError {
  const error = new Error(message) as ChKSzApiError;
  error.name = "ChKSzApiError";
  error.status = status;
  return error;
}

declare function setTimeout(handler: () => void, timeout: number): unknown;

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readUserVariables(self?: ChKSzPluginSelf): Record<string, string> {
  const raw = self ? self.userVariables : undefined;
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

function pickApiKey(variables: Record<string, string>): string | null {
  for (let i = 0; i < API_KEY_VARIABLE_NAMES.length; i += 1) {
    const value = variables[API_KEY_VARIABLE_NAMES[i]];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/** 从插件 this.userVariables / env 用户变量读取 API Key，未配置时抛出可读错误 */
export function getChKSzApiKey(self?: ChKSzPluginSelf): string {
  const fromSelf = pickApiKey(readUserVariables(self));
  if (fromSelf) {
    return fromSelf;
  }
  try {
    if (typeof env !== "undefined" && env && typeof env.getUserVariables === "function") {
      const fromEnv = pickApiKey(readUserVariables({ userVariables: env.getUserVariables() }));
      if (fromEnv) {
        return fromEnv;
      }
    }
  } catch (_) {
    // env 不可用时走统一报错
  }
  throw chkszError(
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
  if (params) {
    const keys = Object.keys(params);
    for (let i = 0; i < keys.length; i += 1) {
      const value = params[keys[i]];
      if (value === undefined || value === null || value === "") {
        continue;
      }
      append(keys[i], String(value));
    }
  }
  append("apikey", apikey);
  return `${CHKSZ_BASE_URL}${path}?${query.join("&")}`;
}

function maskSecret(text: string, secret: string): string {
  return secret ? text.split(secret).join("chksz_***") : text;
}

function pickDetail(data: unknown): string {
  if (data && typeof data === "object") {
    const source = data as Record<string, unknown>;
    const message = source.msg !== undefined ? source.msg : source.message !== undefined ? source.message : source.error;
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
      return chkszError(`ChKSz 请求参数错误${suffix}`, status);
    case 401:
      return chkszError(`ChKSz API Key 无效或登录失效${suffix}，请在插件设置中检查 Key`, status);
    case 402:
      return chkszError(
        "ChKSz 免费和付费额度均已用尽：北京时间次日凌晨重置免费额度，或使用 LDC 兑换付费额度",
        status
      );
    case 403:
      return chkszError(`ChKSz 拒绝访问（用户、Key 或 IP 可能被封禁）${suffix}`, status);
    case 404:
      return chkszError(`ChKSz 接口或资源不存在${suffix}`, status);
    case 429:
      return chkszError(`ChKSz 速率限制（每个 Key 每分钟 20 次）${suffix}，请稍后重试`, status);
    case 503:
      return chkszError(`ChKSz 服务暂不可用或已被管理员停用${suffix}，请稍后重试`, status);
    default:
      return chkszError(`ChKSz 请求失败（HTTP ${status}）${suffix}`, status);
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
  const timeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : CHKSZ_DEFAULT_TIMEOUT_MS;

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
      throw chkszError(`ChKSz 网络请求失败：${maskSecret(reason, apikey)}`);
    }
  };

  let response = await requestOnce();

  // 429：按 Retry-After 等待后最多重试一次，等待过久则直接报错交给用户处理
  if (response && response.status === 429) {
    const headers = response.headers || {};
    const retryAfter = parseRetryAfterSeconds(headers["retry-after"]);
    if (retryAfter !== null && retryAfter <= CHKSZ_MAX_RETRY_AFTER_SECONDS) {
      await sleep((retryAfter + 1) * 1000);
      response = await requestOnce();
    }
  }

  const status = response ? response.status || 0 : 0;
  if (status >= 200 && status < 300) {
    return (response ? response.data : null) as T;
  }
  throw toStatusError(status, pickDetail(response ? response.data : null));
}
