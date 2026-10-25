const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..');
const androidRoot = path.join(projectRoot, 'android');
const isWindows = process.platform === 'win32';
const envFile = path.join(projectRoot, '.env.production');

if (!fs.existsSync(envFile)) {
  throw new Error('Create .env.production before building the production APK.');
}

const loaded = dotenv.config({ path: envFile, override: true, quiet: true });
if (loaded.error) {
  throw loaded.error;
}
if (process.env.EXPO_PUBLIC_APP_ENV !== 'production') {
  throw new Error('.env.production must set EXPO_PUBLIC_APP_ENV=production.');
}

process.env.NODE_ENV = 'production';
process.env.STRICT_ENV_VALIDATION = '1';
process.env.CI = '1';

function run(command, args, cwd = projectRoot) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
    shell: isWindows,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['exec', 'expo', 'prebuild', '--platform', 'android', '--no-install']);

// Autolinking can retain the development package when switching app variants.
for (const generated of [
  path.join(androidRoot, 'build', 'generated', 'autolinking'),
  path.join(androidRoot, 'app', 'build', 'generated', 'autolinking'),
]) {
  const relative = path.relative(androidRoot, generated);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Refusing to remove generated files outside the Android project.');
  }
  fs.rmSync(generated, { recursive: true, force: true });
}

run(isWindows ? 'gradlew.bat' : './gradlew', [
  ':app:assembleRelease',
  '--no-daemon',
  '--max-workers=2',
], androidRoot);

const apk = path.join(androidRoot, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(apk)) {
  throw new Error('Gradle completed without producing app-release.apk.');
}
console.log(`\nProduction APK: ${apk}`);
