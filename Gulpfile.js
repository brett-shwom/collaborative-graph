var gulp = require('gulp');
var stylus = require('gulp-stylus');
var gutil = require("gulp-util");

var EXPRESS_PORT = 9000;
var EXPRESS_ROOT = __dirname + '/target';
var LIVERELOAD_PORT = 35729;

process.chdir(__dirname) //make paths relative to Gulpfile.js not the cwd

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

  gutil.log(gutil.colors.cyan('building stylus'));

  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = event.path;
  }
  else {
    fileNamePattern = './src/*.styl'
  }

  gulp.src(fileNamePattern)
    .pipe(stylus())
    .pipe(gulp.dest('./target'));


}

function copyFontsAndImages(event) {

  gutil.log(gutil.colors.cyan('copying fonts and images'));

  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = event.path;
  }
  else {
    fileNamePattern = './src/**/*.{svg,otf,woff,ttf,eot}'
  }

  gulp.src(fileNamePattern)
    .pipe(gulp.dest('./target'));
}

function copyCSS(event) {

  gutil.log(gutil.colors.cyan('copying css'));

  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = event.path;
  }
  else {
    fileNamePattern = './src/**/*.css'
  }

  gulp.src(fileNamePattern)
    .pipe(gulp.dest('./target'));
}

function copyJS(event) {

  gutil.log(gutil.colors.cyan('copying js'));

  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern = event.path;
  }
  else {
    fileNamePattern = './src/**/*.js'
  }

  gulp.src(fileNamePattern)
    .pipe(gulp.dest('./target'));
}

function copyHTML(event) {

  gutil.log(gutil.colors.cyan('copying html'));

  var fileNamePattern;

  if (event) { //event is passed by gulp.watch. event.path will contain the path to the file that changed
    fileNamePattern =  event.path;
  }
  else {
    fileNamePattern = './src/**/*.html'
  }

  gulp.src(fileNamePattern)
    .pipe(gulp.dest('./target'));
}

gulp.task('build', function () {
  buildStylus()
  copyHTML();
  copyJS();
  copyCSS();
  copyFontsAndImages()
});

gulp.task('watch', function () {

  /* watchers */

  gulp.watch('./target/*.html', notifyLivereload);
  gulp.watch('./target/*.css', notifyLivereload);
  gulp.watch('./target/*.js', notifyLivereload);

  /* rebuilders and copiers */
  gulp.watch('./src/*.styl', buildStylus);
  gulp.watch('./src/**/*.js', copyJS);
  gulp.watch('./src/*.html', copyHTML);
  gulp.watch('./target/*.css', copyCSS);

  /* TODO: watch for changes in fonts */
});

gulp.task('express', function () {
  startExpress();
});

gulp.task('livereload', function () {
  startLivereload();
});

gulp.task('server', ['build', 'express', 'livereload', 'watch']);
