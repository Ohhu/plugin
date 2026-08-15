/**
 * 诊断插件 T7：T2 基础上仅增加「Object.keys + 正则字面量 + 递归」。
 * 不使用 for/while 循环，避免与 T5 探针交叉污染。
 *
 * 判定：
 * - T7 失败而 T5/T6 成功 → 疑点缩到 Object.keys / 正则字面量 / 递归；
 * - T7 成功 → 继续测 T8。
 */
var URL_LIKE_KEYS = [ "url", "musicUrl", "playUrl" ];

function deepFindHttpUrl(root, depth) {
    if (!root || typeof root !== "object" || depth < 0) return undefined;
    var keys = Object.keys(root);
    if (!keys.length) return undefined;
    var firstKey = keys[0];
    var firstValue = root[firstKey];
    if (URL_LIKE_KEYS.indexOf(firstKey) >= 0 && typeof firstValue === "string" && /^https?:\/\//i.test(firstValue)) {
        return firstValue;
    }
    return deepFindHttpUrl(firstValue, depth - 1);
}

var T7Plugin = {
    platform: "T7·正则递归",
    author: "Ohhu",
    version: "0.0.7",
    cacheControl: "no-store",
    primaryKey: [ "id" ],
    supportedSearchType: [ "music" ],
    search: async function(query, page, type) {
        return {
            isEnd: true,
            data: []
        };
    }
};

module.exports = T7Plugin;