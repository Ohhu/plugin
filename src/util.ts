/**
 * 面向代理接口的宽松取值工具。
 *
 * 语法约定：与仓库内已验证可用的插件（QQMusic.js / QQPlaylistImporter.js）
 * 语法面对齐——不使用 ??、Object.entries/values、rest 参数、for-of；
 * 允许 ?.、模板字符串、async/await、数组方法。
 */

export function asRecord(value: unknown): Record<string, any> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : undefined;
}

function pickDefined(values: unknown[]): unknown {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

/** 取第一个非空值（跳过 undefined/null/空字符串），最多 8 个候选 */
export function firstDefined<T>(
  a?: unknown,
  b?: unknown,
  c?: unknown,
  d?: unknown,
  e?: unknown,
  f?: unknown,
  g?: unknown,
  h?: unknown
): T | undefined {
  return pickDefined([a, b, c, d, e, f, g, h]) as T;
}

export function firstString(a?: unknown, b?: unknown, c?: unknown, d?: unknown, e?: unknown): string | undefined {
  const values = [a, b, c, d, e];
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function firstNumber(a?: unknown, b?: unknown, c?: unknown, d?: unknown, e?: unknown): number | undefined {
  const values = [a, b, c, d, e];
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const parsed = Number(value);
    if (isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * 时长统一转毫秒。
 * 上游有的接口给秒（QQ interval / 酷狗 duration），有的给毫秒（网易云 dt）。
 * 小于 5400（1.5 小时）按秒处理：真实歌曲的毫秒值不可能小于 5.4 秒。
 */
export function toDurationMs(a?: unknown, b?: unknown, c?: unknown): number | undefined {
  const parsed = firstNumber(a, b, c);
  if (parsed === undefined || parsed <= 0) {
    return undefined;
  }
  return parsed < 5400 ? Math.round(parsed * 1000) : Math.round(parsed);
}

/** 歌手字段兼容：字符串或 [{ name }] 数组 */
export function joinArtists(a?: unknown, b?: unknown, c?: unknown): string | undefined {
  const sources = [a, b, c];
  for (let i = 0; i < sources.length; i += 1) {
    const source = sources[i];
    if (typeof source === "string" && source.trim()) {
      return source.trim();
    }
    if (Array.isArray(source)) {
      const names: string[] = [];
      for (let j = 0; j < source.length; j += 1) {
        const item = source[j];
        if (typeof item === "string") {
          if (item.trim()) {
            names.push(item.trim());
          }
        } else {
          const record = asRecord(item);
          const name = record ? firstString(record.name, record.title) : undefined;
          if (name) {
            names.push(name);
          }
        }
      }
      if (names.length) {
        return names.join(", ");
      }
    }
  }
  return undefined;
}

const URL_LIKE_KEYS = ["url", "musicUrl", "playUrl", "play_url", "link"];

/** 在嵌套结构里找第一个 key 为 url 类、值为 http(s) 的字符串（播放地址兜底） */
export function deepFindHttpUrl(root: unknown, depth?: number): string | undefined {
  const record = asRecord(root);
  if (!record || (depth || 0) < 0) {
    return undefined;
  }
  const keys = Object.keys(record);
  for (let i = 0; i < keys.length; i += 1) {
    const value = record[keys[i]];
    if (URL_LIKE_KEYS.indexOf(keys[i]) >= 0 && typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
  }
  for (let i = 0; i < keys.length; i += 1) {
    const value = record[keys[i]];
    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j += 1) {
        const found = deepFindHttpUrl(value[j], (depth || 0) - 1);
        if (found) {
          return found;
        }
      }
    } else {
      const found = deepFindHttpUrl(value, (depth || 0) - 1);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

const PREFERRED_LIST_KEYS = ["songs", "list", "tracks", "musicList", "songlist"];

function looksLikeSongs(items: unknown[]): boolean {
  if (!items.length) {
    return false;
  }
  const sampleCount = items.length < 5 ? items.length : 5;
  let hits = 0;
  for (let i = 0; i < sampleCount; i += 1) {
    const record = asRecord(items[i]);
    if (!record) {
      continue;
    }
    const hasTitle = firstString(record.name, record.title, record.songName, record.song);
    const hasIdentity = pickDefined([record.id, record.songId, record.song_id, record.mid, record.songmid, record.musicId, record.hash]);
    if (hasTitle && hasIdentity !== undefined) {
      hits += 1;
    }
  }
  return hits >= Math.ceil(sampleCount / 2);
}

function findSongListInRecord(record: Record<string, any>, depth: number): any[] {
  if (depth < 0) {
    return [];
  }
  const keys = Object.keys(record);

  // 1) 常见命名的数组
  for (let i = 0; i < PREFERRED_LIST_KEYS.length; i += 1) {
    const value = record[PREFERRED_LIST_KEYS[i]];
    if (Array.isArray(value) && looksLikeSongs(value)) {
      return value;
    }
  }
  // 2) 本层任意像歌曲列表的数组
  for (let i = 0; i < keys.length; i += 1) {
    const value = record[keys[i]];
    if (Array.isArray(value) && looksLikeSongs(value)) {
      return value;
    }
  }
  // 3) 向下递归一层
  for (let i = 0; i < keys.length; i += 1) {
    const value = record[keys[i]];
    if (Array.isArray(value)) {
      continue;
    }
    const nested = asRecord(value);
    if (nested) {
      const found = findSongListInRecord(nested, depth - 1);
      if (found.length) {
        return found;
      }
    }
  }
  return [];
}

/** 在嵌套结构中找“看起来像歌曲列表”的数组（搜索/歌单响应兜底） */
export function findSongList(root: unknown, depth?: number): any[] {
  const record = asRecord(root);
  if (!record) {
    return [];
  }
  return findSongListInRecord(record, depth === undefined ? 4 : depth);
}
