const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// react-strict-dom doesn't have a valid main field.
config.resolver.unstable_enablePackageExports = true;

// your metro modifications
module.exports = withUniwindConfig(config, {
	// relative path to your global.css file (from previous step)
	cssEntryFile: './global.css',
	// (optional) path where we gonna auto-generate typings
	// defaults to project's root
	dtsFile: './uniwind-types.d.ts',
	debug: true
});
