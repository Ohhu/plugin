var $8zHUo$axios = require("axios");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/**
 * TuneHub MusicFree 插件
 *
 * 功能分类:
 * - native.ts: API 原生支持的功能 (搜索、音源、歌词、排行榜、导入歌单)
 * - simulated.ts: 模拟功能 (专辑详情、艺术家作品)
 * - constants.ts: 常量定义
 */ // 导入 API 原生支持的功能
// API 基础 URL
const $af8d31735c159a26$export$ca6dda5263526f75 = "https://music-dl.sayqz.com";
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
        const response = await (0, ($parcel$interopDefault($8zHUo$axios)))(config);
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
function $9ba0f9a5c47c04f2$export$937701d1b4a6fa29(baseUrl, platform, id, type, br) {
    let url = `${baseUrl}/api/?source=${platform}&id=${id}&type=${type}`;
    if (br) url += `&br=${br}`;
    return url;
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




const $99a82f6090a5251e$export$bb9c7f929676dbb6 = async function(query, page) {
    try {
        const data = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                type: "aggregateSearch",
                keyword: query
            }
        });
        if (data.code === 200) {
            const results = data.data.results || [];
            // 从歌曲结果中提取专辑信息(去重)
            const albumMap = new Map();
            results.forEach((item)=>{
                if (item.album && !albumMap.has(item.album)) albumMap.set(item.album, {
                    id: item.album,
                    platform: item.platform,
                    source: item.platform,
                    title: item.album,
                    artist: item.artist,
                    artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), item.platform, item.id, "pic")
                });
            });
            // 使用工具函数排序
            const albumList = (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(Array.from(albumMap.values()), query, (album)=>album.title);
            // 聚合搜索返回结果较少，直接返回所有结果
            return {
                isEnd: true,
                data: albumList
            };
        }
    } catch (e) {
        console.error("Search album error:", e);
    }
    return {
        isEnd: true,
        data: []
    };
};
const $99a82f6090a5251e$export$dc862406499065f2 = async function(albumItem, page) {
    const platform = albumItem.source || "netease";
    const albumName = albumItem.title;
    const artistName = albumItem.artist;
    try {
        // 使用艺术家名 + 专辑名进行精确搜索
        const searchKeyword = artistName ? `${artistName} ${albumName}` : albumName;
        const data = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                source: platform,
                type: "search",
                keyword: searchKeyword,
                limit: 100
            }
        });
        if (data.code === 200) {
            const results = data.data.results || [];
            // 过滤出匹配的歌曲
            const musicList = results.filter((item)=>{
                // 专辑名必须匹配
                const albumMatch = item.album && item.album.toLowerCase().includes(albumName.toLowerCase());
                // 如果有艺术家信息,艺术家名也要匹配
                const artistMatch = !artistName || item.artist && item.artist.toLowerCase().includes(artistName.toLowerCase());
                return albumMatch && artistMatch;
            }).map((item)=>({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name,
                    artist: item.artist,
                    album: item.album,
                    artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "pic"),
                    url: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "url", "320k")
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
        const data = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                source: platform,
                type: "search",
                keyword: artistName,
                limit: 50
            }
        });
        if (data.code === 200) {
            const results = data.data.results || [];
            if (type === "music") {
                // 返回歌曲列表
                const musicList = results.filter((item)=>item.artist && item.artist.includes(artistName)).map((item)=>({
                        id: item.id,
                        platform: platform,
                        source: platform,
                        title: item.name,
                        artist: item.artist,
                        album: item.album,
                        artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "pic"),
                        url: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "url", "320k")
                    }));
                return {
                    isEnd: true,
                    data: musicList
                };
            } else if (type === "album") {
                // 返回专辑列表(去重)
                const albumMap = new Map();
                results.filter((item)=>item.artist && item.artist.includes(artistName)).forEach((item)=>{
                    if (item.album && !albumMap.has(item.album)) albumMap.set(item.album, {
                        id: item.album,
                        platform: platform,
                        source: platform,
                        title: item.album,
                        artist: item.artist,
                        artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "pic")
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
    try {
        const data = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                type: "aggregateSearch",
                keyword: query
            }
        });
        if (data.code === 200) {
            const results = data.data.results || [];
            if (type === "music") // 聚合搜索返回结果较少，直接返回所有结果
            return {
                isEnd: true,
                data: results.map((item)=>({
                        id: item.id,
                        platform: item.platform,
                        source: item.platform,
                        title: item.name,
                        artist: item.artist,
                        album: item.album || "",
                        artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), item.platform, item.id, "pic"),
                        url: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), item.platform, item.id, "url", "320k")
                    }))
            };
            else if (type === "album") // 调用模拟的专辑搜索功能
            return await (0, $99a82f6090a5251e$export$bb9c7f929676dbb6)(query, page);
            else if (type === "artist") {
                // 从歌曲结果中提取艺术家信息(去重)
                const artistMap = new Map();
                results.forEach((item)=>{
                    if (item.artist && !artistMap.has(item.artist)) artistMap.set(item.artist, {
                        id: item.artist,
                        source: item.platform,
                        name: item.artist,
                        avatar: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), item.platform, item.id, "pic")
                    });
                });
                // 使用工具函数排序
                const artistList = (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(Array.from(artistMap.values()), query, (artist)=>artist.name, true // 支持分词匹配
                );
                // 聚合搜索返回结果较少，直接返回所有结果
                return {
                    isEnd: true,
                    data: artistList
                };
            }
        }
    } catch (e) {
        console.error("Search error:", e);
    }
    return {
        isEnd: true,
        data: []
    };
};
const $a4fcabfd0bbb32c7$export$a92854129bc50f89 = async function(musicItem, quality) {
    const platform = musicItem.source || "netease";
    const br = (0, $af8d31735c159a26$export$174a7998569c8c21)[quality] || "320k";
    const url = (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, musicItem.id, "url", br);
    // 直接返回 API URL，让 MusicFree 处理 302 重定向
    return {
        url: url
    };
};
const $a4fcabfd0bbb32c7$export$dd8877a67b94ca98 = async function(musicItem) {
    const platform = musicItem.source || "netease";
    try {
        const data = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                source: platform,
                id: musicItem.id,
                type: "lrc"
            },
            responseType: "text"
        });
        return {
            rawLrc: data
        };
    } catch (e) {
        return {
            rawLrc: ""
        };
    }
};
const $a4fcabfd0bbb32c7$export$cec695f762a1db32 = async function(musicBase) {
    const platform = musicBase.source || "netease";
    try {
        const response = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                source: platform,
                id: musicBase.id,
                type: "info"
            }
        });
        if (response.code === 200) {
            const data = response.data;
            return {
                id: musicBase.id,
                source: platform,
                title: data.name,
                artist: data.artist,
                album: data.album || "",
                artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, musicBase.id, "pic")
            };
        }
    } catch (e) {
        console.error("Get music info error:", e);
    }
    return null;
};
const $a4fcabfd0bbb32c7$export$157a64c1e7dbc3b7 = async function() {
    const platforms = [
        "qq",
        "netease",
        "kuwo"
    ];
    const result = [];
    for (const platform of platforms)try {
        const response = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                source: platform,
                type: "toplists"
            }
        });
        if (response.code === 200 && response.data.list) result.push({
            title: (0, $af8d31735c159a26$export$ab2a2e5f034797)[platform],
            data: response.data.list.map((item)=>({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name,
                    description: item.updateFrequency || ""
                }))
        });
    } catch (e) {
    // 忽略单个平台错误
    }
    return result;
};
const $a4fcabfd0bbb32c7$export$b0178d0d6466fe81 = async function(topListItem) {
    const platform = topListItem.source || "netease";
    try {
        const response = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
            method: "GET",
            url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
            params: {
                source: platform,
                id: topListItem.id,
                type: "toplist"
            }
        });
        if (response.code === 200) {
            const list = response.data.list || [];
            return {
                ...topListItem,
                musicList: list.map((item)=>({
                        id: item.id,
                        platform: platform,
                        source: platform,
                        title: item.name,
                        artist: item.artist || "",
                        album: item.album || "",
                        artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "pic"),
                        url: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "url", "320k")
                    }))
            };
        }
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
                const response = await (0, $9ba0f9a5c47c04f2$export$656187f20a39c07c)({
                    method: "GET",
                    url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`,
                    params: {
                        source: platform,
                        id: playlistId,
                        type: "playlist"
                    }
                });
                if (response.code === 200 && response.data.list) // 转换为 IMusicItem 格式
                return response.data.list.map((item)=>({
                        id: item.id,
                        platform: platform,
                        source: platform,
                        title: item.name,
                        artist: item.artist || "",
                        album: item.album || "",
                        artwork: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "pic"),
                        url: (0, $9ba0f9a5c47c04f2$export$937701d1b4a6fa29)((0, $af8d31735c159a26$export$ca6dda5263526f75), platform, item.id, "url", "320k")
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
    version: "1.3.1",
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
    getMusicInfo: $a4fcabfd0bbb32c7$export$cec695f762a1db32,
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
