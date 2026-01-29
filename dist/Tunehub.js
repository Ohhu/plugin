var $8zHUo$axios = require("axios");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/**
 * TuneHub MusicFree 插件 (V3 API)
 *
 * 功能分类:
 * - native.ts: API 原生支持的功能 (搜索、音源、歌词、排行榜、导入歌单)
 * - simulated.ts: 模拟功能 (专辑详情、艺术家作品)
 * - constants.ts: 常量定义
 */ // 导入 API 原生支持的功能
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




const $9ba0f9a5c47c04f2$export$1391212d75b2ee65 = (ms)=>{
    return new Promise((resolve)=>setTimeout(resolve, ms));
};
async function $9ba0f9a5c47c04f2$export$656187f20a39c07c(config, retryCount = 3, retryDelay = 150) {
    try {
        // 自动添加 API Key 到请求头
        const headers = {
            ...config.headers,
            "X-API-Key": (0, $af8d31735c159a26$export$a9861bd62f48e142)
        };
        const response = await (0, ($parcel$interopDefault($8zHUo$axios)))({
            ...config,
            headers: headers
        });
        return response.data;
    } catch (error) {
        // 如果还有重试次数，则重试
        if (retryCount > 0) {
            await $9ba0f9a5c47c04f2$export$1391212d75b2ee65(retryDelay);
            return $9ba0f9a5c47c04f2$export$656187f20a39c07c(config, retryCount - 1, retryDelay);
        }
        // 重试次数用尽，抛出错误
        throw error;
    }
}
function $9ba0f9a5c47c04f2$export$9cd659cf9e0bcd55(text, query, isSplit = false) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    // 1. 完全匹配 (最高优先级)
    if (lowerText === lowerQuery) return 1000;
    // 2. 开头匹配
    if (lowerText.startsWith(lowerQuery)) return 500;
    // 3. 包含关键词
    if (lowerText.includes(lowerQuery)) {
        // 关键词越靠前,分数越高
        const position = lowerText.indexOf(lowerQuery);
        return 300 - position;
    }
    // 4. 分词匹配 (处理多个艺术家的情况,如 "周杰伦、李硕、张鑫")
    if (isSplit) {
        const parts = lowerText.split(/[、,，]/).map((p)=>p.trim());
        for(let i = 0; i < parts.length; i++){
            if (parts[i] === lowerQuery) return 800 - i * 100; // 第一个分数最高
            else if (parts[i].startsWith(lowerQuery)) return 400 - i * 50;
            else if (parts[i].includes(lowerQuery)) return 200 - i * 20;
        }
    }
    return 0;
}
function $9ba0f9a5c47c04f2$export$b2e1e35494b27b67(items, query, getTextField, isSplit = false) {
    // 计算每个项目的相似度分数
    const itemsWithScore = items.map((item)=>({
            item: item,
            score: $9ba0f9a5c47c04f2$export$9cd659cf9e0bcd55(getTextField(item), query, isSplit)
        }));
    // 按分数降序排序
    itemsWithScore.sort((a, b)=>b.score - a.score);
    // 返回排序后的项目
    return itemsWithScore.map(({ item: item })=>item);
}
async function $9ba0f9a5c47c04f2$export$3c06a706316686c9(baseUrl, platform, functionName) {
    try {
        const response = await $9ba0f9a5c47c04f2$export$656187f20a39c07c({
            method: "GET",
            url: `${baseUrl}/v1/methods/${platform}/${functionName}`
        });
        if (response.code === 0) return response.data;
    } catch (e) {
        console.error(`Get method config error (${platform}/${functionName}):`, e);
    }
    return null;
}
function $9ba0f9a5c47c04f2$export$d9a4e0037b7dfe53(template, variables) {
    if (typeof template === "string") {
        let result = template;
        for (const [key, value] of Object.entries(variables))result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
        return result;
    } else if (typeof template === "object" && template !== null) {
        const result = {};
        for (const [key, value] of Object.entries(template))result[key] = $9ba0f9a5c47c04f2$export$d9a4e0037b7dfe53(value, variables);
        return result;
    }
    return template;
}
async function $9ba0f9a5c47c04f2$export$6e82098e274baf8e(config, variables = {}) {
    try {
        // 替换 URL 中的变量
        const url = $9ba0f9a5c47c04f2$export$d9a4e0037b7dfe53(config.url, variables);
        // 替换 params 中的变量
        const params = config.params ? $9ba0f9a5c47c04f2$export$d9a4e0037b7dfe53(config.params, variables) : undefined;
        // 替换 body 中的变量
        const body = config.body ? $9ba0f9a5c47c04f2$export$d9a4e0037b7dfe53(config.body, variables) : undefined;
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
            // 安全地执行 transform 函数
            const transformFunc = new Function("response", config.transform);
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




const $99a82f6090a5251e$export$bb9c7f929676dbb6 = async function(query, page) {
    const platforms = [
        "netease",
        "qq",
        "kuwo"
    ];
    const albumMap = new Map();
    for (const platform of platforms)try {
        const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "search");
        if (!config) continue;
        const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config, {
            keyword: query,
            page: String(page - 1),
            pageSize: String((0, $af8d31735c159a26$export$8ec3d08588d2eeda))
        });
        if (data && data.list && Array.isArray(data.list)) // 从歌曲结果中提取专辑信息(去重)
        data.list.forEach((item)=>{
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
    const albumList = (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(Array.from(albumMap.values()), query, (album)=>album.title);
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
        const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "search");
        if (!config) return {
            isEnd: true,
            musicList: []
        };
        const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config, {
            keyword: searchKeyword,
            page: "0",
            pageSize: "100"
        });
        if (data && data.list && Array.isArray(data.list)) {
            // 过滤出匹配的歌曲
            const musicList = data.list.filter((item)=>{
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
        const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "search");
        if (!config) return {
            isEnd: true,
            data: []
        };
        const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config, {
            keyword: artistName,
            page: String(page - 1),
            pageSize: "50"
        });
        if (data && data.list && Array.isArray(data.list)) {
            const results = data.list.filter((item)=>{
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
        const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "search");
        if (!config) continue;
        const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config, {
            keyword: query,
            page: String(page - 1),
            pageSize: String((0, $af8d31735c159a26$export$8ec3d08588d2eeda))
        });
        if (data && data.list && Array.isArray(data.list)) allResults.push(...data.list.map((item)=>({
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
        const artistList = (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(Array.from(artistMap.values()), query, (artist)=>artist.name, true // 支持分词匹配
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
    const qualityStr = (0, $af8d31735c159a26$export$174a7998569c8c21)[quality] || "320k";
    try {
        const response = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "POST",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/v1/parse`,
            data: {
                platform: platform,
                ids: String(musicItem.id),
                quality: qualityStr
            }
        });
        if (response.code === 0 && response.data) {
            const songData = response.data[String(musicItem.id)];
            if (songData && songData.url) return {
                url: songData.url,
                quality: quality
            };
        }
    } catch (e) {
        console.error("Get media source error:", e);
    }
    return null;
};
const $a4fcabfd0bbb32c7$export$dd8877a67b94ca98 = async function(musicItem) {
    const platform = musicItem.source || "netease";
    try {
        const response = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "POST",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/v1/parse`,
            data: {
                platform: platform,
                ids: String(musicItem.id),
                quality: "128k" // 获取歌词时音质参数不重要，使用最低音质节省积分
            }
        });
        if (response.code === 0 && response.data) {
            const songData = response.data[String(musicItem.id)];
            if (songData && songData.lrc) return {
                rawLrc: songData.lrc
            };
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
        const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "toplists");
        if (!config) continue;
        const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config);
        if (data && data.list && Array.isArray(data.list)) result.push({
            title: (0, $af8d31735c159a26$export$ab2a2e5f034797)[platform],
            data: data.list.map((item)=>({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name || item.title,
                    description: item.updateFrequency || item.description || ""
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
        const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "toplist");
        if (!config) return {
            ...topListItem,
            musicList: []
        };
        const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config, {
            id: String(topListItem.id)
        });
        if (data && data.list && Array.isArray(data.list)) return {
            ...topListItem,
            musicList: data.list.map((item)=>({
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
        {
            platform: "qq",
            regex: /y\.qq\.com.*[?&]id=(\d+)/
        }
    ];
    // 尝试匹配 URL
    for (const { platform: platform, regex: regex } of patterns){
        const match = urlLike.match(regex);
        if (match) {
            const playlistId = match[1];
            try {
                const config = await (0, $9ba0f9a5c47c04f2$export$3c06a706316686c9)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, "playlist");
                if (!config) continue;
                const data = await (0, $9ba0f9a5c47c04f2$export$6e82098e274baf8e)(config, {
                    id: playlistId
                });
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
    version: "2.0.0",
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
