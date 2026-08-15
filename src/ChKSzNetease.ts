/**
 * ChKSz·网易云 —— MusicFree 音源插件入口。
 *
 * 能力：搜索 / 播放解析 / 歌词 / 网易云歌单导入。
 * 使用前需在插件设置中填写 ChKSz API Key。
 */

declare const module: { exports: IPlugin.IPluginDefine };

import { createNeteasePlugin } from "./netease";

module.exports = createNeteasePlugin();
