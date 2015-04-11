// karma.conf.js
module.exports = function(config) {
    config.set({
        basePath: './',
        frameworks: ['mocha', 'sinon-chai'],
        files: [
            'dist/js/**/*.js',
            'js/**/*.js',
            'test/**/*.js'
        ]
    });
};