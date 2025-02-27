const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');

const config = {
  resolver: {
    alias: {
      components: path.resolve(__dirname, 'components'),
    },
    sourceExts: ['json', 'js', 'jsx', 'ts', 'tsx', 'cjs', 'mjs', 'worklet'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
