const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');

const MOBILE_ROOT = path.join(__dirname, '..');

function transpileFile(filename) {
  return ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
}

// Execute application modules without native bindings; transpile relative .ts/.tsx imports.
module.exports = function loadTypescript(relativePath, mocks = {}, cache = new Map()) {
  const filename = path.resolve(MOBILE_ROOT, relativePath);
  if (cache.has(filename)) return cache.get(filename);

  const source = transpileFile(filename);
  const nativeRequire = createRequire(filename);
  const mod = { exports: {} };

  const req = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('.')) {
      const base = path.resolve(path.dirname(filename), id);
      const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`];
      for (const candidate of candidates) {
        if (!fs.existsSync(candidate)) continue;
        if (candidate.endsWith('.ts') || candidate.endsWith('.tsx')) {
          const rel = path.relative(MOBILE_ROOT, candidate);
          return loadTypescript(rel, mocks, cache);
        }
        return nativeRequire(candidate);
      }
    }
    return nativeRequire(id);
  };

  new Function('require', 'module', 'exports', source)(req, mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
};
