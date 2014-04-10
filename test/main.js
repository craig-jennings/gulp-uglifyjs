/* jshint strict: false */
/* global before, after, describe, it */
var Buffer = require('buffer').Buffer,
    chai = require('chai'),
    File = require('gulp-util').File,
    fs = require('fs'),
    path = require('path'),
    uglify = require('../');

require('mocha');

var should = chai.should();

var FILE0_CONTENTS = 'function test1() { var asdf = 3; }';
var FILE0_UGLIFIED = 'function test1(){}';

var FILE1_CONTENTS = 'function test2() { var qwerty = \'keyboard\'; return qwerty; }';

var FILE0_1_UGLIFIED = 'function test1(){}function test2(){var t="keyboard";return t}';
var FILE0_1_UNMANGLED = 'function test1(){}function test2(){var qwerty=\"keyboard\";return qwerty}';

function testFiles(stream, contents, expectedUglified, expectedPath) {
  it('should uglify one or several files', function(done) {
    stream.on('data', function(compressedFile){
      should.exist(compressedFile);
      should.exist(compressedFile.path);
      should.exist(compressedFile.relative);
      should.exist(compressedFile.contents);

      var newFilePath = path.resolve(compressedFile.path);
      var expectedFilePath = path.resolve(expectedPath);
      newFilePath.should.equal(expectedFilePath);

      String(compressedFile.contents).should.equal(expectedUglified);
      Buffer.isBuffer(compressedFile.contents).should.equal(true);
      done();
    });

    contents.forEach(function(contents, i) {
      stream.write(new File({
        cwd: '.',
        base: '.',
        path: 'test/file' + i.toString() + '.js',
        contents: new Buffer(contents)
      }));
    });

    stream.end();
  });
}

describe('gulp-uglifyjs', function() {
  before(function() {
    fs.writeFileSync('test/file0.js', FILE0_CONTENTS);
    fs.writeFileSync('test/file1.js', FILE1_CONTENTS);
  });

  after(function() {
    fs.unlinkSync('test/file0.js');
    fs.unlinkSync('test/file1.js');
  });

  describe('uglify()', function() {
    testFiles(uglify(), [FILE0_CONTENTS], FILE0_UGLIFIED, 'test/file0.js');
    testFiles(uglify(), [FILE0_CONTENTS, FILE1_CONTENTS], FILE0_1_UGLIFIED, 'test/file0.js');
  });

  describe('uglify(filename)', function() {
    testFiles(uglify('test.js'), [FILE0_CONTENTS], FILE0_UGLIFIED, 'test.js');
    testFiles(uglify('test.js'), [FILE0_CONTENTS, FILE1_CONTENTS], FILE0_1_UGLIFIED, 'test.js');
  });

  describe('uglify(options)', function() {
    testFiles(uglify({ mangle: false }), [FILE0_CONTENTS], FILE0_UGLIFIED, 'test/file0.js');
    testFiles(uglify({ mangle: false }), [FILE0_CONTENTS, FILE1_CONTENTS], FILE0_1_UNMANGLED, 'test/file0.js');
  });

  describe('uglify(filename, options)', function() {
    testFiles(uglify('test.js', { mangle: false }), [FILE0_CONTENTS], FILE0_UGLIFIED, 'test.js');
    testFiles(uglify('test.js', { mangle: false }), [FILE0_CONTENTS, FILE1_CONTENTS], FILE0_1_UNMANGLED, 'test.js');
  });
});