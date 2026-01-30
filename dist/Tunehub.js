var $8zHUo$axios = require("axios");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
var $parcel$global =
typeof globalThis !== 'undefined'
  ? globalThis
  : typeof self !== 'undefined'
  ? self
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : {};
var $parcel$modules = {};
var $parcel$inits = {};

var parcelRequire = $parcel$global["parcelRequire9a26"];
if (parcelRequire == null) {
  parcelRequire = function(id) {
    if (id in $parcel$modules) {
      return $parcel$modules[id].exports;
    }
    if (id in $parcel$inits) {
      var init = $parcel$inits[id];
      delete $parcel$inits[id];
      var module = {id: id, exports: {}};
      $parcel$modules[id] = module;
      init.call(module.exports, module, module.exports);
      return module.exports;
    }
    var err = new Error("Cannot find module '" + id + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  };

  parcelRequire.register = function register(id, init) {
    $parcel$inits[id] = init;
  };

  $parcel$global["parcelRequire9a26"] = parcelRequire;
}
parcelRequire.register("lCxOT", function(module, exports) {

$parcel$export(module.exports, "requestWithRetry", () => requestWithRetry);
$parcel$export(module.exports, "sortBySimilarity", () => sortBySimilarity);
$parcel$export(module.exports, "getMethodConfig", () => getMethodConfig);
$parcel$export(module.exports, "executeMethodConfig", () => executeMethodConfig);


var $cyXty = parcelRequire("cyXty");
const delay = (ms11)=>{
    return new Promise((resolve11)=>setTimeout(resolve11, ms11));
};
async function requestWithRetry(config11, retryCount11 = 3, retryDelay11 = 150) {
    try {
        // 自动添加 API Key 到请求头
        const headers11 = {
            ...config11.headers,
            "X-API-Key": (0, $cyXty.API_KEY)
        };
        const response11 = await (0, ($parcel$interopDefault($8zHUo$axios)))({
            ...config11,
            headers: headers11
        });
        return response11.data;
    } catch (error11) {
        // 如果还有重试次数，则重试
        if (retryCount11 > 0) {
            await delay(retryDelay11);
            return requestWithRetry(config11, retryCount11 - 1, retryDelay11);
        }
        // 重试次数用尽，抛出错误
        throw error11;
    }
}
function calculateSimilarityScore(text11, query11, isSplit11 = false) {
    const lowerText11 = text11.toLowerCase();
    const lowerQuery11 = query11.toLowerCase();
    // 1. 完全匹配 (最高优先级)
    if (lowerText11 === lowerQuery11) return 1000;
    // 2. 开头匹配
    if (lowerText11.startsWith(lowerQuery11)) return 500;
    // 3. 包含关键词
    if (lowerText11.includes(lowerQuery11)) {
        // 关键词越靠前,分数越高
        const position11 = lowerText11.indexOf(lowerQuery11);
        return 300 - position11;
    }
    // 4. 分词匹配 (处理多个艺术家的情况,如 "周杰伦、李硕、张鑫")
    if (isSplit11) {
        const parts11 = lowerText11.split(/[、,，]/).map((p11)=>p11.trim());
        for(let i11 = 0; i11 < parts11.length; i11++){
            if (parts11[i11] === lowerQuery11) return 800 - i11 * 100; // 第一个分数最高
            else if (parts11[i11].startsWith(lowerQuery11)) return 400 - i11 * 50;
            else if (parts11[i11].includes(lowerQuery11)) return 200 - i11 * 20;
        }
    }
    return 0;
}
function sortBySimilarity(items11, query11, getTextField11, isSplit11 = false) {
    // 计算每个项目的相似度分数
    const itemsWithScore11 = items11.map((item11)=>({
            item: item11,
            score: calculateSimilarityScore(getTextField11(item11), query11, isSplit11)
        }));
    // 按分数降序排序
    itemsWithScore11.sort((a11, b11)=>b11.score - a11.score);
    // 返回排序后的项目
    return itemsWithScore11.map(({ item: item11 })=>item11);
}
async function getMethodConfig(baseUrl11, platform11, functionName11) {
    try {
        const response11 = await requestWithRetry({
            method: "GET",
            url: `${baseUrl11}/v1/methods/${platform11}/${functionName11}`
        });
        if (response11.code === 0) return response11.data;
    } catch (e11) {
        console.error(`Get method config error (${platform11}/${functionName11}):`, e11);
    }
    return null;
}
function replaceTemplateVariables(template11, variables11) {
    if (typeof template11 === "string") // 匹配 {{...}} 模板，支持表达式
    return template11.replace(/\{\{([^}]+)\}\}/g, (_11, expr11)=>{
        try {
            // 创建变量上下文并求值表达式
            const func11 = new Function(...Object.keys(variables11), `return ${expr11};`);
            const result11 = func11(...Object.values(variables11));
            return String(result11);
        } catch (e11) {
            // 如果求值失败，返回空字符串
            console.error("Template expression error:", expr11, e11);
            return "";
        }
    });
    else if (typeof template11 === "object" && template11 !== null) {
        const result11 = {};
        for (const [key11, value11] of Object.entries(template11))result11[key11] = replaceTemplateVariables(value11, variables11);
        return result11;
    }
    return template11;
}
async function executeMethodConfig(config, variables = {}) {
    try {
        // 替换 URL 中的变量
        const url = replaceTemplateVariables(config.url, variables);
        // 替换 params 中的变量
        const params = config.params ? replaceTemplateVariables(config.params, variables) : undefined;
        // 替换 body 中的变量
        const body = config.body ? replaceTemplateVariables(config.body, variables) : undefined;
        // 发起请求 (不使用 requestWithRetry，因为这是请求上游平台，不需要 API Key)
        const response = await (0, ($parcel$interopDefault($8zHUo$axios)))({
            method: config.method,
            url: url,
            params: params,
            data: body,
            headers: config.headers || {}
        });
        let data = response.data;
        // 如果有 transform 函数，执行转换
        if (config.transform) try {
            // API 返回的是完整函数定义 "function(response) { ... }"
            // 使用 eval 解析完整函数定义
            const transformFunc = eval("(" + config.transform + ")");
            data = transformFunc(data);
        } catch (e) {
            console.error("Transform function error:", e);
        }
        return data;
    } catch (e) {
        console.error("Execute method config error:", e);
        return null;
    }
}

});
parcelRequire.register("cyXty", function(module, exports) {

$parcel$export(module.exports, "BASE_URL", () => $af8d31735c159a26$export$ca6dda5263526f75);
$parcel$export(module.exports, "API_KEY", () => $af8d31735c159a26$export$a9861bd62f48e142);
$parcel$export(module.exports, "PLATFORM_NAMES", () => $af8d31735c159a26$export$ab2a2e5f034797);
$parcel$export(module.exports, "QUALITY_MAP", () => $af8d31735c159a26$export$174a7998569c8c21);
$parcel$export(module.exports, "PAGE_SIZE", () => $af8d31735c159a26$export$8ec3d08588d2eeda);
// API 基础 URL (TuneHub V3)
const $af8d31735c159a26$export$ca6dda5263526f75 = "https://tunehub.sayqz.com/api";
const $af8d31735c159a26$export$a9861bd62f48e142 = "th_dfa1e5bfcc678aed18ee30657d5f260ff5a5be2fb15af6f3";
const $af8d31735c159a26$export$ab2a2e5f034797 = {
    netease: "网易云音乐",
    kuwo: "酷我音乐",
    qq: "QQ音乐"
};
const $af8d31735c159a26$export$174a7998569c8c21 = {
    low: "128k",
    standard: "320k",
    high: "flac",
    super: "flac24bit"
};
const $af8d31735c159a26$export$8ec3d08588d2eeda = 30; // 每页显示数量

});


/**
 * TuneHub MusicFree 插件 (V3 API)
 *
 * 功能分类:
 * - native.ts: API 原生支持的功能 (搜索、音源、歌词、排行榜、导入歌单)
 * - simulated.ts: 模拟功能 (专辑详情、艺术家作品)
 * - constants.ts: 常量定义
 */ // 导入 API 原生支持的功能

var $cyXty = parcelRequire("cyXty");

var $lCxOT = parcelRequire("lCxOT");

var $cyXty = parcelRequire("cyXty");

var $lCxOT = parcelRequire("lCxOT");
const $99a82f6090a5251e$export$bb9c7f929676dbb6 = async function(query, page) {
    const platforms = [
        "netease",
        "qq",
        "kuwo"
    ];
    const albumMap = new Map();
    for (const platform of platforms)try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "search");
        if (!config) continue;
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            keyword: query,
            page: String(page),
            limit: String((0, $cyXty.PAGE_SIZE))
        });
        // transform 函数直接返回数组
        if (data && Array.isArray(data)) // 从歌曲结果中提取专辑信息(去重)
        data.forEach((item)=>{
            const albumName = item.album || "";
            if (albumName && !albumMap.has(albumName)) albumMap.set(albumName, {
                id: albumName,
                platform: platform,
                source: platform,
                title: albumName,
                artist: item.artist || "",
                artwork: item.pic || ""
            });
        });
    } catch (e) {
        console.error(`Search album error for ${platform}:`, e);
    }
    // 使用工具函数排序
    const albumList = (0, $lCxOT.sortBySimilarity)(Array.from(albumMap.values()), query, (album)=>album.title);
    return {
        isEnd: true,
        data: albumList
    };
};
const $99a82f6090a5251e$export$dc862406499065f2 = async function(albumItem, page) {
    const platform = albumItem.source || "netease";
    const albumName = albumItem.title;
    const artistName = albumItem.artist;
    try {
        // 使用艺术家名 + 专辑名进行精确搜索
        const searchKeyword = artistName ? `${artistName} ${albumName}` : albumName;
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "search");
        if (!config) return {
            isEnd: true,
            musicList: []
        };
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            keyword: searchKeyword,
            page: "1",
            limit: "100"
        });
        // transform 函数直接返回数组
        if (data && Array.isArray(data)) {
            // 过滤出匹配的歌曲
            const musicList = data.filter((item)=>{
                const itemAlbum = item.album || "";
                const itemArtist = item.artist || "";
                // 专辑名必须匹配
                const albumMatch = itemAlbum.toLowerCase().includes(albumName.toLowerCase());
                // 如果有艺术家信息,艺术家名也要匹配
                const artistMatch = !artistName || itemArtist.toLowerCase().includes(artistName.toLowerCase());
                return albumMatch && artistMatch;
            }).map((item)=>({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name || item.title,
                    artist: item.artist || "",
                    album: item.album || "",
                    artwork: item.pic || "",
                    url: "" // URL 将通过 getMediaSource 获取
                }));
            return {
                isEnd: true,
                musicList: musicList
            };
        }
    } catch (e) {
        console.error("Get album info error:", e);
    }
    return {
        isEnd: true,
        musicList: []
    };
};
const $99a82f6090a5251e$export$4adb7587a1eda30e = async function(artistItem, page, type) {
    const platform = artistItem.source || "netease";
    const artistName = artistItem.name;
    try {
        // 使用搜索 API 搜索艺术家名称
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "search");
        if (!config) return {
            isEnd: true,
            data: []
        };
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            keyword: artistName,
            page: String(page),
            limit: "50"
        });
        // transform 函数直接返回数组
        if (data && Array.isArray(data)) {
            const results = data.filter((item)=>{
                const itemArtist = item.artist || "";
                return itemArtist.includes(artistName);
            });
            if (type === "music") {
                // 返回歌曲列表
                const musicList = results.map((item)=>({
                        id: item.id,
                        platform: platform,
                        source: platform,
                        title: item.name || item.title,
                        artist: item.artist || "",
                        album: item.album || "",
                        artwork: item.pic || "",
                        url: "" // URL 将通过 getMediaSource 获取
                    }));
                return {
                    isEnd: true,
                    data: musicList
                };
            } else if (type === "album") {
                // 返回专辑列表(去重)
                const albumMap = new Map();
                results.forEach((item)=>{
                    const albumName = item.album || "";
                    if (albumName && !albumMap.has(albumName)) albumMap.set(albumName, {
                        id: albumName,
                        platform: platform,
                        source: platform,
                        title: albumName,
                        artist: item.artist || "",
                        artwork: item.pic || ""
                    });
                });
                return {
                    isEnd: true,
                    data: Array.from(albumMap.values())
                };
            }
        }
    } catch (e) {
        console.error("Get artist works error:", e);
    }
    return {
        isEnd: true,
        data: []
    };
};


const $a4fcabfd0bbb32c7$export$d76128d007d19019 = async function(query, page, type) {
    if (type === "album") // 调用模拟的专辑搜索功能
    return await (0, $99a82f6090a5251e$export$bb9c7f929676dbb6)(query, page);
    // 对于 music 和 artist 类型，使用方法下发进行搜索
    const platforms = [
        "netease",
        "qq",
        "kuwo"
    ];
    const allResults = [];
    for (const platform of platforms)try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "search");
        if (!config) continue;
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            keyword: query,
            page: String(page),
            limit: String((0, $cyXty.PAGE_SIZE))
        });
        // transform 函数直接返回数组，不是 {list: []}
        if (data && Array.isArray(data)) allResults.push(...data.map((item)=>({
                ...item,
                platform: platform,
                source: platform
            })));
    } catch (e) {
        console.error(`Search error for ${platform}:`, e);
    }
    if (type === "music") return {
        isEnd: true,
        data: allResults.map((item)=>({
                id: item.id,
                platform: item.platform,
                source: item.platform,
                title: item.name || item.title,
                artist: item.artist || "",
                album: item.album || "",
                artwork: item.pic || "",
                url: "" // URL 将通过 getMediaSource 获取
            }))
    };
    else if (type === "artist") {
        // 从歌曲结果中提取艺术家信息(去重)
        const artistMap = new Map();
        allResults.forEach((item)=>{
            const artistName = item.artist || "";
            if (artistName && !artistMap.has(artistName)) artistMap.set(artistName, {
                id: artistName,
                source: item.platform,
                name: artistName,
                avatar: item.pic || ""
            });
        });
        // 使用工具函数排序
        const artistList = (0, $lCxOT.sortBySimilarity)(Array.from(artistMap.values()), query, (artist)=>artist.name, true // 支持分词匹配
        );
        return {
            isEnd: true,
            data: artistList
        };
    }
    return {
        isEnd: true,
        data: []
    };
};
const $a4fcabfd0bbb32c7$export$a92854129bc50f89 = async function(musicItem, quality) {
    const platform = musicItem.source || "netease";
    const qualityStr = (0, $cyXty.QUALITY_MAP)[quality] || "320k";
    try {
        const response = await (0, $lCxOT.requestWithRetry)({
            method: "POST",
            url: `${(0, $cyXty.BASE_URL)}/v1/parse`,
            data: {
                platform: platform,
                ids: String(musicItem.id),
                quality: qualityStr
            }
        });
        if (response.code === 0 && response.data) {
            // API 返回 data.data 是数组，需要从中查找对应 ID 的歌曲
            const dataArray = response.data.data;
            if (Array.isArray(dataArray)) {
                const songData = dataArray.find((item)=>String(item.id) === String(musicItem.id));
                if (songData && songData.url) return {
                    url: songData.url,
                    quality: quality
                };
            }
        }
    } catch (e) {
        console.error("Get media source error:", e);
    }
    return null;
};
const $a4fcabfd0bbb32c7$export$dd8877a67b94ca98 = async function(musicItem) {
    const platform = musicItem.source || "netease";
    try {
        const response = await (0, $lCxOT.requestWithRetry)({
            method: "POST",
            url: `${(0, $cyXty.BASE_URL)}/v1/parse`,
            data: {
                platform: platform,
                ids: String(musicItem.id),
                quality: "128k" // 获取歌词时音质参数不重要，使用最低音质节省积分
            }
        });
        if (response.code === 0 && response.data) {
            // API 返回 data.data 是数组，需要从中查找对应 ID 的歌曲
            const dataArray = response.data.data;
            if (Array.isArray(dataArray)) {
                const songData = dataArray.find((item)=>String(item.id) === String(musicItem.id));
                if (songData && songData.lyrics) return {
                    rawLrc: songData.lyrics
                };
            }
        }
    } catch (e) {
        console.error("Get lyric error:", e);
    }
    return {
        rawLrc: ""
    };
};
const $a4fcabfd0bbb32c7$export$157a64c1e7dbc3b7 = async function() {
    const platforms = [
        "netease",
        "qq",
        "kuwo"
    ];
    const result = [];
    for (const platform of platforms)try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "toplists");
        if (!config) continue;
        const data = await (0, $lCxOT.executeMethodConfig)(config);
        // transform 函数直接返回数组
        if (data && Array.isArray(data)) result.push({
            title: (0, $cyXty.PLATFORM_NAMES)[platform],
            data: data.map((item)=>({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name || item.title,
                    description: item.updateFrequency || item.description || "",
                    coverImg: item.pic || ""
                }))
        });
    } catch (e) {
        console.error(`Get toplists error for ${platform}:`, e);
    }
    return result;
};
const $a4fcabfd0bbb32c7$export$b0178d0d6466fe81 = async function(topListItem) {
    const platform = topListItem.source || "netease";
    try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "toplist");
        if (!config) return {
            ...topListItem,
            musicList: []
        };
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            id: String(topListItem.id)
        });
        // transform 函数直接返回数组
        if (data && Array.isArray(data)) return {
            ...topListItem,
            musicList: data.map((item)=>({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name || item.title,
                    artist: item.artist || "",
                    album: item.album || "",
                    artwork: item.pic || "",
                    url: "" // URL 将通过 getMediaSource 获取
                }))
        };
    } catch (e) {
        console.error("Get top list detail error:", e);
    }
    return {
        ...topListItem,
        musicList: []
    };
};
const $a4fcabfd0bbb32c7$export$673794af62c4d65e = async function(urlLike) {
    // URL 解析规则
    const patterns = [
        // 酷我音乐: https://www.kuwo.cn/playlist_detail/3486842676
        {
            platform: "kuwo",
            regex: /kuwo\.cn\/playlist_detail\/(\d+)/
        },
        // 网易云音乐: https://music.163.com/#/playlist?id=946216567
        {
            platform: "netease",
            regex: /music\.163\.com.*[?&]id=(\d+)/
        },
        // QQ音乐: https://i.y.qq.com/n2/m/share/details/taoge.html?id=9629884311
        // QQ音乐新版: https://y.qq.com/n/ryqq/playlist/9629884311
        {
            platform: "qq",
            regex: /y\.qq\.com.*(?:playlist\/|[?&]id=)(\d+)/
        }
    ];
    // 尝试匹配 URL
    for (const { platform: platform, regex: regex } of patterns){
        const match = urlLike.match(regex);
        if (match) {
            const playlistId = match[1];
            try {
                const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "playlist");
                if (!config) continue;
                const data = await (0, $lCxOT.executeMethodConfig)(config, {
                    id: playlistId
                });
                // transform 函数返回 {info: {...}, list: [...]}
                if (data && data.list && Array.isArray(data.list)) // 转换为 IMusicItem 格式
                return data.list.map((item)=>({
                        id: item.id,
                        platform: platform,
                        source: platform,
                        title: item.name || item.title,
                        artist: item.artist || "",
                        album: item.album || "",
                        artwork: item.pic || "",
                        url: "" // URL 将通过 getMediaSource 获取
                    }));
            } catch (e) {
                console.error(`Import playlist error for ${platform}:`, e);
                return null;
            }
        }
    }
    // 未匹配到任何平台
    return null;
};



// 插件定义
const $882b6d93070905b3$var$pluginInstance = {
    platform: "TuneHub",
    author: "Ohhu",
    version: "2.1.2",
    defaultSearchType: "music",
    supportedSearchType: [
        "music",
        "album",
        "artist"
    ],
    cacheControl: "no-store",
    primaryKey: [
        "id",
        "source"
    ],
    srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/TuneHub/dist/Tunehub.js",
    search: // API 原生支持的功能
    $a4fcabfd0bbb32c7$export$d76128d007d19019,
    getMediaSource: $a4fcabfd0bbb32c7$export$a92854129bc50f89,
    getLyric: $a4fcabfd0bbb32c7$export$dd8877a67b94ca98,
    getTopLists: $a4fcabfd0bbb32c7$export$157a64c1e7dbc3b7,
    getTopListDetail: $a4fcabfd0bbb32c7$export$b0178d0d6466fe81,
    importMusicSheet: $a4fcabfd0bbb32c7$export$673794af62c4d65e,
    getAlbumInfo: // 模拟功能
    $99a82f6090a5251e$export$dc862406499065f2,
    getArtistWorks: $99a82f6090a5251e$export$4adb7587a1eda30e
};
// 使用 CommonJS 导出方式
module.exports = $882b6d93070905b3$var$pluginInstance;


//# sourceMappingURL=Tunehub.js.map
