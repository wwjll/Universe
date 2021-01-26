/**
 * mode develpment production
 * entry 入口文件
 * output path filename 打包输出路径
 * devtool source-map
 * module rules loader
 * plugins 插件
 * devSeerver 开发服务器
 */


const { resolve, join } = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopywebpackPlugin = require('copy-webpack-plugin')
// Cesium源码所在目录
const cesiumSource = 'node_modules/cesium/Source';
const assets = 'src/Assets';

module.exports = {
    mode: 'development',
    entry: resolve(__dirname, './src/index.js'),
    output: {
        path: resolve(__dirname, 'build'),
        filename: 'build[hash:16].js',
        //需要编译Cesium中的多行字符串 
        sourcePrefix: ''
    },
    module: {
        rules: [ 
            {
                // 删除 cesium pragmas
                test: /\.js$/,
                    enforce: 'pre',
                    include: resolve(__dirname, cesiumSource),
                    use: [{
                        loader: 'strip-pragma-loader',
                        options: {
                            pragmas: {
                                debug: false
                            }
                        }
                    }]
            },
            { 
                test: /\.css$/, use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
                use: [ 'url-loader' ]
            }
        ]
    },
    resolve: {
        alias: {
            cesium: join(__dirname, cesiumSource)
        }
    },
    amd: {
        //允许Cesium兼容 webpack的 require 方式 
        toUrlUndefined: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            title: 'Hot Module Replacement',
        }),
        // 拷贝 three 到静态目录 
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/three/build', 
                to: 'three/build' 
            }]
        }),
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/three/examples', 
                to: 'three/examples' 
            }]
        }),
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/three/src', 
                to: 'three/src' 
            }]
        }),
        // 拷贝Cesium 资源、控价、web worker到静态目录 
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/cesium/Source/Assets', 
                to: 'cesium/Assets' 
            }]
        }),
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/cesium/Source/Widgets', 
                to: 'cesium/Widgets' 
            }]
        }),
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/cesium/Source/Workers', 
                to: 'cesium/Workers' 
            }]
        }),
        new CopywebpackPlugin({
            patterns: [{ 
                from: 'node_modules/cesium/Source/Workers', 
                to: 'cesium/Workers' 
            }]
        }),
        new webpack.DefinePlugin({
            //Cesium载入静态的资源的相对路径
            CESIUM_BASE_URL: JSON.stringify('./cesium')
        })
    ],
    devtool: 'source-map',
    devServer: {
        inline: false,
        port: 3333,
        contentBase: resolve(__dirname, "build"),
        hot: true
    }
}