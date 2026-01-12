// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Handle SQLite web bundling issues
config.resolver.assetExts.push('wasm');
config.resolver.platforms = ['ios', 'android', 'native'];

// Exclude web platform for expo-sqlite to avoid WASM bundling issues
config.resolver.platformExtensions = ['native.js', 'ios.js', 'android.js', 'js'];

// Suppress InternalBytecode.js errors (Metro bundler noise)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Filter function to check if error should be suppressed
const shouldSuppress = (args) => {
  const errorString = args.map(arg => 
    typeof arg === 'string' ? arg : 
    arg instanceof Error ? arg.message + ' ' + arg.stack : 
    JSON.stringify(arg)
  ).join(' ');
  
  return (
    (errorString.includes('InternalBytecode.js') && errorString.includes('ENOENT')) ||
    (errorString.includes('InternalBytecode.js') && errorString.includes('no such file'))
  );
};

console.error = (...args) => {
  if (!shouldSuppress(args)) {
    originalConsoleError.apply(console, args);
  }
};

console.warn = (...args) => {
  if (!shouldSuppress(args)) {
    originalConsoleWarn.apply(console, args);
  }
};

module.exports = config; 