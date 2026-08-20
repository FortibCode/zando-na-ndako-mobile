const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'react-native/Libraries/Utilities/codegenNativeComponent' ||
      moduleName.endsWith('/codegenNativeComponent') ||
      moduleName === 'codegenNativeComponent'
    ) {
      return {
        filePath: path.resolve(__dirname, 'scripts/codegenNativeComponentShim.js'),
        type: 'sourceFile',
      };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
