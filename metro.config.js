// Metro bundler config. NativeWind під'єднується сюди, щоб Metro обробляв
// наш global.css і перетворював Tailwind-класи на стилі React Native.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
