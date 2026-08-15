/**
 * 诊断插件 T10：正式 ChKSzQQ 插件的「结构克隆」——
 * 相同的模块层级（require axios、~20 个函数声明、~10 个常量、工厂链、挂载期 (0,fn)() 调用），
 * 但函数体全部替换为无害 stub（安装/挂载路径上只定义、不执行）。
 * 自然体积约 5KB。
 *
 * 判定：
 * - T10 失败而 T4–T9 成功 → 触发条件与「规模/结构」（函数数、绑定数、体量）有关，而非具体语法；
 * - T10 成功、T11–T14（同内容注释撑大的尺寸阶梯）中某档失败 → 纯文件尺寸阈值。
 */
var $T10x$axios = require("axios");

function $T10x$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
}

const $T10c1$ = "https://api.chksz.com";
const $T10c2$ = 12e3;
const $T10c3$ = 25e3;
const $T10c4$ = 10;
const $T10c5$ = [ "apikey", "apiKey", "key" ];
const $T10c6$ = [ "url", "musicUrl", "playUrl", "play_url", "link" ];
const $T10c7$ = [ "songs", "list", "tracks", "musicList", "songlist" ];

function $T10f1$(message, status) {
    var error = new Error(message);
    error.name = "T10ApiError";
    error.status = status;
    return error;
}

function $T10f2$(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

function $T10f3$(self) {
    var raw = self ? self.userVariables : undefined;
    if (Array.isArray(raw)) {
        var declared = {};
        raw.forEach(function(item) {
            if (item && typeof item === "object" && typeof item.key === "string") declared[item.key] = "";
        });
        return declared;
    }
    if (raw && typeof raw === "object") return raw;
    return {};
}

function $T10f4$(variables) {
    for (var i = 0; i < $T10c5$.length; i += 1) {
        var value = variables[$T10c5$[i]];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
}

function $T10f5$(self) {
    var key = $T10f4$($T10f3$(self));
    if (key) return key;
    try {
        if (typeof env !== "undefined" && env && typeof env.getUserVariables === "function") {
            var envKey = $T10f4$($T10f3$({
                userVariables: env.getUserVariables()
            }));
            if (envKey) return envKey;
        }
    } catch (_) {}
    throw $T10f1$("尚未配置 Key", 0);
}

function $T10f6$(path, params, apikey) {
    var query = [];
    var append = function(key, value) {
        query.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    };
    if (params) {
        var keys = Object.keys(params);
        for (var i = 0; i < keys.length; i += 1) {
            var value = params[keys[i]];
            if (value === undefined || value === null || value === "") continue;
            append(keys[i], String(value));
        }
    }
    append("apikey", apikey);
    return `${$T10c1$}${path}?${query.join("&")}`;
}

function $T10f7$(text, secret) {
    return secret ? text.split(secret).join("chksz_***") : text;
}

function $T10f8$(data) {
    if (data && typeof data === "object") {
        var message = data.msg !== undefined ? data.msg : data.message !== undefined ? data.message : data.error;
        if (typeof message === "string" && message.trim()) return message.trim();
        return "";
    }
    if (typeof data === "string" && data.trim()) return data.trim().slice(0, 120);
    return "";
}

function $T10f9$(status, detail) {
    var suffix = detail ? "：" + detail : "";
    switch (status) {
      case 429:
        return $T10f1$("速率限制" + suffix, status);
      default:
        return $T10f1$(`HTTP ${status}` + suffix, status);
    }
}

function $T10f10$(headerValue) {
    var value = Number(headerValue);
    if (!isFinite(value) || value < 0) return null;
    return Math.floor(value);
}

async function $T10f11$(options) {
    var apikey = $T10f5$(options.self);
    var url = $T10f6$(options.path, options.params, apikey);
    return {
        apikey: apikey,
        url: url
    };
}

function $T10f12$(a, b, c, d, e, f, g, h) {
    var values = [ a, b, c, d, e, f, g, h ];
    for (var i = 0; i < values.length; i += 1) {
        if (values[i] !== undefined && values[i] !== null && values[i] !== "") return values[i];
    }
    return undefined;
}

function $T10f13$(a, b, c, d, e) {
    var values = [ a, b, c, d, e ];
    for (var i = 0; i < values.length; i += 1) {
        var value = values[i];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
}

function $T10f14$(a, b, c, d, e) {
    var values = [ a, b, c, d, e ];
    for (var i = 0; i < values.length; i += 1) {
        var value = values[i];
        if (value === undefined || value === null || value === "") continue;
        var parsed = Number(value);
        if (isFinite(parsed)) return parsed;
    }
    return undefined;
}

function $T10f15$(a, b, c) {
    var parsed = $T10f14$(a, b, c);
    if (parsed === undefined || parsed <= 0) return undefined;
    return parsed < 5400 ? Math.round(parsed * 1e3) : Math.round(parsed);
}

function $T10f16$(a, b, c) {
    var sources = [ a, b, c ];
    for (var i = 0; i < sources.length; i += 1) {
        var source = sources[i];
        if (typeof source === "string" && source.trim()) return source.trim();
        if (Array.isArray(source)) {
            var names = [];
            for (var j = 0; j < source.length; j += 1) {
                var item = source[j];
                if (typeof item === "string") {
                    if (item.trim()) names.push(item.trim());
                } else {
                    var record = item && typeof item === "object" && !Array.isArray(item) ? item : undefined;
                    var name = record ? $T10f13$(record.name, record.title) : undefined;
                    if (name) names.push(name);
                }
            }
            if (names.length) return names.join(", ");
        }
    }
    return undefined;
}

function $T10f17$(root, depth) {
    var record = root && typeof root === "object" && !Array.isArray(root) ? root : undefined;
    if (!record || depth < 0) return undefined;
    var keys = Object.keys(record);
    for (var i = 0; i < $T10c6$.length; i += 1) {
        var key = $T10c6$[i];
        var value = record[key];
        if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
    }
    return undefined;
}

function $T10f18$(root) {
    var record = root && typeof root === "object" && !Array.isArray(root) ? root : undefined;
    if (!record) return [];
    var found = [];
    var keys = Object.keys(record);
    for (var i = 0; i < $T10c7$.length; i += 1) {
        var value = record[$T10c7$[i]];
        if (Array.isArray(value) && value.length) found = value;
    }
    return found.length ? found : [];
}

function $T10f19$createPlugin(options) {
    var USER_VARIABLES = [
        {
            key: "apikey",
            name: "ChKSz API Key",
            hint: "以 chksz_ 开头"
        }
    ];
    function mapItem(raw, keyword) {
        return {
            id: String($T10f12$(raw.mid, raw.id, raw.hash, raw.n) || ""),
            title: $T10f13$(raw.name, raw.title, raw.songName) || "",
            platform: options.platform,
            keyword: keyword
        };
    }
    async function search(query, page, type) {
        if (type !== "music") {
            return {
                isEnd: true,
                data: []
            };
        }
        if (Math.floor(Number(page)) > 1) {
            return {
                isEnd: true,
                data: []
            };
        }
        await $T10f11$({
            path: options.endpoint,
            params: {
                msg: query
            },
            self: this
        });
        return {
            isEnd: true,
            data: []
        };
    }
    async function getMediaSource(musicItem, quality) {
        var detail = await $T10f11$({
            path: options.endpoint,
            params: {},
            self: this
        });
        var url = $T10f13$(detail && detail.url ? detail.url : undefined);
        if (!url) throw $T10f1$("未返回播放地址", 0);
        return {
            url: url,
            quality: quality
        };
    }
    async function getLyric(musicItem) {
        return null;
    }
    return {
        platform: options.platform,
        author: "Ohhu",
        version: "1.0.2",
        srcUrl: options.srcUrl,
        cacheControl: "no-store",
        primaryKey: [
            options.idParam
        ],
        supportedSearchType: [
            "music"
        ],
        hints: {
            importMusicSheet: [],
            importMusicItem: []
        },
        userVariables: USER_VARIABLES,
        search: search,
        getMediaSource: getMediaSource,
        getLyric: getLyric
    };
}

function $T10f20$createQQ() {
    return $T10f19$createPlugin({
        platform: "ChKSz·QQ音乐",
        endpoint: "/api/qq_music",
        idParam: "mid",
        srcUrl: "https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v1.0.2/dist/ChKSzQQ.js"
    });
}

function $T10f21$createKugou() {
    return $T10f19$createPlugin({
        platform: "ChKSz·酷狗",
        endpoint: "/api/kugou_music",
        idParam: "id",
        srcUrl: "https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v1.0.2/dist/ChKSzKugou.js"
    });
}

var $T10p$plugin = (0, $T10f20$createQQ)();
$T10p$plugin.platform = "T13·16K";
$T10p$plugin.version = "0.0.13";
$T10p$plugin.srcUrl = undefined;

module.exports = $T10p$plugin;
/*
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
*/
