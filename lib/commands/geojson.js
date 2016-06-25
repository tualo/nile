(function() {
  var Command, GISDB, GeoJSON, Geocoords, Server, Template, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  Template = require('tualo-template');

  Server = require('../classes/server/server');

  GISDB = require('../classes/server/classes/gisdb');

  Geocoords = require('geocoords');

  module.exports = GeoJSON = (function(superClass) {
    extend(GeoJSON, superClass);

    function GeoJSON() {
      return GeoJSON.__super__.constructor.apply(this, arguments);
    }

    GeoJSON.commandName = 'geojson';

    GeoJSON.commandArgs = [];

    GeoJSON.commandShortDescription = 'export geojson';

    GeoJSON.options = [
      {
        parameter: "--hint",
        description: "show hints"
      }, {
        parameter: "--zoom [zoom]",
        description: "enable use mml"
      }, {
        parameter: "--x [x]",
        description: "enable use mml"
      }, {
        parameter: "--y [y]",
        description: "enable use mml"
      }, {
        parameter: "-m, --mml [mml]",
        description: "enable use mml"
      }, {
        parameter: "-i, --id [id]",
        description: "mml id"
      }, {
        parameter: "-c, --csv [csv]",
        description: "enable the csv export"
      }, {
        parameter: "-d, --debug [debug]",
        description: "enable the debug mode"
      }, {
        parameter: "-n, --dbname [dbname]",
        description: "postgis db"
      }, {
        parameter: "-f, --field [field]",
        description: "id field"
      }, {
        parameter: "-t, --filter [filter]",
        description: "filter"
      }
    ];

    GeoJSON.prototype.hint = function() {
      return console.log("exporting geojson.\n\nsample:\n  bin/nile geojson \\\n  --dbname nile \\\n  --field \"tags::hstore->'de:amtlicher_gemeindeschluessel'\" \\\n  --filter \"tags::hstore->'de:amtlicher_gemeindeschluessel' like '03%'\"> \\\n  export.geojson && topojson --properties -- export.geojson > \\\n  export.topojson && mv export.topojson ~/\n");
    };

    GeoJSON.prototype.action = function(options, args) {
      var gisdbOptions, me;
      if (options.hint) {
        return this.hint();
      } else {
        me = this;
        gisdbOptions = {
          database: options.dbname || 'nile',
          port: 5432
        };
        this.db = new GISDB(gisdbOptions);
        return this.db.connect(function() {
          var item, j, k, len, len1, mml, mmlSource, pathname, ref, ref1, results, results1;
          if (options.mml) {
            pathname = path.dirname(options.mml);
            mmlSource = fs.readFileSync(options.mml);
            mml = JSON.parse(mmlSource);
            me.bbox = Geocoords.getBbox(options.zoom, options.x, options.y);
            if (options.id) {
              ref = mml.Layer;
              results = [];
              for (j = 0, len = ref.length; j < len; j++) {
                item = ref[j];
                if (item.id === options.id) {
                  results.push(me.exportMML(item));
                }
              }
              return results;
            } else {
              ref1 = mml.Layer;
              results1 = [];
              for (k = 0, len1 = ref1.length; k < len1; k++) {
                item = ref1[k];
                results1.push(me.exportMML(item, true));
              }
              return results1;
            }
          } else {
            return this.exportJSON(options, args);
          }
        });
      }
    };

    GeoJSON.prototype.exportMML = function(item, keep) {
      var me, sql, srid, tolerance;
      if (item.type === 'posgis') {
        me = this;
        tolerance = 0;
        console.log(this.bbox);
        srid = "ST_SetSRID('BOX(" + (this.bbox[0] - tolerance) + " " + (this.bbox[1] - tolerance) + "," + (this.bbox[2] + tolerance) + " " + (this.bbox[3] + tolerance) + ")'::box2d,4326) ";
        sql = 'select ST_ASGeoJSON(' + item.Datasource.geometry_field + ') j,* from ' + item.Datasource.table + ' ';
        sql += ' where ST_Intersects(   ' + item.Datasource.geometry_field + ', ' + srid + '  )';
        console.log('###', sql);
        return this.db.query(sql + ' limit 10', function(err, res) {
          var features, fld, i, j, k, len, len1, properties, ref, ref1;
          if (err) {
            console.log(err);
          } else {
            features = [];
            ref = res.rows;
            for (j = 0, len = ref.length; j < len; j++) {
              i = ref[j];
              if (i.j) {
                properties = {};
                ref1 = res.fields;
                for (k = 0, len1 = ref1.length; k < len1; k++) {
                  fld = ref1[k];
                  if (fld.name !== item.Datasource.geometry_field && fld.name !== 'j') {
                    properties[fld.name] = i[fld.name];
                  }
                }
                features.push({
                  "type": "Feature",
                  "geometry": JSON.parse(i.j),
                  "properties": properties
                });
              }
            }
            fs.writeFileSync(item.id + '.output.geojson', 'module.exports = ' + JSON.stringify({
              "type": "FeatureCollection",
              "features": features
            }, null, 0));
          }
          if (keep === true) {
            return me.db.disconnect();
          }
        });
      }
    };

    GeoJSON.prototype.exportJSON = function(options, args) {
      var sql;
      sql = 'select\n  name,\n  source,\n  ST_ASGeoJSON(w) j\nfrom ( select name,';
      sql += options.field || 'tags::hstore->\'de:amtlicher_gemeindeschluessel\'';
      sql += ' source,   ST_Union(way) w from planet_osm_roads where ';
      sql += options.filter || 'tags::hstore->\'de:amtlicher_gemeindeschluessel\' like \'03______\'';
      sql += ' group by ';
      sql += options.field || 'tags::hstore->\'de:amtlicher_gemeindeschluessel\'';
      sql += ',name ) as G limit 100000 ';
      return this.db.query(sql, function(err, res) {
        var csv, i, j, len, output, ref, row;
        output = true;
        if (err) {
          console.error(err);
          output = false;
        }
        if (output) {
          process.stdout.write('{"type": "FeatureCollection", "features": [');
          i = 0;
          csv = "";
          ref = res.rows;
          for (j = 0, len = ref.length; j < len; j++) {
            row = ref[j];
            csv += '"' + row.name + '","' + row.source + '"' + "\n";
            if (i !== 0) {
              process.stdout.write(',');
            }
            process.stdout.write('{"type": "Feature","geometry":' + row.j + ',"properties":{"name": "' + row.name.replace(/ä/g, '&auml;').replace(/ö/g, '&ouml;').replace(/ü/g, '&uuml;').replace(/Ä/g, '&Auml;').replace(/Ö/g, '&Ouml;').replace(/ß/g, '&szlig;').replace(/Ü/g, '&Uuml;') + '"},"id":"' + row.source + '"}');
            i++;
          }
          if (options.csv) {
            fs.writeFileSync(options.csv, csv);
          }
          process.stdout.write(']}');
        }
        return this.db.disconnect();
      });
    };

    GeoJSON.prototype.actionX = function(options, args) {
      var db, gisdbOptions;
      if (options.help) {
        this.help();
      }
      gisdbOptions = {
        database: options.dbname || 'nile',
        port: 5432
      };
      db = new GISDB(gisdbOptions);
      return db.connect(function() {
        var sql;
        sql = 'select\n  name,\n  tags::hstore->\'de:amtlicher_gemeindeschluessel\' source,\n  ST_ASGeoJSON( ST_MakePolygon(way) ) j\nfrom\n  planet_osm_roads\nwhere tags::hstore->\'de:amtlicher_gemeindeschluessel\' <> \'\'\nand way && ST_MakeEnvelope(6.6545841239,51.2954150799,11.3132037822,55.0573747014, 4326)\nand st_isclosed(way)\n\nunion\n\nselect\n  name,\n  tags::hstore->\'de:amtlicher_gemeindeschluessel\' source,\n  ST_ASGeoJSON( way ) j\nfrom\n  planet_osm_roads\nwhere tags::hstore->\'de:amtlicher_gemeindeschluessel\' = \'03453007\'\n\nlimit 100000';
        sql = 'select\n  name,\n  source,\n  ST_ASGeoJSON(w) j\nfrom (\nselect\n  name,\n  tags::hstore->\'de:amtlicher_gemeindeschluessel\' source,\n  ST_Union(way) w\nfrom\n  planet_osm_roads\nwhere tags::hstore->\'de:amtlicher_gemeindeschluessel\' in (\'11000000\',\n\'13059002\',\n\'13076159\',\n\'03241001\',\n\'03251047\',\n\'03352005\',\n\'03357002\',\n\'03361012\',\n\'03401000\',\n\'03403000\',\n\'03405000\',\n\'03451001\',\n\'03451002\',\n\'03451004\',\n\'03451005\',\n\'03451007\',\n\'03451008\',\n\'03452001\',\n\'03453001\',\n\'03453002\',\n\'03453003\',\n\'03453004\',\n\'03453005\',\n\'03453006\',\n\'03453007\',\n\'03453008\',\n\'03453009\',\n\'03453010\',\n\'03453011\',\n\'03453012\',\n\'03453013\',\n\'03455007\',\n\'03455014\',\n\'03455015\',\n\'03455020\',\n\'03455021\',\n\'03455025\',\n\'03455026\',\n\'03455027\',\n\'03457010\',\n\'03458001\',\n\'03458002\',\n\'03458003\',\n\'03458004\',\n\'03458005\',\n\'03458006\',\n\'03458007\',\n\'03458008\',\n\'03458009\',\n\'03458010\',\n\'03458011\',\n\'03458012\',\n\'03458013\',\n\'03458014\',\n\'03458015\',\n\'03460001\',\n\'03460002\',\n\'03460003\',\n\'03460004\',\n\'03460005\',\n\'03460006\',\n\'03460007\',\n\'03460008\',\n\'03460009\',\n\'03460010\',\n\'03461001\',\n\'03461002\',\n\'03461003\',\n\'03461004\',\n\'03461005\',\n\'03461006\',\n\'03461007\',\n\'03461008\',\n\'03461009\',\n\'04011000\',\n\'04012000\',\n\'05513000\',\n\'06438009\',\n\'07141006\')\ngroup by tags::hstore->\'de:amtlicher_gemeindeschluessel\',name\n) as G\nlimit 100000';
        return db.query(sql, function(err, res) {
          var i, j, len, output, ref, row;
          output = true;
          if (err) {
            console.error(err);
            output = false;
          }
          if (output) {
            process.stdout.write('{"type": "FeatureCollection", "features": [');
            i = 0;
            ref = res.rows;
            for (j = 0, len = ref.length; j < len; j++) {
              row = ref[j];
              if (i !== 0) {
                process.stdout.write(',');
              }
              process.stdout.write('{"type": "Feature","geometry":' + row.j + ',"properties":{"name": "' + row.name + '"},"id":"' + row.source + '"}');
              i++;
            }
            process.stdout.write(']}');
          }
          return db.disconnect();
        });
      });
    };

    return GeoJSON;

  })(Command);

}).call(this);
