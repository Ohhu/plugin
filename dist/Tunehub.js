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




const $99a82f6090a5251e$export$bb9c7f929676dbb6 = async function(query, page) {
    try {
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                type: "aggregateSearch",
                keyword: query
            }
        });
        if (res.data.code === 200) {
            const results = res.data.data.results || [];
            // 从歌曲结果中提取专辑信息(去重)
            const albumMap = new Map();
            results.forEach((item)=>{
                if (item.album && !albumMap.has(item.album)) albumMap.set(item.album, {
                    id: item.album,
                    source: item.platform,
                    title: item.album,
                    artist: item.artist,
                    artwork: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/?source=${item.platform}&id=${item.id}&type=pic`,
                    _searchQuery: query.toLowerCase() // 保存搜索关键词用于排序
                });
            });
            // 计算相似度并排序
            const albumList = Array.from(albumMap.values()).map((album)=>{
                const title = album.title.toLowerCase();
                const searchQuery = query.toLowerCase();
                // 计算相似度分数
                let score = 0;
                // 1. 完全匹配 (最高优先级)
                if (title === searchQuery) score = 1000;
                else if (title.startsWith(searchQuery)) score = 500;
                else if (title.includes(searchQuery)) {
                    // 关键词越靠前,分数越高
                    const position = title.indexOf(searchQuery);
                    score = 300 - position;
                }
                return {
                    ...album,
                    _score: score
                };
            });
            // 按分数降序排序
            albumList.sort((a, b)=>b._score - a._score);
            // 移除临时字段
            const sortedData = albumList.map(({ _searchQuery: _searchQuery, _score: _score, ...album })=>album);
            return {
                isEnd: true,
                data: sortedData
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
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                source: platform,
                type: "search",
                keyword: searchKeyword,
                limit: 100
            }
        });
        if (res.data.code === 200) {
            const results = res.data.data.results || [];
            // 过滤出匹配的歌曲
            const musicList = results.filter((item)=>{
                // 专辑名必须匹配
                const albumMatch = item.album && item.album.toLowerCase().includes(albumName.toLowerCase());
                // 如果有艺术家信息,艺术家名也要匹配
                const artistMatch = !artistName || item.artist && item.artist.toLowerCase().includes(artistName.toLowerCase());
                return albumMatch && artistMatch;
            }).map((item)=>({
                    id: item.id,
                    source: platform,
                    title: item.name,
                    artist: item.artist,
                    album: item.album,
                    artwork: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=pic`,
                    url: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
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
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                source: platform,
                type: "search",
                keyword: artistName,
                limit: 50
            }
        });
        if (res.data.code === 200) {
            const results = res.data.data.results || [];
            if (type === "music") {
                // 返回歌曲列表
                const musicList = results.filter((item)=>item.artist && item.artist.includes(artistName)).map((item)=>({
                        id: item.id,
                        source: platform,
                        title: item.name,
                        artist: item.artist,
                        album: item.album,
                        artwork: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=pic`,
                        url: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
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
                        source: platform,
                        title: item.album,
                        artist: item.artist,
                        artwork: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/?source=${platform}&id=${item.id}&type=pic`
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
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                type: "aggregateSearch",
                keyword: query
            }
        });
        if (res.data.code === 200) {
            const results = res.data.data.results || [];
            if (type === "music") // 返回歌曲列表
            return {
                isEnd: true,
                data: results.map((item)=>({
                        id: item.id,
                        source: item.platform,
                        title: item.name,
                        artist: item.artist,
                        album: item.album || "",
                        artwork: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${item.platform}&id=${item.id}&type=pic`,
                        url: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${item.platform}&id=${item.id}&type=url&br=320k`
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
                        avatar: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/?source=${item.platform}&id=${item.id}&type=pic`,
                        _searchQuery: query.toLowerCase() // 保存搜索关键词用于排序
                    });
                });
                // 计算相似度并排序
                const artistList = Array.from(artistMap.values()).map((artist)=>{
                    const name = artist.name.toLowerCase();
                    const searchQuery = query.toLowerCase();
                    // 计算相似度分数
                    let score = 0;
                    // 1. 完全匹配 (最高优先级)
                    if (name === searchQuery) score = 1000;
                    else if (name.startsWith(searchQuery)) score = 500;
                    else if (name.includes(searchQuery)) {
                        // 关键词越靠前,分数越高
                        const position = name.indexOf(searchQuery);
                        score = 300 - position;
                    } else {
                        const artists = name.split(/[、,，]/).map((a)=>a.trim());
                        for(let i = 0; i < artists.length; i++){
                            if (artists[i] === searchQuery) {
                                score = 800 - i * 100; // 第一个艺术家分数最高
                                break;
                            } else if (artists[i].startsWith(searchQuery)) {
                                score = 400 - i * 50;
                                break;
                            } else if (artists[i].includes(searchQuery)) {
                                score = 200 - i * 20;
                                break;
                            }
                        }
                    }
                    return {
                        ...artist,
                        _score: score
                    };
                });
                // 按分数降序排序
                artistList.sort((a, b)=>b._score - a._score);
                // 移除临时字段
                const sortedData = artistList.map(({ _searchQuery: _searchQuery, _score: _score, ...artist })=>artist);
                return {
                    isEnd: true,
                    data: sortedData
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
    const url = `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/?source=${platform}&id=${musicItem.id}&type=url&br=${br}`;
    // 直接返回 API URL，让 MusicFree 处理 302 重定向
    return {
        url: url
    };
};
const $a4fcabfd0bbb32c7$export$dd8877a67b94ca98 = async function(musicItem) {
    const platform = musicItem.source || "netease";
    try {
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                source: platform,
                id: musicItem.id,
                type: "lrc"
            },
            responseType: "text"
        });
        return {
            rawLrc: res.data
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
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                source: platform,
                id: musicBase.id,
                type: "info"
            }
        });
        if (res.data.code === 200) {
            const data = res.data.data;
            return {
                id: musicBase.id,
                source: platform,
                title: data.name,
                artist: data.artist,
                album: data.album || "",
                artwork: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${musicBase.id}&type=pic`
            };
        }
    } catch (e) {
        console.error("Get music info error:", e);
    }
    return null;
};
const $a4fcabfd0bbb32c7$export$157a64c1e7dbc3b7 = async function() {
    const platforms = [
        "netease",
        "kuwo",
        "qq"
    ];
    const result = [];
    for (const platform of platforms)try {
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                source: platform,
                type: "toplists"
            }
        });
        if (res.data.code === 200 && res.data.data.list) result.push({
            title: (0, $af8d31735c159a26$export$ab2a2e5f034797)[platform],
            data: res.data.data.list.map((item)=>({
                    id: item.id,
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
        const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
            params: {
                source: platform,
                id: topListItem.id,
                type: "toplist"
            }
        });
        if (res.data.code === 200) {
            const list = res.data.data.list || [];
            return {
                ...topListItem,
                musicList: list.map((item)=>({
                        id: item.id,
                        source: platform,
                        title: item.name,
                        artist: item.artist || "",
                        album: item.album || "",
                        artwork: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=pic`,
                        url: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
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
                const res = await (0, ($parcel$interopDefault($8zHUo$axios))).get(`${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/api/`, {
                    params: {
                        source: platform,
                        id: playlistId,
                        type: "playlist"
                    }
                });
                if (res.data.code === 200 && res.data.data.list) // 转换为 IMusicItem 格式
                return res.data.data.list.map((item)=>({
                        id: item.id,
                        source: platform,
                        title: item.name,
                        artist: item.artist || "",
                        album: item.album || "",
                        artwork: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=pic`,
                        url: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
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
    version: "1.2.0",
    cacheControl: "no-store",
    primaryKey: [
        "id",
        "source"
    ],
    srcUrl: "https://your-plugin-url/tunehub.js",
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
