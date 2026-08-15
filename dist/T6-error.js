/**
 * 诊断插件 T6：T2 基础上仅增加「错误工厂（new Error）+ throw/catch + typeof 链」。
 *
 * 判定：
 * - T6 失败而 T1/T2 成功 → 设备引擎不接受 Error 构造/throw/catch 相关写法；
 * - T6 成功 → 继续测 T7/T8。
 */
function chkszError(message, status) {
    var error = new Error(message);
    error.name = "ChKSzApiError";
    error.status = status;
    return error;
}

var T6Plugin = {
    platform: "T6·异常工厂",
    author: "Ohhu",
    version: "0.0.6",
    cacheControl: "no-store",
    primaryKey: [ "id" ],
    supportedSearchType: [ "music" ],
    search: async function(query, page, type) {
        try {
            throw chkszError("boom", 400);
        } catch (error) {
            var detail = error && typeof error === "object" && typeof error.message === "string" ? error.message : String(error);
            if (detail === "boom") {
                return {
                    isEnd: true,
                    data: []
                };
            }
        }
        return {
            isEnd: true,
            data: []
        };
    }
};

module.exports = T6Plugin;