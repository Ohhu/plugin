/**
 * 面向代理接口的宽松取值工具。
 *
 * ChKSz 部分接口（163 系列）未给出严格响应 schema，
 * 这里做「常用字段名优先 + 结构兜底」的容错提取，避免响应被
 * 外层再包一层 data/envelope 时整体失效。
 */

export function asRecord(value: unknown): Record<string, any> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : undefined;
}

/** 取第一个非空值（跳过 undefined/null/空字符串） */
export function firstDefined<T>(...values: unknown[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value as T;
    }
  }
  return undefined;
}

export function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
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
export function toDurationMs(...values: unknown[]): number | undefined {
  const parsed = firstNumber(...values);
  if (parsed === undefined || parsed <= 0) {
    return undefined;
  }
  return parsed < 5400 ? Math.round(parsed * 1000) : Math.round(parsed);
}

/** 歌手字段兼容：字符串或 [{ name }] 数组 */
export function joinArtists(...sources: unknown[]): string | undefined {
  for (const source of sources) {
    if (typeof source === "string" && source.trim()) {
      return source.trim();
    }
    if (Array.isArray(source)) {
      const names = source
        .map((item) => {
          if (typeof item === "string") {
            return item.trim() || undefined;
          }
          const record = asRecord(item);
          return record ? firstString(record.name, record.title) : undefined;
        })
        .filter((name): name is string => Boolean(name));
      if (names.length) {
        return names.join(", ");
      }
    }
  }
  return undefined;
}

const URL_LIKE_KEYS = ["url", "musicUrl", "playUrl", "play_url", "link"];

/** 在嵌套结构里找第一个 key 为 url 类、值为 http(s) 的字符串（播放地址兜底） */
export function deepFindHttpUrl(root: unknown, depth = 4): string | undefined {
  const record = asRecord(root);
  if (!record || depth < 0) {
    return undefined;
  }
  for (const [key, value] of Object.entries(record)) {
    if (URL_LIKE_KEYS.indexOf(key) >= 0 && typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = deepFindHttpUrl(item, depth - 1);
        if (found) {
          return found;
        }
      }
    } else {
      const found = deepFindHttpUrl(value, depth - 1);
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
  const sample = items.slice(0, 5);
  let hits = 0;
  sample.forEach((item) => {
    const record = asRecord(item);
    if (!record) {
      return;
    }
    const hasTitle = firstString(record.name, record.title, record.songName, record.song);
    const hasIdentity = firstDefined(record.id, record.songId, record.song_id, record.mid, record.songmid, record.musicId, record.hash);
    if (hasTitle && hasIdentity !== undefined) {
      hits += 1;
    }
  });
  return hits >= Math.ceil(sample.length / 2);
}

/** 在嵌套结构中找“看起来像歌曲列表”的数组（搜索/歌单响应兜底） */
export function findSongList(root: unknown, depth = 4): any[] {
  const record = asRecord(root);
  if (!record || depth < 0) {
    return [];
  }

  // 1) 本层有常见命名的数组
  for (const key of PREFERRED_LIST_KEYS) {
    const value = record[key];
    if (Array.isArray(value) && looksLikeSongs(value)) {
      return value;
    }
  }
  // 2) 本层任意像歌曲列表的数组
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && looksLikeSongs(value)) {
      return value;
    }
  }
  // 3) 向下递归一层
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      continue;
    }
    const nested = findSongList(value, depth - 1);
    if (nested.length) {
      return nested;
    }
  }
  return [];
}
