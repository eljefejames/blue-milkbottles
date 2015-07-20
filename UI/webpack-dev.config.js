var webpack = require("webpack");

module.exports = [
    {
        name: "browser",
        entry: {
            main: './src/main.js'
        },
        output: {
            path: './public',
            filename: 'bundle.js'
        },
        debug: true,
        module: {
            loaders: [
                { test: /\.js$/, loader: 'jsx-loader?harmony' },
                { test: /\.css$/, loader: "style-loader!css-loader" },
                { test: /\.less$/, loader: "style-loader!css-loader!less-loader"},
                { test: /\.(eot|woff|ttf|svg|png|jpg)([\?]?.*)$/, loader: 'url-loader' }
            ]
        },
        externals: {
            // require("jquery") is external and available
            //  on the global var jQuery
            "jquery": "jQuery"
        }
    }
];

