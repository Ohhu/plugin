/**
 * 诊断插件 T5：T2 基础上仅增加「经典 for 循环 + switch + continue」构造。
 *
 * 判定：
 * - T5 失败而 T1/T2 成功 → 设备引擎不接受 for/switch/continue 之一；
 * - T5 成功 → 继续测 T6–T8。
 */
var T5Plugin = {
    platform: "T5·循环switch",
    author: "Ohhu",
    version: "0.0.5",
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
        var acc = "";
        for (var i = 0; i < 3; i += 1) {
            switch (i) {
              case 1:
                acc += "b";
              default:
                continue;
            }
        }
        return {
            isEnd: true,
            data: []
        };
    }
};

module.exports = T5Plugin;