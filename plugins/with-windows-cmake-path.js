const { withAppBuildGradle } = require('expo/config-plugins');

/** Keep generated C++ object paths within Ninja's path limit on Windows. */
function withWindowsCmakePath(config) {
  if (process.platform !== 'win32') {
    return config;
  }

  return withAppBuildGradle(config, (mod) => {
    const stagingDirectory = 'buildStagingDirectory file("$rootDir/.c")';
    if (mod.modResults.contents.includes(stagingDirectory)) {
      return mod;
    }
    if (mod.modResults.language !== 'groovy' || !/android\s*\{/.test(mod.modResults.contents)) {
      throw new Error('Cannot configure the Windows CMake path in android/app/build.gradle');
    }

    mod.modResults.contents = mod.modResults.contents.replace(
      /android\s*\{/,
      `$&\n    // Keep generated C++ object paths below Ninja's Windows path limit.\n    externalNativeBuild {\n        cmake {\n            ${stagingDirectory}\n        }\n    }\n`,
    );
    return mod;
  });
}

module.exports = withWindowsCmakePath;
