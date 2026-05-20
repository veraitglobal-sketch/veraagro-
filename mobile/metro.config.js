const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Only `shared/` from monorepo — not entire repo root (`..`), which breaks EAS tarball upload.
config.watchFolders = [__dirname, path.resolve(__dirname, '../shared')];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

module.exports = config;
