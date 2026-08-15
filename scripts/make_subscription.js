/**
 * 生成 MusicFree 插件订阅文件 dist/ChKSz.json。
 *
 * 订阅格式：{ plugins: [{ name, url }] }
 * name 从各产物运行时读取（即插件 platform），改名后重新构建即可同步。
 *
 * 运行：npm run subscribe（npm run build 会自动执行，需先构建产物）
 */
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

/** 订阅内插件文件的托管地址前缀（GitHub Raw + 分支名） */
const RAW_BASE = "https://raw.githubusercontent.com/Ohhu/plugin/ChKSz/dist";

const PLUGIN_FILES = ["ChKSzNetease.js", "ChKSzQQ.js", "ChKSzKugou.js"];

function main() {
  const distDir = path.join(__dirname, "..", "dist");
  const plugins = PLUGIN_FILES.map((file) => {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`缺少构建产物 ${file}，请先 npm run build`);
    }
    // 产物是 CJS，require 后读取 platform 作为订阅项名称
    const mod = require(filePath);
    if (!mod || typeof mod.platform !== "string" || !mod.platform) {
      throw new Error(`${file} 未导出有效的 platform`);
    }
    return { name: mod.platform, url: `${RAW_BASE}/${file}` };
  });

  const target = path.join(distDir, "ChKSz.json");
  fs.writeFileSync(target, `${JSON.stringify({ plugins }, null, 4)}\n`, "utf8");

  console.log(`已生成订阅文件 ${path.relative(process.cwd(), target)}`);
  plugins.forEach((plugin) => console.log(`  - ${plugin.name} -> ${plugin.url}`));
}

main();
