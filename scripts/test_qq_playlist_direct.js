#!/usr/bin/env node

/**
 * Standalone probe for QQ Music playlist imports using the same internal
 * endpoint/signing approach used by GoMusic.
 *
 * Usage:
 *   node scripts/test_qq_playlist_direct.js "https://i2.y.qq.com/...&id=9629884311"
 */

const DEFAULT_INPUT =
  "https://i2.y.qq.com/n3/other/pages/details/playlist.html?app_type=qmlite&ADTAG=myqq&from=myqq&channel=10000001&id=9629884311&hosteuin=NKCP7wci7wvl";

const API_URLS = (process.env.QQ_MUSIC_API_URLS || "https://u6.y.qq.com/cgi-bin/musics.fcg,https://u.y.qq.com/cgi-bin/musics.fcg")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const MAX_SONGS_PER_PAGE = 30;
const MAX_TOTAL_SONGS = 10000;
const REQUEST_TIMEOUT_MS = 10000;
const QQ_MUSIC_ERROR_RESPONSE_LENGTH = 108;
const PLATFORMS = ["-1", "android", "iphone", "h5", "wxfshare", "iphone_wx", "windows"];

function add32(a, b) {
  return (a + b) & 0xffffffff;
}

function rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

function cmn(q, a, b, x, s, t) {
  return add32(rol(add32(add32(a, q), add32(x, t)), s), b);
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}

function md5Cycle(x, k) {
  let [a, b, c, d] = x;

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
}

function md5Blocks(input) {
  const bytes = new TextEncoder().encode(input);
  const originalBitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 8) >> 6) + 1) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, originalBitLength & 0xffffffff, true);
  view.setUint32(paddedLength - 4, Math.floor(originalBitLength / 0x100000000), true);

  const blocks = [];
  for (let i = 0; i < paddedLength; i += 64) {
    const block = [];
    for (let j = 0; j < 64; j += 4) {
      block.push(view.getInt32(i + j, true));
    }
    blocks.push(block);
  }
  return blocks;
}

function md5(input) {
  const state = [1732584193, -271733879, -1732584194, 271733878];
  for (const block of md5Blocks(input)) md5Cycle(state, block);

  const hex = [];
  for (const n of state) {
    for (let i = 0; i < 4; i++) {
      hex.push(((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0"));
    }
  }
  return hex.join("");
}

function selectChars(str, indices) {
  return indices.map((index) => str[index]).join("");
}

function getQQMusicSign(param) {
  const k1 = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
  };
  const l1 = [212, 45, 80, 68, 195, 163, 163, 203, 157, 220, 254, 91, 204, 79, 104, 6];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const md5Str = md5(param).toUpperCase();

  const t1 = selectChars(md5Str, [21, 4, 9, 26, 16, 20, 27, 30]);
  const t3 = selectChars(md5Str, [18, 11, 3, 2, 1, 7, 6, 25]);

  const ls2 = [];
  for (let i = 0; i < 16; i += 1) {
    const x1 = k1[md5Str[i * 2]];
    const x2 = k1[md5Str[i * 2 + 1]];
    ls2.push(((x1 * 16) ^ x2) ^ l1[i]);
  }

  const ls3 = [];
  for (let i = 0; i < 6; i += 1) {
    if (i === 5) {
      const last = ls2[ls2.length - 1];
      ls3.push(chars[last >> 2], chars[(last & 3) << 4]);
    } else {
      const x4 = ls2[i * 3] >> 2;
      const x5 = (ls2[i * 3 + 1] >> 4) ^ ((ls2[i * 3] & 3) << 4);
      const x6 = (ls2[i * 3 + 2] >> 6) ^ ((ls2[i * 3 + 1] & 15) << 2);
      const x7 = 63 & ls2[i * 3 + 2];
      ls3.push(chars[x4] + chars[x5] + chars[x6] + chars[x7]);
    }
  }

  // Keep this compatible with GoMusic's strings.ReplaceAll usage, not a regex replace.
  return `zzb${(t1 + ls3.join("").replace("[\\/+\]", "") + t3).toLowerCase()}`;
}

function extractPlaylistId(input) {
  const value = String(input || "").trim();
  if (/^\d+$/.test(value)) return value;

  try {
    const parsed = new URL(value);
    const id = parsed.searchParams.get("id");
    if (id && /^\d+$/.test(id)) return id;
  } catch (_) {
    // Fall back to regexes below for partial or non-standard shared text.
  }

  const patterns = [/y\.qq\.com\/n\/ryqq\/playlist\/(\d+)/, /\/playlist\/(\d+)/, /[?&]id=(\d+)/];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function buildRequestBody(disstid, platform, songBegin, songNum) {
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
        song_num: songNum,
      },
    },
    comm: {
      g_tk: 5381,
      uin: 0,
      format: "json",
      platform,
    },
  });
}

async function fetchPlaylistPage(disstid, songBegin, songNum) {
  let lastError = null;

  for (const apiUrl of API_URLS) {
    for (const platform of PLATFORMS) {
      const body = buildRequestBody(disstid, platform, songBegin, songNum);
      const sign = getQQMusicSign(body);
      const url = `${apiUrl}?sign=${encodeURIComponent(sign)}&_=${Date.now()}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          signal: controller.signal,
        });
        const text = await response.text();

        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status} on ${apiUrl} platform ${platform}: ${text.slice(0, 160)}`);
          continue;
        }

        if (text.length === QQ_MUSIC_ERROR_RESPONSE_LENGTH) {
          lastError = new Error(`QQ Music rejected ${apiUrl} platform ${platform}: ${text}`);
          continue;
        }

        const json = JSON.parse(text);
        const reqCode = json?.req_0?.code;
        const songlist = json?.req_0?.data?.songlist;
        if (json?.code === 0 && reqCode === 0 && Array.isArray(songlist)) {
          return { json, apiUrl, platform, sign };
        }

        lastError = new Error(`Unexpected response on ${apiUrl} platform ${platform}: ${text.slice(0, 300)}`);
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError || new Error("All QQ Music platform variants failed");
}

async function fetchPlaylist(disstid) {
  const firstPage = await fetchPlaylistPage(disstid, 0, MAX_SONGS_PER_PAGE);
  const data = firstPage.json.req_0.data;
  const total = Math.min(data?.dirinfo?.songnum || data?.songlist?.length || 0, MAX_TOTAL_SONGS);
  const songs = [...(data.songlist || [])];
  const pageCount = Math.ceil(total / MAX_SONGS_PER_PAGE);

  for (let page = 1; page < pageCount; page += 1) {
    const songBegin = page * MAX_SONGS_PER_PAGE;
    const songNum = Math.min(MAX_SONGS_PER_PAGE, total - songBegin);
    const pageResult = await fetchPlaylistPage(disstid, songBegin, songNum);
    songs.push(...(pageResult.json.req_0.data.songlist || []));
    console.log(`Fetched page ${page + 1}/${pageCount}: +${pageResult.json.req_0.data.songlist?.length || 0}`);
  }

  return {
    id: String(disstid),
    title: data?.dirinfo?.title || "",
    songCount: total,
    fetchedCount: songs.length,
    apiUrl: firstPage.apiUrl,
    platform: firstPage.platform,
    songs,
  };
}

async function main() {
  const input = process.argv[2] || DEFAULT_INPUT;
  const playlistId = extractPlaylistId(input);
  if (!playlistId) {
    throw new Error(`Cannot extract QQ Music playlist id from: ${input}`);
  }

  console.log(`Playlist id: ${playlistId}`);
  const playlist = await fetchPlaylist(playlistId);

  console.log(`Title: ${playlist.title}`);
  console.log(`Song count from QQ Music: ${playlist.songCount}`);
  console.log(`Fetched songs: ${playlist.fetchedCount}`);
  console.log(`Working API: ${playlist.apiUrl}`);
  console.log(`Working platform: ${playlist.platform}`);
  console.log("First 10 songs:");

  playlist.songs.slice(0, 10).forEach((song, index) => {
    const singers = (song.singer || []).map((singer) => singer.name).join(" / ");
    const songId = song.mid || song.songmid || song.id || "";
    console.log(`${String(index + 1).padStart(2, "0")}. ${song.name} - ${singers} [${songId}]`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
