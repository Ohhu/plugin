# QQ Music Refactor Plan

## Conclusion

先以 QQ 音乐作为唯一基座重构。当前实测表明，QQ 音乐链路已经能覆盖 MusicFree 插件的核心播放闭环：搜索歌曲、获取歌曲详情、获取播放直链、获取歌词、导入歌单。

## Verified Playback

实测接口：

```text
GET https://gateway.karpov.cn/api/proxy/qqmusic/songs/0039MnYb0qxYhV/url?quality=MP3_320
X-API-Key: <api_key>
```

该接口成功返回：

```text
data.audio.format = mp3
data.audio.quality = MP3_320
data.audio.sizeBytes = 10792943
data.audio.expiresInSeconds = 7200
data.audio.url = https://ws.stream.qqmusic.qq.com/...
```

随后对临时播放 URL 发起 Range 请求：

```text
Range: bytes=0-1023
```

验证结果：

```text
HTTP/2 206
content-type: audio/mpeg
content-range: bytes 0-1023/10792943
content-length: 1024
```

结论：QQ 音乐播放直链可被正常拉取，满足 MusicFree 播放所需的基础条件。

## Actual API Base

当前网页实际使用的接口不是 OpenAPI 文档中的 `/v1/{provider}/...`，而是：

```text
https://gateway.karpov.cn/api/proxy/{provider}/...
```

鉴权方式为：

```text
X-API-Key: <api_key>
```

`Authorization: Bearer <api_key>` 和 query `api_key` 均未通过实测。

## QQ Music Feature Scope

```text
QQ 音乐重构范围
├── 可实现
│   ├── search(music)：搜索歌曲
│   ├── getMusicInfo：获取歌曲详情
│   ├── getMediaSource：获取播放直链
│   ├── getLyric：获取歌词
│   ├── importMusicSheet：通过歌单 URL 提取 id 后获取歌单 songs
│   └── getMusicSheetInfo：按歌单 id 获取 songs
├── 可保留模拟
│   ├── search(album)：从歌曲搜索结果提取 album
│   ├── getAlbumInfo：专辑接口暂不可靠，继续用搜索结果模拟
│   └── getArtistWorks：歌手详情只有基础信息，作品列表继续用搜索模拟
└── 暂不实现
    ├── 聚合搜索
    ├── netease / kugou / kuwo
    ├── 排行榜
    └── 原生专辑歌曲列表
```

## Important API Differences

- 成功响应 `code` 为 `200`，不是 OpenAPI 文档中的 `0`。
- 歌曲搜索返回 `data.items`。
- 歌曲字段使用 `durationSeconds`、`publishDate`、`album.title`、`album.cover`。
- 直链返回 `data.audio.url`，并附带 `data.song`。
- 歌词返回 `data.lyric.lrc`、`data.lyric.qrc`、`data.lyric.roma`、`data.lyric.trans`。
- QQ 音乐专辑详情接口目前只返回极简数据，没有 `songs`。

## Refactor Direction

建议重构时先删除旧 TuneHub 方法下发依赖，建立一个小型 QQ Music adapter：

```text
MusicFree plugin
└── qqmusic adapter
    ├── requestProxy(path, params)
    ├── mapSongToMusicItem(song)
    ├── searchSongs(query, page)
    ├── getSongDetail(id)
    ├── getSongUrl(id, quality)
    ├── getLyric(id)
    └── getPlaylist(id)
```

核心映射：

```text
API song.id              -> IMusicItem.id
API song.provider        -> IMusicItem.source / platform
API song.title           -> IMusicItem.title
API song.artist          -> IMusicItem.artist
API song.album.title     -> IMusicItem.album
API song.album.cover     -> IMusicItem.artwork
data.audio.url           -> IMediaSourceResult.url
data.lyric.lrc           -> ILyricSource.rawLrc
```

## Risks

- `gateway.karpov.cn` 在当前执行环境中偶发 DNS 解析失败；实现中应保留请求重试。
- 播放 URL 有过期时间，不能缓存太久。
- VIP 歌曲也可能返回直链，但实际可播性可能随账号池、版权和区域变化，需要运行时兜底。
- 专辑接口与文档不一致，不应作为首版核心能力。

## References

- `docs/api-response-samples.json`
- `docs/api-call-results.md`
- `docs/qqmusic-gateway-openapi.yaml`
