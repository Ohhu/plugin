/**
 * 诊断插件 T4：T2 基础上仅增加「箭头函数 + 模板字符串」两个构造。
 *
 * 判定：
 * - T4 失败而 T1/T2 成功 → 设备引擎不接受箭头函数或模板字符串
 *   （下一轮再用两个独立探针区分二者）；
 * - T4 成功 → 继续测 T5–T8。
 */
var T4Plugin = {
    platform: "T4·箭头模板",
    author: "Ohhu",
    version: "0.0.4",
    cacheControl: "no-store",
    primaryKey: [ "id" ],
    supportedSearchType: [ "music" ],
    search: async function(query, page, type) {
        if (type !== "music") {
            return {
                isEnd: true,
                data: []
            };
        }
        var greet = (name) => "hi " + name;
        var label = `kw:${query} p:${page}`;
        var hi = greet(label);
        return {
            isEnd: true,
            data: [
                {
                    id: String(hi).length,
                    title: label
                }
            ]
        };
    }
};

module.exports = T4Plugin;