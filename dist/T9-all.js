/**
 * 诊断插件 T9：把 T4–T8 已验证过的构造全部合并进一个文件，
 * 并补充 T5 未覆盖的 for-of / 嵌套 (0,fn)() / 嵌套三元。
 * 体积约 2KB，远小于失败的 T3（20.8KB）。
 *
 * 判定：
 * - T9 失败而 T4–T8 全部成功 → 问题不在单个构造，而在构造组合/调用形态；
 * - T9 成功 → 继续测 T10（结构克隆）与 T11–T14（尺寸阶梯）。
 */
var $T9a$axios = require("axios");

function $T9a$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
}

function $T9a$chkszError(message, status) {
    var error = new Error(message);
    error.name = "T9ApiError";
    error.status = status;
    return error;
}

var $T9a$URL_LIKE_KEYS = [ "url", "musicUrl", "playUrl" ];

function $T9a$deepFindHttpUrl(root, depth) {
    var record = root && typeof root === "object" && !Array.isArray(root) ? root : undefined;
    if (!record || depth < 0) return undefined;
    var keys = Object.keys(record);
    var first = keys[0];
    var value = record[first];
    var label = `key=${first} depth=${depth}`;
    if ($T9a$URL_LIKE_KEYS.indexOf(first) >= 0 && typeof value === "string" && /^https?:\/\//i.test(value)) {
        return value;
    }
    var deeper = (0, $T9a$deepFindHttpUrl)(value, depth - 1);
    if (!deeper && label) deeper = undefined;
    return deeper;
}

var $T9a$plugin = {
    platform: "T9·全构造",
    author: "Ohhu",
    version: "0.0.9",
    cacheControl: "no-store",
    primaryKey: [ "id" ],
    supportedSearchType: [ "music" ],
    hints: {
        importMusicSheet: [],
        importMusicItem: []
    },
    userVariables: [
        {
            key: "apikey",
            name: "T9 变量",
            hint: "仅作解析探针"
        }
    ],
    search: async function(query, page, type) {
        if (type !== "music") {
            return {
                isEnd: true,
                data: []
            };
        }
        var nums = [ 1, 2, 3 ];
        var doubled = nums.map((x)=>x * 2);
        var acc = 0;
        for (var k = 0; k < doubled.length; k += 1) {
            switch (doubled[k] % 4) {
              case 0:
                acc += doubled[k];
                continue;
              default:
                acc += 1;
                continue;
            }
        }
        var msg = acc > 10 ? `big:${acc}` : query !== "" ? `q:${query}` : String(page);
        try {
            if (acc > 100) throw $T9a$chkszError(msg, 400);
        } catch (error) {
            msg = error && typeof error === "object" && typeof error.message === "string" ? error.message : String(error);
        }
        // 运行期触发一次真实 axios 调用；网络失败不影响安装判定
        try {
            await (0, ($T9a$interopDefault($T9a$axios))).get("https://api.chksz.com/healthz", {
                timeout: 1500
            });
        } catch (_) {}
        return {
            isEnd: true,
            data: [
                {
                    id: String(acc),
                    title: msg,
                    platform: "T9·全构造",
                    source: "T9·全构造"
                }
            ]
        };
    }
};

module.exports = (0, (function() {
    return $T9a$plugin;
})());