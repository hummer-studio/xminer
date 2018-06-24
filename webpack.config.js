'use strict'

    const webpack = require('webpack'),
                _ = require("lodash"),
ExtractTextPlugin = require('extract-text-webpack-plugin'),
HtmlWebpackPlugin = require('html-webpack-plugin'),
HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin'),
HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin'),
ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin'),
 HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')

const isProduction = process.env.NODE_ENV == 'production'
const ROOT_PATH = `${__dirname}/assets/frontend`
const OUTPUT_PATH = `${__dirname}/public`

const devPort = (function randomPort(){
  const n = parseInt(Math.random() * 10000)

  if (n > 1024){
    return n
  }

  return randomPort()
})()

const config = {
  entry: [`${ROOT_PATH}/index.vue`],

  output: {
    path: OUTPUT_PATH,
    publicPath: "/"
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            js: {
              loader: 'babel-loader',
            },
            scss: isProduction ? ExtractTextPlugin.extract({
              use: ['css-loader?minimize', 'autoprefixer-loader?browsers=last 2 versions', 'sass-loader'],
              fallback: 'vue-style-loader'
            }) : ['vue-style-loader', 'css-loader', 'sass-loader', 'autoprefixer-loader?browsers=last 2 versions'],
            sass: isProduction ? ExtractTextPlugin.extract({
              use: ['css-loader?minimize', 'sass-loader', 'autoprefixer-loader?browsers=last 2 versions'],
              fallback: 'vue-style-loader'
            }) : ['vue-style-loader', 'css-loader', 'sass-loader', 'autoprefixer-loader?browsers=last 2 versions'],            
            // less: ExtractTextPlugin.extract({
            //    use: ['css-loader?minimize', 'autoprefixer-loader', 'less-loader'],
            //    fallback: 'vue-style-loader'
            //  }),
            // css: ExtractTextPlugin.extract({
            //    use: ['css-loader', 'autoprefixer-loader', 'less-loader'],
            //    fallback: 'vue-style-loader'
            // })
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },      
      {
        test: /\.(scss|css)$/,
        loader: isProduction ? ExtractTextPlugin.extract({
          use: ['css-loader?minimize', 'autoprefixer-loader?browsers=last 2 versions', 'sass-loader'],
          fallback: 'vue-style-loader'
        }) : ['vue-style-loader', 'css-loader', 'sass-loader', 'autoprefixer-loader?browsers=last 2 versions'],
      },
      {
         test: /\.(gif|jpg|png|woff|woff2|svg|eot|ttf)\??.*$/,
         loader: 'url-loader',
         query: {
           limit: 8192,
           name: "images/[name]-[hash].[ext]"
         }
      },

      // {
      //   test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      //   loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
      // }
    ]
  },

  externals: {
    // "vue": "Vue",
    // "vuex": "Vuex",
    // lodash: "_",
  },
  
  // node: {
  //   fs: 'empty'
  // },

  resolve: {
    extensions: ['.js', '.vue'],
    alias: {
      'vue': 'vue/dist/vue.esm.js'
    //   'vue': 'vue/dist/vue.js'
    }
  },

  devServer: {
    port: devPort,
    historyApiFallback: true,
    noInfo: true,
    headers: { "Access-Control-Allow-Origin": "*" }
  },

  plugins: [new webpack.DefinePlugin({
    isProduction: JSON.stringify(isProduction),
    'process.env.NODE_ENV': `'${process.env.NODE_ENV || "development"}'`,
  })],
  devtool: isProduction ? "cheap-module-source-map" : "cheap-module-eval-source-map"
}


if (isProduction){
  config.output.filename = 'javascripts/bundle-[chunkhash].js'

  config.plugins.push(new ExtractTextPlugin("styles/bundle-[chunkhash].css"))
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false,
      },
      // mangle: {
      //   except: ['$super', '$', 'exports', 'require']
      // },
      minimize: true,
      output: {comments: false}
  }))

  config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin())
}else{
  config.output.filename = 'javascripts/bundle.js'
  config.output.publicPath = `http://localhost:${devPort}/static/dist/`  
}


const assets = [  
  '//buttons.github.io/buttons.js'
]

config.plugins = config.plugins.concat([
  new HtmlWebpackPlugin({
    alwaysWriteToDisk: true,
    filename: '../views/layout/vue.ejs',
    template: './views/template/default.html',
    minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
    } : {},
  }),
  new HtmlWebpackHarddiskPlugin(),
  new HtmlWebpackIncludeAssetsPlugin({
    append: false,
    publicPath: "",
    assets: [].concat(_.chain(assets).map((n) => {
      if (isProduction){
        return n
      }

      return n.replace(/\.min\./, ".")
    }).value())
  }),
  new ScriptExtHtmlWebpackPlugin({
    custom: [
      {
        test: /buttons.js/,
        attribute: ['defer async']
      },
    ]
  }),
  new HtmlReplaceWebpackPlugin([
    {
      //pattern: /(<!--\s*|@@)(css|js|img):([\w-\/]+)(\s*-->)?/g,
      pattern: /<!-- ejs -->/g,
      replacement: "<%- body %>"
    },    
  ])
])

module.exports = config
