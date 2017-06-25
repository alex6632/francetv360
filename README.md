# francetv360
France•TV360 est un outil nouveau qui vous permet d'explorer l'information de manière ludique


Requirements
------------
* composer
* npm
* Gulp.js
* Sass

Install
-------
On first install run this command in the web/ folder :
```shell
composer install
```

then, back to base and run :
```shell
npm install
```
_More details see: [package.json](/package.json)_

Compile prod
-------
// Run compilation prod task.
```shell
gulp dist-prod
```

Compile dev
-------
// If you want to collaborate and run watch in the dev environment :
```shell
gulp web-dev
gulp watch
```
_More tasks see: [Gruntfile.js](/Gruntfile.js)_


Optionnal
---------
* [LiveReload](http://livereload.com/extensions/) extention

When the project is compiled, the page will now refresh automatically.

CSS/SASS
--------
_cf:_ [web/scss/README.md](/web/scss/README.md)