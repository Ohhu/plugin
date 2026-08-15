# ChKSz 音源插件（MusicFree）

接入 [ChKSz API](https://api.chksz.com) 的 MusicFree 音源插件，一个 Key 覆盖三个音源：

| 插件文件 | 音源名 | 能力 |
| --- | --- | --- |
| `dist/ChKSzNetease.js` | `ChKSz·网易云` | 搜索、播放解析、歌词、歌单导入 |
| `dist/ChKSzQQ.js` | `ChKSz·QQ音乐` | 搜索、播放解析、歌词 |
| `dist/ChKSzKugou.js` | `ChKSz·酷狗` | 搜索、播放解析、歌词 |

三个插件相互独立，可按需导入；同时启用后在 MusicFree「聚合搜索」中可一并命中。

## 使用方式

### 1. 获取 ChKSz API Key

1. 访问 <https://api.chksz.com/login>，使用邮箱或 LinuxDo 登录；
2. 在账户页复制以 `chksz_` 开头的个人 API Key。

### 2. 导入插件

**方式一：插件订阅（推荐）**

MusicFree → 设置 → 插件订阅 → 添加订阅，填入下面地址，即可一次性安装全部三个插件，后续在订阅内可统一检查更新：

```text
https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSz.json
```

**方式二：单个插件手动导入**

按需导入 `dist/` 下对应的插件文件（或通过你自己的托管地址导入）：

```text
https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzNetease.js   # ChKSz·网易云
https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzQQ.js        # ChKSz·QQ音乐
https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist/ChKSzKugou.js     # ChKSz·酷狗
```

### 3. 填写 API Key

MusicFree → 设置 → 插件管理 → 对应插件 → 用户变量，填写 `ChKSz API Key`。
**每个插件都需要各填一次**（Key 相同）。

未填写 Key 时调用会得到明确的配置指引；Key 只随请求发送给 `api.chksz.com`，不会出现在错误信息或日志里。

## 音质映射

MusicFree 的四档音质映射到 ChKSz 的服务端原生值（服务端不做别名/降级映射）：

| MusicFree | 网易云 `level` | QQ / 酷狗 `size` |
| --- | --- | --- |
| `low` | `standard` | `128k` |
| `standard` | `exhigh` | `320k` |
| `high` | `lossless` | `flac` |
| `super` | `jymaster` | `master` |

## 网易云歌单导入

`ChKSz·网易云` 支持导入网易云歌单，支持纯歌单 ID 和常见链接形式：

```text
3778678
https://music.163.com/#/playlist?id=3778678
```

## 限额与错误行为

- 默认速率限制：每个 Key 每分钟 20 次；免费额度每账户每日 50 次（北京时间次日凌晨重置），1 LDC 可兑换 10 次付费请求。
- `429` 时若 `Retry-After` ≤ 10 秒，插件会等待后重试一次；否则直接提示稍后再试。
- `401 / 402 / 403 / 503` 等错误会转述为可读的中文提示（检查 Key、等待额度重置、兑换 LDC、稍后重试等），不会无限重试。
- 每次搜索、解析、歌词、歌单请求各消耗一次额度，请按需使用。

## 开发

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # parcel 构建 + terser 美化 + 生成订阅 dist/ChKSz.json
npm run smoke       # 本地 stub axios 的冒烟测试（无网络）
```

源码结构：

```text
src/
├── types.ts          # MusicFree 类型补充（userVariables 等）
├── client.ts         # 请求核心：apikey、超时、错误映射、429 重试、Key 脱敏
├── util.ts           # 宽松取值工具（163 系列响应 schema 未严格约定）
├── netease.ts        # 网易云后端（搜索/解析/歌词/歌单）
├── pointsong.ts      # QQ / 酷狗点歌后端（同形态接口的通用实现）
├── ChKSzNetease.ts   # 插件入口：ChKSz·网易云
├── ChKSzQQ.ts        # 插件入口：ChKSz·QQ音乐
└── ChKSzKugou.ts     # 插件入口：ChKSz·酷狗
scripts/
└── make_subscription.js  # 构建后生成 MusicFree 插件订阅 dist/ChKSz.json
```

ChKSz API 规范快照见 [docs/chksz-api.md](docs/chksz-api.md)。

## 相关分支

- `qq-playlist-importer`：QQ 音乐歌单导入插件（仅导入，播放靠音源重定向）
- `ChKSz`：本分支，ChKSz API 三音源插件
