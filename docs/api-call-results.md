# API Call Results

测试时间：2026-05-07

## Goal

验证 `docs/qqmusic-gateway-openapi.yaml` 中音乐接口的真实返回格式，并保存可供后续重构参考的样例。

## Credential Handling

- 测试使用了用户提供的 API Key。
- 本文件不保存完整 API Key，仅以 `mk_...i9Y` 表示。

## Tested Base URLs

```text
https://gateway.karpov.cn
https://api.karpov.cn
https://api.gateway.karpov.cn
https://music.karpov.cn
https://gateway-api.karpov.cn
https://tunehub.sayqz.com/api
```

## Karpov Gateway Results

### `https://gateway.karpov.cn/v1/...`

请求示例：

```text
GET /v1/netease/search/songs?q=周杰伦&page=1&page_size=3
Authorization: Bearer mk_...i9Y
```

结果：

```text
HTTP/2 307
location: /login?next=/v1/netease/search/songs...
```

结论：该域名当前更像控制台入口，请求被登录中间件重定向，Bearer API Key 未到达业务接口。

### `https://gateway.karpov.cn/api/v1/...`

请求示例：

```text
GET /api/v1/netease/search/songs?q=周杰伦&page=1&page_size=3
Authorization: Bearer mk_...i9Y
```

结果：

```text
HTTP/2 404
content-type: text/html; charset=utf-8
title: Karpov Console
body: 404 - 页面不存在
```

结论：`/api/v1/...` 不是该 OpenAPI 文档对应的业务路径。

### Candidate Karpov Subdomains

请求到以下候选域名时，使用正常证书校验会失败；使用 `curl -k` 后返回 OpenResty 403：

```text
https://api.karpov.cn/v1/...
https://api.gateway.karpov.cn/v1/...
https://music.karpov.cn/v1/...
https://gateway-api.karpov.cn/v1/...
```

结果：

```text
HTTP/2 403
content-type: text/html
body: 403 Forbidden
server: openresty
```

结论：这些候选域名没有暴露可直接访问的业务 JSON 接口，或需要额外入口配置。

## Old TuneHub Service Results

旧实现中的 base URL 为：

```text
https://tunehub.sayqz.com/api
```

### Method Config Endpoint

请求：

```text
GET /v1/methods/netease/search
```

结果：成功返回旧 TuneHub 的方法下发配置。

```json
{
  "code": 0,
  "success": true,
  "message": "Success",
  "data": {
    "type": "http",
    "method": "GET",
    "url": "https://music.163.com/api/search/get/web",
    "params": {
      "s": "{{keyword}}",
      "type": "1",
      "offset": "{{((page || 1) - 1) * (limit || 20)}}",
      "limit": "{{limit || 20}}"
    },
    "headers": {
      "Referer": "https://music.163.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    "transform": "function(response) { ... }"
  }
}
```

结论：旧服务可访问，但这是旧实现使用的 TuneHub V3 方法下发接口，不是当前 OpenAPI 的新 RESTful 音乐接口。

### Parse Endpoint

请求：

```text
POST /v1/parse
Authorization: Bearer mk_...i9Y
Content-Type: application/json

{"platform":"netease","ids":"186016","quality":"320k"}
```

结果：

```json
{
  "code": 401,
  "message": "Missing API Key",
  "data": null
}
```

使用 `X-API-Key: mk_...i9Y` 时：

```json
{
  "code": 401,
  "message": "Invalid API Key",
  "data": null
}
```

结论：用户提供的 `mk_...i9Y` 不是旧 TuneHub 服务的有效 API Key，或者旧服务不使用同一套鉴权。

## Current Conclusion

- 已确认网页实际调用入口是 `https://gateway.karpov.cn/api/proxy/{provider}/...`。
- 已确认该 proxy 入口使用 `X-API-Key` 鉴权；`Authorization: Bearer ...` 和 query `api_key` 均未通过。
- 实际响应样例已保存到 `docs/api-response-samples.json`。
- `docs/qqmusic-gateway-openapi.yaml` 与 proxy 实际返回存在差异，重构时应以 `docs/api-response-samples.json` 中的实测字段为准，并用 OpenAPI 作为接口范围参考。

## Working Proxy Endpoint

成功请求：

```text
GET /api/proxy/qqmusic/search/songs?q=周杰伦&page=1&page_size=3
Host: gateway.karpov.cn
X-API-Key: mk_...i9Y
Accept: application/json
```

成功响应概要：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "hasMore": true,
    "items": [
      {
        "id": "0039MnYb0qxYhV",
        "title": "晴天",
        "artist": "周杰伦",
        "album": {
          "id": "000MkMni19ClKG",
          "title": "叶惠美",
          "cover": "https://y.qq.com/music/photo_new/T002R300x300M000000MkMni19ClKG_5.jpg"
        },
        "provider": "qqmusic"
      }
    ],
    "page": 1,
    "pageSize": 3,
    "total": 43841
  }
}
```

## Actual Response Notes

- 成功响应的 `code` 是 `200`，不是 OpenAPI 描述里的 `0`。
- 搜索歌曲返回 `data.items`，歌曲字段包括 `durationSeconds`、`publishDate`、`isVipOnly`、`playable`。
- 歌曲直链返回 `data.audio` 与 `data.song`，不是扁平的 `SongURL`。
- 歌词返回 `data.lyric` 与 `data.song`，`lyric` 里有 `lrc`、`qrc`、`roma`、`trans`。
- QQ 音乐专辑详情 `GET /api/proxy/qqmusic/albums/000MkMni19ClKG` 返回了 200，但只有极简数据：`id/provider/title/ext`，没有 songs；这与 OpenAPI 的 `Album.songs` 不一致。
- QQ 音乐歌单详情能返回 `songs`。
- `GET /api/proxy/kugou/search/songs` 返回 `40400 未知的音乐提供商`，虽然 OpenAPI Provider enum 里写了 `kugou`。

## Suggested Next Tests

后续重构前，建议继续补测：

```text
GET /api/proxy/netease/songs/{id}
GET /api/proxy/netease/albums/{albumId}
GET /api/proxy/netease/artists/{artistId}
GET /api/proxy/netease/playlists/{playlistId}
GET /api/proxy/qqmusic/search/artists?q=周杰伦&page=1&page_size=3
GET /api/proxy/qqmusic/search/albums?q=叶惠美&page=1&page_size=3
```
