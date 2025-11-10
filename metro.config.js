// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for GLB and GLTF 3D model files
config.resolver.assetExts.push(
  // 3D model formats
  'glb',
  'gltf',
  'bin',
  // Additional texture formats if needed
  'mtl',
  'obj'
);

module.exports = config;
