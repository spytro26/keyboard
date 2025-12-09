module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // other plugins (if any) go BEFORE worklets
    'react-native-worklets/plugin'
  ],
};
