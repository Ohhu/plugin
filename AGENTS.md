# Project Notes

## Project Structure

```text
music-free/
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── QQ_MUSIC_REFACTOR_PLAN.md         # 以 QQ 音乐为基座的重构范围与验证结论
├── src/                              # MusicFree QQ 音乐插件源码
├── types/                            # MusicFree 类型声明
└── docs/
    ├── api-call-results.md           # API 真实调用记录与阻塞结论
    ├── api-response-samples.json     # API 实测响应样例，重构映射时优先参考
    ├── qqmusic-gateway-openapi.yaml  # 主要 API 文档，OpenAPI 3.0.3 结构化规范
    └── 开发文档.html                  # SingleFile 网页快照，仅作离线备份和人工查看兜底
```

## Maintenance

- 发现项目结构、关键文件职责或文档位置发生变化时，及时更新本文件。
- 新增重要目录或约定后，补充到 `Project Structure` 或相关说明中。

## API Documentation

- 查阅接口、参数、响应、schema、认证方式时，优先阅读 `docs/qqmusic-gateway-openapi.yaml`。
- 查阅已验证的真实返回字段时，阅读 `docs/api-response-samples.json` 和 `docs/api-call-results.md`。
- 不要优先读取 `docs/开发文档.html`；该文件包含大量页面样式、脚本和快照噪声，不适合作为 AI 的主要上下文。
