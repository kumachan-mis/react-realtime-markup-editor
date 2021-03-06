const path = require('path');

module.exports = {
  entry: path.resolve('sample', 'src', 'index.tsx'),
  target: 'web',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    katex: 'katex',
  },
  output: {
    path: path.resolve('sample', 'dist'),
    filename: '[name].bundle.[chunkhash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        exclude: /katex/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                compileType: 'module',
                localIdentName: '[path][name]__[local]__[hash:base64:5]',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: /katex/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
