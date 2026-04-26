const cssInteropBabel = require('react-native-css-interop/babel');

module.exports = function(api) {
  api.cache(true);
  
  const cssInteropConfig = cssInteropBabel();
  
  // Filter plugins and remove duplicates
  // react-native-reanimated/plugin već uključuje react-native-worklets/plugin
  const seenPlugins = new Set();
  const plugins = cssInteropConfig.plugins
    .filter(Boolean)
    .filter(plugin => {
      // Kreiraj jedinstveni identifikator za plugin
      let pluginId;
      if (typeof plugin === 'string') {
        pluginId = plugin;
      } else if (Array.isArray(plugin)) {
        pluginId = plugin[0];
      } else {
        // Za objekte, koristi ime ako postoji
        pluginId = plugin.name || 'unknown';
      }
      
      // Preskoči react-native-reanimated/plugin jer ćemo ga dodati poslednjeg
      if (pluginId && pluginId.includes('react-native-reanimated')) {
        return false;
      }
      
      // Preskoči react-native-worklets/plugin jer ga react-native-reanimated/plugin već uključuje
      if (pluginId && pluginId.includes('react-native-worklets')) {
        return false;
      }
      
      // Proveri da li smo već videli ovaj plugin
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
      'react-native-reanimated/plugin', // Mora biti poslednji, uključuje react-native-worklets/plugin
    ],
  };
};
