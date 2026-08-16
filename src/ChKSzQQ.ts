/**
 * ChKSz·QQ音乐 —— MusicFree 音源插件入口。
 *
 * 能力：搜索 / 播放解析 / 歌词 / QQ 歌单导入（直连 QQ 官方接口，不耗 ChKSz 额度）。
 * 播放解析需在插件设置中填写 ChKSz API Key。
 */

declare const module: { exports: IPlugin.IPluginDefine };

import { createQQPlugin } from "./pointsong";
import { attachQQPlaylistImport } from "./qqsheet";

module.exports = attachQQPlaylistImport(createQQPlugin());