/**
 * 生成 MusicFree 插件订阅文件 dist/ChKSz.json。
 *
 * 订阅格式：{ plugins: [{ name, version, url }] }
 * name/version 从各产物运行时读取（即插件 platform/version）。
 *
 * 插件文件地址：git tag 锁定的 jsDelivr 直链（chksz-v<版本>）。
 * - raw.githubusercontent.com 大陆常被阻断/劫持；
 * - jsdelivr 分支引用（@ChKSz）在多边缘节点间会新旧行 flipping（已复现）；
 * - tag 内容寻址永不 stale；但 tag 只能一次性使用——删除后重打同名 tag，
 *   CDN 会残留被删 tag 的历史缓存（已复现），因此版本号只增、tag 永不复用。
 *
 * 发布流程：升版本 → npm run build → 提交 → 打 tag chksz-v<版本> →
 * push 分支与 tag → purge 订阅 JSON 与各插件文件。
 *
 * 运行：npm run subscribe（npm run build 会自动执行，需先构建产物）
 */
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

function pluginBaseFor(version) {
  return (
    process.env.CHKSZ_PLUGIN_BASE ||
    `https://cdn.jsdelivr.net/gh/Ohhu/plugin@chksz-v${version}/dist`
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
