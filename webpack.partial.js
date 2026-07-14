const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      timers: require.resolve('timers-browserify'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
};
