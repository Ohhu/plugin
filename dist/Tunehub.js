var $8zHUo$axios = require("axios");

function $parcel$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
    Object.defineProperty(e, n, {
        get: v,
        set: s,
        enumerable: true,
        configurable: true
    });
}

var $parcel$global = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};

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
            var module = {
                id: id,
                exports: {}
            };
            $parcel$modules[id] = module;
            init.call(module.exports, module, module.exports);
            return module.exports;
        }
        var err = new Error("Cannot find module '" + id + "'");
        err.code = "MODULE_NOT_FOUND";
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
    $parcel$export(module.exports, "executeMethodConfigRaw", () => executeMethodConfigRaw);
    var $cyXty = parcelRequire("cyXty");
    const delay = ms11 => new Promise(resolve11 => setTimeout(resolve11, ms11));
    async function requestWithRetry(config11, retryCount11 = 3, retryDelay11 = 150) {
        try {
            const headers11 = {
                ...config11.headers,
                "X-API-Key": (0, $cyXty.API_KEY)
            };
            const response11 = await (0, $parcel$interopDefault($8zHUo$axios))({
                ...config11,
                headers: headers11
            });
            return response11.data;
        } catch (error11) {
            if (retryCount11 > 0) {
                await delay(retryDelay11);
                return requestWithRetry(config11, retryCount11 - 1, retryDelay11);
            }
            throw error11;
        }
    }
    function calculateSimilarityScore(text11, query11, isSplit11 = false) {
        const lowerText11 = text11.toLowerCase();
        const lowerQuery11 = query11.toLowerCase();
        if (lowerText11 === lowerQuery11) return 1e3;
        if (lowerText11.startsWith(lowerQuery11)) return 500;
        if (lowerText11.includes(lowerQuery11)) {
            const position11 = lowerText11.indexOf(lowerQuery11);
            return 300 - position11;
        }
        if (isSplit11) {
            const parts11 = lowerText11.split(/[、,，]/).map(p11 => p11.trim());
            for (let i11 = 0; i11 < parts11.length; i11++) {
                if (parts11[i11] === lowerQuery11) return 800 - i11 * 100; else if (parts11[i11].startsWith(lowerQuery11)) return 400 - i11 * 50; else if (parts11[i11].includes(lowerQuery11)) return 200 - i11 * 20;
            }
        }
        return 0;
    }
    function sortBySimilarity(items11, query11, getTextField11, isSplit11 = false) {
        const itemsWithScore11 = items11.map(item11 => ({
            item: item11,
            score: calculateSimilarityScore(getTextField11(item11), query11, isSplit11)
        }));
        itemsWithScore11.sort((a11, b11) => b11.score - a11.score);
        return itemsWithScore11.map(({item: item11}) => item11);
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
        if (typeof template11 === "string") {
            const fullMatch11 = template11.match(/^\{\{([^}]+)\}\}$/);
            if (fullMatch11) try {
                const func11 = new Function(...Object.keys(variables11), `return ${fullMatch11[1]};`);
                return func11(...Object.values(variables11));
            } catch (e11) {
                console.error("Template expression error:", fullMatch11[1], e11);
                return "";
            }
            return template11.replace(/\{\{([^}]+)\}\}/g, (_11, expr11) => {
                try {
                    const func11 = new Function(...Object.keys(variables11), `return ${expr11};`);
                    const result11 = func11(...Object.values(variables11));
                    return String(result11);
                } catch (e11) {
                    console.error("Template expression error:", expr11, e11);
                    return "";
                }
            });
        } else if (typeof template11 === "object" && template11 !== null) {
            const result11 = {};
            for (const [key11, value11] of Object.entries(template11)) result11[key11] = replaceTemplateVariables(value11, variables11);
            return result11;
        }
        return template11;
    }
    async function executeMethodConfig(config, variables = {}) {
        try {
            const url = replaceTemplateVariables(config.url, variables);
            const params = config.params ? replaceTemplateVariables(config.params, variables) : undefined;
            const body = config.body ? replaceTemplateVariables(config.body, variables) : undefined;
            const response = await (0, $parcel$interopDefault($8zHUo$axios))({
                method: config.method,
                url: url,
                params: params,
                data: body,
                headers: config.headers || {},
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            let data = response.data;
            if (config.transform) try {
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
    async function executeMethodConfigRaw(config11, variables11 = {}) {
        try {
            const url11 = replaceTemplateVariables(config11.url, variables11);
            const params11 = config11.params ? replaceTemplateVariables(config11.params, variables11) : undefined;
            const body11 = config11.body ? replaceTemplateVariables(config11.body, variables11) : undefined;
            const response11 = await (0, $parcel$interopDefault($8zHUo$axios))({
                method: config11.method,
                url: url11,
                params: params11,
                data: body11,
                headers: config11.headers || {},
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            return response11.data;
        } catch (e11) {
            console.error("Execute method config raw error:", e11);
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
    const $af8d31735c159a26$export$8ec3d08588d2eeda = 30;
});

var $cyXty = parcelRequire("cyXty");

var $lCxOT = parcelRequire("lCxOT");

var $cyXty = parcelRequire("cyXty");

var $lCxOT = parcelRequire("lCxOT");

const $99a82f6090a5251e$export$bb9c7f929676dbb6 = async function(query, page) {
    const platforms = [ "netease", "qq", "kuwo" ];
    const albumMap = new Map;
    for (const platform of platforms) try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "search");
        if (!config) continue;
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            keyword: query,
            page: String(page),
            limit: String((0, $cyXty.PAGE_SIZE))
        });
        if (data && Array.isArray(data)) data.forEach(item => {
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
    const albumList = (0, $lCxOT.sortBySimilarity)(Array.from(albumMap.values()), query, album => album.title);
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
        if (data && Array.isArray(data)) {
            const musicList = data.filter(item => {
                const itemAlbum = item.album || "";
                const itemArtist = item.artist || "";
                const albumMatch = itemAlbum.toLowerCase().includes(albumName.toLowerCase());
                const artistMatch = !artistName || itemArtist.toLowerCase().includes(artistName.toLowerCase());
                return albumMatch && artistMatch;
            }).map(item => ({
                id: item.id,
                platform: platform,
                source: platform,
                title: item.name || item.title,
                artist: item.artist || "",
                album: item.album || "",
                artwork: item.pic || "",
                url: ""
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
        if (data && Array.isArray(data)) {
            const results = data.filter(item => {
                const itemArtist = item.artist || "";
                return itemArtist.includes(artistName);
            });
            if (type === "music") {
                const musicList = results.map(item => ({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name || item.title,
                    artist: item.artist || "",
                    album: item.album || "",
                    artwork: item.pic || "",
                    url: ""
                }));
                return {
                    isEnd: true,
                    data: musicList
                };
            } else if (type === "album") {
                const albumMap = new Map;
                results.forEach(item => {
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

const $a4fcabfd0bbb32c7$var$lyricCache = new Map;

const $a4fcabfd0bbb32c7$var$pendingRequests = new Map;

const $a4fcabfd0bbb32c7$var$MAX_CACHE_SIZE = 50;

const $a4fcabfd0bbb32c7$export$d76128d007d19019 = async function(query, page, type) {
    if (type === "album") return await (0, $99a82f6090a5251e$export$bb9c7f929676dbb6)(query, page);
    const platforms = [ "netease", "qq", "kuwo" ];
    const allResults = [];
    for (const platform of platforms) try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "search");
        if (!config) continue;
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            keyword: query,
            page: String(page),
            limit: String((0, $cyXty.PAGE_SIZE))
        });
        if (data && Array.isArray(data)) allResults.push(...data.map(item => ({
            ...item,
            platform: platform,
            source: platform
        })));
    } catch (e) {
        console.error(`Search error for ${platform}:`, e);
    }
    if (type === "music") return {
        isEnd: true,
        data: allResults.map(item => ({
            id: item.id,
            platform: item.platform,
            source: item.platform,
            title: item.name || item.title,
            artist: item.artist || "",
            album: item.album || "",
            artwork: item.pic || "",
            url: ""
        }))
    }; else if (type === "artist") {
        const artistMap = new Map;
        allResults.forEach(item => {
            const artistName = item.artist || "";
            if (artistName && !artistMap.has(artistName)) artistMap.set(artistName, {
                id: artistName,
                source: item.platform,
                name: artistName,
                avatar: item.pic || ""
            });
        });
        const artistList = (0, $lCxOT.sortBySimilarity)(Array.from(artistMap.values()), query, artist => artist.name, true);
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
    const cacheKey = `${platform}_${musicItem.id}`;
    const requestPromise = (async () => {
        const response = await (0, $lCxOT.requestWithRetry)({
            method: "POST",
            url: `${0, $cyXty.BASE_URL}/v1/parse`,
            data: {
                platform: platform,
                ids: String(musicItem.id),
                quality: qualityStr
            }
        });
        return response;
    })();
    $a4fcabfd0bbb32c7$var$pendingRequests.set(cacheKey, requestPromise);
    try {
        const response = await requestPromise;
        if (response.code === 0 && response.data) {
            const dataArray = response.data.data;
            if (Array.isArray(dataArray)) {
                const songData = dataArray.find(item => String(item.id) === String(musicItem.id));
                if (songData) {
                    if ($a4fcabfd0bbb32c7$var$lyricCache.size >= $a4fcabfd0bbb32c7$var$MAX_CACHE_SIZE) {
                        const firstKey = $a4fcabfd0bbb32c7$var$lyricCache.keys().next().value;
                        if (firstKey) $a4fcabfd0bbb32c7$var$lyricCache.delete(firstKey);
                    }
                    $a4fcabfd0bbb32c7$var$lyricCache.set(cacheKey, songData.lyrics || "");
                    if (songData.url) return {
                        url: songData.url,
                        quality: quality
                    };
                }
            }
        }
    } catch (e) {
        console.error("Get media source error:", e);
    } finally {
        $a4fcabfd0bbb32c7$var$pendingRequests.delete(cacheKey);
    }
    return null;
};

const $a4fcabfd0bbb32c7$export$dd8877a67b94ca98 = async function(musicItem) {
    const platform = musicItem.source || "netease";
    const cacheKey = `${platform}_${musicItem.id}`;
    if ($a4fcabfd0bbb32c7$var$lyricCache.has(cacheKey)) return {
        rawLrc: $a4fcabfd0bbb32c7$var$lyricCache.get(cacheKey)
    };
    if ($a4fcabfd0bbb32c7$var$pendingRequests.has(cacheKey)) try {
        await $a4fcabfd0bbb32c7$var$pendingRequests.get(cacheKey);
        if ($a4fcabfd0bbb32c7$var$lyricCache.has(cacheKey)) return {
            rawLrc: $a4fcabfd0bbb32c7$var$lyricCache.get(cacheKey)
        };
    } catch (e) {}
    try {
        const response = await (0, $lCxOT.requestWithRetry)({
            method: "POST",
            url: `${0, $cyXty.BASE_URL}/v1/parse`,
            data: {
                platform: platform,
                ids: String(musicItem.id),
                quality: "128k"
            }
        });
        if (response.code === 0 && response.data) {
            const dataArray = response.data.data;
            if (Array.isArray(dataArray)) {
                const songData = dataArray.find(item => String(item.id) === String(musicItem.id));
                if (songData && songData.lyrics) {
                    if ($a4fcabfd0bbb32c7$var$lyricCache.size >= $a4fcabfd0bbb32c7$var$MAX_CACHE_SIZE) {
                        const firstKey = $a4fcabfd0bbb32c7$var$lyricCache.keys().next().value;
                        if (firstKey) $a4fcabfd0bbb32c7$var$lyricCache.delete(firstKey);
                    }
                    $a4fcabfd0bbb32c7$var$lyricCache.set(cacheKey, songData.lyrics);
                    return {
                        rawLrc: songData.lyrics
                    };
                }
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
    const platforms = [ "qq", "netease", "kuwo" ];
    const result = [];
    for (const platform of platforms) try {
        const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "toplists");
        if (!config) continue;
        const data = await (0, $lCxOT.executeMethodConfig)(config);
        if (data && Array.isArray(data)) result.push({
            title: (0, $cyXty.PLATFORM_NAMES)[platform],
            data: data.map(item => ({
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
        if (platform === "qq") {
            const rawData = await (0, $lCxOT.executeMethodConfigRaw)(config, {
                id: String(topListItem.id)
            });
            const songList = rawData?.toplist?.data?.songInfoList;
            if (songList && Array.isArray(songList) && songList.length > 0) return {
                ...topListItem,
                musicList: songList.map(item => ({
                    id: item.mid || item.id,
                    platform: platform,
                    source: platform,
                    title: item.title || item.name,
                    artist: item.singer?.map(s => s.name).join(", ") || "",
                    album: item.album?.name || item.albumName || "",
                    artwork: item.album?.mid ? `https://y.qq.com/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : "",
                    url: ""
                }))
            };
        }
        const data = await (0, $lCxOT.executeMethodConfig)(config, {
            id: String(topListItem.id)
        });
        if (data && Array.isArray(data) && data.length > 0) return {
            ...topListItem,
            musicList: data.map(item => ({
                id: item.id,
                platform: platform,
                source: platform,
                title: item.name || item.title,
                artist: item.artist || "",
                album: item.album || "",
                artwork: item.pic || "",
                url: ""
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
    const patterns = [ {
        platform: "kuwo",
        regex: /kuwo\.cn\/playlist_detail\/(\d+)/
    }, {
        platform: "netease",
        regex: /music\.163\.com.*[?&]id=(\d+)/
    }, {
        platform: "qq",
        regex: /y\.qq\.com.*(?:playlist\/|[?&]id=)(\d+)/
    } ];
    for (const {platform: platform, regex: regex} of patterns) {
        const match = urlLike.match(regex);
        if (match) {
            const playlistId = match[1];
            try {
                const config = await (0, $lCxOT.getMethodConfig)((0, $cyXty.BASE_URL), platform, "playlist");
                if (!config) continue;
                if (platform === "qq") {
                    const rawData = await (0, $lCxOT.executeMethodConfigRaw)(config, {
                        id: playlistId
                    });
                    const cdlist = rawData?.cdlist;
                    if (cdlist && cdlist.length > 0 && cdlist[0].songlist) {
                        const songList = cdlist[0].songlist;
                        return songList.map(item => ({
                            id: item.mid || item.id,
                            platform: platform,
                            source: platform,
                            title: item.title || item.name,
                            artist: item.singer?.map(s => s.name).join(", ") || "",
                            album: item.album?.name || item.albumName || "",
                            artwork: item.album?.mid ? `https://y.qq.com/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : "",
                            url: ""
                        }));
                    }
                }
                const rawData = await (0, $lCxOT.executeMethodConfigRaw)(config, {
                    id: playlistId
                });
                if (platform === "netease" && rawData?.result?.tracks) return rawData.result.tracks.map(item => ({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name,
                    artist: item.ar?.map(a => a.name).join(", ") || item.artists?.map(a => a.name).join(", ") || "",
                    album: item.al?.name || item.album?.name || "",
                    artwork: item.al?.picUrl || item.album?.picUrl || "",
                    url: ""
                }));
                if (platform === "kuwo" && rawData?.musiclist) return rawData.musiclist.map(item => ({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name,
                    artist: item.artist || "",
                    album: item.album || "",
                    artwork: item.albumpic || item.pic || "",
                    url: ""
                }));
                const data = await (0, $lCxOT.executeMethodConfig)(config, {
                    id: playlistId
                });
                if (data && data.list && Array.isArray(data.list)) return data.list.map(item => ({
                    id: item.id,
                    platform: platform,
                    source: platform,
                    title: item.name || item.title,
                    artist: item.artist || "",
                    album: item.album || "",
                    artwork: item.pic || "",
                    url: ""
                }));
            } catch (e) {
                console.error(`Import playlist error for ${platform}:`, e);
                return null;
            }
        }
    }
    return null;
};

const $882b6d93070905b3$var$pluginInstance = {
    platform: "TuneHub",
    author: "Ohhu",
    version: "2.1.9",
    defaultSearchType: "music",
    supportedSearchType: [ "music", "album", "artist" ],
    cacheControl: "no-store",
    primaryKey: [ "id", "source" ],
    srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/TuneHub/dist/Tunehub.js",
    search: $a4fcabfd0bbb32c7$export$d76128d007d19019,
    getMediaSource: $a4fcabfd0bbb32c7$export$a92854129bc50f89,
    getLyric: $a4fcabfd0bbb32c7$export$dd8877a67b94ca98,
    getTopLists: $a4fcabfd0bbb32c7$export$157a64c1e7dbc3b7,
    getTopListDetail: $a4fcabfd0bbb32c7$export$b0178d0d6466fe81,
    importMusicSheet: $a4fcabfd0bbb32c7$export$673794af62c4d65e,
    getAlbumInfo: $99a82f6090a5251e$export$dc862406499065f2,
    getArtistWorks: $99a82f6090a5251e$export$4adb7587a1eda30e
};

module.exports = $882b6d93070905b3$var$pluginInstance;