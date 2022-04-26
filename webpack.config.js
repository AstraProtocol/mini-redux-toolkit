const webpack = require('webpack');
const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');

const _developmentMode = false;
const defaultConfig = (props, developmentMode) =>
  Object.assign({}, props, {
    devtool: developmentMode ? 'source-map' : 'eval',
    mode: developmentMode ? 'development' : 'production',
    optimization: {
      minimizer: [developmentMode ? null : new TerserJSPlugin({})].filter(Boolean),
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
  });

const UMDConfig = {
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    library: 'mini-redux-toolkit',
    libraryTarget: 'umd',
    filename: 'index.js',
    globalObject: 'this',
  },
};
module.exports = [defaultConfig(UMDConfig, _developmentMode)];
