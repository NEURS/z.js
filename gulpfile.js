var del			= require('del'),
	gulp		= require('gulp'),
	concat		= require('gulp-concat'),
	uglify		= require('gulp-uglify'),
	replace		= require('gulp-replace'),
	sourcemaps	= require('gulp-sourcemaps'),
	queue		= require('streamqueue'),
	pkg			= require('./package.json');

function compileJavascript(fileName, doSourcemaps, doUglify) {
	return function () {
		var header, body, footer, stream;

		header	= gulp.src(['lib/_header.js', 'lib/_base.js']);
		body	= gulp.src(['lib/*.js', '!lib/_*.js']);
		footer	= gulp.src(['lib/_footer.js']);
		stream	= queue({objectMode: true}, header, body, footer);

		if (doSourcemaps) {
			stream = stream.pipe(sourcemaps.init());
		}

		stream = stream
			.pipe(concat(fileName))
			.pipe(replace(/@DATE/, (new Date).toISOString().replace(/:\d+\.\d+/, '')))
			.pipe(replace(/@VERSION/, pkg.version));

		if (doUglify) {
			stream = stream.pipe(uglify());
		}

		if (doSourcemaps) {
			stream = stream.pipe(sourcemaps.write());
		}

		return stream.pipe(gulp.dest('dist'));
	};
}

gulp.task('clean', function (cb) {
	del(['dist'], cb);
});

gulp.task('build:compile', compileJavascript('z.js', false, false));
gulp.task('build:minify', compileJavascript('z.min.js', false, true));
gulp.task('build:compileWithSourcemaps', compileJavascript('z.sm.js', true, false));
gulp.task('build:minifyWithSourcemaps', compileJavascript('z.sm.min.js', true, true));

gulp.task('build', ['clean', 'build:compile', 'build:minify', 'build:compileWithSourcemaps', 'build:minifyWithSourcemaps']);
