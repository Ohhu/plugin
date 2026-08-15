var $gjr1N$axios = require("axios");

function $parcel$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
}

const $a6afe7b81da5ac04$export$1b6bf9910cf9afa0 = "https://api.chksz.com";

const $a6afe7b81da5ac04$export$94bbe8f22941309c = 12e3;

const $a6afe7b81da5ac04$export$1ad3691e597a27ef = 25e3;

const $a6afe7b81da5ac04$var$CHKSZ_MAX_RETRY_AFTER_SECONDS = 10;

const $a6afe7b81da5ac04$var$API_KEY_VARIABLE_NAMES = [ "apikey", "apiKey", "key", "API Key" ];

class $a6afe7b81da5ac04$export$66edf9116816b092 extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ChKSzApiError";
        this.status = status;
    }
}

function $a6afe7b81da5ac04$var$sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function $a6afe7b81da5ac04$var$readUserVariables(self) {
    const raw = self?.userVariables;
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

function $a6afe7b81da5ac04$export$d2f6112f5650928(self) {
    const variables = $a6afe7b81da5ac04$var$readUserVariables(self);
    for (const name of $a6afe7b81da5ac04$var$API_KEY_VARIABLE_NAMES) {
        const value = variables[name];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    throw new $a6afe7b81da5ac04$export$66edf9116816b092("尚未配置 ChKSz API Key：请在 MusicFree 的插件设置中填写个人 Key（访问 https://api.chksz.com/login 登录后，在账户页复制以 chksz_ 开头的 Key）");
}

function $a6afe7b81da5ac04$var$buildUrl(path, params, apikey) {
    const query = [];
    const append = (key, value) => {
        query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    };
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        append(key, String(value));
    });
    append("apikey", apikey);
    return `${$a6afe7b81da5ac04$export$1b6bf9910cf9afa0}${path}?${query.join("&")}`;
}

function $a6afe7b81da5ac04$var$maskSecret(text, secret) {
    return secret ? text.split(secret).join("chksz_***") : text;
}

function $a6afe7b81da5ac04$var$pickDetail(data) {
    if (data && typeof data === "object") {
        const source = data;
        const message = source.msg ?? source.message ?? source.error;
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
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 请求参数错误${suffix}`, status);

      case 401:
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz API Key 无效或登录失效${suffix}，请在插件设置中检查 Key`, status);

      case 402:
        return new $a6afe7b81da5ac04$export$66edf9116816b092("ChKSz 免费和付费额度均已用尽：北京时间次日凌晨重置免费额度，或使用 LDC 兑换付费额度", status);

      case 403:
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 拒绝访问（用户、Key 或 IP 可能被封禁）${suffix}`, status);

      case 404:
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 接口或资源不存在${suffix}`, status);

      case 429:
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 速率限制（每个 Key 每分钟 20 次）${suffix}，请稍后重试`, status);

      case 503:
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 服务暂不可用或已被管理员停用${suffix}，请稍后重试`, status);

      default:
        return new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 请求失败（HTTP ${status}）${suffix}`, status);
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
    const timeoutMs = options.timeoutMs ?? $a6afe7b81da5ac04$export$94bbe8f22941309c;
    const requestOnce = async () => {
        try {
            return await (0, $parcel$interopDefault($gjr1N$axios)).get(url, {
                timeout: timeoutMs,
                responseType: "json",
                validateStatus: () => true
            });
        } catch (error) {
            const reason = error && typeof error === "object" && typeof error.message === "string" ? error.message : String(error);
            throw new $a6afe7b81da5ac04$export$66edf9116816b092(`ChKSz 网络请求失败：${$a6afe7b81da5ac04$var$maskSecret(reason, apikey)}`);
        }
    };
    let response = await requestOnce();
    if (response && response.status === 429) {
        const retryAfter = $a6afe7b81da5ac04$var$parseRetryAfterSeconds(response.headers?.["retry-after"]);
        if (retryAfter !== null && retryAfter <= $a6afe7b81da5ac04$var$CHKSZ_MAX_RETRY_AFTER_SECONDS) {
            await $a6afe7b81da5ac04$var$sleep((retryAfter + 1) * 1e3);
            response = await requestOnce();
        }
    }
    const status = response?.status ?? 0;
    if (status >= 200 && status < 300) return response?.data ?? null;
    throw $a6afe7b81da5ac04$var$toStatusError(status, $a6afe7b81da5ac04$var$pickDetail(response?.data));
}

function $2fe70d8413f7612b$export$badcc9423dc3e1c1(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}

function $2fe70d8413f7612b$export$c4ed8c822f31cc12(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
}

function $2fe70d8413f7612b$export$8d3f56d05539298a(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
}

function $2fe70d8413f7612b$export$9c2d3e693419842c(...values) {
    for (const value of values) {
        if (value === undefined || value === null || value === "") continue;
        const parsed = Number(value);
        if (isFinite(parsed)) return parsed;
    }
    return undefined;
}

function $2fe70d8413f7612b$export$c8a14c10c33048c2(...values) {
    const parsed = $2fe70d8413f7612b$export$9c2d3e693419842c(...values);
    if (parsed === undefined || parsed <= 0) return undefined;
    return parsed < 5400 ? Math.round(parsed * 1e3) : Math.round(parsed);
}

function $2fe70d8413f7612b$export$f1c212ee0684f3c2(...sources) {
    for (const source of sources) {
        if (typeof source === "string" && source.trim()) return source.trim();
        if (Array.isArray(source)) {
            const names = source.map(item => {
                if (typeof item === "string") return item.trim() || undefined;
                const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(item);
                return record ? $2fe70d8413f7612b$export$8d3f56d05539298a(record.name, record.title) : undefined;
            }).filter(name => Boolean(name));
            if (names.length) return names.join(", ");
        }
    }
    return undefined;
}

const $2fe70d8413f7612b$var$URL_LIKE_KEYS = [ "url", "musicUrl", "playUrl", "play_url", "link" ];

function $2fe70d8413f7612b$export$22fc19959322c831(root, depth = 4) {
    const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(root);
    if (!record || depth < 0) return undefined;
    for (const [key, value] of Object.entries(record)) {
        if ($2fe70d8413f7612b$var$URL_LIKE_KEYS.indexOf(key) >= 0 && typeof value === "string" && /^https?:\/\//i.test(value)) return value;
    }
    for (const value of Object.values(record)) {
        if (Array.isArray(value)) for (const item of value) {
            const found = $2fe70d8413f7612b$export$22fc19959322c831(item, depth - 1);
            if (found) return found;
        } else {
            const found = $2fe70d8413f7612b$export$22fc19959322c831(value, depth - 1);
            if (found) return found;
        }
    }
    return undefined;
}

const $2fe70d8413f7612b$var$PREFERRED_LIST_KEYS = [ "songs", "list", "tracks", "musicList", "songlist" ];

function $2fe70d8413f7612b$var$looksLikeSongs(items) {
    if (!items.length) return false;
    const sample = items.slice(0, 5);
    let hits = 0;
    sample.forEach(item => {
        const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(item);
        if (!record) return;
        const hasTitle = $2fe70d8413f7612b$export$8d3f56d05539298a(record.name, record.title, record.songName, record.song);
        const hasIdentity = $2fe70d8413f7612b$export$c4ed8c822f31cc12(record.id, record.songId, record.song_id, record.mid, record.songmid, record.musicId, record.hash);
        if (hasTitle && hasIdentity !== undefined) hits += 1;
    });
    return hits >= Math.ceil(sample.length / 2);
}

function $2fe70d8413f7612b$export$83ab0c0b59227553(root, depth = 4) {
    const record = $2fe70d8413f7612b$export$badcc9423dc3e1c1(root);
    if (!record || depth < 0) return [];
    for (const key of $2fe70d8413f7612b$var$PREFERRED_LIST_KEYS) {
        const value = record[key];
        if (Array.isArray(value) && $2fe70d8413f7612b$var$looksLikeSongs(value)) return value;
    }
    for (const value of Object.values(record)) {
        if (Array.isArray(value) && $2fe70d8413f7612b$var$looksLikeSongs(value)) return value;
    }
    for (const value of Object.values(record)) {
        if (Array.isArray(value)) continue;
        const nested = $2fe70d8413f7612b$export$83ab0c0b59227553(value, depth - 1);
        if (nested.length) return nested;
    }
    return [];
}

const $7f28772cb2d30742$export$fb4417ed62a774fb = "ChKSz·网易云";

const $7f28772cb2d30742$export$d41e84739c89bdfb = 30;

const $7f28772cb2d30742$var$NETEASE_QUALITY_LEVEL = {
    low: "standard",
    standard: "exhigh",
    high: "lossless",
    super: "jymaster"
};

const $7f28772cb2d30742$var$USER_VARIABLES = [ {
    key: "apikey",
    name: "ChKSz API Key",
    hint: "以 chksz_ 开头；访问 https://api.chksz.com/login 登录后，在账户页复制"
} ];

function $7f28772cb2d30742$export$f4d330e02bd7717f(raw) {
    const album = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)((0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(raw.album, raw.al));
    const artists = (0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(raw.artists, raw.singers, raw.ar, raw.artist);
    return {
        id: String((0, $2fe70d8413f7612b$export$c4ed8c822f31cc12)(raw.id, raw.songId, raw.song_id, raw.musicId) ?? ""),
        title: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(raw.name, raw.title, raw.songName) ?? "",
        artist: (0, $2fe70d8413f7612b$export$f1c212ee0684f3c2)(artists) ?? "",
        album: (album ? (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(album.name, album.title) : undefined) ?? (0, 
        $2fe70d8413f7612b$export$8d3f56d05539298a)(raw.albumName, raw.albumname, raw.album) ?? "",
        artwork: (album ? (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(album.picUrl, album.cover, album.coverImgUrl) : undefined) ?? (0, 
        $2fe70d8413f7612b$export$8d3f56d05539298a)(raw.picUrl, raw.cover, raw.coverImgUrl),
        duration: (0, $2fe70d8413f7612b$export$c8a14c10c33048c2)(raw.duration, raw.dt, raw.interval),
        platform: $7f28772cb2d30742$export$fb4417ed62a774fb,
        source: $7f28772cb2d30742$export$fb4417ed62a774fb
    };
}

async function $7f28772cb2d30742$var$searchNetease(query, page, type) {
    if (type !== "music") return {
        isEnd: true,
        data: []
    };
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const offset = (safePage - 1) * $7f28772cb2d30742$export$d41e84739c89bdfb;
    const data = await (0, $a6afe7b81da5ac04$export$ad90614321195e52)({
        path: "/api/163_search",
        params: {
            keyword: query,
            limit: $7f28772cb2d30742$export$d41e84739c89bdfb,
            offset: offset
        },
        self: this
    });
    const list = (0, $2fe70d8413f7612b$export$83ab0c0b59227553)(data);
    const root = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data) || {};
    const inner = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root.data) || root;
    const total = (0, $2fe70d8413f7612b$export$9c2d3e693419842c)(root.total, root.count, root.songCount, inner.total, inner.count, (0, 
    $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root.result)?.songCount, (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(inner.result)?.songCount);
    return {
        isEnd: list.length < $7f28772cb2d30742$export$d41e84739c89bdfb || total !== undefined && offset + list.length >= total,
        data: list.map(item => $7f28772cb2d30742$export$f4d330e02bd7717f((0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(item) || {}))
    };
}

async function $7f28772cb2d30742$var$getNeteaseMediaSource(musicItem, quality) {
    const level = $7f28772cb2d30742$var$NETEASE_QUALITY_LEVEL[quality] || "jymaster";
    const data = await (0, $a6afe7b81da5ac04$export$ad90614321195e52)({
        path: "/api/163_music",
        params: {
            id: musicItem.id,
            level: level
        },
        self: this
    });
    const root = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data);
    const url = (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(root?.url, (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root?.data)?.url, (0, 
    $2fe70d8413f7612b$export$22fc19959322c831)(data));
    if (!url) throw new (0, $a6afe7b81da5ac04$export$66edf9116816b092)("ChKSz 未返回播放地址：歌曲可能无版权或当前音质不可用，可尝试切换音质");
    return {
        url: url,
        quality: quality
    };
}

function $7f28772cb2d30742$var$lyricTextOf(value) {
    if (typeof value === "string") return value.trim() ? value : undefined;
    const record = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(value);
    if (record) return (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(record.lyric, record.content, record.text, record.lrc);
    return undefined;
}

async function $7f28772cb2d30742$var$getNeteaseLyric(musicItem) {
    const data = await (0, $a6afe7b81da5ac04$export$ad90614321195e52)({
        path: "/api/163_lyric",
        params: {
            id: musicItem.id
        },
        self: this
    });
    const root = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data) || {};
    const inner = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root.data) || root;
    const lrc = $7f28772cb2d30742$var$lyricTextOf(inner.lrc) ?? $7f28772cb2d30742$var$lyricTextOf(root.lrc) ?? $7f28772cb2d30742$var$lyricTextOf(inner.lyric) ?? $7f28772cb2d30742$var$lyricTextOf(root.lyric) ?? $7f28772cb2d30742$var$lyricTextOf(inner.tlyric) ?? $7f28772cb2d30742$var$lyricTextOf(root.tlyric);
    return lrc ? {
        lrc: lrc
    } : null;
}

function $7f28772cb2d30742$export$c2125087b6972bc(input) {
    const value = String(input || "").trim();
    if (!value) return null;
    if (/^\d+$/.test(value)) return value;
    const patterns = [ /[?&]id=(\d+)/, /playlist\/(\d+)/ ];
    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function $7f28772cb2d30742$var$fetchNeteasePlaylist(playlistId) {
    const data = await (0, $a6afe7b81da5ac04$export$ad90614321195e52)({
        path: "/api/163_playlist",
        params: {
            id: playlistId
        },
        self: this,
        timeoutMs: (0, $a6afe7b81da5ac04$export$1ad3691e597a27ef)
    });
    const root = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(data) || {};
    const playlist = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root.playlist) ?? (0, 
    $2fe70d8413f7612b$export$badcc9423dc3e1c1)((0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root.data)?.playlist) ?? (0, 
    $2fe70d8413f7612b$export$badcc9423dc3e1c1)(root.data) ?? root;
    const songs = (0, $2fe70d8413f7612b$export$83ab0c0b59227553)(playlist).length ? (0, 
    $2fe70d8413f7612b$export$83ab0c0b59227553)(playlist) : (0, $2fe70d8413f7612b$export$83ab0c0b59227553)(data);
    const creator = (0, $2fe70d8413f7612b$export$badcc9423dc3e1c1)(playlist.creator);
    return {
        id: playlistId,
        title: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(playlist.title, playlist.name) ?? "网易云音乐歌单",
        description: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(playlist.description, playlist.desc) ?? "",
        cover: (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(playlist.coverImgUrl, playlist.picUrl, playlist.coverImg, playlist.cover, playlist.logo),
        creator: (creator ? (0, $2fe70d8413f7612b$export$8d3f56d05539298a)(creator.nickname, creator.name) : undefined) ?? (0, 
        $2fe70d8413f7612b$export$8d3f56d05539298a)(playlist.nickname, playlist.userName, playlist.creator),
        songCount: (0, $2fe70d8413f7612b$export$9c2d3e693419842c)(playlist.trackCount, playlist.songCount) ?? songs.length,
        songs: songs
    };
}

async function $7f28772cb2d30742$var$importNeteaseMusicSheet(urlLike) {
    const playlistId = $7f28772cb2d30742$export$c2125087b6972bc(urlLike);
    if (!playlistId) throw new (0, $a6afe7b81da5ac04$export$66edf9116816b092)("无法识别网易云歌单：请传入 music.163.com 歌单链接或纯数字歌单 ID");
    const playlist = await $7f28772cb2d30742$var$fetchNeteasePlaylist.call(this, playlistId);
    return playlist.songs.map(item => $7f28772cb2d30742$export$f4d330e02bd7717f((0, 
    $2fe70d8413f7612b$export$badcc9423dc3e1c1)(item) || {}));
}

async function $7f28772cb2d30742$var$getNeteaseMusicSheetInfo(sheetItem, page) {
    const playlist = await $7f28772cb2d30742$var$fetchNeteasePlaylist.call(this, String(sheetItem.id));
    const songs = playlist.songs.map(item => $7f28772cb2d30742$export$f4d330e02bd7717f((0, 
    $2fe70d8413f7612b$export$badcc9423dc3e1c1)(item) || {}));
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const start = (safePage - 1) * $7f28772cb2d30742$export$d41e84739c89bdfb;
    return {
        isEnd: start + $7f28772cb2d30742$export$d41e84739c89bdfb >= songs.length,
        sheetItem: {
            id: playlist.id,
            platform: $7f28772cb2d30742$export$fb4417ed62a774fb,
            source: $7f28772cb2d30742$export$fb4417ed62a774fb,
            title: playlist.title || sheetItem.title,
            description: playlist.description || sheetItem.description,
            artwork: playlist.cover || sheetItem.coverImg,
            artist: playlist.creator,
            worksNum: playlist.songCount
        },
        musicList: songs.slice(start, start + $7f28772cb2d30742$export$d41e84739c89bdfb)
    };
}

function $7f28772cb2d30742$export$db196fef1ba941f3() {
    return {
        platform: $7f28772cb2d30742$export$fb4417ed62a774fb,
        author: "Ohhu",
        version: "1.0.0",
        cacheControl: "no-cache",
        primaryKey: [ "id" ],
        supportedSearchType: [ "music" ],
        hints: {
            importMusicSheet: [ "支持网易云歌单链接（music.163.com）或纯数字歌单 ID。", "使用前请在插件设置中填写 ChKSz API Key。" ],
            importMusicItem: []
        },
        userVariables: $7f28772cb2d30742$var$USER_VARIABLES,
        search: $7f28772cb2d30742$var$searchNetease,
        getMediaSource: $7f28772cb2d30742$var$getNeteaseMediaSource,
        getLyric: $7f28772cb2d30742$var$getNeteaseLyric,
        importMusicSheet: $7f28772cb2d30742$var$importNeteaseMusicSheet,
        getMusicSheetInfo: $7f28772cb2d30742$var$getNeteaseMusicSheetInfo
    };
}

module.exports = (0, $7f28772cb2d30742$export$db196fef1ba941f3)();