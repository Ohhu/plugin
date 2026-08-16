/**
 * ChKSz 插件冒烟测试（无网络）。
 *
 * 通过 Module._load 拦截 require("axios")，用本地 stub 模拟 ChKSz
 * 各端点的成功/失败响应，验证三个插件的行为：
 * 映射、分页、参数拼接、apikey 传递、错误码转文案、429 重试、Key 不泄漏。
 *
 * 运行：npm run smoke（需先 npm run build）
 */
/* eslint-disable no-console */

const assert = require("assert");
const path = require("path");
const Module = require("module");

const APIKEY = "chksz_test_key_123";

let calls = [];
let responder = null;

const axiosStub = {
  get(url, config) {
    calls.push({ url, config });
    const result = responder ? responder(url, calls.length) : null;
    if (!result) {
      return Promise.resolve({ status: 200, data: {}, headers: {} });
    }
    if (result.reject) {
      return Promise.reject(new Error(result.rejectMessage || "Network Error"));
    }
    return Promise.resolve({
      status: result.status || 200,
      data: result.data,
      headers: result.headers || {},
    });
  },
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "axios") {
    return axiosStub;
  }
  return originalLoad.apply(this, arguments);
};

const netease = require(path.join(__dirname, "..", "dist", "ChKSzNetease.js"));
const qq = require(path.join(__dirname, "..", "dist", "ChKSzQQ.js"));
const kugou = require(path.join(__dirname, "..", "dist", "ChKSzKugou.js"));

const self = { userVariables: { apikey: APIKEY } };
const noKeySelf = { userVariables: {} };
const declaredSelf = { userVariables: [{ key: "apikey", name: "ChKSz API Key" }] };

function lastUrl() {
  return calls[calls.length - 1].url;
}

function queryOf(url) {
  const search = url.slice(url.indexOf("?") + 1);
  const params = {};
  search.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  });
  return params;
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  calls = [];
  try {
    await fn();
    passed += 1;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}: ${error && error.message}`);
  }
}

function song(id, name, extra) {
  return Object.assign({ id, name, artists: [{ name: `歌手${id}` }], album: { name: `专辑${id}` } }, extra);
}

async function main() {
  console.log("ChKSz 插件冒烟测试\n");

  await test("网易云搜索：网易云原生结构 + 参数拼接", async () => {
    responder = () => ({
      data: {
        code: 200,
        result: {
          songCount: 2,
          songs: [
            { id: 1, name: "歌A", artists: [{ name: "歌手A" }], album: { name: "专辑A", picUrl: "https://p/a.jpg" }, duration: 210000 },
            { id: 2, name: "歌B", ar: [{ name: "歌手B" }], al: { name: "专辑B" }, dt: 180000 },
          ],
        },
      },
    });
    const result = await netease.search.call(self, "_kw 1", 1, "music");
    assert.strictEqual(result.data.length, 2);
    const first = result.data[0];
    assert.strictEqual(first.id, "1");
    assert.strictEqual(first.title, "歌A");
    assert.strictEqual(first.artist, "歌手A");
    assert.strictEqual(first.album, "专辑A");
    assert.strictEqual(first.artwork, "https://p/a.jpg");
    assert.strictEqual(first.duration, 210000);
    assert.strictEqual(first.platform, "ChKSz·网易云");
    assert.strictEqual(result.isEnd, true);
    const query = queryOf(lastUrl());
    assert.strictEqual(query.keyword, "_kw 1");
    assert.strictEqual(query.limit, "30");
    assert.strictEqual(query.offset, "0");
    assert.strictEqual(query.apikey, APIKEY);
  });

  await test("网易云搜索：{code,msg,data:{songs}} 包装 + 分页 offset", async () => {
    responder = () => ({
      data: { code: 200, msg: "ok", data: { total: 40, songs: [song(3, "歌C")] } },
    });
    const result = await netease.search.call(self, "kw", 2, "music");
    assert.strictEqual(queryOf(lastUrl()).offset, "30");
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].id, "3");
    assert.strictEqual(result.isEnd, true); // 返回不足一页（1 < 30）视为末页
  });

  await test("网易云解析：嵌套 data.url + 音质映射 high→lossless", async () => {
    responder = () => ({ data: { code: 200, data: { url: "https://cdn.example.com/a.flac", level: "lossless" } } });
    const result = await netease.getMediaSource.call(self, { id: 42 }, "high");
    assert.strictEqual(result.url, "https://cdn.example.com/a.flac");
    assert.strictEqual(result.quality, "high");
    assert.strictEqual(calls[calls.length - 1].config.timeout, 25000);
    const query = queryOf(lastUrl());
    assert.strictEqual(query.id, "42");
    assert.strictEqual(query.level, "lossless");
  });

  await test("网易云解析：顶层 url + low→standard", async () => {
    responder = () => ({ data: { code: 200, url: "https://cdn.example.com/b.mp3" } });
    const result = await netease.getMediaSource.call(self, { id: 7 }, "low");
    assert.strictEqual(result.url, "https://cdn.example.com/b.mp3");
    assert.strictEqual(queryOf(lastUrl()).level, "standard");
  });

  await test("网易云歌词：rawLrc 原文 + translation 翻译", async () => {
    responder = () => ({
      data: {
        lrc: { version: 1, lyric: "[00:01.00]hello\n[00:02.00]world" },
        tlyric: { lyric: "[00:01.00]你好" },
      },
    });
    const result = await netease.getLyric.call(self, { id: 9 });
    assert.ok(result.rawLrc.indexOf("hello") >= 0);
    assert.ok(result.rawLrc.indexOf("你好") < 0);
    assert.ok(result.translation.indexOf("你好") >= 0);
    assert.strictEqual(queryOf(lastUrl()).id, "9");
  });

  await test("网易云歌单导入：链接提取 ID + tracks 映射", async () => {
    responder = () => ({
      data: {
        code: 200,
        playlist: {
          name: "云音乐热歌榜",
          coverImgUrl: "https://p/cover.jpg",
          creator: { nickname: "网易云" },
          trackCount: 2,
          description: "描述",
          tracks: [song(1, "A", { dt: 190000 }), { id: 2, name: "B" }],
        },
      },
    });
    const items = await netease.importMusicSheet.call(self, "https://music.163.com/#/playlist?id=3778678");
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].duration, 190000);
    assert.strictEqual(queryOf(lastUrl()).id, "3778678");
  });

  await test("网易云歌单信息：分页与元数据补全", async () => {
    responder = () => ({
      data: {
        code: 200,
        playlist: {
          name: "云音乐热歌榜",
          coverImgUrl: "https://p/cover.jpg",
          creator: { nickname: "网易云" },
          trackCount: 2,
          tracks: [song(1, "A"), { id: 2, name: "B" }],
        },
      },
    });
    const result = await netease.getMusicSheetInfo.call(self, { id: "3778678", title: "旧标题" }, 1);
    assert.strictEqual(result.musicList.length, 2);
    assert.strictEqual(result.isEnd, true);
    assert.strictEqual(result.sheetItem.title, "云音乐热歌榜");
    assert.strictEqual(result.sheetItem.artwork, "https://p/cover.jpg");
    assert.strictEqual(result.sheetItem.artist, "网易云");
    assert.strictEqual(result.sheetItem.worksNum, 2);
  });

  await test("QQ 搜索：list 结构、mid 主键、keyword 保留", async () => {
    responder = () => ({
      data: {
        code: 200,
        msg: "ok",
        count: 2,
        list: [
          { n: 1, name: "QA", singer: "SA", album: "AA", pay: 1, mid: "m1" },
          { n: 2, name: "QB", singer: ["S1", "S2"], album: "AB", mid: "m2" },
        ],
      },
    });
    const result = await qq.search.call(self, "kw", 1, "music");
    assert.strictEqual(result.data.length, 2);
    assert.strictEqual(result.data[0].id, "m1");
    assert.strictEqual(result.data[0].mid, "m1");
    assert.strictEqual(result.data[0].artist, "SA");
    assert.strictEqual(result.data[0].keyword, "kw");
    assert.strictEqual(result.data[1].artist, "S1, S2");
    assert.strictEqual(result.isEnd, true);
    const query = queryOf(lastUrl());
    assert.strictEqual(query.msg, "kw");
    assert.strictEqual(query.num, "30");
    assert.strictEqual(query.apikey, APIKEY);
  });

  await test("QQ 解析：mid 直解 + super→master", async () => {
    responder = () => ({
      data: {
        url: "https://qq.example.com/a.flac",
        name: "QA",
        singer: "SA",
        album: "AA",
        cover: "https://qq.example.com/cover.jpg",
        lrc: "[00:01]q",
        interval: 200,
        mid: "m1",
        format: "flac",
      },
    });
    const item = { id: "m1", mid: "m1", title: "QA", artist: "SA", keyword: "kw" };
    const result = await qq.getMediaSource.call(self, item, "super");
    assert.strictEqual(result.url, "https://qq.example.com/a.flac");
    // 解析类请求使用大超时，避免无损/母带解析慢被 App 静默降档
    assert.strictEqual(calls[calls.length - 1].config.timeout, 25000);
    const query = queryOf(lastUrl());
    assert.strictEqual(query.mid, "m1");
    assert.strictEqual(query.msg, "kw");
    assert.strictEqual(query.size, "master");
  });

  await test("QQ 歌词：缓存热时零请求，冷缓存取详情并回填", async () => {
    // 上一个测试解析 m1 时详情已入缓存
    responder = () => {
      throw new Error("不应发起请求");
    };
    const warm = await qq.getLyric.call(self, { id: "m1", mid: "m1", title: "QA", keyword: "kw" });
    assert.strictEqual(warm.rawLrc, "[00:01]q");
    assert.strictEqual(calls.length, 0);

    responder = () => ({ data: { url: "https://x/9.flac", lrc: "[00:01.00]qq 歌词" } });
    const cold = await qq.getLyric.call(self, { id: "m9", mid: "m9", title: "QI", keyword: "kw9" });
    assert.strictEqual(cold.rawLrc, "[00:01.00]qq 歌词");
    assert.strictEqual(queryOf(lastUrl()).mid, "m9");

    calls = [];
    responder = () => {
      throw new Error("不应发起请求");
    };
    const again = await qq.getLyric.call(self, { id: "m9", mid: "m9", title: "QI" });
    assert.strictEqual(again.rawLrc, "[00:01.00]qq 歌词");
    assert.strictEqual(calls.length, 0);
  });

  await test("QQ getMusicInfo：缓存命中回填封面/专辑/时长，冷缓存返回 null", async () => {
    responder = () => {
      throw new Error("不应发起请求");
    };
    const info = await qq.getMusicInfo.call(self, { mid: "m1", id: "m1" });
    assert.strictEqual(info.artwork, "https://qq.example.com/cover.jpg");
    assert.strictEqual(info.album, "AA");
    assert.strictEqual(info.title, "QA");
    assert.strictEqual(info.artist, "SA");
    assert.strictEqual(info.duration, 200000); // interval 秒 → 毫秒
    assert.strictEqual(calls.length, 0);

    const cold = await qq.getMusicInfo.call(self, { mid: "m-cold" });
    assert.strictEqual(cold, null);
    assert.strictEqual(calls.length, 0);
  });

  await test("酷狗搜索：duration 秒转毫秒", async () => {
    responder = () => ({
      data: {
        code: 200,
        keyword: "kw",
        total: 1,
        list: [{ n: 1, id: "kg1", name: "KA", singer: "SK", album: "AK", duration: 190 }],
      },
    });
    const result = await kugou.search.call(self, "kw", 1, "music");
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].id, "kg1");
    assert.strictEqual(result.data[0].duration, 190000);
    assert.strictEqual(queryOf(lastUrl()).msg, "kw");
  });

  await test("酷狗解析：id 直解 + standard→320k", async () => {
    responder = () => ({
      data: {
        url: "https://kg.example.com/a.mp3",
        name: "KA",
        singer: "SK",
        album: "AK",
        cover: "https://kg.example.com/cover.jpg",
        lrc: "[00:01]k",
        interval: 190,
        id: "kg1",
      },
    });
    const result = await kugou.getMediaSource.call(self, { id: "kg1", title: "KA", artist: "SK", keyword: "kw" }, "standard");
    assert.strictEqual(result.url, "https://kg.example.com/a.mp3");
    const query = queryOf(lastUrl());
    assert.strictEqual(query.id, "kg1");
    assert.strictEqual(query.msg, "kw");
    assert.strictEqual(query.size, "320k");
  });

  await test("酷狗歌词 + getMusicInfo：解析后读缓存，零请求", async () => {
    responder = () => {
      throw new Error("不应发起请求");
    };
    const lyric = await kugou.getLyric.call(self, { id: "kg1", title: "KA", keyword: "kw" });
    assert.strictEqual(lyric.rawLrc, "[00:01]k");
    const info = await kugou.getMusicInfo.call(self, { id: "kg1" });
    assert.strictEqual(info.artwork, "https://kg.example.com/cover.jpg");
    assert.strictEqual(info.album, "AK");
    assert.strictEqual(info.duration, 190000);
    assert.strictEqual(calls.length, 0);
  });

  await test("非 music 搜索类型直接返回空，不发起请求", async () => {
    responder = () => {
      throw new Error("不应发起请求");
    };
    const result = await netease.search.call(self, "kw", 1, "album");
    assert.deepStrictEqual(result, { isEnd: true, data: [] });
    assert.strictEqual(calls.length, 0);
  });

  await test("未配置 Key：给出配置指引", async () => {
    responder = () => ({ data: {} });
    await assert.rejects(netease.search.call(noKeySelf, "kw", 1, "music"), /尚未配置 ChKSz API Key/);
    await assert.rejects(qq.getLyric.call(declaredSelf, { id: "mnk", mid: "mnk", keyword: "k" }), /尚未配置 ChKSz API Key/);
  });

  await test("401：转述为 Key 无效且不回显 Key", async () => {
    responder = () => ({ status: 401, data: { msg: "invalid api key" } });
    await assert.rejects(
      netease.getMediaSource.call(self, { id: 1 }, "high"),
      (error) => {
        assert.ok(/API Key 无效或登录失效/.test(error.message));
        assert.ok(error.message.indexOf("invalid api key") >= 0);
        assert.ok(error.message.indexOf(APIKEY) < 0);
        return true;
      }
    );
  });

  await test("402：额度用尽文案", async () => {
    responder = () => ({ status: 402, data: { msg: "quota exhausted" } });
    await assert.rejects(kugou.getMediaSource.call(self, { id: "kg1" }, "high"), /额度均已用尽/);
  });

  await test("429：Retry-After 较短时重试一次后成功", async () => {
    responder = (url, index) => {
      if (index === 1) {
        return { status: 429, headers: { "retry-after": "0" }, data: { msg: "too many requests" } };
      }
      return { data: { lrc: { lyric: "[00:01.00]after retry" } } };
    };
    const result = await netease.getLyric.call(self, { id: 5 });
    assert.ok(result.rawLrc.indexOf("after retry") >= 0);
    assert.strictEqual(calls.length, 2);
  });

  await test("429：Retry-After 过长时不等待，直接报错", async () => {
    responder = () => ({ status: 429, headers: { "retry-after": "42" }, data: { msg: "slow down" } });
    await assert.rejects(netease.getLyric.call(self, { id: 5 }), /速率限制/);
    assert.strictEqual(calls.length, 1);
  });

  await test("网络错误：不回显 Key", async () => {
    responder = () => ({ reject: true, rejectMessage: `Network Error for ${APIKEY}` });
    await assert.rejects(
      netease.search.call(self, "kw", 1, "music"),
      (error) => {
        assert.ok(/网络请求失败/.test(error.message));
        assert.ok(error.message.indexOf(APIKEY) < 0);
        return true;
      }
    );
  });

  await test("歌单导入：非法输入直接报错", async () => {
    responder = () => ({ data: {} });
    await assert.rejects(netease.importMusicSheet.call(self, "not-a-playlist"), /无法识别网易云歌单/);
  });

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
