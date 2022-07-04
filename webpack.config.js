const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";
const path = require("path");
const BrotliWebpackPlugin = require("brotli-webpack-plugin");

/**
 * Should source maps be generated alongside your production bundle? This will
 * expose your raw source code, so it's disabled by default.
 */
const sourceMapsInProduction = true;

/**
 * Should we run Babel on builds? This will transpile your bundle in order to
 * work on your target browsers (see the `browserslist` property in your
 * package.json), but will impact bundle size and build speed.
 */
const useBabel = true;

/**
 * Should we run Babel on development builds? If set to `false`, only production
 * builds will be transpiled. If you're only testing in modern browsers and
 * don't need transpiling in development, it is recommended to keep this
 * disabled as it will greatly speed up your builds.
 */
const useBabelInDevelopment = false;

/**
 * One or more stylesheets to compile and add to the beginning of the bundle. By
 * default, SASS, SCSS and CSS files are supported. The order of this array is
 * important, as the order of outputted styles will match. Svelte component
 * styles will always appear last in the bundle.
 */
const stylesheets = [];

// Point the client to the server; default is for development mode
const relmServer = process.env.RELM_SERVER ?? "http://localhost:3000";

module.exports = {
  // Production or Development mode
  mode,

  /**
   * The "entry" is where webpack starts looking for imports and other parts of the
   * app. It produces a bundle.js file (or in our case, multiple chunked bundles
   * due to our needing async wasm support).
   */
  entry: {
    bundle: [
      "./src/index.ts",
    ],
  },

  /**
   * When building for production, follow the output pattern to generate bundled js.
   */
  output: {
    filename: "[name].js",
    chunkFilename: "[name].[id].[contenthash].js",
    path: __dirname + "/dist",
    publicPath: "/",
  },

  /**
   * Direct webpack to understand our app's internal patterns for imports. For example,
   * we use the `~/` prefix to denote the "root" of the project.
   */
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
    extensions: [".mjs", ".js", ".ts", ".svelte"],
    mainFields: ["browser", "module", "main"],
  },

  /**
   * Modules are like plugins, but for specific file types.
   */
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      // Include source maps from node modules
      // {
      //   test: /\.js$/,
      //   enforce: "pre",
      //   use: ["source-map-loader"],
      // },
    ],
  },

  optimization: {
    minimizer: [],

    splitChunks: {
      chunks: "async",
    },

    concatenateModules: false,
  },
  devtool: prod && !sourceMapsInProduction ? false : "source-map",
};

// Load path mapping from tsconfig
const tsconfigPath = path.resolve(__dirname, "tsconfig.json");
const tsconfig = require("fs").existsSync(tsconfigPath)
  ? require(tsconfigPath)
  : {};
if ("compilerOptions" in tsconfig && "paths" in tsconfig.compilerOptions) {
  const aliases = tsconfig.compilerOptions.paths;
  for (const alias in aliases) {
    const paths = aliases[alias].map((p) => path.resolve(__dirname, p));

    if (!(alias in module.exports.resolve.alias) && paths.length) {
      module.exports.resolve.alias[alias] = paths.length > 1 ? paths : paths[0];
    }
  }
}

// These options should only apply to production builds
if (prod) {
  // Clean the build directory for production builds
  // module.exports.plugins.push(new CleanWebpackPlugin());

  // Compress assets
  // module.exports.plugins.push(
  //   new BrotliWebpackPlugin({
  //     test: /\.(js|css|html|svg|png|jpg|wasm)$/,
  //     threshold: 10240,
  //     minRatio: 0.8,
  //   })
  // );

  // Minify and treeshake JS
  module.exports.optimization.minimizer.push(
    new TerserPlugin({
      sourceMap: sourceMapsInProduction,
      extractComments: false,
      terserOptions: {
        keep_classnames: true,
        keep_fnames: true,
      },
    })
  );
}

// Add babel if enabled
if (useBabel && (prod || useBabelInDevelopment)) {
  module.exports.module.rules.unshift({
    test: /\.(?:svelte|m?js)$/,
    include: [path.resolve(__dirname, "src")],
    use: {
      loader: "babel-loader",
      options: {
        sourceType: "unambiguous",
        presets: ["@babel/preset-env"],
        plugins: ["@babel/plugin-transform-runtime"],
      },
    },
  });
}
