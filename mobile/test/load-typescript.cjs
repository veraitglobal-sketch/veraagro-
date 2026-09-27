const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');

// Execute the actual application modules without loading native bindings or installing a second runner.
module.exports = function loadTypescript(relativePath, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const nativeRequire = createRequire(filename);
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', source)(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : nativeRequire(id), mod, mod.exports,
  );
  return mod.exports;
};
