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

var isWindows = process.platform === 'win32';

var FILE0_CONTENTS = 'function test1() { var asdf = 3; }',
    FILE0_UGLIFIED = 'function test1(){}',
    FILE0_UGLIFIED_WITH_SM = 'function test1(){}\r\n//# sourceMappingURL=test' + path.sep + 'file0.js.map';

var FILE1_CONTENTS = 'function test2() { var qwerty = \'keyboard\'; return qwerty; }';

var FILE0_1_UGLIFIED = 'function test1(){}function test2(){var t="keyboard";return t}',
    FILE0_1_UGLIFIED_WITH_SM = 'function test1(){}function test2(){var t=\"keyboard\";return t}\r\n//# sourceMappingURL=test' + path.sep + 'file0.js.map',
    FILE0_1_UNMANGLED = 'function test1(){}function test2(){var qwerty=\"keyboard\";return qwerty}';

var FILE0_SOURCE_MAP,
    FILE0_1_SOURCE_MAP;

if (isWindows) {
  FILE0_SOURCE_MAP = '{"version":3,"file":"test\\\\file0.js.map","sources":["test\\\\file0.js"],"names":["test1"],"mappings":"AAAA,QAASA"}';
  FILE0_1_SOURCE_MAP = '{"version":3,"file":"test\\\\file0.js.map","sources":["test\\\\file0.js","test\\\\file1.js"],"names":["test1","test2","qwerty"],"mappings":"AAAA,QAASA,UCAT,QAASC,SAAU,GAAIC,GAAS,UAAY,OAAOA"}';
} else {
  FILE0_SOURCE_MAP = '{"version":3,"file":"test/file0.js.map","sources":["test/file0.js"],"names":["test1"],"mappings":"AAAA,QAASA"}';
  FILE0_1_SOURCE_MAP = '{"version":3,"file":"test/file0.js.map","sources":["test/file0.js","test/file1.js"],"names":["test1","test2","qwerty"],"mappings":"AAAA,QAASA,UCAT,QAASC,SAAU,GAAIC,GAAS,UAAY,OAAOA"}';
}

function testFiles(stream, contents, expectedContents, expectedPaths) {
  it('should uglify one or several files', function(done) {
    var index = 0;

    stream.on('data', function(uglifiedFile){
      should.exist(uglifiedFile);
      should.exist(uglifiedFile.path);
      should.exist(uglifiedFile.relative);
      should.exist(uglifiedFile.contents);

      var newFilePath = path.resolve(uglifiedFile.path);
      var expectedFilePath = path.resolve(expectedPaths[index]);
      newFilePath.should.equal(expectedFilePath);

      String(uglifiedFile.contents).should.equal(expectedContents[index]);
      Buffer.isBuffer(uglifiedFile.contents).should.equal(true);

      index++;
    });

    stream.on('end', function() {
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
    fs.writeFileSync('test/file0.js', [FILE0_CONTENTS]);
    fs.writeFileSync('test/file1.js', [FILE1_CONTENTS]);
  });

  after(function() {
    fs.unlinkSync('test/file0.js');
    fs.unlinkSync('test/file1.js');
  });

  describe('uglify()', function() {
    testFiles(uglify(), [FILE0_CONTENTS], [FILE0_UGLIFIED], ['test/file0.js']);
    testFiles(uglify(), [FILE0_CONTENTS, FILE1_CONTENTS], [FILE0_1_UGLIFIED], ['test/file0.js']);
  });

  describe('uglify(filename)', function() {
    testFiles(uglify('test.js'), [FILE0_CONTENTS], [FILE0_UGLIFIED], ['test.js']);
    testFiles(uglify('test.js'), [FILE0_CONTENTS, FILE1_CONTENTS], [FILE0_1_UGLIFIED], ['test.js']);
  });

  describe('uglify(options)', function() {
    testFiles(uglify({ mangle: false }), [FILE0_CONTENTS], [FILE0_UGLIFIED], ['test/file0.js']);
    testFiles(uglify({ mangle: false }), [FILE0_CONTENTS, FILE1_CONTENTS], [FILE0_1_UNMANGLED], ['test/file0.js']);
  });

  describe('uglify(filename, options)', function() {
    testFiles(uglify('test.js', { mangle: false }), [FILE0_CONTENTS], [FILE0_UGLIFIED], ['test.js']);
    testFiles(uglify('test.js', { mangle: false }), [FILE0_CONTENTS, FILE1_CONTENTS], [FILE0_1_UNMANGLED], ['test.js']);
  });

  describe('uglify(options) with sourcemap', function() {
    testFiles(
      uglify({ outSourceMap: true }),
      [FILE0_CONTENTS],
      [FILE0_UGLIFIED_WITH_SM, FILE0_SOURCE_MAP],
      ['test/file0.js', 'test/file0.js.map']
    );

    testFiles(
      uglify({ outSourceMap: true }),
      [FILE0_CONTENTS, FILE1_CONTENTS],
      [FILE0_1_UGLIFIED_WITH_SM, FILE0_1_SOURCE_MAP],
      ['test/file0.js', 'test/file0.js.map']
    );
  });
});