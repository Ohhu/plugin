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

const $eb463bb9be5279f7$var$DETAIL_CACHE_LIMIT = 100;

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
    const detailCache = {};
    const detailCacheOrder = [];
    function cacheKeyOf(record) {
        const key = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(record[options.idParam], options.idParam === "mid" ? record.songmid : undefined, record.id);
        return key || null;
    }
    function rememberDetail(key, detail) {
        const detailData = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(detail.data);
        const info = {
            url: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.url, detailData ? detailData.url : undefined),
            cover: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.cover, detailData ? detailData.cover : undefined),
            lrc: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.lrc, detailData ? detailData.lrc : undefined),
            album: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.album, detailData ? detailData.album : undefined),
            title: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(detail.name, detailData ? detailData.name : undefined),
            artist: (0, $2fe70d8413f7612b$export$f1c212ee0684f3c2)(detail.singer, detailData ? detailData.singer : undefined),
            interval: (0, $2fe70d8413f7612b$export$9c2d3e693419842c)(detail.interval, detailData ? detailData.interval : undefined)
        };
        const cacheKey = key || cacheKeyOf(detail);
        if (cacheKey) {
            if (!detailCache[cacheKey]) {
                detailCacheOrder.push(cacheKey);
                while (detailCacheOrder.length > $eb463bb9be5279f7$var$DETAIL_CACHE_LIMIT) {
                    const oldest = detailCacheOrder.shift();
                    if (oldest && detailCache[oldest]) delete detailCache[oldest];
                }
            }
            detailCache[cacheKey] = info;
        }
        return info;
    }
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
            self: self,
            timeoutMs: (0, $a6afe7b81da5ac04$export$1ad3691e597a27ef)
        });
        return (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data) || {};
    }
    async function getMediaSource(musicItem, quality) {
        const size = $eb463bb9be5279f7$var$SIZE_BY_QUALITY[quality] || "flac";
        const record = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(musicItem) || {};
        const detail = await fetchDetail(this, musicItem, size);
        const info = rememberDetail(cacheKeyOf(record), detail);
        const url = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(info.url, (0, $2fe70d8413f7612b$export$22fc19959322c831)(detail));
        if (!url) throw (0, $a6afe7b81da5ac04$export$13019d6ed2a4b3dd)("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
        return {
            url: url,
            quality: quality
        };
    }
    async function getLyric(musicItem) {
        const record = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(musicItem) || {};
        const key = cacheKeyOf(record);
        const cached = key ? detailCache[key] : undefined;
        if (cached) return cached.lrc ? {
            rawLrc: cached.lrc
        } : null;
        const detail = await fetchDetail(this, musicItem);
        const info = rememberDetail(key, detail);
        return info.lrc ? {
            rawLrc: info.lrc
        } : null;
    }
    async function getMusicInfo(musicBase) {
        const record = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(musicBase) || {};
        const key = cacheKeyOf(record);
        const cached = key ? detailCache[key] : undefined;
        if (!cached) return null;
        const info = {};
        if (cached.title) info.title = cached.title;
        if (cached.artist) info.artist = cached.artist;
        if (cached.album) info.album = cached.album;
        if (cached.cover) info.artwork = cached.cover;
        if (cached.interval) info.duration = (0, $2fe70d8413f7612b$export$c8a14c10c33048c2)(cached.interval);
        return info;
    }
    return {
        platform: options.platform,
        author: "Ohhu",
        version: "1.0.8",
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
        getLyric: getLyric,
        getMusicInfo: getMusicInfo
    };
}

const $eb463bb9be5279f7$export$7a13aa922dabd899 = "ChKSz·QQ音乐";

function $eb463bb9be5279f7$export$2ef6d92eb854799e() {
    return $eb463bb9be5279f7$var$createPointSongPlugin({
        platform: $eb463bb9be5279f7$export$7a13aa922dabd899,
        endpoint: "/api/qq_music",
        idParam: "mid",
        searchLimitParam: "num",
        srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzQQ.js"
    });
}

function $eb463bb9be5279f7$export$eaa44ae5e5e89012() {
    return $eb463bb9be5279f7$var$createPointSongPlugin({
        platform: "ChKSz·酷狗",
        endpoint: "/api/kugou_music",
        idParam: "id",
        srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzKugou.js"
    });
}

const $df22fc6da2618097$var$QQ_SHEET_API_URLS = [ "https://u6.y.qq.com/cgi-bin/musics.fcg", "https://u.y.qq.com/cgi-bin/musics.fcg" ];

const $df22fc6da2618097$var$QQ_SHEET_PLATFORMS = [ "-1", "android", "iphone", "h5", "wxfshare", "iphone_wx", "windows" ];

const $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE = 30;

const $df22fc6da2618097$var$QQ_SHEET_MAX_TOTAL = 1e4;

const $df22fc6da2618097$var$QQ_SHEET_TIMEOUT_MS = 1e4;

const $df22fc6da2618097$var$QQ_SHEET_ERROR_LENGTH = 108;

function $df22fc6da2618097$var$add32(a, b) {
    return a + b & 4294967295;
}

function $df22fc6da2618097$var$rol(num, cnt) {
    return num << cnt | num >>> 32 - cnt;
}

function $df22fc6da2618097$var$cmn(q, a, b, x, s, t) {
    return $df22fc6da2618097$var$add32($df22fc6da2618097$var$rol($df22fc6da2618097$var$add32($df22fc6da2618097$var$add32(a, q), $df22fc6da2618097$var$add32(x, t)), s), b);
}

function $df22fc6da2618097$var$ff(a, b, c, d, x, s, t) {
    return $df22fc6da2618097$var$cmn(b & c | ~b & d, a, b, x, s, t);
}

function $df22fc6da2618097$var$gg(a, b, c, d, x, s, t) {
    return $df22fc6da2618097$var$cmn(b & d | c & ~d, a, b, x, s, t);
}

function $df22fc6da2618097$var$hh(a, b, c, d, x, s, t) {
    return $df22fc6da2618097$var$cmn(b ^ c ^ d, a, b, x, s, t);
}

function $df22fc6da2618097$var$ii(a, b, c, d, x, s, t) {
    return $df22fc6da2618097$var$cmn(c ^ (b | ~d), a, b, x, s, t);
}

function $df22fc6da2618097$var$md5Cycle(x, k) {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];
    a = $df22fc6da2618097$var$ff(a, b, c, d, k[0], 7, -680876936);
    d = $df22fc6da2618097$var$ff(d, a, b, c, k[1], 12, -389564586);
    c = $df22fc6da2618097$var$ff(c, d, a, b, k[2], 17, 606105819);
    b = $df22fc6da2618097$var$ff(b, c, d, a, k[3], 22, -1044525330);
    a = $df22fc6da2618097$var$ff(a, b, c, d, k[4], 7, -176418897);
    d = $df22fc6da2618097$var$ff(d, a, b, c, k[5], 12, 1200080426);
    c = $df22fc6da2618097$var$ff(c, d, a, b, k[6], 17, -1473231341);
    b = $df22fc6da2618097$var$ff(b, c, d, a, k[7], 22, -45705983);
    a = $df22fc6da2618097$var$ff(a, b, c, d, k[8], 7, 1770035416);
    d = $df22fc6da2618097$var$ff(d, a, b, c, k[9], 12, -1958414417);
    c = $df22fc6da2618097$var$ff(c, d, a, b, k[10], 17, -42063);
    b = $df22fc6da2618097$var$ff(b, c, d, a, k[11], 22, -1990404162);
    a = $df22fc6da2618097$var$ff(a, b, c, d, k[12], 7, 1804603682);
    d = $df22fc6da2618097$var$ff(d, a, b, c, k[13], 12, -40341101);
    c = $df22fc6da2618097$var$ff(c, d, a, b, k[14], 17, -1502002290);
    b = $df22fc6da2618097$var$ff(b, c, d, a, k[15], 22, 1236535329);
    a = $df22fc6da2618097$var$gg(a, b, c, d, k[1], 5, -165796510);
    d = $df22fc6da2618097$var$gg(d, a, b, c, k[6], 9, -1069501632);
    c = $df22fc6da2618097$var$gg(c, d, a, b, k[11], 14, 643717713);
    b = $df22fc6da2618097$var$gg(b, c, d, a, k[0], 20, -373897302);
    a = $df22fc6da2618097$var$gg(a, b, c, d, k[5], 5, -701558691);
    d = $df22fc6da2618097$var$gg(d, a, b, c, k[10], 9, 38016083);
    c = $df22fc6da2618097$var$gg(c, d, a, b, k[15], 14, -660478335);
    b = $df22fc6da2618097$var$gg(b, c, d, a, k[4], 20, -405537848);
    a = $df22fc6da2618097$var$gg(a, b, c, d, k[9], 5, 568446438);
    d = $df22fc6da2618097$var$gg(d, a, b, c, k[14], 9, -1019803690);
    c = $df22fc6da2618097$var$gg(c, d, a, b, k[3], 14, -187363961);
    b = $df22fc6da2618097$var$gg(b, c, d, a, k[8], 20, 1163531501);
    a = $df22fc6da2618097$var$gg(a, b, c, d, k[13], 5, -1444681467);
    d = $df22fc6da2618097$var$gg(d, a, b, c, k[2], 9, -51403784);
    c = $df22fc6da2618097$var$gg(c, d, a, b, k[7], 14, 1735328473);
    b = $df22fc6da2618097$var$gg(b, c, d, a, k[12], 20, -1926607734);
    a = $df22fc6da2618097$var$hh(a, b, c, d, k[5], 4, -378558);
    d = $df22fc6da2618097$var$hh(d, a, b, c, k[8], 11, -2022574463);
    c = $df22fc6da2618097$var$hh(c, d, a, b, k[11], 16, 1839030562);
    b = $df22fc6da2618097$var$hh(b, c, d, a, k[14], 23, -35309556);
    a = $df22fc6da2618097$var$hh(a, b, c, d, k[1], 4, -1530992060);
    d = $df22fc6da2618097$var$hh(d, a, b, c, k[4], 11, 1272893353);
    c = $df22fc6da2618097$var$hh(c, d, a, b, k[7], 16, -155497632);
    b = $df22fc6da2618097$var$hh(b, c, d, a, k[10], 23, -1094730640);
    a = $df22fc6da2618097$var$hh(a, b, c, d, k[13], 4, 681279174);
    d = $df22fc6da2618097$var$hh(d, a, b, c, k[0], 11, -358537222);
    c = $df22fc6da2618097$var$hh(c, d, a, b, k[3], 16, -722521979);
    b = $df22fc6da2618097$var$hh(b, c, d, a, k[6], 23, 76029189);
    a = $df22fc6da2618097$var$hh(a, b, c, d, k[9], 4, -640364487);
    d = $df22fc6da2618097$var$hh(d, a, b, c, k[12], 11, -421815835);
    c = $df22fc6da2618097$var$hh(c, d, a, b, k[15], 16, 530742520);
    b = $df22fc6da2618097$var$hh(b, c, d, a, k[2], 23, -995338651);
    a = $df22fc6da2618097$var$ii(a, b, c, d, k[0], 6, -198630844);
    d = $df22fc6da2618097$var$ii(d, a, b, c, k[7], 10, 1126891415);
    c = $df22fc6da2618097$var$ii(c, d, a, b, k[14], 15, -1416354905);
    b = $df22fc6da2618097$var$ii(b, c, d, a, k[5], 21, -57434055);
    a = $df22fc6da2618097$var$ii(a, b, c, d, k[12], 6, 1700485571);
    d = $df22fc6da2618097$var$ii(d, a, b, c, k[3], 10, -1894986606);
    c = $df22fc6da2618097$var$ii(c, d, a, b, k[10], 15, -1051523);
    b = $df22fc6da2618097$var$ii(b, c, d, a, k[1], 21, -2054922799);
    a = $df22fc6da2618097$var$ii(a, b, c, d, k[8], 6, 1873313359);
    d = $df22fc6da2618097$var$ii(d, a, b, c, k[15], 10, -30611744);
    c = $df22fc6da2618097$var$ii(c, d, a, b, k[6], 15, -1560198380);
    b = $df22fc6da2618097$var$ii(b, c, d, a, k[13], 21, 1309151649);
    a = $df22fc6da2618097$var$ii(a, b, c, d, k[4], 6, -145523070);
    d = $df22fc6da2618097$var$ii(d, a, b, c, k[11], 10, -1120210379);
    c = $df22fc6da2618097$var$ii(c, d, a, b, k[2], 15, 718787259);
    b = $df22fc6da2618097$var$ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = $df22fc6da2618097$var$add32(a, x[0]);
    x[1] = $df22fc6da2618097$var$add32(b, x[1]);
    x[2] = $df22fc6da2618097$var$add32(c, x[2]);
    x[3] = $df22fc6da2618097$var$add32(d, x[3]);
}

function $df22fc6da2618097$var$md5Bytes(input) {
    const encoded = unescape(encodeURIComponent(input));
    const bytes = [];
    for (let i = 0; i < encoded.length; i += 1) bytes.push(encoded.charCodeAt(i));
    return bytes;
}

function $df22fc6da2618097$var$md5(input) {
    const bytes = $df22fc6da2618097$var$md5Bytes(input);
    const originalBitLength = bytes.length * 8;
    const paddedLength = ((bytes.length + 8 >> 6) + 1) * 64;
    const padded = [];
    for (let i = 0; i < paddedLength; i += 1) padded.push(0);
    for (let i = 0; i < bytes.length; i += 1) padded[i] = bytes[i];
    padded[bytes.length] = 128;
    for (let i = 0; i < 8; i += 1) padded[paddedLength - 8 + i] = Math.floor(originalBitLength / Math.pow(256, i)) & 255;
    const state = [ 1732584193, -271733879, -1732584194, 271733878 ];
    for (let i = 0; i < paddedLength; i += 64) {
        const block = [];
        for (let j = 0; j < 64; j += 4) block.push(padded[i + j] | padded[i + j + 1] << 8 | padded[i + j + 2] << 16 | padded[i + j + 3] << 24);
        $df22fc6da2618097$var$md5Cycle(state, block);
    }
    const hex = [];
    for (let i = 0; i < state.length; i += 1) {
        const n = state[i];
        for (let j = 0; j < 4; j += 1) {
            const byte = n >>> j * 8 & 255;
            const text = byte.toString(16);
            hex.push(text.length < 2 ? "0" + text : text);
        }
    }
    return hex.join("");
}

function $df22fc6da2618097$var$selectChars(str, indices) {
    let result = "";
    for (let i = 0; i < indices.length; i += 1) result += str[indices[i]];
    return result;
}

function $df22fc6da2618097$var$qqSheetSign(param) {
    const l1 = [ 212, 45, 80, 68, 195, 163, 163, 203, 157, 220, 254, 91, 204, 79, 104, 6 ];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    const md5Str = $df22fc6da2618097$var$md5(param).toUpperCase();
    const t1 = $df22fc6da2618097$var$selectChars(md5Str, [ 21, 4, 9, 26, 16, 20, 27, 30 ]);
    const t3 = $df22fc6da2618097$var$selectChars(md5Str, [ 18, 11, 3, 2, 1, 7, 6, 25 ]);
    const ls2 = [];
    for (let i = 0; i < 16; i += 1) {
        const x1 = parseInt(md5Str[i * 2], 16);
        const x2 = parseInt(md5Str[i * 2 + 1], 16);
        ls2.push(x1 * 16 ^ x2 ^ l1[i]);
    }
    const ls3 = [];
    for (let i = 0; i < 6; i += 1) if (i === 5) {
        const last = ls2[ls2.length - 1];
        ls3.push(chars[last >> 2], chars[(last & 3) << 4]);
    } else {
        const x4 = ls2[i * 3] >> 2;
        const x5 = ls2[i * 3 + 1] >> 4 ^ (ls2[i * 3] & 3) << 4;
        const x6 = ls2[i * 3 + 2] >> 6 ^ (ls2[i * 3 + 1] & 15) << 2;
        const x7 = 63 & ls2[i * 3 + 2];
        ls3.push(chars[x4] + chars[x5] + chars[x6] + chars[x7]);
    }
    const combined = ls3.join("");
    return "zzb" + (t1 + combined + t3).toLowerCase();
}

function $df22fc6da2618097$export$e8fa40ce8154c452(input) {
    const value = String(input || "").trim();
    if (/^\d+$/.test(value)) return value;
    const patterns = [ /y\.qq\.com\/n\/ryqq\/playlist\/(\d+)/, /\/playlist\/(\d+)/, /[?&]id=(\d+)/ ];
    for (let i = 0; i < patterns.length; i += 1) {
        const match = value.match(patterns[i]);
        if (match) return match[1];
    }
    return null;
}

function $df22fc6da2618097$var$buildSheetRequestBody(disstid, platform, songBegin, songNum) {
    return JSON.stringify({
        req_0: {
            module: "music.srfDissInfo.aiDissInfo",
            method: "uniform_get_Dissinfo",
            param: {
                disstid: Number(disstid),
                enc_host_uin: "",
                tag: 1,
                userinfo: 1,
                song_begin: songBegin,
                song_num: songNum
            }
        },
        comm: {
            g_tk: 5381,
            uin: 0,
            format: "json",
            platform: platform
        }
    });
}

async function $df22fc6da2618097$var$fetchSheetPage(disstid, songBegin, songNum) {
    let lastError = null;
    for (let u = 0; u < $df22fc6da2618097$var$QQ_SHEET_API_URLS.length; u += 1) for (let p = 0; p < $df22fc6da2618097$var$QQ_SHEET_PLATFORMS.length; p += 1) {
        const bodyText = $df22fc6da2618097$var$buildSheetRequestBody(disstid, $df22fc6da2618097$var$QQ_SHEET_PLATFORMS[p], songBegin, songNum);
        const sign = $df22fc6da2618097$var$qqSheetSign(bodyText);
        const url = $df22fc6da2618097$var$QQ_SHEET_API_URLS[u] + "?sign=" + encodeURIComponent(sign) + "&_=" + Date.now();
        try {
            const response = await (0, $parcel$interopDefault($g8oBv$axios)).post(url, bodyText, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: $df22fc6da2618097$var$QQ_SHEET_TIMEOUT_MS,
                responseType: "text",
                transformResponse: [ function(data) {
                    return data;
                } ]
            });
            const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
            if (text.length === $df22fc6da2618097$var$QQ_SHEET_ERROR_LENGTH) {
                lastError = new Error("QQ 音乐网关拒绝了该请求组合");
                continue;
            }
            const json = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(JSON.parse(text));
            const req0 = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(json ? json.req_0 : undefined);
            const req0Data = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(req0 ? req0.data : undefined);
            if (json && json.code === 0 && req0 && req0.code === 0 && Array.isArray(req0Data ? req0Data.songlist : undefined)) return json;
            lastError = new Error("QQ音乐歌单响应格式异常");
        } catch (error) {
            lastError = error && error.message ? error : new Error(String(error));
        }
    }
    throw lastError || new Error("QQ音乐歌单请求全部失败");
}

function $df22fc6da2618097$var$qqAlbumCover(albumMid) {
    return albumMid ? "https://y.gtimg.cn/music/photo_new/T002R300x300M000" + albumMid + ".jpg" : undefined;
}

function $df22fc6da2618097$var$mapSheetSong(song) {
    const album = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(song.album);
    const albumMid = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(album ? album.pmid : undefined, album ? album.mid : undefined, song.albummid) || "";
    const mid = String((0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(song.mid, song.songmid) || "");
    const title = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(song.title, song.name) || "";
    const artist = (0, $2fe70d8413f7612b$export$f1c212ee0684f3c2)(song.singer) || "";
    return {
        id: mid,
        mid: mid,
        title: title,
        artist: artist,
        album: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(album ? album.title : undefined, album ? album.name : undefined, song.albumname) || "",
        artwork: $df22fc6da2618097$var$qqAlbumCover(albumMid),
        duration: (0, $2fe70d8413f7612b$export$c8a14c10c33048c2)((0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(song.interval, song.duration)),
        platform: (0, $eb463bb9be5279f7$export$7a13aa922dabd899),
        source: (0, $eb463bb9be5279f7$export$7a13aa922dabd899),
        keyword: (title + " " + artist).trim()
    };
}

async function $df22fc6da2618097$var$fetchQQSheet(input) {
    const playlistId = $df22fc6da2618097$export$e8fa40ce8154c452(input);
    if (!playlistId) throw new Error("无法识别 QQ 音乐歌单：请传入 y.qq.com 歌单链接或纯数字歌单 ID");
    const firstPage = await $df22fc6da2618097$var$fetchSheetPage(playlistId, 0, $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE);
    const req0 = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(firstPage.req_0);
    const firstData = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(req0 ? req0.data : undefined) || {};
    const dirinfo = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(firstData.dirinfo) || {};
    const firstList = Array.isArray(firstData.songlist) ? firstData.songlist : [];
    const total = Math.min((0, $2fe70d8413f7612b$export$9c2d3e693419842c)(dirinfo.songnum) || firstList.length || 0, $df22fc6da2618097$var$QQ_SHEET_MAX_TOTAL);
    const songs = firstList.map(function(item) {
        return $df22fc6da2618097$var$mapSheetSong((0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(item) || {});
    });
    const pageCount = Math.ceil(total / $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE);
    for (let page = 1; page < pageCount; page += 1) {
        const songBegin = page * $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE;
        const songNum = Math.min($df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE, total - songBegin);
        const pageResult = await $df22fc6da2618097$var$fetchSheetPage(playlistId, songBegin, songNum);
        const req0Next = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(pageResult.req_0);
        const dataNext = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(req0Next ? req0Next.data : undefined) || {};
        const listNext = Array.isArray(dataNext.songlist) ? dataNext.songlist : [];
        for (let i = 0; i < listNext.length; i += 1) songs.push($df22fc6da2618097$var$mapSheetSong((0, 
        $2fe70d8413f7612b$export$badcc9423dc3e1c1)(listNext[i]) || {}));
    }
    return {
        id: playlistId,
        title: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(dirinfo.title, dirinfo.dissname) || "QQ音乐歌单",
        description: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(dirinfo.desc, dirinfo.dissdesc) || "",
        cover: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(dirinfo.picurl, dirinfo.logo),
        creator: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(dirinfo.nickname, dirinfo.host_nick),
        playCount: (0, $2fe70d8413f7612b$export$9c2d3e693419842c)(dirinfo.visitnum, dirinfo.listennum),
        songCount: total,
        songs: songs
    };
}

async function $df22fc6da2618097$var$importQQMusicSheet(urlLike) {
    const sheet = await $df22fc6da2618097$var$fetchQQSheet(urlLike);
    return sheet.songs;
}

async function $df22fc6da2618097$var$getQQMusicSheetInfo(sheetItem, page) {
    const sheet = await $df22fc6da2618097$var$fetchQQSheet(String(sheetItem.id));
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const start = (safePage - 1) * $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE;
    return {
        isEnd: start + $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE >= sheet.songs.length,
        sheetItem: {
            id: sheet.id,
            platform: (0, $eb463bb9be5279f7$export$7a13aa922dabd899),
            source: (0, $eb463bb9be5279f7$export$7a13aa922dabd899),
            title: sheet.title || sheetItem.title,
            description: sheet.description || sheetItem.description,
            artwork: sheet.cover || sheetItem.coverImg,
            artist: sheet.creator,
            playCount: sheet.playCount,
            worksNum: sheet.songCount
        },
        musicList: sheet.songs.slice(start, start + $df22fc6da2618097$var$QQ_SHEET_PAGE_SIZE)
    };
}

function $df22fc6da2618097$export$9743f9e908b8e60(plugin) {
    plugin.importMusicSheet = $df22fc6da2618097$var$importQQMusicSheet;
    plugin.getMusicSheetInfo = $df22fc6da2618097$var$getQQMusicSheetInfo;
    if (plugin.hints) plugin.hints.importMusicSheet = [ "支持 QQ 音乐歌单链接（y.qq.com）或纯数字歌单 ID。", "歌单通过 QQ 官方接口直连获取，不消耗 ChKSz 额度；播放时走 ChKSz 解析。" ];
    return plugin;
}

module.exports = (0, $df22fc6da2618097$export$9743f9e908b8e60)((0, $eb463bb9be5279f7$export$2ef6d92eb854799e)());