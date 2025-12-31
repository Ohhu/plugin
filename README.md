# MusicFree Plugin

MusicFree 插件

## 功能

- 聚合搜索 (音乐/专辑/艺术家)
- 多音质
- 排行榜
- 歌词支持
- 导入歌单

## 使用

下载地址：
```
https://raw.githubusercontent.com/Ohhu/plugin/TuneHub/dist/Tunehub.js
```

下载 `dist/Tunehub.js` 导入 MusicFree

## 构建

```bash
npm install
npm run build              # 构建并混淆代码
npm run build:no-obfuscate # 仅构建，不混淆
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