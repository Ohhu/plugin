var $8zHUo$axios = require("axios");

function $parcel$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
}

const $af8d31735c159a26$export$ca6dda5263526f75 = "https://gateway.karpov.cn/api/proxy";

const $af8d31735c159a26$export$a9861bd62f48e142 = "mk_";

const $af8d31735c159a26$export$d5f2363fcb2d1ef9 = "qqmusic";

const $af8d31735c159a26$export$174a7998569c8c21 = {
    low: "MP3_128",
    standard: "MP3_320",
    high: "FLAC",
    super: "FLAC"
};

const $af8d31735c159a26$export$8ec3d08588d2eeda = 30;

const $9ba0f9a5c47c04f2$export$1391212d75b2ee65 = ms => new Promise(resolve => setTimeout(resolve, ms));

async function $9ba0f9a5c47c04f2$export$656187f20a39c07c(config, retryCount = 3, retryDelay = 150) {
    try {
        const headers = {
            ...config.headers,
            "X-API-Key": (0, $af8d31735c159a26$export$a9861bd62f48e142)
        };
        const response = await (0, $parcel$interopDefault($8zHUo$axios))({
            ...config,
            headers: headers
        });
        return response.data;
    } catch (error) {
        if (retryCount > 0) {
            await $9ba0f9a5c47c04f2$export$1391212d75b2ee65(retryDelay);
            return $9ba0f9a5c47c04f2$export$656187f20a39c07c(config, retryCount - 1, retryDelay);
        }
        throw error;
    }
}

function $9ba0f9a5c47c04f2$export$9cd659cf9e0bcd55(text, query, isSplit = false) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    if (lowerText === lowerQuery) return 1e3;
    if (lowerText.startsWith(lowerQuery)) return 500;
    if (lowerText.includes(lowerQuery)) {
        const position = lowerText.indexOf(lowerQuery);
        return 300 - position;
    }
    if (isSplit) {
        const parts = lowerText.split(/[、,，]/).map(p => p.trim());
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === lowerQuery) return 800 - i * 100; else if (parts[i].startsWith(lowerQuery)) return 400 - i * 50; else if (parts[i].includes(lowerQuery)) return 200 - i * 20;
        }
    }
    return 0;
}

function $9ba0f9a5c47c04f2$export$b2e1e35494b27b67(items, query, getTextField, isSplit = false) {
    const itemsWithScore = items.map(item => ({
        item: item,
        score: $9ba0f9a5c47c04f2$export$9cd659cf9e0bcd55(getTextField(item), query, isSplit)
    }));
    itemsWithScore.sort((a, b) => b.score - a.score);
    return itemsWithScore.map(({item: item}) => item);
}

async function $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31(path, params) {
    const response = await $9ba0f9a5c47c04f2$export$656187f20a39c07c({
        method: "GET",
        url: `${0, $af8d31735c159a26$export$ca6dda5263526f75}/${0, $af8d31735c159a26$export$d5f2363fcb2d1ef9}${path}`,
        params: params
    });
    if (response.code !== 200) {
        console.error(`QQ Music API error: ${response.code} ${response.message || ""}`);
        return null;
    }
    return response.data;
}

function $9ba0f9a5c47c04f2$export$9a42595b32d58b49(album) {
    if (!album) return "";
    return typeof album === "string" ? album : album.title || "";
}

function $9ba0f9a5c47c04f2$export$c1d5fc96c2ea9679(song) {
    if (song.cover) return song.cover;
    return typeof song.album === "object" && song.album?.cover ? song.album.cover : "";
}

function $9ba0f9a5c47c04f2$export$5dd8c4d9bf309290(album) {
    return typeof album === "object" && album?.id ? album.id : "";
}

function $9ba0f9a5c47c04f2$export$d917c56e92199476(song) {
    return {
        id: song.id,
        platform: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        source: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        title: song.title || "",
        artist: song.artist || song.artists?.map(artist => artist.name).join(", ") || "",
        album: $9ba0f9a5c47c04f2$export$9a42595b32d58b49(song.album),
        artwork: $9ba0f9a5c47c04f2$export$c1d5fc96c2ea9679(song),
        duration: song.durationSeconds,
        url: "",
        qqmusicRaw: song
    };
}

function $9ba0f9a5c47c04f2$export$4252b4fefcc1b0ca(song) {
    const albumTitle = $9ba0f9a5c47c04f2$export$9a42595b32d58b49(song.album);
    if (!albumTitle) return null;
    return {
        id: $9ba0f9a5c47c04f2$export$5dd8c4d9bf309290(song.album) || albumTitle,
        platform: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        source: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        title: albumTitle,
        artist: song.artist || "",
        artwork: $9ba0f9a5c47c04f2$export$c1d5fc96c2ea9679(song),
        description: "",
        qqmusicRaw: song.album
    };
}

function $9ba0f9a5c47c04f2$export$ab03dbb02a7afa1d(song) {
    if (Array.isArray(song.artists) && song.artists.length > 0) return song.artists.map(artist => ({
        id: artist.id || artist.name,
        platform: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        source: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        name: artist.name,
        avatar: ""
    }));
    if (!song.artist) return [];
    return song.artist.split(/[、,，/]/).map(name => name.trim()).filter(Boolean).map(name => ({
        id: name,
        platform: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        source: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        name: name,
        avatar: ""
    }));
}

function $9ba0f9a5c47c04f2$export$220cca749de3aca(items) {
    const itemMap = new Map;
    items.forEach(item => {
        if (!itemMap.has(item.id)) itemMap.set(item.id, item);
    });
    return Array.from(itemMap.values());
}

async function $99a82f6090a5251e$var$searchRawSongs(query, page, pageSize = (0, 
$af8d31735c159a26$export$8ec3d08588d2eeda)) {
    const data = await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)("/search/songs", {
        q: query,
        page: page,
        page_size: pageSize
    });
    return data?.items || [];
}

const $99a82f6090a5251e$export$bb9c7f929676dbb6 = async function(query, page) {
    try {
        const songs = await $99a82f6090a5251e$var$searchRawSongs(query, page);
        const albums = (0, $9ba0f9a5c47c04f2$export$220cca749de3aca)(songs.map((0, $9ba0f9a5c47c04f2$export$4252b4fefcc1b0ca)).filter(Boolean));
        return {
            isEnd: true,
            data: (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(albums, query, album => album.title)
        };
    } catch (e) {
        console.error("Search album error:", e);
        return {
            isEnd: true,
            data: []
        };
    }
};

const $99a82f6090a5251e$export$8bdc97021ba8f894 = async function(query, page) {
    try {
        const songs = await $99a82f6090a5251e$var$searchRawSongs(query, page);
        const artists = (0, $9ba0f9a5c47c04f2$export$220cca749de3aca)(songs.flatMap((0, 
        $9ba0f9a5c47c04f2$export$ab03dbb02a7afa1d)));
        return {
            isEnd: true,
            data: (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(artists, query, artist => artist.name, true)
        };
    } catch (e) {
        console.error("Search artist error:", e);
        return {
            isEnd: true,
            data: []
        };
    }
};

const $99a82f6090a5251e$export$dc862406499065f2 = async function(albumItem, page) {
    try {
        const albumName = albumItem.title || String(albumItem.id);
        const artistName = albumItem.artist || "";
        const searchKeyword = artistName ? `${artistName} ${albumName}` : albumName;
        const songs = await $99a82f6090a5251e$var$searchRawSongs(searchKeyword, page, 100);
        const musicList = songs.filter(song => {
            const album = (0, $9ba0f9a5c47c04f2$export$4252b4fefcc1b0ca)(song);
            return album?.title.toLowerCase().includes(albumName.toLowerCase());
        }).map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476));
        return {
            isEnd: true,
            musicList: musicList
        };
    } catch (e) {
        console.error("Get album info error:", e);
        return {
            isEnd: true,
            musicList: []
        };
    }
};

const $99a82f6090a5251e$export$4adb7587a1eda30e = async function(artistItem, page, type) {
    try {
        const artistName = artistItem.name;
        const songs = await $99a82f6090a5251e$var$searchRawSongs(artistName, page, 50);
        const matchedSongs = songs.filter(song => song.artist?.includes(artistName));
        if (type === "album") {
            const albums = (0, $9ba0f9a5c47c04f2$export$220cca749de3aca)(matchedSongs.map((0, 
            $9ba0f9a5c47c04f2$export$4252b4fefcc1b0ca)).filter(Boolean));
            return {
                isEnd: true,
                data: albums
            };
        }
        return {
            isEnd: true,
            data: matchedSongs.map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476))
        };
    } catch (e) {
        console.error("Get artist works error:", e);
        return {
            isEnd: true,
            data: []
        };
    }
};

const $a4fcabfd0bbb32c7$var$lyricCache = new Map;

const $a4fcabfd0bbb32c7$var$MAX_CACHE_SIZE = 50;

function $a4fcabfd0bbb32c7$var$setLyricCache(id, lyric) {
    if ($a4fcabfd0bbb32c7$var$lyricCache.size >= $a4fcabfd0bbb32c7$var$MAX_CACHE_SIZE) {
        const firstKey = $a4fcabfd0bbb32c7$var$lyricCache.keys().next().value;
        if (firstKey) $a4fcabfd0bbb32c7$var$lyricCache.delete(firstKey);
    }
    $a4fcabfd0bbb32c7$var$lyricCache.set(id, lyric);
}

async function $a4fcabfd0bbb32c7$export$fd49fd7de453819a(query, page) {
    try {
        const data = await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)("/search/songs", {
            q: query,
            page: page,
            page_size: (0, $af8d31735c159a26$export$8ec3d08588d2eeda)
        });
        const songs = data?.items || [];
        return {
            isEnd: !data?.hasMore,
            data: songs.map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476))
        };
    } catch (e) {
        console.error("Search songs error:", e);
        return {
            isEnd: true,
            data: []
        };
    }
}

const $a4fcabfd0bbb32c7$export$d76128d007d19019 = async function(query, page, type) {
    if (type === "album") return (0, $99a82f6090a5251e$export$bb9c7f929676dbb6)(query, page);
    if (type === "artist") return (0, $99a82f6090a5251e$export$8bdc97021ba8f894)(query, page);
    if (type === "music") return $a4fcabfd0bbb32c7$export$fd49fd7de453819a(query, page);
    return {
        isEnd: true,
        data: []
    };
};

const $a4fcabfd0bbb32c7$export$cec695f762a1db32 = async function(musicBase) {
    try {
        const song = await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)(`/songs/${encodeURIComponent(String(musicBase.id))}`);
        return song ? (0, $9ba0f9a5c47c04f2$export$d917c56e92199476)(song) : null;
    } catch (e) {
        console.error("Get music info error:", e);
        return null;
    }
};

const $a4fcabfd0bbb32c7$export$a92854129bc50f89 = async function(musicItem, quality) {
    if (!musicItem.id) return null;
    try {
        const data = await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)(`/songs/${encodeURIComponent(String(musicItem.id))}/url`, {
            quality: (0, $af8d31735c159a26$export$174a7998569c8c21)[quality] || (0, $af8d31735c159a26$export$174a7998569c8c21).standard
        });
        const url = data?.audio?.url;
        if (!url) return null;
        return {
            url: url,
            quality: quality
        };
    } catch (e) {
        console.error("Get media source error:", e);
        return null;
    }
};

const $a4fcabfd0bbb32c7$export$dd8877a67b94ca98 = async function(musicItem) {
    if (!musicItem.id) return {
        rawLrc: ""
    };
    const cacheKey = String(musicItem.id);
    if ($a4fcabfd0bbb32c7$var$lyricCache.has(cacheKey)) return {
        rawLrc: $a4fcabfd0bbb32c7$var$lyricCache.get(cacheKey)
    };
    try {
        const data = await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)(`/songs/${encodeURIComponent(String(musicItem.id))}/lyric`);
        const rawLrc = data?.lyric?.lrc || "";
        $a4fcabfd0bbb32c7$var$setLyricCache(cacheKey, rawLrc);
        return {
            rawLrc: rawLrc
        };
    } catch (e) {
        console.error("Get lyric error:", e);
        return {
            rawLrc: ""
        };
    }
};

async function $a4fcabfd0bbb32c7$export$b9347112ad6b5fab(id) {
    try {
        return await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)(`/playlists/${encodeURIComponent(id)}`);
    } catch (e) {
        console.error("Get playlist error:", e);
        return null;
    }
}

function $a4fcabfd0bbb32c7$var$extractPlaylistId(urlLike) {
    const patterns = [ /y\.qq\.com\/n\/ryqq\/playlist\/(\d+)/, /[?&]id=(\d+)/, /\/playlist\/(\d+)/, /^(\d+)$/ ];
    for (const pattern of patterns) {
        const match = urlLike.match(pattern);
        if (match) return match[1];
    }
    return null;
}

const $a4fcabfd0bbb32c7$export$673794af62c4d65e = async function(urlLike) {
    const playlistId = $a4fcabfd0bbb32c7$var$extractPlaylistId(urlLike);
    if (!playlistId) return null;
    const playlist = await $a4fcabfd0bbb32c7$export$b9347112ad6b5fab(playlistId);
    return playlist?.songs?.map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476)) || null;
};

const $a4fcabfd0bbb32c7$export$96ef2693ce7e7983 = async function(sheetItem, page) {
    const playlist = await $a4fcabfd0bbb32c7$export$b9347112ad6b5fab(String(sheetItem.id));
    const songs = playlist?.songs || [];
    const start = Math.max(page - 1, 0) * (0, $af8d31735c159a26$export$8ec3d08588d2eeda);
    const musicList = songs.slice(start, start + (0, $af8d31735c159a26$export$8ec3d08588d2eeda)).map((0, 
    $9ba0f9a5c47c04f2$export$d917c56e92199476));
    return {
        isEnd: start + (0, $af8d31735c159a26$export$8ec3d08588d2eeda) >= songs.length || !playlist?.hasMore,
        sheetItem: playlist ? {
            title: playlist.title || sheetItem.title,
            description: playlist.description || sheetItem.description,
            artwork: playlist.cover || sheetItem.artwork,
            playCount: playlist.playCount,
            worksNum: playlist.songCount,
            artist: playlist.creator?.nickname
        } : undefined,
        musicList: musicList
    };
};

const $882b6d93070905b3$var$pluginInstance = {
    platform: "QQ音乐",
    author: "Ohhu",
    version: "3.0.0",
    defaultSearchType: "music",
    supportedSearchType: [ "music", "album", "artist" ],
    cacheControl: "no-store",
    primaryKey: [ "id", "source" ],
    srcUrl: "",
    search: $a4fcabfd0bbb32c7$export$d76128d007d19019,
    getMusicInfo: $a4fcabfd0bbb32c7$export$cec695f762a1db32,
    getMediaSource: $a4fcabfd0bbb32c7$export$a92854129bc50f89,
    getLyric: $a4fcabfd0bbb32c7$export$dd8877a67b94ca98,
    importMusicSheet: $a4fcabfd0bbb32c7$export$673794af62c4d65e,
    getMusicSheetInfo: $a4fcabfd0bbb32c7$export$96ef2693ce7e7983,
    getAlbumInfo: $99a82f6090a5251e$export$dc862406499065f2,
    getArtistWorks: $99a82f6090a5251e$export$4adb7587a1eda30e
};

module.exports = $882b6d93070905b3$var$pluginInstance;