/**
 * Sign release builds with a real keystore instead of the debug one.
 *
 * `android/` is generated and gitignored, so hand-editing `app/build.gradle`
 * after a prebuild lasts exactly until the next prebuild wipes it. This does
 * the same edit as a mod, so it is reapplied every time the folder is written.
 *
 * The credentials are deliberately NOT in this repo. They come from Gradle
 * properties, which belong in `~/.gradle/gradle.properties`:
 *
 *   PRODUCTIVELY_STORE_FILE=/Users/you/keystores/productively-release.jks
 *   PRODUCTIVELY_STORE_PASSWORD=...
 *   PRODUCTIVELY_KEY_ALIAS=productively
 *   PRODUCTIVELY_KEY_PASSWORD=...
 *
 * When those are absent -- which is the case for anyone who clones this -- the
 * release build falls back to the debug keystore exactly as the Expo template
 * does, so `assembleRelease` still works for a contributor. It just produces an
 * APK that cannot be shipped, which is the correct outcome: only the holder of
 * the keystore can publish a build Play Store will accept as an update.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const HAS_KEYSTORE = "project.hasProperty('PRODUCTIVELY_STORE_FILE')";

/**
 * The template's own line, comment included. It occurs exactly once and only in
 * the release build type, which is why the comment is part of the anchor: a
 * looser `release { ... signingConfigs.debug` match instead catches the
 * `release` entry this plugin adds to `signingConfigs` and then runs forward
 * into the *debug* build type, silently swapping which build gets which key.
 */
const RELEASE_LINE = [
  '// see https://reactnative.dev/docs/signed-apk-android.',
  '            signingConfig signingConfigs.debug',
].join('\n');

const RELEASE_SIGNING_CONFIG = [
  '        release {',
  `            if (${HAS_KEYSTORE}) {`,
  '                storeFile file(PRODUCTIVELY_STORE_FILE)',
  '                storePassword PRODUCTIVELY_STORE_PASSWORD',
  '                keyAlias PRODUCTIVELY_KEY_ALIAS',
  '                keyPassword PRODUCTIVELY_KEY_PASSWORD',
  '            }',
  '        }',
  '',
].join('\n');

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (contents.includes('PRODUCTIVELY_STORE_FILE')) return cfg;

    // Step 1 rewrites the release build type. It runs first so the block added
    // in step 2 cannot become a candidate anchor for it.
    if (contents.split(RELEASE_LINE).length !== 2) {
      throw new Error(
        'withReleaseSigning: expected exactly one release-build-type signingConfigs.debug'
      );
    }
    contents = contents.replace(
      RELEASE_LINE,
      [
        '// Signed with the real keystore when its Gradle properties are present.',
        `            signingConfig ${HAS_KEYSTORE} ? signingConfigs.release : signingConfigs.debug`,
      ].join('\n')
    );

    // Step 2 adds the `release` entry beside the template's `debug` one.
    const anchor = contents.match(/(\n\s*signingConfigs\s*\{\n)/);
    if (!anchor) {
      throw new Error('withReleaseSigning: no signingConfigs block in app/build.gradle');
    }
    contents = contents.replace(anchor[1], `${anchor[1]}${RELEASE_SIGNING_CONFIG}`);

    cfg.modResults.contents = contents;
    return cfg;
  });
};
