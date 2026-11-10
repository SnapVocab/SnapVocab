# Build a production APK on Expo

After pushing `thanh` and merging it into `master`, run from the mobile repository:

```sh
git switch master
pnpm build:production:android:apk
```

The command checks for uncommitted source changes, runs `git pull --ff-only origin
master`, prints the full source commit, and starts the EAS `production-apk` profile.
It refuses to build a different branch or silently merge divergent local commits.
The build message is `master@<commit>` so the APK's source can be identified on Expo.

Optional flags: `--non-interactive`, `--no-wait`, `--clear-cache`, `--json`.
The separate `build:apk:prod` command remains a local Gradle build.

## Why the previous command failed

EAS CLI normally creates a shallow local Git clone before uploading source. Recent
Git versions reject this clone when the source repository has an active
`core.hooksPath` such as Husky's `.husky/_`. The reported failure is `git clone
--no-checkout --no-hardlinks --depth 1 file:///D:/SnapVocab ... exited with code 128`.

The wrapper sets `EAS_NO_VCS=1` only for the EAS child process, after checking and
updating the Git checkout itself. EAS uploads the current directory without the
failing clone. Husky and Git clone protection stay enabled. `.easignore` excludes
secrets, generated native folders, local logs and QA files from the archive.
The tracked local `debug.log` may remain modified; it is excluded from the upload.

EAS does not automatically pull GitHub when invoked directly. Use this wrapper for
the synchronized production flow. Production values and Firebase file credentials
continue to come from the EAS `production` environment.
