(function() {
  var Canvas, Geocoords, MSS, MSSRenderer, NileTile, SphericalMercator, Template, Tile, coffee, fs, mapnik, mapnikPool, mkdirp, path, pool, sass, tilelive;

  path = require('path');

  mkdirp = require('mkdirp');

  fs = require('fs');

  sass = require('node-sass');

  Template = require('tualo-template');

  Canvas = require('canvas');

  NileTile = require('nile-tile');

  Geocoords = require('geocoords');

  mapnik = require('mapnik');

  SphericalMercator = require('sphericalmercator');

  coffee = require('coffee-script');

  MSS = require('../classes/mss');

  MSSRenderer = require('../classes/mssrenderer');

  mapnik.register_default_input_plugins();

  mapnik.register_default_fonts();

  mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-Semibold.ttf');

  mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-BoldItalic.ttf');

  mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-Bold.ttf');

  mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-Italic.ttf');

  mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-SemiboldItalic.ttf');

  mapnikPool = require('mapnik-pool')(mapnik);

  pool = mapnikPool.fromString(fs.readFileSync('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/project.xml', 'utf8'), {
    size: 512,
    bufferSize: 1024
  }, {
    base: '/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto'
  });

  tilelive = require('tilelive');

  require('tilelive-mapnik').registerProtocols(tilelive);

  module.exports = Tile = (function() {
    function Tile(mssfile) {
      var data, name, parser;
      this.basePath = path.join(__dirname, '..', '..', '..', '..', 'styles', 'default');
      this.styleData = require(path.join(this.basePath, 'data'));
      this.mss = {};
      for (name in this.styleData) {
        data = fs.readFileSync(path.join(this.basePath, this.styleData[name].style));
        parser = new MSS(data.toString());
        parser.parse();
        this.apply(this.mss, parser);
      }
    }

    Tile.prototype.getImage = function(data, size) {
      var renderer;
      if (typeof size === 'undefined') {
        size = 256;
      }
      renderer = new MSSRenderer(this.mss, data);
      renderer.render(size);
      return renderer;
    };

    Tile.prototype.apply = function(a, b) {
      var n;
      for (n in b) {
        if (typeof a[n] === 'undefined') {
          a[n] = b[n];
        } else {
          this.apply(a[n], b[n]);
        }
      }
      return a;
    };

    Tile.prototype.queryTile = function(db, zoom, x, y, cb) {
      var bbox, conditions, i, j, k, len, len1, list, name, notNull, options, ref, result, val, valueColumn, valueTable, values, variaticValues, vname, vvalues, zoomindex;
      bbox = Geocoords.from4326To900913(Geocoords.getBbox(zoom, x, y)).slice(0, 4);
      list = [];
      result = {
        Map: {
          lbbox: bbox,
          bbox: bbox
        },
        'roads::outline': [],
        roads: []
      };
      for (name in this.styleData) {
        result[name] = [];
        conditions = [];
        variaticValues = [];
        if (typeof this.styleData[name].variaticValues !== 'undefined') {
          variaticValues = this.styleData[name].variaticValues;
        }
        values = [];
        valueColumn = '';
        valueTable = '';
        notNull = false;
        for (zoomindex = i = 1, ref = zoom; 1 <= ref ? i <= ref : i >= ref; zoomindex = 1 <= ref ? ++i : --i) {
          if (typeof this.styleData[name].queries.zoom[zoomindex] !== 'undefined') {
            if (typeof this.styleData[name].queries.zoom[zoomindex].table === 'string') {
              valueTable = this.styleData[name].queries.zoom[zoomindex].table;
            }
            if (typeof this.styleData[name].queries.zoom[zoomindex].column === 'string') {
              valueColumn = this.styleData[name].queries.zoom[zoomindex].column;
            }
            if (typeof this.styleData[name].queries.zoom[zoomindex].values === 'object') {
              values = this.styleData[name].queries.zoom[zoomindex].values;
            }
            if (typeof this.styleData[name].queries.zoom[zoomindex].notNull === 'boolean') {
              notNull = this.styleData[name].queries.zoom[zoomindex].notNull;
            }
            if (typeof this.styleData[name].queries.zoom[zoomindex].additionalValues === 'object') {
              values = values.concat(this.styleData[name].queries.zoom[zoomindex].additionalValues);
            }
          }
        }
        vvalues = [];
        for (j = 0, len = values.length; j < len; j++) {
          val = values[j];
          vvalues.push(val);
          for (k = 0, len1 = variaticValues.length; k < len1; k++) {
            vname = variaticValues[k];
            vvalues.push(val + vname);
          }
        }
        if (notNull === true) {
          conditions = ['"' + valueColumn + '" is not null'];
        } else {
          conditions = ['"' + valueColumn + '" in (\'' + vvalues.join('\',\'') + '\')'];
        }
        options = {
          name: name,
          valueTable: valueTable,
          conditions: conditions
        };
        list.push(options);
      }
      return this.processQuery(db, bbox, list, 0, cb, result);
    };

    Tile.prototype.processQuery = function(db, bbox, list, index, cb, result) {
      var conditions, me, name, noTolerance, valueTable;
      if (index < list.length) {
        name = list[index].name;
        conditions = list[index].conditions;
        valueTable = list[index].valueTable;
        noTolerance = typeof list[index].noTolerance === 'undefined' ? false : list[index].noTolerance;
        me = this;
        console.log('******');
        return this.qline(db, bbox, valueTable, conditions, noTolerance, function(err, res) {
          console.log('q', err, res);
          if (err) {

          } else {
            result[name + '::outline'] = res;
            result[name] = res;
            if (res.length > 0) {
              result.Map.bbox = JSON.parse(res[0].bbox).coordinates[0];
            }
          }
          return me.processQuery(db, bbox, list, index + 1, cb, result);
        });
      } else {
        return cb(null, result);
      }
    };

    Tile.prototype.qline = function(db, bbox, table, conditions, noTolerance, cb) {
      var box900913, granularity, options, sconditions, sql, template, tolerance;
      if (typeof conditions === 'undefined') {
        conditions = [];
      }
      sconditions = conditions.join(' and ');
      if (sconditions !== '') {
        sconditions = ' and ' + sconditions;
      }
      sql = 'SELECT ST_AsGeoJSON( ST_TransScale( ST_Intersection({way_column}, {srid}) ,{transscale}) ,0 ) AS data, name, highway, "natural", tunnel, water, waterway, building, bridge, z_order, hstore2json(tags) tags, ST_AsGeoJSON( ST_TransScale( {srid} ,{transscale}),0 ) AS  bbox FROM {table} WHERE ST_Intersects(   {way_column}, {srid}  ) {conditions} ORDER BY z_order';
      granularity = 10000;
      tolerance = bbox[2] - bbox[0];
      if (noTolerance) {
        tolerance = -0.02 * (bbox[2] - bbox[0]);
      }
      options = {
        prefix: 'planet_osm',
        way_column: 'way',
        tolerance: tolerance,
        granularity: granularity,
        table: table,
        conditions: sconditions,
        transscale: '' + (-bbox[0]) + ', ' + (-bbox[1]) + ', ' + granularity / (bbox[2] - bbox[0]) + ', ' + granularity / (bbox[3] - bbox[1]) + '',
        srid: "ST_SetSRID('BOX3D(" + (bbox[0] - tolerance) + " " + (bbox[1] - tolerance) + "," + (bbox[2] + tolerance) + " " + (bbox[3] + tolerance) + ")'::box3d,900913) "
      };
      box900913 = Geocoords.from4326To900913(bbox);
      template = new Template(sql);
      sql = template.render(options);
      console.log(sql);
      return db.query(sql, function(err, res) {
        var i, j, len, len1, ref, ref1, result, row;
        console.log('query', err, res);
        if (err) {
          console.log(err);
          error('query', err);
          return cb(error);
        } else {
          console.log('qline', res);
          result = [];
          ref = res.rows;
          for (i = 0, len = ref.length; i < len; i++) {
            row = ref[i];
            row.data = JSON.parse(row.data);
          }
          ref1 = res.rows;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            row = ref1[j];
            if (row.tags === null) {
              row.tags = {};
            } else {
              row.tags = JSON.parse(row.tags);
            }
            if (typeof row.tags.lanes === 'undefined') {
              row.tags.lanes = 1;
            }
            result.push(row);
          }
          return cb(null, result);
        }
      });
    };

    Tile.prototype.rad2deg = function(angle) {
      return angle / (Math.PI / 180.0);
    };

    Tile.prototype.projectMercToLat = function(v) {
      return this.rad2deg(Math.atan(Math.sinh(v)));
    };

    Tile.prototype.router = function(req, res) {
      var express, me, route;
      express = require('express');
      route = express.Router();
      me = this;
      route.get('/:zoom/:x/:y.:ext', function(req, res) {
        var file, folder, merc;
        if (false) {
          tilelive.load('mapnik:///Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/project.xml', function(err, source) {
            if (err) {
              return console.log(err);
            } else {
              console.log(parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y));
              return source.getTile(parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y), function(err, tile, headers) {
                console.log('getTile', err, tile, headers);
                res.writeHead(200, {
                  'Content-Type': 'image/png'
                });
                return res.end(tile, 'binary');
              });
            }
          });
        }
        if (true) {
          merc = new SphericalMercator({
            size: 512
          });
          console.log(parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y));
          pool.acquire(function(err, map) {
            var im;
            console.log(parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y));
            if (err) {
              console.log('mapnik renderer', err);
              return res.end();
            } else {
              map.extent = merc.bbox(parseInt(req.params.x), parseInt(req.params.y), parseInt(req.params.zoom), false, '900913');
              im = new mapnik.Image(map.width, map.height);
              return map.render(im, {
                scale: 1,
                scale_denominator: 1
              }, function(err, result) {
                if (err) {
                  console.log('mapnik renderer', err);
                  return res.end();
                } else {
                  return im.encode('png24', function(err, encoded) {
                    res.writeHead(200, {
                      'Content-Type': 'image/png'
                    });
                    return res.end(encoded, 'binary');
                  });
                }
              });
            }
          });
        }
        if (false) {
          console.log('get ', req.params.zoom, req.params.x, req.params.y);
          me.queryTile(req.gisdb, req.params.zoom, req.params.x, req.params.y, function(err, dbResult) {
            var canvas, niletile;
            canvas = new Canvas(256, 256);
            niletile = new NileTile;
            console.log(dbResult);
            niletile.setGeoJSON(dbResult);
            niletile.on('ready', function(png) {
              res.writeHead(200, {
                'Content-Type': 'image/png'
              });
              return res.end(buf, 'binary');
            });
            return niletile.render(canvas, req.params.x, req.params.y, req.params.zoom);
          });
        }
        if (false) {
          folder = path.join(__dirname, '..', '..', '..', '..', 'tile-cache', path.basename(me.basePath), req.params.zoom, req.params.x);
          file = path.join(folder, req.params.y + '.png');
          return fs.exists(file, function(exists) {
            if (exists) {
              return fs.readFile(file, function(err, buf) {
                if (err) {
                  return res.send("Error");
                } else {
                  res.writeHead(200, {
                    'Content-Type': 'image/png'
                  });
                  return res.end(buf, 'binary');
                }
              });
            } else {
              return me.queryTile(req.gisdb, req.params.zoom, req.params.x, req.params.y, function(err, dbResult) {
                var renderer;
                renderer = me.getImage(dbResult, 512);
                return renderer.toBuffer(function(err, buf) {
                  res.writeHead(200, {
                    'Content-Type': 'image/png'
                  });
                  res.end(buf, 'binary');
                  return mkdirp(folder, function(err) {
                    if (err) {

                    } else {
                      return fs.writeFile(file, buf, function(err) {
                        if (err) {
                          return error('route error', err);
                        }
                      });
                    }
                  });
                });
              });
            }
          });
        }
      });
      return route;
    };

    return Tile;

  })();

}).call(this);
