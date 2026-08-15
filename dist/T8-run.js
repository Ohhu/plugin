/**
 * 诊断插件 T8：挂载期（module scope）即执行的构造组合——
 * 逗号序列调用 `(0, fn)(...)`、delete 属性、字符串 \xNN 转义。
 * 这些是 T3-nouser 挂载时真正执行、而 T2 从未执行的代码。
 *
 * 判定：
 * - T8 失败而 T1/T2 成功 → 引擎无法在挂载期执行上述构造之一；
 * - T8 成功 → T4–T8 全部通过，此前 T3 的失败来自更深层差异，需抓取设备日志。
 */
function $id$(x) {
    return x;
}

var T8Plugin = (0, $id$)({
    platform: "T8·逗号调用",
    author: "Ohhu",
    version: "0.0.8",
    cacheControl: "no-store",
    primaryKey: [ "id" ],
    supportedSearchType: [ "music" ],
    extra: "to-be-deleted"
});

delete T8Plugin.extra;
T8Plugin.tag = "esc:\xb7";
T8Plugin.search = async function(query, page, type) {
    return {
        isEnd: true,
        data: []
    };
};

module.exports = T8Plugin;