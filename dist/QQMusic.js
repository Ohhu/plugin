var $8zHUo$axios = require("axios");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/**
 * QQ 音乐 MusicFree 插件
 *
 * 功能分类:
 * - native.ts: API 原生支持的功能 (搜索、详情、音源、歌词、导入歌单)
 * - simulated.ts: 模拟功能 (专辑详情、艺术家作品)
 * - constants.ts: 常量定义
 */ // QQ 音乐代理 API 基础 URL
const $af8d31735c159a26$export$ca6dda5263526f75 = "https://gateway.karpov.cn/api/proxy";
const $af8d31735c159a26$export$a9861bd62f48e142 = "mk_ZmTkVzg-vfLQn2iNszi9YUJWpssSIxyM";
const $af8d31735c159a26$export$d5f2363fcb2d1ef9 = "qqmusic";
const $af8d31735c159a26$export$174a7998569c8c21 = {
    low: "MP3_128",
    standard: "MP3_320",
    high: "FLAC",
    super: "FLAC"
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
async function $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31(path, params) {
    const response = await $9ba0f9a5c47c04f2$export$656187f20a39c07c({
        method: "GET",
        url: `${(0, $af8d31735c159a26$export$ca6dda5263526f75)}/${(0, $af8d31735c159a26$export$d5f2363fcb2d1ef9)}${path}`,
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
        artist: song.artist || song.artists?.map((artist)=>artist.name).join(", ") || "",
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
    if (Array.isArray(song.artists) && song.artists.length > 0) return song.artists.map((artist)=>({
            id: artist.id || artist.name,
            platform: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
            source: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
            name: artist.name,
            avatar: ""
        }));
    if (!song.artist) return [];
    return song.artist.split(/[、,，/]/).map((name)=>name.trim()).filter(Boolean).map((name)=>({
            id: name,
            platform: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
            source: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
            name: name,
            avatar: ""
        }));
}
function $9ba0f9a5c47c04f2$export$220cca749de3aca(items) {
    const itemMap = new Map();
    items.forEach((item)=>{
        if (!itemMap.has(item.id)) itemMap.set(item.id, item);
    });
    return Array.from(itemMap.values());
}




async function $99a82f6090a5251e$var$searchRawSongs(query, page, pageSize = (0, $af8d31735c159a26$export$8ec3d08588d2eeda)) {
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
            data: (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(albums, query, (album)=>album.title)
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
        const artists = (0, $9ba0f9a5c47c04f2$export$220cca749de3aca)([].concat(...songs.map((0, $9ba0f9a5c47c04f2$export$ab03dbb02a7afa1d))));
        return {
            isEnd: true,
            data: (0, $9ba0f9a5c47c04f2$export$b2e1e35494b27b67)(artists, query, (artist)=>artist.name, true)
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
        const album = await (0, $9ba0f9a5c47c04f2$export$2c3d55c000f8fb31)(`/albums/${encodeURIComponent(String(albumItem.id))}`);
        const songs = album?.songs || [];
        return {
            isEnd: true,
            albumItem: album ? {
                title: album.title || album.name || albumItem.title,
                artwork: album.cover || album.picUrl || albumItem.artwork,
                qqmusicRaw: album
            } : undefined,
            musicList: songs.map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476))
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
        const matchedSongs = songs.filter((song)=>song.artist?.includes(artistName));
        if (type === "album") {
            const albums = (0, $9ba0f9a5c47c04f2$export$220cca749de3aca)(matchedSongs.map((0, $9ba0f9a5c47c04f2$export$4252b4fefcc1b0ca)).filter(Boolean));
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




const $86926f9976742e38$var$QQ_MUSIC_API_URLS = [
    "https://u6.y.qq.com/cgi-bin/musics.fcg",
    "https://u.y.qq.com/cgi-bin/musics.fcg"
];
const $86926f9976742e38$var$QQ_MUSIC_PLATFORMS = [
    "-1",
    "android",
    "iphone",
    "h5",
    "wxfshare",
    "iphone_wx",
    "windows"
];
const $86926f9976742e38$var$MAX_SONGS_PER_PAGE = 30;
const $86926f9976742e38$var$MAX_TOTAL_SONGS = 10000;
const $86926f9976742e38$var$REQUEST_TIMEOUT_MS = 10000;
const $86926f9976742e38$var$QQ_MUSIC_ERROR_RESPONSE_LENGTH = 108;
function $86926f9976742e38$var$add32(a, b) {
    return a + b & 0xffffffff;
}
function $86926f9976742e38$var$rol(num, cnt) {
    return num << cnt | num >>> 32 - cnt;
}
function $86926f9976742e38$var$cmn(q, a, b, x, s, t) {
    return $86926f9976742e38$var$add32($86926f9976742e38$var$rol($86926f9976742e38$var$add32($86926f9976742e38$var$add32(a, q), $86926f9976742e38$var$add32(x, t)), s), b);
}
function $86926f9976742e38$var$ff(a, b, c, d, x, s, t) {
    return $86926f9976742e38$var$cmn(b & c | ~b & d, a, b, x, s, t);
}
function $86926f9976742e38$var$gg(a, b, c, d, x, s, t) {
    return $86926f9976742e38$var$cmn(b & d | c & ~d, a, b, x, s, t);
}
function $86926f9976742e38$var$hh(a, b, c, d, x, s, t) {
    return $86926f9976742e38$var$cmn(b ^ c ^ d, a, b, x, s, t);
}
function $86926f9976742e38$var$ii(a, b, c, d, x, s, t) {
    return $86926f9976742e38$var$cmn(c ^ (b | ~d), a, b, x, s, t);
}
function $86926f9976742e38$var$md5Cycle(x, k) {
    let [a, b, c, d] = x;
    a = $86926f9976742e38$var$ff(a, b, c, d, k[0], 7, -680876936);
    d = $86926f9976742e38$var$ff(d, a, b, c, k[1], 12, -389564586);
    c = $86926f9976742e38$var$ff(c, d, a, b, k[2], 17, 606105819);
    b = $86926f9976742e38$var$ff(b, c, d, a, k[3], 22, -1044525330);
    a = $86926f9976742e38$var$ff(a, b, c, d, k[4], 7, -176418897);
    d = $86926f9976742e38$var$ff(d, a, b, c, k[5], 12, 1200080426);
    c = $86926f9976742e38$var$ff(c, d, a, b, k[6], 17, -1473231341);
    b = $86926f9976742e38$var$ff(b, c, d, a, k[7], 22, -45705983);
    a = $86926f9976742e38$var$ff(a, b, c, d, k[8], 7, 1770035416);
    d = $86926f9976742e38$var$ff(d, a, b, c, k[9], 12, -1958414417);
    c = $86926f9976742e38$var$ff(c, d, a, b, k[10], 17, -42063);
    b = $86926f9976742e38$var$ff(b, c, d, a, k[11], 22, -1990404162);
    a = $86926f9976742e38$var$ff(a, b, c, d, k[12], 7, 1804603682);
    d = $86926f9976742e38$var$ff(d, a, b, c, k[13], 12, -40341101);
    c = $86926f9976742e38$var$ff(c, d, a, b, k[14], 17, -1502002290);
    b = $86926f9976742e38$var$ff(b, c, d, a, k[15], 22, 1236535329);
    a = $86926f9976742e38$var$gg(a, b, c, d, k[1], 5, -165796510);
    d = $86926f9976742e38$var$gg(d, a, b, c, k[6], 9, -1069501632);
    c = $86926f9976742e38$var$gg(c, d, a, b, k[11], 14, 643717713);
    b = $86926f9976742e38$var$gg(b, c, d, a, k[0], 20, -373897302);
    a = $86926f9976742e38$var$gg(a, b, c, d, k[5], 5, -701558691);
    d = $86926f9976742e38$var$gg(d, a, b, c, k[10], 9, 38016083);
    c = $86926f9976742e38$var$gg(c, d, a, b, k[15], 14, -660478335);
    b = $86926f9976742e38$var$gg(b, c, d, a, k[4], 20, -405537848);
    a = $86926f9976742e38$var$gg(a, b, c, d, k[9], 5, 568446438);
    d = $86926f9976742e38$var$gg(d, a, b, c, k[14], 9, -1019803690);
    c = $86926f9976742e38$var$gg(c, d, a, b, k[3], 14, -187363961);
    b = $86926f9976742e38$var$gg(b, c, d, a, k[8], 20, 1163531501);
    a = $86926f9976742e38$var$gg(a, b, c, d, k[13], 5, -1444681467);
    d = $86926f9976742e38$var$gg(d, a, b, c, k[2], 9, -51403784);
    c = $86926f9976742e38$var$gg(c, d, a, b, k[7], 14, 1735328473);
    b = $86926f9976742e38$var$gg(b, c, d, a, k[12], 20, -1926607734);
    a = $86926f9976742e38$var$hh(a, b, c, d, k[5], 4, -378558);
    d = $86926f9976742e38$var$hh(d, a, b, c, k[8], 11, -2022574463);
    c = $86926f9976742e38$var$hh(c, d, a, b, k[11], 16, 1839030562);
    b = $86926f9976742e38$var$hh(b, c, d, a, k[14], 23, -35309556);
    a = $86926f9976742e38$var$hh(a, b, c, d, k[1], 4, -1530992060);
    d = $86926f9976742e38$var$hh(d, a, b, c, k[4], 11, 1272893353);
    c = $86926f9976742e38$var$hh(c, d, a, b, k[7], 16, -155497632);
    b = $86926f9976742e38$var$hh(b, c, d, a, k[10], 23, -1094730640);
    a = $86926f9976742e38$var$hh(a, b, c, d, k[13], 4, 681279174);
    d = $86926f9976742e38$var$hh(d, a, b, c, k[0], 11, -358537222);
    c = $86926f9976742e38$var$hh(c, d, a, b, k[3], 16, -722521979);
    b = $86926f9976742e38$var$hh(b, c, d, a, k[6], 23, 76029189);
    a = $86926f9976742e38$var$hh(a, b, c, d, k[9], 4, -640364487);
    d = $86926f9976742e38$var$hh(d, a, b, c, k[12], 11, -421815835);
    c = $86926f9976742e38$var$hh(c, d, a, b, k[15], 16, 530742520);
    b = $86926f9976742e38$var$hh(b, c, d, a, k[2], 23, -995338651);
    a = $86926f9976742e38$var$ii(a, b, c, d, k[0], 6, -198630844);
    d = $86926f9976742e38$var$ii(d, a, b, c, k[7], 10, 1126891415);
    c = $86926f9976742e38$var$ii(c, d, a, b, k[14], 15, -1416354905);
    b = $86926f9976742e38$var$ii(b, c, d, a, k[5], 21, -57434055);
    a = $86926f9976742e38$var$ii(a, b, c, d, k[12], 6, 1700485571);
    d = $86926f9976742e38$var$ii(d, a, b, c, k[3], 10, -1894986606);
    c = $86926f9976742e38$var$ii(c, d, a, b, k[10], 15, -1051523);
    b = $86926f9976742e38$var$ii(b, c, d, a, k[1], 21, -2054922799);
    a = $86926f9976742e38$var$ii(a, b, c, d, k[8], 6, 1873313359);
    d = $86926f9976742e38$var$ii(d, a, b, c, k[15], 10, -30611744);
    c = $86926f9976742e38$var$ii(c, d, a, b, k[6], 15, -1560198380);
    b = $86926f9976742e38$var$ii(b, c, d, a, k[13], 21, 1309151649);
    a = $86926f9976742e38$var$ii(a, b, c, d, k[4], 6, -145523070);
    d = $86926f9976742e38$var$ii(d, a, b, c, k[11], 10, -1120210379);
    c = $86926f9976742e38$var$ii(c, d, a, b, k[2], 15, 718787259);
    b = $86926f9976742e38$var$ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = $86926f9976742e38$var$add32(a, x[0]);
    x[1] = $86926f9976742e38$var$add32(b, x[1]);
    x[2] = $86926f9976742e38$var$add32(c, x[2]);
    x[3] = $86926f9976742e38$var$add32(d, x[3]);
}
function $86926f9976742e38$var$utf8Bytes(input) {
    const bytes = [];
    const encoded = unescape(encodeURIComponent(input));
    for(let i = 0; i < encoded.length; i += 1)bytes.push(encoded.charCodeAt(i));
    return bytes;
}
function $86926f9976742e38$var$md5Blocks(input) {
    const bytes = $86926f9976742e38$var$utf8Bytes(input);
    const originalBitLength = bytes.length * 8;
    const paddedLength = ((bytes.length + 8 >> 6) + 1) * 64;
    const padded = new Array(paddedLength).fill(0);
    for(let i = 0; i < bytes.length; i += 1)padded[i] = bytes[i];
    padded[bytes.length] = 0x80;
    for(let i = 0; i < 8; i += 1)padded[paddedLength - 8 + i] = Math.floor(originalBitLength / Math.pow(256, i)) & 0xff;
    const blocks = [];
    for(let i = 0; i < paddedLength; i += 64){
        const block = [];
        for(let j = 0; j < 64; j += 4)block.push(padded[i + j] | padded[i + j + 1] << 8 | padded[i + j + 2] << 16 | padded[i + j + 3] << 24);
        blocks.push(block);
    }
    return blocks;
}
function $86926f9976742e38$var$md5(input) {
    const state = [
        1732584193,
        -271733879,
        -1732584194,
        271733878
    ];
    $86926f9976742e38$var$md5Blocks(input).forEach((block)=>$86926f9976742e38$var$md5Cycle(state, block));
    const hex = [];
    state.forEach((n)=>{
        for(let i = 0; i < 4; i += 1)hex.push((n >>> i * 8 & 0xff).toString(16).padStart(2, "0"));
    });
    return hex.join("");
}
function $86926f9976742e38$var$selectChars(str, indices) {
    return indices.map((index)=>str[index]).join("");
}
function $86926f9976742e38$var$getQQMusicSign(param) {
    const l1 = [
        212,
        45,
        80,
        68,
        195,
        163,
        163,
        203,
        157,
        220,
        254,
        91,
        204,
        79,
        104,
        6
    ];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    const md5Str = $86926f9976742e38$var$md5(param).toUpperCase();
    const t1 = $86926f9976742e38$var$selectChars(md5Str, [
        21,
        4,
        9,
        26,
        16,
        20,
        27,
        30
    ]);
    const t3 = $86926f9976742e38$var$selectChars(md5Str, [
        18,
        11,
        3,
        2,
        1,
        7,
        6,
        25
    ]);
    const ls2 = [];
    for(let i = 0; i < 16; i += 1){
        const x1 = parseInt(md5Str[i * 2], 16);
        const x2 = parseInt(md5Str[i * 2 + 1], 16);
        ls2.push(x1 * 16 ^ x2 ^ l1[i]);
    }
    const ls3 = [];
    for(let i = 0; i < 6; i += 1)if (i === 5) {
        const last = ls2[ls2.length - 1];
        ls3.push(chars[last >> 2], chars[(last & 3) << 4]);
    } else {
        const x4 = ls2[i * 3] >> 2;
        const x5 = ls2[i * 3 + 1] >> 4 ^ (ls2[i * 3] & 3) << 4;
        const x6 = ls2[i * 3 + 2] >> 6 ^ (ls2[i * 3 + 1] & 15) << 2;
        const x7 = 63 & ls2[i * 3 + 2];
        ls3.push(chars[x4] + chars[x5] + chars[x6] + chars[x7]);
    }
    return `zzb${(t1 + ls3.join("").replace("[\\/+]", "") + t3).toLowerCase()}`;
}
function $86926f9976742e38$export$ce98046fc5ed6f8c(input) {
    const value = String(input || "").trim();
    if (/^\d+$/.test(value)) return value;
    try {
        const parsed = new URL(value);
        const id = parsed.searchParams.get("id");
        if (id && /^\d+$/.test(id)) return id;
    } catch (_) {
    // Shared text can contain partial URLs, so keep regex fallback below.
    }
    const patterns = [
        /y\.qq\.com\/n\/ryqq\/playlist\/(\d+)/,
        /\/playlist\/(\d+)/,
        /[?&]id=(\d+)/
    ];
    for (const pattern of patterns){
        const match = value.match(pattern);
        if (match) return match[1];
    }
    return null;
}
function $86926f9976742e38$var$buildRequestBody(disstid, platform, songBegin, songNum) {
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
async function $86926f9976742e38$var$fetchPlaylistPage(disstid, songBegin, songNum) {
    let lastError = null;
    for (const apiUrl of $86926f9976742e38$var$QQ_MUSIC_API_URLS)for (const platform of $86926f9976742e38$var$QQ_MUSIC_PLATFORMS){
        const body = $86926f9976742e38$var$buildRequestBody(disstid, platform, songBegin, songNum);
        const sign = $86926f9976742e38$var$getQQMusicSign(body);
        const url = `${apiUrl}?sign=${encodeURIComponent(sign)}&_=${Date.now()}`;
        try {
            const response = await (0, ($parcel$interopDefault($8zHUo$axios))).post(url, body, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: $86926f9976742e38$var$REQUEST_TIMEOUT_MS,
                responseType: "text",
                transformResponse: [
                    (data)=>data
                ]
            });
            const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
            if (text.length === $86926f9976742e38$var$QQ_MUSIC_ERROR_RESPONSE_LENGTH) {
                lastError = new Error(`QQ Music rejected ${apiUrl} platform ${platform}: ${text}`);
                continue;
            }
            const json = JSON.parse(text);
            const songlist = json.req_0?.data?.songlist;
            if (json.code === 0 && json.req_0?.code === 0 && Array.isArray(songlist)) return json;
            lastError = new Error(`Unexpected QQ Music response on ${apiUrl} platform ${platform}`);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("All QQ Music playlist requests failed");
}
function $86926f9976742e38$var$getAlbumCover(albumMid) {
    return albumMid ? `https://y.qq.com/music/photo_new/T002R300x300M000${albumMid}_5.jpg` : "";
}
function $86926f9976742e38$var$mapQQSongToApiSong(song) {
    const singers = Array.isArray(song.singer) ? song.singer : [];
    const albumMid = song.album?.pmid || song.album?.mid || song.albummid || "";
    const albumTitle = song.album?.title || song.album?.name || song.albumname || "";
    const songMid = song.mid || song.songmid || String(song.id || song.songid || "");
    return {
        id: songMid,
        title: song.title || song.name || "",
        artist: singers.map((singer)=>singer.name).filter(Boolean).join(", "),
        artists: singers.map((singer)=>({
                id: String(singer.mid || singer.id || singer.name || ""),
                name: singer.name || ""
            })).filter((artist)=>artist.name),
        album: {
            id: String(albumMid || song.album?.id || ""),
            title: albumTitle,
            cover: $86926f9976742e38$var$getAlbumCover(albumMid)
        },
        cover: $86926f9976742e38$var$getAlbumCover(albumMid),
        durationSeconds: song.interval || song.duration,
        isVipOnly: song.pay?.pay_play === 1,
        provider: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        publishDate: song.time_public,
        qqmusicRaw: song
    };
}
async function $86926f9976742e38$export$5f20f3d874fc5f18(input) {
    const playlistId = $86926f9976742e38$export$ce98046fc5ed6f8c(input);
    if (!playlistId) return null;
    const firstPage = await $86926f9976742e38$var$fetchPlaylistPage(playlistId, 0, $86926f9976742e38$var$MAX_SONGS_PER_PAGE);
    const firstData = firstPage.req_0?.data;
    const dirinfo = firstData?.dirinfo || {};
    const total = Math.min(Number(dirinfo.songnum) || firstData?.songlist?.length || 0, $86926f9976742e38$var$MAX_TOTAL_SONGS);
    const songs = [
        ...firstData?.songlist || []
    ];
    const pageCount = Math.ceil(total / $86926f9976742e38$var$MAX_SONGS_PER_PAGE);
    for(let page = 1; page < pageCount; page += 1){
        const songBegin = page * $86926f9976742e38$var$MAX_SONGS_PER_PAGE;
        const songNum = Math.min($86926f9976742e38$var$MAX_SONGS_PER_PAGE, total - songBegin);
        const pageResult = await $86926f9976742e38$var$fetchPlaylistPage(playlistId, songBegin, songNum);
        songs.push(...pageResult.req_0?.data?.songlist || []);
    }
    return {
        id: playlistId,
        title: dirinfo.title || dirinfo.dissname || "",
        description: dirinfo.desc || dirinfo.dissdesc || "",
        cover: dirinfo.picurl || dirinfo.logo || "",
        creator: {
            id: String(dirinfo.hostuin || dirinfo.uin || ""),
            nickname: dirinfo.nickname || dirinfo.host_nick || "",
            avatar: dirinfo.headurl || ""
        },
        hasMore: false,
        playCount: Number(dirinfo.visitnum) || Number(dirinfo.listennum) || undefined,
        provider: (0, $af8d31735c159a26$export$d5f2363fcb2d1ef9),
        songCount: total,
        songs: songs.map($86926f9976742e38$var$mapQQSongToApiSong)
    };
}


const $a4fcabfd0bbb32c7$var$lyricCache = new Map();
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
        return await (0, $86926f9976742e38$export$5f20f3d874fc5f18)(id);
    } catch (e) {
        console.error("Get playlist error:", e);
        return null;
    }
}
const $a4fcabfd0bbb32c7$export$673794af62c4d65e = async function(urlLike) {
    const playlistId = (0, $86926f9976742e38$export$ce98046fc5ed6f8c)(urlLike);
    if (!playlistId) return null;
    const playlist = await $a4fcabfd0bbb32c7$export$b9347112ad6b5fab(playlistId);
    return playlist?.songs?.map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476)) || null;
};
const $a4fcabfd0bbb32c7$export$96ef2693ce7e7983 = async function(sheetItem, page) {
    const playlistId = (0, $86926f9976742e38$export$ce98046fc5ed6f8c)(String(sheetItem.id)) || String(sheetItem.id);
    const playlist = await $a4fcabfd0bbb32c7$export$b9347112ad6b5fab(playlistId);
    const songs = playlist?.songs || [];
    const start = Math.max(page - 1, 0) * (0, $af8d31735c159a26$export$8ec3d08588d2eeda);
    const musicList = songs.slice(start, start + (0, $af8d31735c159a26$export$8ec3d08588d2eeda)).map((0, $9ba0f9a5c47c04f2$export$d917c56e92199476));
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



// 插件定义
const $882b6d93070905b3$var$pluginInstance = {
    platform: "QQ音乐",
    author: "Ohhu",
    version: "2.1.1",
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
    srcUrl: "https://raw.githubusercontent.com/Ohhu/plugin/music-free/dist/QQMusic.js",
    search: // API 原生支持的功能
    $a4fcabfd0bbb32c7$export$d76128d007d19019,
    getMusicInfo: $a4fcabfd0bbb32c7$export$cec695f762a1db32,
    getMediaSource: $a4fcabfd0bbb32c7$export$a92854129bc50f89,
    getLyric: $a4fcabfd0bbb32c7$export$dd8877a67b94ca98,
    importMusicSheet: $a4fcabfd0bbb32c7$export$673794af62c4d65e,
    getMusicSheetInfo: $a4fcabfd0bbb32c7$export$96ef2693ce7e7983,
    getAlbumInfo: // 模拟功能
    $99a82f6090a5251e$export$dc862406499065f2,
    getArtistWorks: $99a82f6090a5251e$export$4adb7587a1eda30e
};
// 使用 CommonJS 导出方式
module.exports = $882b6d93070905b3$var$pluginInstance;


//# sourceMappingURL=QQMusic.js.map
