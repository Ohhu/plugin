/**
 * ChKSz·QQ音乐 —— MusicFree 音源插件入口。
 *
 * 能力：搜索 / 播放解析 / 歌词（点歌接口，无分页）。
 * 使用前需在插件设置中填写 ChKSz API Key。
 */

declare const module: { exports: IPlugin.IPluginDefine };

import { createQQPlugin } from "./pointsong";

module.exports = createQQPlugin();
