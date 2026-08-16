// 在与 App 同版本的 Hermes REPL 中执行 mountPlugin 复刻
const fs = require("fs");
const { execFileSync } = require("child_process");
const hermes = "/tmp/hermestest/destroot/bin/hermes";

function makeHarness(funcCode, label) {
  const literal = JSON.stringify(funcCode);
  return [
    "var packages = {",
    "  axios: { get: function() { return { then: function(f) { return f({ status: 200, data: {}, headers: {} }); } }; } },",
    "};",
    "var _require = function(packageName) {",
    "  var pkg = packages[packageName];",
    "  pkg.default = pkg;",
    "  return pkg;",
    "};",
    "function _noop() {}",
    "var _console = { log: _noop, warn: _noop, info: _noop, error: _noop };",
    "var _URLStub = function(url) { this.toString = function() { return url; }; };",
    "function mountPlugin(funcCode, pluginPath) {",
    "  var state, instance, err = null;",
    "  var _module = { exports: {} };",
    "  try {",
    "    var env = {",
    "      getUserVariables: function() { return {}; },",
    "      appVersion: \"0.6.2\", os: \"android\", lang: \"zh-CN\"",
    "    };",
    "    env.userVariables = {};",
    "    var _process = { platform: \"android\", version: \"0.6.2\", env: env };",
    "    instance = Function(",
    "      \"'use strict';\" +",
    "      \"return function(require, __musicfree_require, module, exports, console, env, URL, process) {\\n\" +",
    "      funcCode +",
    "      \"\\n}\"",
    "    )()(_require, _require, _module, _module.exports, _console, env, _URLStub, _process);",
    "    if (_module.exports.default) instance = _module.exports.default;",
    "    else instance = _module.exports;",
    "    if (Array.isArray(instance.userVariables)) {",
    "      instance.userVariables = instance.userVariables.filter(function(it) { return it && it.key; });",
    "    }",
    "    state = \"Mounted\";",
    "  } catch (e) {",
    "    err = e && e.message ? e.message + \" | \" + (e.stack || \"\") : String(e);",
    "    instance = { platform: \"\" };",
    "    state = \"Error\";",
    "  }",
    "  return { state: state, platform: instance.platform, err: err };",
    "}",
    "var r = mountPlugin(" + literal + ", " + JSON.stringify(label) + ");",
    "print(JSON.stringify(r));",
  ].join("\n");
}

const files = process.argv.slice(2);
let bad = 0;
for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  const tmp = "/tmp/hermestest/_hrun_" + f.replace(/[^a-zA-Z0-9]/g, "_") + ".js";
  fs.writeFileSync(tmp, makeHarness(code, f));
  try {
    const out = execFileSync(hermes, ["-w", tmp], { stdio: "pipe", encoding: "utf8", timeout: 30000 });
    const line = out.trim().split("\n").filter(function(l){return l.indexOf('state')>=0;}).pop() || out.trim().slice(-300) || "(no output)";
    const ok = line.indexOf('"state":"Mounted"') >= 0;
    if (!ok) bad++;
    console.log((ok ? "HERMES-RUN-MOUNT-OK   " : "HERMES-RUN-MOUNT-FAIL ") + f);
    if (!ok) console.log("   " + line.slice(0, 500));
  } catch (e) {
    bad++;
    console.log("HERMES-RUN-ERROR " + f);
    console.log(String((e.stderr || "") + (e.stdout || "") + e.message).slice(0, 900));
  }
}
process.exit(bad ? 1 : 0);
