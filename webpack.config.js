/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'app'),
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'app.bundle.js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.ts|.tsx$/,
        use: 'ts-loader',
        exclude: path.resolve(__dirname, 'node_modules'),
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
