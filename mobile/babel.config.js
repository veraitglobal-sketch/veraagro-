const cssInteropBabel = require('react-native-css-interop/babel');

module.exports = function (api) {
  api.cache(true);

  const cssInteropConfig = cssInteropBabel();

  // Filter plugins and remove duplicates.
  // react-native-reanimated/plugin already includes react-native-worklets/plugin.
  const seenPlugins = new Set();
  const plugins = cssInteropConfig.plugins
    .filter(Boolean)
    .filter((plugin) => {
      // Unique id per plugin entry
      let pluginId;
      if (typeof plugin === 'string') {
        pluginId = plugin;
      } else if (Array.isArray(plugin)) {
        pluginId = plugin[0];
      } else {
        pluginId = plugin.name || 'unknown';
      }

      // Strip reanimated here; we append it last below
      if (pluginId && pluginId.includes('react-native-reanimated')) {
        return false;
      }

      // Strip worklets; reanimated/plugin bundles it
      if (pluginId && pluginId.includes('react-native-worklets')) {
        return false;
      }

      if (seenPlugins.has(pluginId)) {
        return false;
      }

      seenPlugins.add(pluginId);
      return true;
    });

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...plugins,
      'react-native-reanimated/plugin', // Must be last; includes react-native-worklets/plugin
    ],
  };
};
