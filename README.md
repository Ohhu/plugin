# QQ 音乐歌单导入插件

这是一个 MusicFree **QQ 音乐歌单导入专用插件**。

插件只负责解析 QQ 音乐歌单链接并导入歌曲列表，不提供搜索、歌词、歌曲详情或播放解析能力。播放请在 MusicFree 应用内使用“音源重定向”交给其他可播放的 QQ 音源插件。

## 功能

- 导入 QQ 音乐歌单
- 获取歌单分页歌曲列表
- 直连 QQ 音乐 `musics.fcg` 接口获取完整歌单
- 输出兼容 QQ 解析插件的歌曲字段：
  - `id`
  - `songmid`
  - `albumid`
  - `albummid`
  - `title`
  - `artist`
  - `album`
  - `artwork`

## 不负责的能力

- 搜索歌曲
- 获取播放直链
- 获取歌词
- 获取歌曲详情
- 获取专辑 / 歌手 / 排行榜

这些能力请交给 MusicFree 的其他音源插件处理。

## 支持的歌单链接

支持纯歌单 ID 和常见 QQ 音乐分享链接，例如：

```text
9629884311
https://y.qq.com/n/ryqq/playlist/9629884311
https://i.y.qq.com/n2/m/share/details/taoge.html?id=9629884311
https://i2.y.qq.com/n3/other/pages/details/playlist.html?...&id=9629884311
```

## 使用方式

### 1. 导入插件

复制下面的链接，在 MusicFree 中导入插件：

```text
https://raw.githubusercontent.com/Ohhu/plugin/qq-playlist-importer/dist/QQPlaylistImporter.js
```

插件平台名：

```text
QQ歌单导入
```

### 2. 配置音源重定向

本插件不解析播放地址。请在 MusicFree 应用内把：

```text
QQ歌单导入
```

重定向到你正在使用的可播放 QQ 音源插件。

例如，如果目标播放插件的平台名是：

```text
元力QQ
```

则在 MusicFree 中配置：

```text
QQ歌单导入 -> 元力QQ
```

重定向配置在应用里完成，插件代码不会硬编码任何第三方播放源。

## 构建

```bash
npm install
npm run build
```

构建产物：

```text
dist/QQPlaylistImporter.js
```

## 项目结构

```text
src/
└── index.ts       # MusicFree 歌单导入插件入口与 QQ 歌单直连逻辑
types/             # MusicFree 类型声明
docs/              # API 实测记录与文档
```
