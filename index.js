var gutil = require('gulp-util'),
    path = require('path'),
    through = require('through'),
    uglify = require('uglify-js');

var File = gutil.File,
    PluginError = gutil.PluginError;

module.exports = function(filename, options) {
  'use strict';

  var basePath = '.',
      files = [],
      firstFile = null;

  options = options || {};

  if (typeof filename === 'object') {
    // options given, but no filename
    options = filename;
    filename = null;
  }

  if (options.basePath) {
    basePath = process.cwd() + path.sep + options.basePath;
  }

  function bufferFiles(file) {
    /* jshint validthis: true */
    if (file.isNull()) return;

    if (file.isStream()) {
      return this.emit(
        'error',
        new PluginError('gulp-uglifyjs',  'Streaming not supported')
      );
    }

    if (!firstFile) {
      firstFile = file;

      // Set the filename if one wasn't given
      if (!filename) {
        filename = firstFile.relative;
      }

      // Set the outSourceMap filename if one was requested
      if (options.outSourceMap === true) {
        options.outSourceMap = filename + '.map';
      }
    }

    files.push(path.relative(basePath, file.path));
  }

  function minify() {
    /* jshint validthis: true */
    process.chdir(basePath);

    var uglified = uglify.minify(files, options);

    if (options.outSourceMap) {
      // Manually add source map comment to uglified code
      uglified.code += '\r\n//# sourceMappingURL=' + options.outSourceMap;
    }

    var compressedFile = new File({
      cwd: firstFile.cwd,
      base: firstFile.base,
      path: path.join(firstFile.base, filename),
      contents: new Buffer(uglified.code)
    });

    this.push(compressedFile);

    if (options.outSourceMap) {
      var sourceMap = new File({
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, options.outSourceMap),
        contents: new Buffer(uglified.map)
      });

      this.push(sourceMap);
    }

    this.emit('end');
  }

  return through(bufferFiles, minify);
};
