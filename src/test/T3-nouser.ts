/**
 * 诊断插件 T3：完整的 ChKSz·QQ音乐 插件，仅删除 userVariables 字段。
 *
 * 判定：
 * - T2 成功、T3 失败 → 问题在我们的插件本体（与 userVariables 无关）；
 * - T3 成功、正式版失败 → userVariables 字段在该设备上引发解析问题
 *   （与源码分析矛盾，需进一步抓日志）。
 */

declare const module: { exports: IPlugin.IPluginDefine };

import { createQQPlugin } from "../pointsong";

const plugin = createQQPlugin() as any;
delete plugin.userVariables;
plugin.platform = "T3·QQ音乐无变量";
plugin.version = "0.0.3";
plugin.srcUrl = undefined;

module.exports = plugin;
