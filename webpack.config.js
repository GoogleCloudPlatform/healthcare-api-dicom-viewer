const path = require('path');

module.exports = {
  mode: 'development',
  entry: ['babel-polyfill', './src/index.js'],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.worker\.js$/,
        use: [
          'worker-loader',
        ],
      },
    ],
  },
  node: {fs: 'empty'},
};
