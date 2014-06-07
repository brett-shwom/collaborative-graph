var gulp = require('gulp');
 
// Let's make things more readable by
// encapsulating each part's setup
// in its own method
function startExpress() {
 
  var express = require('express');
  var app = express();
  app.use(express.static(__dirname));
  app.listen(4000);
}
 
gulp.task('default', function () {
 
  startExpress();
});
