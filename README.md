# QQ MusicFree Plugin

基于 `gateway.karpov.cn/api/proxy/qqmusic` 的 MusicFree QQ 音乐插件。

## 功能

- 搜索歌曲
- 获取歌曲详情
- 获取播放直链
- 获取歌词
- 导入 QQ 音乐歌单
- 获取歌单歌曲
- 基于歌曲搜索结果模拟专辑搜索、专辑详情和歌手作品

## 暂不实现

- 聚合搜索
- 网易云 / 酷狗 / 酷我
- 排行榜
- 原生专辑歌曲列表

## 构建

```bash
npm install
npm run build
```

## 项目结构

```text
src/
├── constants.ts   # API 常量与音质映射
├── index.ts       # MusicFree 插件入口
├── native.ts      # QQ 音乐代理 API 原生能力
├── simulated.ts   # 基于歌曲搜索的模拟能力
├── types.ts       # API 响应类型
└── utils.ts       # 请求、映射与排序工具
types/             # MusicFree 类型声明
docs/              # API 实测记录与文档
```
