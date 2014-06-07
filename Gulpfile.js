var gulp = require('gulp');
var stylus = require('gulp-stylus');

var EXPRESS_PORT = 9000;
var EXPRESS_ROOT = __dirname + '/target';
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

  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = require('path').relative(EXPRESS_ROOT, event.path);
  }
  else {
    fileNamePattern = 'src/*.styl'
  }

  gulp.src(fileNamePattern)
    .pipe(stylus())
    .pipe(gulp.dest('./target'));


}

function copyJS(event) {
  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = require('path').relative(EXPRESS_ROOT, event.path);
  }
  else {
    fileNamePattern = 'src/*.js'
  }

  gulp.src(fileNamePattern)
    .pipe(gulp.dest('./target'));
}

function copyHTML(event) {
  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = require('path').relative(EXPRESS_ROOT, event.path);
  }
  else {
    fileNamePattern = 'src/*.html'
  }

  gulp.src(fileNamePattern)
    .pipe(gulp.dest('./target'));
}

gulp.task('build', function () {
  buildStylus()
  copyHTML();
  copyJS();
});

gulp.task('watch', function () {

  /* watchers */

  gulp.watch('target/*.html', notifyLivereload);
  gulp.watch('target/*.css', notifyLivereload);
  gulp.watch('target/*.js', notifyLivereload);

  /* rebuilders */
  gulp.watch('src/*.styl', buildStylus);
  gulp.watch('src/*.js', copyJS);
  gulp.watch('src/*.html', copyHTML);
});

gulp.task('express', function () {
  startExpress();
});

gulp.task('livereload', function () {
  startLivereload();
});

gulp.task('server', ['build', 'express', 'livereload', 'watch']);
