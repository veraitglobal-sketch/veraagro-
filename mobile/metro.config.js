const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Only `shared/` from monorepo — not entire repo root (`..`), which breaks EAS tarball upload.
config.watchFolders = [__dirname, path.resolve(__dirname, '../shared')];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

// Browser preview (`expo start --web`): react-native-maps has no web build — use a stub there only.
const mapsWebStub = path.resolve(__dirname, 'lib/web-stubs/react-native-maps.js');
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'sourceFile', filePath: mapsWebStub };
  }
  return defaultResolve ? defaultResolve(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
