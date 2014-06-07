var gulp = require('gulp');
var stylus = require('gulp-stylus');

var EXPRESS_PORT = 9000;
var EXPRESS_ROOT = __dirname;
var LIVERELOAD_PORT = 35729;

function startExpress() {

  var express = require('express');
  var app = express();
  app.use(require('connect-livereload')());
  app.use(express.static(EXPRESS_ROOT));
  app.listen(EXPRESS_PORT);
}

function startLivereload() {

  lr = require('tiny-lr')();
  lr.listen(LIVERELOAD_PORT);
}

// Notifies livereload of changes detected
// by `gulp.watch()`
function notifyLivereload(event) {
  // `gulp.watch()` events provide an absolute path
  // so we need to make it relative to the server root
  var fileName = require('path').relative(EXPRESS_ROOT, event.path);

  lr.changed({
    body: {
      files: [fileName]
    }
  });
}

function buildStylus(event) {

  var fileName;

  if (event) {
    fileName = require('path').relative(EXPRESS_ROOT, event.path);
  }
  else {
    fileName = '*.styl'
  }

  gulp.src(fileName)
    .pipe(stylus())
    .pipe(gulp.dest('./'));


}

gulp.task('build', function () {
  buildStylus()
});

gulp.task('server', function () {

  startExpress();
  startLivereload();
  buildStylus();
  gulp.watch('*.html', notifyLivereload);
  gulp.watch('*.css', notifyLivereload);
  gulp.watch('*.js', notifyLivereload);
  gulp.watch('*.styl', buildStylus);
});
