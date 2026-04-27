const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Include repo root so `shared/` (imported from `lib/grower-journey-data`, etc.) is watched and resolvable
config.watchFolders = [__dirname, path.resolve(__dirname, '..')];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

module.exports = config;
