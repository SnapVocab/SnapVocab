const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const flags = process.argv.slice(2);
const allowedFlags = new Set(['--no-wait', '--non-interactive', '--clear-cache', '--json']);
if (flags.some(flag => !allowedFlags.has(flag))) {
  throw new Error('Supported flags: --no-wait --non-interactive --clear-cache --json');
}

function git(...args) {
  return execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trimEnd();
}

if (git('branch', '--show-current') !== 'master') {
  throw new Error('Production APKs build from master. Commit/push thanh, merge master, then switch to master.');
}
// A tracked local debug.log is unrelated to the uploaded app and excluded by .easignore.
const changes = git('status', '--porcelain', '--untracked-files=all')
  .split(/\r?\n/)
  .filter(line => line && line.slice(3) !== 'debug.log');
if (changes.length) {
  throw new Error(`Commit or move local changes before building master:\n${changes.join('\n')}`);
}
execFileSync('git', ['pull', '--ff-only', 'origin', 'master'], { cwd: projectRoot, stdio: 'inherit' });
const commit = git('rev-parse', 'HEAD');
console.log(`Production APK source: master@${commit}`);

// Recent Git versions reject EAS's local shallow clone when Husky's core.hooksPath
// is configured. No-VCS mode uploads this already-verified checkout without that
// clone; Git protections and local hooks remain enabled.
const result = spawnSync('npx', [
  '--yes',
  'eas-cli',
  'build',
  '--profile',
  'production-apk',
  '--platform',
  'android',
  '--message',
  `master@${commit}`,
  ...flags,
], {
  cwd: projectRoot,
  env: { ...process.env, EAS_NO_VCS: '1', EXPO_PUBLIC_APP_ENV: 'production' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.error)
  throw result.error;
process.exit(result.status ?? 1);
