/**
 * Web-only stand-in for react-native-maps (no web support). Lets `expo start --web`
 * bundle the app for browser previews; native builds keep the real module.
 */
const React = require('react');
const { View, Text } = require('react-native');

function MapView(props) {
  return React.createElement(
    View,
    { style: [{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F1E4' }, props.style] },
    React.createElement(Text, { style: { color: '#2D5A27', fontSize: 12 } }, 'Map preview is available in the mobile app'),
  );
}
const Noop = () => null;

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Noop;
module.exports.Polygon = Noop;
module.exports.Polyline = Noop;
module.exports.Circle = Noop;
module.exports.Callout = Noop;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
