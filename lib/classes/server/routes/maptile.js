(function() {
  var MapTile, SphericalMercator, fs, glob, mkdirp, path, spawn;

  mkdirp = require('mkdirp');

  path = require('path');

  mkdirp = require('mkdirp');

  fs = require('fs');

  glob = require('glob');

  SphericalMercator = require('sphericalmercator');

  spawn = require('child_process').spawn;

  module.exports = MapTile = (function() {
    function MapTile(xtile) {
      this.xtile = xtile;
    }

    MapTile.prototype.router = function(req, res, next) {
      var express, me, route;
      express = require('express');
      route = express.Router();
      me = this;
      return route.get('/:zoom/:x/:y.:ext(png|geojson)', (function(_this) {
        return function(req, res, next) {
          return _this.onFileRequest(req, res, next);
        };
      })(this));
    };

    MapTile.prototype.onFileRequest = function(req, res, next) {
      var folder, name;
      folder = path.resolve(__dirname, '..', '..', '..', '..', 'tile-cache', req.params.zoom, req.params.x);
      name = path.resolve(folder, req.params.y);
      name = name + '.' + req.params.ext;
      req.folder = folder;
      req.filename = name;
      return fs.exists(name, (function(_this) {
        return function(exists) {
          return _this.onFileExists(exists, req, res, next);
        };
      })(this));
    };

    MapTile.prototype.onFileExists = function(exists, req, res, next) {
      var folder, me, name;
      if (exists) {
        return res.sendFile(req.filename);
      } else {
        folder = path.resolve(__dirname, '..', '..', '..', '..', 'tile-cache', req.params.zoom, req.params.x);
        name = path.resolve(folder, req.params.y);
        name = name + '.' + req.params.ext;
        me = this;
        return mkdirp(folder, function(err) {
          if (err) {

          } else {
            me.xtile.getTile(req.params.zoom, req.params.x, req.params.y, name);
            return res.sendFile(name);
          }
        });
      }
    };

    MapTile.prototype.onTileRequestX = function(req, res, next) {
      var folder, name, tile, xmlfile;
      folder = path.resolve(__dirname, '..', '..', '..', '..', 'tile-cache', req.params.zoom, req.params.x);
      name = path.resolve(folder, req.params.y);
      name = name + '.' + req.params.ext;
      xmlfile = path.resolve(__dirname, '..', '..', '..', '..', 'cartostyle', 'carto.xml');
      tile = spawn('/Users/thomashoffmann/Documents/Projects/node/tualo-carto/tile', [xmlfile, name, req.params.zoom, req.params.x, req.params.y]);
      return tile.on('close', function() {
        return mkdirp(folder, function(err) {
          if (err) {

          } else {
            return res.sendFile(name);
          }
        });
      });
    };

    MapTile.prototype.onTileRequest = function(req, res, next) {
      var map;
      if (this.map) {
        map = this.map;
      } else {
        this.map = new Tile(this.tileSize, this.tileSize);
        this.map.waitingRequest = [];
        this.map.dataSourcePath("/usr/local/lib/mapnik/input/");
        this.map.fontPath("/Users/thomashoffmann/Documents/Projects/node/tualo-carto/fonts");
        this.map.loadMap(this.xmlfile);
        map = this.map;
      }
      if (false) {
        console.log("wait");
        return this.map.waitingRequest.push([null, map, req, res, next]);
      } else {
        return this.onAccuireMap(null, map, req, res, next);
      }
    };

    MapTile.prototype.onMapReadyAgain = function() {
      var args;
      if (this.map.waitingRequest.length > 0) {
        args = this.map.waitingRequest.pop();
        return this.onAccuireMap.apply(this, args);
      }
    };

    MapTile.prototype.onAccuireMap = function(err, map, req, res, next) {
      var folder, name;
      if (err) {
        console.log('error on acquire pool', err);
        return next();
      } else {
        folder = path.resolve(__dirname, '..', '..', '..', '..', 'tile-cache', req.params.zoom, req.params.x);
        name = path.resolve(folder, req.params.y);
        name = name + '.' + req.params.ext;
        return mkdirp(folder, function(err) {
          if (err) {

          } else {
            console.log("here", name);
            map.getTile(parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y), name);
            return res.sendFile(name);
          }
        });
      }
    };

    MapTile.prototype.onRenderMap = function(err, result, req, res, next, im) {
      if (err) {
        console.log('error on render map');
        console.trace(err);
        return next();
      } else {
        return im.encode('png24', (function(_this) {
          return function(err, encoded) {
            return _this.onEncodeMap(err, encoded, req, res, next);
          };
        })(this));
      }
    };

    MapTile.prototype.onEncodeMap = function(err, encoded, req, res, next) {
      var folder, name;
      if (err) {
        console.log('error on encode map', err);
        return next();
      } else {
        res.writeHead(200, {
          'Content-Type': 'image/png'
        });
        res.end(encoded, 'binary');
        folder = path.resolve(__dirname, '..', '..', '..', '..', 'tile-cache', req.params.zoom, req.params.x);
        name = path.resolve(folder, req.params.y);
        name = name + '.' + req.params.ext;
        this.onMapReadyAgain();
        return mkdirp(folder, function(err) {
          if (err) {

          } else {
            return fs.writeFile(name, encoded, function(err) {
              if (err) {
                return console.log('error while write file');
              }
            });
          }
        });
      }
    };

    return MapTile;

  })();

}).call(this);
