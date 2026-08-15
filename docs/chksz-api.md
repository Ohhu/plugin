# ChKSz API 参考

本分支插件所接入的 ChKSz API 规范快照（来源：ChKSz 官方「AI 智能体接入提示词」）。
字段以官方文档为准，本文件用于插件维护时的离线参考。

## 服务信息

- 基础地址：`https://api.chksz.com`
- 认证：所有业务接口通过 URL 查询参数 `apikey` 传入个人 API Key
- API Key 获取：访问 `https://api.chksz.com/login`，使用邮箱或 LinuxDo 登录，在账户页复制以 `chksz_` 开头的 Key
- 响应格式：除音频转发、纯文本和显式跳转外均为 JSON
- 默认速率限制：每个 Key、用户和 IP 每分钟 20 次
- 默认免费额度：每个账户每日 50 次；结算时区为中国标准时间 UTC+8
- 付费额度：1 LDC 可兑换 10 次请求
- 每个业务响应包含额度响应头：`X-RateLimit-Limit`、`X-Quota-Free-Remaining`、`X-Quota-Paid-Remaining`；限流响应额外包含 `Retry-After`

## 网易云音乐

| 接口 | 说明 |
| --- | --- |
| `GET /api/163_music?id={歌曲ID}&level={音质}&type={返回类型}` | 歌曲解析。`level`：`standard` / `exhigh` / `lossless` / `hires` / `jyeffect` / `sky` / `jymaster`（默认 `jymaster`）；`type`：`json`（完整信息）/ `text`（纯 URL）/ `down`（302 跳转），默认 `json` |
| `GET /api/163_search?keyword={关键词}&limit={数量}&offset={偏移量}` | 搜索，`limit` 默认 30，`offset` 默认 0 |
| `GET /api/163_lyric?id={歌曲ID}` | 歌词，可能包含原文 / 翻译 / 罗马音，对应字段可能为空 |
| `GET /api/163_playlist?id={歌单ID}` | 歌单详情：名称、封面、创建者、曲目数量、歌曲列表；大型歌单响应较大 |

163 系列接口支持 GET 与表单 POST。响应 schema 官方未严格给出，插件侧做了
「常见字段名优先 + 结构兜底」的容错解析（`src/util.ts` 的 `findSongList` / `deepFindHttpUrl`）。

## QQ 音乐点歌

| 接口 | 说明 |
| --- | --- |
| `GET /api/qq_music?msg={关键词}` | 搜索 |
| `GET /api/qq_music?msg={关键词}&n={序号}` | 选择搜索结果中的歌曲 |
| `GET /api/qq_music?msg={关键词}&mid={mid}` | 通过 `mid` 直接解析 |

- 仅接受 GET；`num` / `g` 控制搜索数量（1～50）
- `size` 使用音乐源原生值：`128k` / `320k` / `flac` / `hires` / `master`，默认 `flac`，服务端不做别名或降级映射
- `cookie` 仅为兼容保留，不会被使用或转发
- 搜索响应顶层：`code`、`msg`、`count`、`list`；列表项：`n`、`name`、`singer`、`album`、`pay`、`mid`
- 详情响应顶层含 `url`，可含 `name`、`singer`、`album`、`cover`、`lrc`、`interval`、`mid`、`bitrate`、`format`；无封面时用 QQ 官方专辑封面地址补全
- `type=text` 时详情直接返回播放 URL

## 酷狗音乐点歌

| 接口 | 说明 |
| --- | --- |
| `GET /api/kugou_music?msg={关键词}` | 搜索 |
| `GET /api/kugou_music?msg={关键词}&n={序号}` | 选择搜索结果序号（1～50） |
| `GET /api/kugou_music?msg={关键词}&id={歌曲ID}` | 直接解析搜索结果中的歌曲 ID |

- 仅接受 GET；`size` 原生值同 QQ（默认 `flac`，不做映射）
- 搜索响应顶层：`code`、`msg`、`keyword`、`total`、`list`；列表项固定含 `n`、`id`、`name`、`singer`、`album`、`duration`
- 详情响应含 `url`，固定映射 `name`、`singer`、`album`、`cover`、`lrc`、`interval`、`bitrate`、`format`、`id`
- `/api/kg_stream` 是受限的兼容媒体通道，不应把任意第三方 URL 传给该接口

## 错误处理

| HTTP 状态 | 含义 | 插件行为 |
| --- | --- | --- |
| `400` | 参数缺失或格式错误 | 抛错并转述 `msg`，不重复请求 |
| `401` | 缺少 Key、Key 无效或登录失效 | 提示用户检查 Key / 重新登录 |
| `402` | 免费和付费额度均已用尽 | 提示等待次日重置或兑换 LDC |
| `403` | 用户、Key 或 IP 被封禁 | 转述原因，停止重试 |
| `404` | 路径或资源不存在 | 提示检查接口路径和资源 ID |
| `429` | 超过速率限制 | `Retry-After` ≤ 10s 时等待后重试一次；否则直接抛错 |
| `503` | API 被停用或音乐服务暂不可用 | 提示稍后重试，不高频轮询 |

## 调用规则

1. 优先使用 HTTPS。
2. 不把 API Key 写入日志、公开链接、截图或代码仓库（插件的错误信息已做脱敏）。
3. 不高并发调用音乐服务；批量任务应限制并发并遵守 `Retry-After`。
4. 未知 `/api/*` 路径返回 404，不会扣减额度。
5. 业务失败时以 HTTP 状态和 `msg` 为准，不要只检查 JSON 中是否存在 `data`。
