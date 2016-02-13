var gulp = require('gulp');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var server = require('gulp-develop-server');
var bs = require('browser-sync');

// babelで変換
gulp.task('js', function() {
	return gulp.src('es6/**/*.js')
		.pipe(plumber())
		.pipe(babel())
		.pipe(gulp.dest('./dist/'));
});

// サーバー立ち上げおよび監視
gulp.task('default', ['js', 'server:start'], function() {
	gulp.watch('es6/**/*.js', ['server:restart']);
});

// サーバー立ち上げ
gulp.task('server:start', function() {
	server.listen({path: './dist/app.js'}, function(error) {
		if (!error) bs({
			notify: false,
			proxy: 'http://localhost:3000',
			port: 8000
		});
	});
});

// サーバーリスタート
gulp.task('server:restart', ['js'], function() {
	return gulp.src('es6/**/*.js')
		.pipe(server());
});
