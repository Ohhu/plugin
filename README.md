# MusicFree Plugin

MusicFree 插件

## 功能

- 聚合搜索 (音乐/专辑/艺术家)
- 多音质
- 排行榜
- 歌词支持
- 导入歌单

## 使用

复制下面的链接，在 MusicFree 中导入插件：
```
https://raw.githubusercontent.com/Ohhu/plugin/TuneHub/dist/Tunehub.js
```

## 构建

```bash
npm install
npm run build
```

## 项目结构

```
src/
├── index.ts       # 入口
├── constants.ts   # 常量
├── native.ts      # API 原生功能
└── simulated.ts   # 模拟功能
types/             # 类型定义
dist/              # 构建输出
```