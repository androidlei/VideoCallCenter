var gulp = require('gulp'),
    browserify = require('browserify')
    source = require('vinyl-source-stream')
    tsify = require('tsify')
    sourcemaps = require('gulp-sourcemaps')
    buffer = require('vinyl-buffer')
    watchify = require('watchify')
    gutil = require('gulp-util')
    browserSync = require('browser-sync')
    babelpolyfill = require('babel-plugin-transform-runtime');
var reload = browserSync.reload;

var paths = {
  pages: ['src/*.html'],
}

var watchedBrowserify = watchify(browserify({
  basedir: '.',
  debug: true,
  entries: ['src/main.ts'],
  cache: {},
  packageCache: {}
}).plugin(tsify));

gulp.task('copyHtml', function() {
  return copyHtml();
});

function copyHtml() {
  return gulp.src(paths.pages)
              .pipe(gulp.dest('dist'))
              .pipe(reload({stream: true}));
}

function bundle() {
  return watchedBrowserify
         .transform('babelify', {
           presets: ['es2015'],
           extensions: ['.ts']
         })
         .bundle()
         .pipe(source('bundle.js'))
         .pipe(buffer())
         .pipe(sourcemaps.init({loadMaps: true}))
         .pipe(gulp.dest('dist'))
         .pipe(reload({stream: true}));
}

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: './',
      index: 'dist/index.html'
    },
    port: 8080
  });
});

gulp.task('default', ['copyHtml', 'serve'], bundle);

gulp.watch(paths.pages, ['copyHtml']);

watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);
