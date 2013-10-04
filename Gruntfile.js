'use strict';

module.exports = function(grunt){

    grunt.initConfig({
        uglify: {
          dist: {
            options: {
              sourceMap: function(path) {
                return path + ".map";
              },
            },
            files: {
              'jquery.bend-gauge.min.js': [ 'jquery.bend-gauge.js' ]
            }
          }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['uglify']);

};