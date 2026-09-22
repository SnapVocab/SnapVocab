const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Force zustand to CommonJS on web to prevent `import.meta` syntax error
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'zustand' || moduleName.startsWith('zustand/'))) {
    try {
      return {
        filePath: require.resolve(moduleName),
        type: 'sourceFile',
      };
    }
    catch (e) {}
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
