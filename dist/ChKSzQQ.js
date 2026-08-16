var $g8oBv$axios = require("axios");

function $parcel$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
}

const $a6afe7b81da5ac04$export$1b6bf9910cf9afa0 = "https://api.chksz.com";

const $a6afe7b81da5ac04$export$94bbe8f22941309c = 12e3;

const $a6afe7b81da5ac04$export$1ad3691e597a27ef = 25e3;

const $a6afe7b81da5ac04$var$CHKSZ_MAX_RETRY_AFTER_SECONDS = 10;

const $a6afe7b81da5ac04$var$API_KEY_VARIABLE_NAMES = [ "apikey", "apiKey", "key", "API Key" ];

function $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(message, status) {
    const error = new Error(message);
    error.name = "ChKSzApiError";
    error.status = status;
    return error;
}

function $a6afe7b81da5ac04$var$sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function $a6afe7b81da5ac04$var$readUserVariables(self) {
    const raw = self ? self.userVariables : undefined;
    if (Array.isArray(raw)) {
        const declared = {};
        raw.forEach(item => {
            if (item && typeof item === "object" && typeof item.key === "string") declared[item.key] = "";
        });
        return declared;
    }
    if (raw && typeof raw === "object") return raw;
    return {};
}

function $a6afe7b81da5ac04$var$pickApiKey(variables) {
    for (let i = 0; i < $a6afe7b81da5ac04$var$API_KEY_VARIABLE_NAMES.length; i += 1) {
        const value = variables[$a6afe7b81da5ac04$var$API_KEY_VARIABLE_NAMES[i]];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
}

function $a6afe7b81da5ac04$export$d2f6112f5650928(self) {
    const fromSelf = $a6afe7b81da5ac04$var$pickApiKey($a6afe7b81da5ac04$var$readUserVariables(self));
    if (fromSelf) return fromSelf;
    try {
        if (typeof env !== "undefined" && env && typeof env.getUserVariables === "function") {
            const fromEnv = $a6afe7b81da5ac04$var$pickApiKey($a6afe7b81da5ac04$var$readUserVariables({
                userVariables: env.getUserVariables()
            }));
            if (fromEnv) return fromEnv;
        }
    } catch (_) {}
    throw $a6afe7b81da5ac04$export$13019d6ed2a4b3dd("尚未配置 ChKSz API Key：请在 MusicFree 的插件设置中填写个人 Key（访问 https://api.chksz.com/login 登录后，在账户页复制以 chksz_ 开头的 Key）");
}

function $a6afe7b81da5ac04$var$buildUrl(path, params, apikey) {
    const query = [];
    const append = (key, value) => {
        query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    };
    if (params) {
        const keys = Object.keys(params);
        for (let i = 0; i < keys.length; i += 1) {
            const value = params[keys[i]];
            if (value === undefined || value === null || value === "") continue;
            append(keys[i], String(value));
        }
    }
    append("apikey", apikey);
    return `${$a6afe7b81da5ac04$export$1b6bf9910cf9afa0}${path}?${query.join("&")}`;
}

function $a6afe7b81da5ac04$var$maskSecret(text, secret) {
    return secret ? text.split(secret).join("chksz_***") : text;
}

function $a6afe7b81da5ac04$var$pickDetail(data) {
    if (data && typeof data === "object") {
        const source = data;
        const message = source.msg !== undefined ? source.msg : source.message !== undefined ? source.message : source.error;
        if (typeof message === "string" && message.trim()) return message.trim();
        return "";
    }
    if (typeof data === "string" && data.trim()) return data.trim().slice(0, 120);
    return "";
}

function $a6afe7b81da5ac04$var$toStatusError(status, detail) {
    const suffix = detail ? `：${detail}` : "";
    switch (status) {
      case 400:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 请求参数错误${suffix}`, status);

      case 401:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz API Key 无效或登录失效${suffix}，请在插件设置中检查 Key`, status);

      case 402:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd("ChKSz 免费和付费额度均已用尽：北京时间次日凌晨重置免费额度，或使用 LDC 兑换付费额度", status);

      case 403:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 拒绝访问（用户、Key 或 IP 可能被封禁）${suffix}`, status);

      case 404:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 接口或资源不存在${suffix}`, status);

      case 429:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 速率限制（每个 Key 每分钟 20 次）${suffix}，请稍后重试`, status);

      case 503:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 服务暂不可用或已被管理员停用${suffix}，请稍后重试`, status);

      default:
        return $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 请求失败（HTTP ${status}）${suffix}`, status);
    }
}

function $a6afe7b81da5ac04$var$parseRetryAfterSeconds(headerValue) {
    const value = Number(headerValue);
    if (!isFinite(value) || value < 0) return null;
    return Math.floor(value);
}

async function $a6afe7b81da5ac04$export$ad90614321195e52(options) {
    const apikey = $a6afe7b81da5ac04$export$d2f6112f5650928(options.self);
    const url = $a6afe7b81da5ac04$var$buildUrl(options.path, options.params, apikey);
    const timeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : $a6afe7b81da5ac04$export$94bbe8f22941309c;
    const requestOnce = async function() {
        try {
            return await (0, $parcel$interopDefault($g8oBv$axios)).get(url, {
                timeout: timeoutMs,
                responseType: "json",
                validateStatus: () => true
            });
        } catch (error) {
            const reason = error && typeof error === "object" && typeof error.message === "string" ? error.message : String(error);
            throw $a6afe7b81da5ac04$export$13019d6ed2a4b3dd(`ChKSz 网络请求失败：${$a6afe7b81da5ac04$var$maskSecret(reason, apikey)}`);
        }
    };
    let response = await requestOnce();
    if (response && response.status === 429) {
        const headers = response.headers || {};
        const retryAfter = $a6afe7b81da5ac04$var$parseRetryAfterSeconds(headers["retry-after"]);
        if (retryAfter !== null && retryAfter <= $a6afe7b81da5ac04$var$CHKSZ_MAX_RETRY_AFTER_SECONDS) {
            await $a6afe7b81da5ac04$var$sleep((retryAfter + 1) * 1e3);
            response = await requestOnce();
        }
    }
    const status = response ? response.status || 0 : 0;
    if (status >= 200 && status < 300) return response ? response.data : null;
    throw $a6afe7b81da5ac04$var$toStatusError(status, $a6afe7b81da5ac04$var$pickDetail(response ? response.data : null));
}

function $2fe70d8413f7612b$export$badcc9423dc3e1c1(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}

function $2fe70d8413f7612b$var$pickDefined(values) {
    for (let i = 0; i < values.length; i += 1) {
        const value = values[i];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
}

function $2fe70d8413f7612b$export$c4ed8c822f31cc12(a, b, c, d, e, f, g, h) {
    return $2fe70d8413f7612b$var$pickDefined([ a, b, c, d, e, f, g, h ]);
}

function $2fe70d8413f7612b$export$8d3f56d05539298a(a, b, c, d, e) {
    const values = [ a, b, c, d, e ];
    for (let i = 0; i < values.length; i += 1) {
        const value = values[i];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
}

function $2fe70d8413f7612b$export$9c2d3e693419842c(a, b, c, d, e) {
    const values = [ a, b, c, d, e ];
    for (let i = 0; i < values.length; i += 1) {
        const value = values[i];
        if (value === undefined || value === null || value === "") continue;
        const parsed = Number(value);
        if (isFinite(parsed)) return parsed;
    }
    return undefined;
}

function $2fe70d8413f7612b$export$c8a14c10c33048c2(a, b, c) {
    const parsed = $2fe70d8413f7612b$export$9c2d3e693419842c(a, b, c);
    if (parsed === undefined || parsed <= 0) return undefined;
    return parsed < 5400 ? Math.round(parsed * 1e3) : Math.round(parsed);
}

function $2fe70d8413f7612b$export$f1c212ee0684f3c2(a, b, c) {
    const sources = [ a, b, c ];
    for (let i = 0; i < sources.length; i += 1) {
        const source = sources[i];
        if (typeof source === "string" && source.trim()) return source.trim();
        if (Array.isArray(source)) {
            const names = [];
            for (let j = 0; j < source.length; j += 1) {
                const item = source[j];
                if (typeof item === "string") {
                    if (item.trim()) names.push(item.trim());
                } else {
                    const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(item);
                    const name = record ? $2fe70d8413f7612b$export$8d3f56d05539298a(record.name, record.title) : undefined;
                    if (name) names.push(name);
                }
            }
            if (names.length) return names.join(", ");
        }
    }
    return undefined;
}

const $2fe70d8413f7612b$var$URL_LIKE_KEYS = [ "url", "musicUrl", "playUrl", "play_url", "link" ];

function $2fe70d8413f7612b$export$22fc19959322c831(root, depth) {
    const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(root);
    if (!record || (depth || 0) < 0) return undefined;
    const keys = Object.keys(record);
    for (let i = 0; i < keys.length; i += 1) {
        const value = record[keys[i]];
        if ($2fe70d8413f7612b$var$URL_LIKE_KEYS.indexOf(keys[i]) >= 0 && typeof value === "string" && /^https?:\/\//i.test(value)) return value;
    }
    for (let i = 0; i < keys.length; i += 1) {
        const value = record[keys[i]];
        if (Array.isArray(value)) for (let j = 0; j < value.length; j += 1) {
            const found = $2fe70d8413f7612b$export$22fc19959322c831(value[j], (depth || 0) - 1);
            if (found) return found;
        } else {
            const found = $2fe70d8413f7612b$export$22fc19959322c831(value, (depth || 0) - 1);
            if (found) return found;
        }
    }
    return undefined;
}

const $2fe70d8413f7612b$var$PREFERRED_LIST_KEYS = [ "songs", "list", "tracks", "musicList", "songlist" ];

function $2fe70d8413f7612b$var$looksLikeSongs(items) {
    if (!items.length) return false;
    const sampleCount = items.length < 5 ? items.length : 5;
    let hits = 0;
    for (let i = 0; i < sampleCount; i += 1) {
        const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(items[i]);
        if (!record) continue;
        const hasTitle = $2fe70d8413f7612b$export$8d3f56d05539298a(record.name, record.title, record.songName, record.song);
        const hasIdentity = $2fe70d8413f7612b$var$pickDefined([ record.id, record.songId, record.song_id, record.mid, record.songmid, record.musicId, record.hash ]);
        if (hasTitle && hasIdentity !== undefined) hits += 1;
    }
    return hits >= Math.ceil(sampleCount / 2);
}

function $2fe70d8413f7612b$var$findSongListInRecord(record, depth) {
    if (depth < 0) return [];
    const keys = Object.keys(record);
    for (let i = 0; i < $2fe70d8413f7612b$var$PREFERRED_LIST_KEYS.length; i += 1) {
        const value = record[$2fe70d8413f7612b$var$PREFERRED_LIST_KEYS[i]];
        if (Array.isArray(value) && $2fe70d8413f7612b$var$looksLikeSongs(value)) return value;
    }
    for (let i = 0; i < keys.length; i += 1) {
        const value = record[keys[i]];
        if (Array.isArray(value) && $2fe70d8413f7612b$var$looksLikeSongs(value)) return value;
    }
    for (let i = 0; i < keys.length; i += 1) {
        const value = record[keys[i]];
        if (Array.isArray(value)) continue;
        const nested = $2fe70d8413f7612b$export$badcc9423dc3e1c1(value);
        if (nested) {
            const found = $2fe70d8413f7612b$var$findSongListInRecord(nested, depth - 1);
            if (found.length) return found;
        }
    }
    return [];
}

function $2fe70d8413f7612b$export$83ab0c0b59227553(root, depth) {
    const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(root);
    if (!record) return [];
    return $2fe70d8413f7612b$var$findSongListInRecord(record, depth === undefined ? 4 : depth);
}

const $eb463bb9be5279f7$var$POINT_SONG_SEARCH_LIMIT = 30;

const $eb463bb9be5279f7$var$SIZE_BY_QUALITY = {
    low: "128k",
    standard: "320k",
    high: "flac",
    super: "master"
};

const $eb463bb9be5279f7$var$USER_VARIABLES = [ {
    key: "apikey",
    name: "ChKSz API Key",
    hint: "以 chksz_ 开头；访问 https://api.chksz.com/login 登录后，在账户页复制"
} ];

function $eb463bb9be5279f7$var$mapPointSongItem(options, raw, keyword) {
    const item = {
        id: String((0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(raw.mid, raw.id, raw.hash, raw.n) || ""),
        title: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(raw.name, raw.title, raw.songName) || "",
        artist: (0, $2fe70d8413f7612b$export$f1c212ee0684f3c2)(raw.singer, raw.singers, raw.artist) || "",
        album: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(raw.album, raw.albumName, raw.albumname) || "",
        duration: (0, $2fe70d8413f7612b$export$c8a14c10c33048c2)(raw.duration, raw.interval),
        platform: options.platform,
        source: options.platform,
        keyword: keyword
    };
    if (options.idParam === "mid") item.mid = String((0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(raw.mid, raw.songmid, raw.id) || "");
    return item;
}

function $eb463bb9be5279f7$var$createPointSongPlugin(options) {
    async function search(query, page, type) {
        if (type !== "music") return {
            isEnd: true,
            data: []
        };
        if (Math.floor(Number(page)) > 1) return {
            isEnd: true,
            data: []
        };
        const params = {
            msg: query
        };
        if (options.searchLimitParam) params[options.searchLimitParam] = $eb463bb9be5279f7$var$POINT_SONG_SEARCH_LIMIT;
        const data = await (0, $a6afe7b81da5ac04$export$ad90614321195e52)({
            path: options.endpoint,
            params: params,
            self: this
        });
        const root = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data);
        const rootData = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root ? root.data : undefined);
        const list = Array.isArray(root && root.list) ? root.list : Array.isArray(rootData && rootData.list) ? rootData.list : [];
        return {
            isEnd: true,
            data: list.map(item => $eb463bb9be5279f7$var$mapPointSongItem(options, (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(item) || {}, query))
        };
    }
    async function fetchDetail(self, musicItem, size) {
        const record = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(musicItem) || {};
        const keyword = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(record.keyword, `${(0, 
        $2fe70d8413f7612b$export$8d3f56d05539298a)(record.title) || ""} ${(0, $2fe70d8413f7612b$export$8d3f56d05539298a)(record.artist) || ""}`.trim());
        const directId = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(record[options.idParam], record.id, options.idParam === "mid" ? record.songmid : undefined);
        const params = {};
        if (keyword) params.msg = keyword;
        if (directId) params[options.idParam] = directId;
        if (size) params.size = size;
        if (!keyword && !directId) throw (0, $a6afe7b81da5ac04$export$13019d6ed2a4b3dd)("缺少歌曲标识（mid/id）与关键词，无法解析歌曲");
        const data = await (0, $a6afe7b81da5ac04$export$ad90614321195e52)({
            path: options.endpoint,
            params: params,
            self: self
        });
        return (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data) || {};
    }
    async function getMediaSource(musicItem, quality) {
        const size = $eb463bb9be5279f7$var$SIZE_BY_QUALITY[quality] || "flac";
        const detail = await fetchDetail(this, musicItem, size);
        const detailData = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(detail.data);
        const url = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.url, detailData ? detailData.url : undefined, (0, 
        $2fe70d8413f7612b$export$22fc19959322c831)(detail));
        if (!url) throw (0, $a6afe7b81da5ac04$export$13019d6ed2a4b3dd)("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
        return {
            url: url,
            quality: quality
        };
    }
    async function getLyric(musicItem) {
        const detail = await fetchDetail(this, musicItem);
        const detailData = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(detail.data);
        const lrc = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.lrc, detailData ? detailData.lrc : undefined);
        return lrc ? {
            lrc: lrc
        } : null;
    }
    return {
        platform: options.platform,
        author: "Ohhu",
        version: "1.0.3",
        srcUrl: options.srcUrl,
        cacheControl: "no-store",
        primaryKey: [ options.idParam ],
        supportedSearchType: [ "music" ],
        hints: {
            importMusicSheet: [],
            importMusicItem: []
        },
        userVariables: $eb463bb9be5279f7$var$USER_VARIABLES,
        search: search,
        getMediaSource: getMediaSource,
        getLyric: getLyric
    };
}

function $eb463bb9be5279f7$export$2ef6d92eb854799e() {
    return $eb463bb9be5279f7$var$createPointSongPlugin({
        platform: "ChKSz·QQ音乐",
        endpoint: "/api/qq_music",
        idParam: "mid",
        searchLimitParam: "num",
        srcUrl: "https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v1.0.3/dist/ChKSzQQ.js"
    });
}

function $eb463bb9be5279f7$export$eaa44ae5e5e89012() {
    return $eb463bb9be5279f7$var$createPointSongPlugin({
        platform: "ChKSz·酷狗",
        endpoint: "/api/kugou_music",
        idParam: "id",
        srcUrl: "https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v1.0.3/dist/ChKSzKugou.js"
    });
}

module.exports = (0, $eb463bb9be5279f7$export$2ef6d92eb854799e)();