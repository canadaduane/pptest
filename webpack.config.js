module.exports = {
  mode: "development",

  entry: {
    bundle: ["./src/index.ts"],
  },

  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
    publicPath: "/",
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },

  optimization: {},
  devtool: false,
};
