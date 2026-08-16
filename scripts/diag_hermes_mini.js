// 最小复现：Hermes Function 构造器支持哪些 async 形态
const fs = require("fs");
const { execFileSync } = require("child_process");
const hermes = "/tmp/hermestest/destroot/bin/hermes";

function makeHarness(funcCode) {
  const literal = JSON.stringify(funcCode);
  return [
    "var packages = { axios: { get: function() { return { then: function(f) { return f({ status: 200, data: {}, headers: {} }); } }; } } };",
    "var _require = function(p) { var pkg = packages[p]; pkg.default = pkg; return pkg; };",
    "function _noop() {}",
    "var _console = { log: _noop, warn: _noop, info: _noop, error: _noop };",
    "var _URLStub = function(u) { this.toString = function() { return u; }; };",
    "var out = { state: null, err: null };",
    "try {",
    "  var _module = { exports: {} };",
    "  var env = { getUserVariables: function() { return {}; }, appVersion: \"0.6.2\" }; env.userVariables = {};",
    "  var fn = Function(\"'use strict';\" + \"return function(require, __musicfree_require, module, exports, console, env, URL, process) {\\n\" + " + literal + " + \"\\n}\")();",
    "  fn(_require, _require, _module, _module.exports, _console, env, _URLStub, { platform: \"android\" });",
    "  out.state = \"OK\";",
    "} catch (e) { out.state = \"FAIL\"; out.err = e && e.message; }",
    "print(JSON.stringify(out));",
  ].join("\n");
}

const cases = {
  "plain arrow":                "const f = () => 1; module.exports = { platform: 'X', f };",
  "async fn declaration":       "async function f() { return 1; } module.exports = { platform: 'X', f };",
  "async fn expression":        "const f = async function() { return 1; }; module.exports = { platform: 'X', f };",
  "async arrow":                "const f = async () => { return 1; }; module.exports = { platform: 'X', f };",
  "async arrow 0-arg":          "const f = async () => 1; module.exports = { platform: 'X', f };",
  "async arrow w param":        "const f = async (x) => { return x; }; module.exports = { platform: 'X', f };",
  "async arrow method value":   "module.exports = { platform: 'X', f: async (x) => x };",
  "async method shorthand":     "module.exports = { platform: 'X', async f(x) { return x; } };",
  "await in async fn":          "async function f() { const v = await Promise.resolve(1); return v; } module.exports = { platform: 'X', f };",
  "for-of await decl":          "async function f(it) { for await (const x of it) {} } module.exports = { platform: 'X', f };",
  "nested async arrow":         "async function f() { const g = async () => 2; return g(); } module.exports = { platform: 'X', f };",
};

for (const [name, code] of Object.entries(cases)) {
  fs.writeFileSync("/tmp/hermestest/_mini.js", makeHarness(code));
  try {
    const out = execFileSync(hermes, ["-w", "/tmp/hermestest/_mini.js"], { stdio: "pipe", encoding: "utf8", timeout: 20000 });
    const line = out.trim().split("\n").pop();
    const ok = line.indexOf('"state":"OK"') >= 0;
    console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : "   -> " + line.slice(0, 160)));
  } catch (e) {
    console.log("ERR  " + name + "  " + String(e.message).slice(0, 120));
  }
}
