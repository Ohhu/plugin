/**
 * 诊断：用 MusicFree App mountPlugin 的同款求值环境装载 dist 插件。
 * 用法：node scripts/diag_app_loader.js [文件...]
 */
const fs = require("fs");
const path = require("path");

const packages = {
  axios: {
    get: () => Promise.resolve({ status: 200, data: {}, headers: {} }),
    isAxiosError: () => false,
  },
};
const _require = (packageName) => {
  let pkg = packages[packageName];
  pkg.default = pkg; // App 原样实现：包名不在白名单 => TypeError
  return pkg;
};
const devLogs = [];
const _console = {};
["log", "warn", "info", "error"].forEach((m) => {
  _console[m] = function () {
    devLogs.push([m].concat(Array.prototype.slice.call(arguments).map(String)));
  };
});

function mount(funcCode, pluginPath) {
  const result = { state: "", name: "", error: null };
  let _instance;
  const _module = { exports: {} };
  try {
    const env = {
      getUserVariables: () => ({}),
      get userVariables() {
        return this.getUserVariables() || {};
      },
      appVersion: "0.6.2",
      os: "android",
      lang: "zh-CN",
    };
    const _process = { platform: "android", version: "0.6.2", env };
    _instance = Function(
      "'use strict';\n" +
        "return function(require, __musicfree_require, module, exports, console, env, URL, process) {\n" +
        funcCode +
        "\n}" +
        "\n"
    )()(_require, _require, _module, _module.exports, _console, env, URL, _process);
    if (_module.exports.default) {
      _instance = _module.exports.default;
    } else {
      _instance = _module.exports;
    }
    if (Array.isArray(_instance.userVariables)) {
      _instance.userVariables = _instance.userVariables.filter(function (it) {
        return it && it.key;
      });
    }
    if (_instance.appVersion) {
      throw new Error("VersionNotMatch, appVersion=" + _instance.appVersion);
    }
  } catch (e) {
    result.error = { message: e && e.message, stack: e && e.stack };
    _instance = (e && e.instance) || { platform: "" };
  }
  result.name = _instance.platform;
  result.state = result.name ? "Mounted" : "Error";
  result.keys = Object.keys(_instance).join(",");
  return result;
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["ChKSzNetease.js", "ChKSzQQ.js", "ChKSzKugou.js"];
const distDir = path.join(__dirname, "..", "dist");
let bad = 0;
files.forEach(function (f) {
  const code = fs.readFileSync(path.join(distDir, f), "utf8");
  const r = mount(code, f);
  console.log(f, "=>", r.state, "| platform:", JSON.stringify(r.name));
  if (r.error) {
    bad++;
    console.log("  ERROR:", r.error.message);
    console.log("  stack:", String(r.error.stack || "").split("\n").slice(0, 5).join("\n    "));
  }
  console.log("  instance keys:", r.keys);
});
console.log("devLogs:", JSON.stringify(devLogs).slice(0, 300) || "(none)");
process.exit(bad ? 1 : 0);
