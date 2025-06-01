// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Handle SQLite web bundling issues
config.resolver.assetExts.push('wasm');
config.resolver.platforms = ['ios', 'android', 'native'];

// Exclude web platform for expo-sqlite to avoid WASM bundling issues
config.resolver.platformExtensions = ['native.js', 'ios.js', 'android.js', 'js'];

module.exports = config; 