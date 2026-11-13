const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Gradle (IDE Java/Gradle extensions) churns android/**/build inside node_modules; Metro's watcher crashes with ENOENT on it.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /node_modules[/\\].*[/\\]android[/\\](.*[/\\])?(build|\.gradle|\.cxx)[/\\].*/,
];

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
    catch {}
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
