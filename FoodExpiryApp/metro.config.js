// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Add this to make expo-router work properly
config.resolver.sourceExts.push('mjs');

// Add better asset handling for fonts and icons
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Ensure proper asset resolution for iOS
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

module.exports = config; 