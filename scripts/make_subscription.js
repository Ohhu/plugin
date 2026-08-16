/**
 * 生成 MusicFree 插件订阅文件 dist/ChKSz.json。
 *
 * 订阅格式：{ plugins: [{ name, version, url }] }
 * name/version 从各产物运行时读取（即插件 platform/version）。
 *
 * 插件文件地址：git tag 锁定的 raw.githubusercontent.com 直链（chksz-v<版本>）。
 * - 一律走 raw（origin 直连），不经过 CDN——用户反馈 jsdelivr 更新不及时；
 *   raw 的 Cache-Control 仅 max-age=300，push 后最多 5 分钟生效，无需 purge；
 * - tag 内容不可变，不存在缓存 stale；tag 只能一次性使用，版本号只增、tag 永不复用；
 * - 注意：raw.githubusercontent.com 在部分大陆网络环境下可能不可达（历史上因此用过
 *   jsdelivr，v1.0.4 起按用户要求切回 raw）；临时换基座可用环境变量 CHKSZ_PLUGIN_BASE。
 *
 * 发布流程：升版本 → npm run build → 提交 → 打 tag chksz-v<版本> → push 分支与 tag。
 *
 * 运行：npm run subscribe（npm run build 会自动执行，需先构建产物）
 */
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

function pluginBaseFor(version) {
  return (
    process.env.CHKSZ_PLUGIN_BASE ||
    `https://raw.githubusercontent.com/Ohhu/plugin/chksz-v${version}/dist`
  );
}

const PLUGIN_FILES = ["ChKSzNetease.js", "ChKSzQQ.js", "ChKSzKugou.js"];

function main() {
  const distDir = path.join(__dirname, "..", "dist");
  const plugins = PLUGIN_FILES.map((file) => {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`缺少构建产物 ${file}，请先 npm run build`);
    }
    // 产物是 CJS，require 后读取 platform/version 作为订阅项元数据
    const mod = require(filePath);
    if (!mod || typeof mod.platform !== "string" || !mod.platform) {
      throw new Error(`${file} 未导出有效的 platform`);
    }
    // App 官方实现只读 plugins[].url；name/version 仅为展示与第三方客户端兼容保留
    return {
      name: mod.platform,
      version: mod.version || "",
      url: `${pluginBaseFor(mod.version || "")}/${file}`,
    };
  });

  const versions = Array.from(new Set(plugins.map((p) => p.version)));
  if (versions.length > 1) {
    throw new Error(`三个插件版本不一致：${versions.join(", ")}`);
  }

  const target = path.join(distDir, "ChKSz.json");
  fs.writeFileSync(target, `${JSON.stringify({ plugins }, null, 4)}\n`, "utf8");

  console.log(`已生成订阅文件 ${path.relative(process.cwd(), target)}`);
  plugins.forEach((plugin) => console.log(`  - ${plugin.name} ${plugin.version} -> ${plugin.url}`));
}

main();
