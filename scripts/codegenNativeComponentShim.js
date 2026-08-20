const React = require('react');
const { View } = require('react-native-web');

/**
 * Fallback shim for `codegenNativeComponent` on React Native Web.
 * Native components generated via codegenNativeComponent are not natively supported on web.
 * This shim prevents `TypeError: (0, _reactNativeWebDistIndex.codegenNativeComponent) is not a function`
 * by returning a standard View component.
 */
function codegenNativeComponent(componentName, _options) {
  const DummyComponent = React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref });
  });
  DummyComponent.displayName = componentName || 'NativeComponentShim';
  return DummyComponent;
}

module.exports = codegenNativeComponent;
module.exports.default = codegenNativeComponent;
module.exports.__esModule = true;
