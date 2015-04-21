# Vote for Policies Data Website

## About this website

The Vote for Policies Data website is a static website (HTML/CSS/JavaScript) that calls the Vote for Policies API for data.

## Tools used

- [DocPad](https://docpad.org/)
- [Browserify](http://browserify.org/)
- [UglifyJS](http://lisperator.net/uglifyjs/)
- [Watchify](https://github.com/substack/watchify)
- [Node-Sass]https://www.npmjs.com/package/node-sass)

## Setting things up for development

```bash
# Install DocPad module globally
npm install -g docpad

# Install project module dependencies
npm install
```

## Development commands

```bash
# Watch for website changes and start the local DocPad web server
docpad run
```

```bash
# Watch for JavaScript changes and bundle them with Browserify (generates source map)
npm run watch:js
```

```bash
# Watch for scss changes with node-sass ( generates source maps )
npm run watch:scss
```
