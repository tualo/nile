(function() {
  var Command, ExportStreets, GISDB, Geocoords, Server, Template, bigint, fs, md5, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  Template = require('tualo-template');

  Server = require('../classes/server/server');

  GISDB = require('../classes/server/classes/gisdb');

  Geocoords = require('geocoords');

  md5 = require('md5');

  bigint = require('big-integer');

  module.exports = ExportStreets = (function(superClass) {
    extend(ExportStreets, superClass);

    function ExportStreets() {
      return ExportStreets.__super__.constructor.apply(this, arguments);
    }

    ExportStreets.commandName = 'exportstreets';

    ExportStreets.commandArgs = [];

    ExportStreets.commandShortDescription = 'export streets and zip codes';

    ExportStreets.options = [
      {
        parameter: "--hint",
        description: "show hints"
      }, {
        parameter: "-s, --sql",
        description: "enable the sql export"
      }, {
        parameter: "-d, --debug [debug]",
        description: "enable the debug mode"
      }, {
        parameter: "-n, --dbname [dbname]",
        description: "postgis db"
      }
    ];

    ExportStreets.prototype.hint = function() {
      return console.log("exporting streets and zip codes'.\n\nsample:\n  bin/nile geojson \\\n  --dbname nile \\\n  > \\\n  export.csv\n");
    };

    ExportStreets.prototype.action = function(options, args) {
      var me;
      if (options.hint) {
        return this.hint();
      } else {
        me = this;
        return this["export"](options, args);
      }
    };

    ExportStreets.prototype["export"] = function(options, args) {
      var db, gisdbOptions, me;
      me = this;
      me.sqlexport = options.sql;
      gisdbOptions = {
        database: options.dbname || 'nile',
        port: 5432
      };
      db = new GISDB(gisdbOptions);
      return db.connect(function() {
        var sql;
        sql = 'select name, way, tags::hstore->\'postal_code\' as zipcode, tags from planet_osm_polygon where boundary = \'postal_code\'';
        return db.query(sql, function(err, res) {
          var output;
          output = true;
          if (err) {
            console.error(err);
            output = false;
          }
          me.rows = res.rows;
          db.disconnect();
          if (me.sqlexport) {

          } else {
            process.stdout.write(['id', 'strasse', 'zipcode', 'amtlicher_gemeindeschluessel', 'regionalschluessel', 'ort', 'landkreis', 'kreis_regionalschluessel'].join(';'));
            process.stdout.write("\n");
          }
          return me.exportStreets(options, 0);
        });
      });
    };

    ExportStreets.prototype.exportStreets = function(options, index) {
      var db, gisdbOptions, me, zipcode;
      me = this;
      if (index < me.rows.length) {
        zipcode = me.rows[index].zipcode;
        gisdbOptions = {
          database: options.dbname || 'nile',
          port: 5432
        };
        db = new GISDB(gisdbOptions);
        return db.connect(function() {
          var sql, sql_alt;
          sql = 'select\n  z.street as strasse,\n  z.zipcode,\n  z.gemeinde as ort,\n  z.ortsteil,\n  gemeinden_tags::hstore->\'de:amtlicher_gemeindeschluessel\' as amtlicher_gemeindeschluessel,\n  gemeinden_tags::hstore->\'de:regionalschluessel\' as regionalschluessel,\n  kreis.name landkreis,\n  kreis.tags::hstore->\'de:regionalschluessel\' as kreis_regionalschluessel\nfrom\n (\n  select\n    y.id,\n    y.street,\n    y.zipcode,\n    y.gemeinde,\n    y.gemeinden_tags,\n    y.ortsteil,\n    y.way\n  from (\n    select\n\n      x.id,\n      x.street,\n      x.zipcode,\n      x.gemeinde,\n      x.gemeinden_tags,\n      ot.name as ortsteil,\n      x.way\n    from\n      (\n        select\n          roads.id,\n          roads.street,\n          roads.zipcode,\n          roads.way,\n          gemeinden.name as gemeinde,\n          gemeinden.tags as gemeinden_tags\n        from\n          (select * from plz_roads where zipcode=\'{zipcode}\') as roads\n          INNER JOIN\n          (\n            select tags,name,way from planet_osm_polygon where exist(tags,\'de:amtlicher_gemeindeschluessel\')\n            and length(tags::hstore->\'de:amtlicher_gemeindeschluessel\')= 8\n          ) as gemeinden\n\n          ON ST_Intersects(roads.way,gemeinden.way)\n      ) x\n      LEFT OUTER  JOIN\n        ( select name,tags,way from planet_osm_polygon where boundary=\'administrative\' and admin_level=\'10\' ) as ot\n      ON ST_Intersects(x.way,ot.way)\n  ) y\n  ) z\n\n  LEFT OUTER  JOIN\n\n  (\n  select tags,name,way from planet_osm_polygon where exist(tags,\'de:amtlicher_gemeindeschluessel\')\n  and length(tags::hstore->\'de:amtlicher_gemeindeschluessel\')= 5\n  ) as kreis\n  ON ST_Intersects(z.way,kreis.way) and\n  substring(z.gemeinden_tags::hstore->\'de:amtlicher_gemeindeschluessel\',1,5) = kreis.tags::hstore->\'de:amtlicher_gemeindeschluessel\'\n\ngroup by\n\nstreet,\nzipcode,\ngemeinde,\nortsteil,\nlandkreis,\namtlicher_gemeindeschluessel,\nregionalschluessel,\ngemeinden_tags::hstore->\'de:amtlicher_gemeindeschluessel\',\ngemeinden_tags::hstore->\'de:regionalschluessel\',\nkreis.tags::hstore->\'de:regionalschluessel\'\n';
          sql_alt = 'select\nmax(id) id,\nstrasse,\nzipcode,\namtlicher_gemeindeschluessel,\nregionalschluessel,\nort,\nlandkreis,\nkreis_regionalschluessel\nfrom (\n\n  select\n    roads.osm_id as id,\n    roads.name as strasse,\n    plz.zipcode,\n    gemeinden.tags::hstore->\'de:amtlicher_gemeindeschluessel\' as amtlicher_gemeindeschluessel,\n    gemeinden.tags::hstore->\'de:regionalschluessel\' as regionalschluessel,\n    gemeinden.name as ort,\n    kreis.name landkreis,\n    kreis.tags::hstore->\'de:regionalschluessel\' as kreis_regionalschluessel\n  from\n\n    (select way,tags::hstore->\'postal_code\' as zipcode from planet_osm_polygon\n    where boundary = \'postal_code\' and tags::hstore->\'postal_code\' = \'{zipcode}\'\n    ) as plz\n    INNER JOIN\n\n    (\n    select tags,name,way from planet_osm_polygon where exist(tags,\'de:amtlicher_gemeindeschluessel\')\n    and length(tags::hstore->\'de:amtlicher_gemeindeschluessel\')= 8\n    ) as gemeinden\n    ON ST_Intersects(plz.way,gemeinden.way)\n\n    LEFT OUTER  JOIN\n\n    (\n    select tags,name,way from planet_osm_polygon where exist(tags,\'de:amtlicher_gemeindeschluessel\')\n    and length(tags::hstore->\'de:amtlicher_gemeindeschluessel\')= 5\n    ) as kreis\n    ON ST_Intersects(plz.way,kreis.way) and\n    substring(gemeinden.tags::hstore->\'de:amtlicher_gemeindeschluessel\',1,5) = kreis.tags::hstore->\'de:amtlicher_gemeindeschluessel\'\n\n    INNER JOIN\n    (select * from planet_osm_line where highway in (\n      \'secondary\',\n      \'primary\',\n      \'service\',\n      \'steps\',\n      \'residential\',\n      \'living_street\',\n      \'footway\'\n    ) and name <> \'\' ) as roads\n    ON ST_Intersects(plz.way,roads.way)\n\n  union\n\n  select\n    roads.osm_id as id,\n    roads.name as strasse,\n    plz.zipcode,\n    gemeinden.tags::hstore->\'de:amtlicher_gemeindeschluessel\' as amtlicher_gemeindeschluessel,\n    gemeinden.tags::hstore->\'de:regionalschluessel\' as regionalschluessel,\n    gemeinden.name as ort,\n    kreis.name landkreis,\n    kreis.tags::hstore->\'de:regionalschluessel\' as kreis_regionalschluessel\n  from\n\n    (select way,tags::hstore->\'postal_code\' as zipcode from planet_osm_polygon\n    where boundary = \'postal_code\' and tags::hstore->\'postal_code\' = \'{zipcode}\'\n    ) as plz\n    INNER JOIN\n\n    (\n    select tags,name,way from planet_osm_polygon where exist(tags,\'de:amtlicher_gemeindeschluessel\')\n    and length(tags::hstore->\'de:amtlicher_gemeindeschluessel\')= 8\n    ) as gemeinden\n    ON ST_Intersects(plz.way,gemeinden.way)\n\n    LEFT OUTER  JOIN\n\n    (\n    select tags,name,way from planet_osm_polygon where exist(tags,\'de:amtlicher_gemeindeschluessel\')\n    and length(tags::hstore->\'de:amtlicher_gemeindeschluessel\')= 5\n    ) as kreis\n    ON ST_Intersects(plz.way,kreis.way) and\n    substring(gemeinden.tags::hstore->\'de:amtlicher_gemeindeschluessel\',1,5) = kreis.tags::hstore->\'de:amtlicher_gemeindeschluessel\'\n\n    INNER JOIN\n    (select * from planet_osm_roads where highway in (\n      \'secondary\',\n      \'primary\',\n      \'service\',\n      \'steps\',\n      \'residential\',\n      \'living_street\',\n      \'footway\'\n    ) and name <> \'\' ) as roads\n    ON ST_Intersects(plz.way,roads.way)\n) j\n\ngroup by\n\nstrasse,\nzipcode,\namtlicher_gemeindeschluessel,\nregionalschluessel,\nort,\nlandkreis,\nkreis_regionalschluessel\n';
          return db.query(sql.replace('{zipcode}', zipcode).replace('{zipcode}', zipcode), function(err, res) {
            var i, id, len, output, ref, row;
            output = true;
            if (err) {
              console.error(err);
              output = false;
              return db.disconnect();
            } else {
              ref = res.rows;
              for (i = 0, len = ref.length; i < len; i++) {
                row = ref[i];
                if (me.sqlexport) {
                  sql = 'insert into strassenverzeichnis\n(\n  id,\n  strasse,\n  plz,\n  ort,\n  ortsteil,\n  amtlicher_gemeindeschluessel,\n  regionalschluessel,\n  landkreis,\n  kreis_regionalschluessel,\n  create_date\n) values\n(\n  \'{id}\',\n  \'{strasse}\',\n  \'{plz}\',\n  \'{ort}\',\n  \'{ortsteil}\',\n  \'{amtlicher_gemeindeschluessel}\',\n  \'{regionalschluessel}\',\n  \'{landkreis}\',\n  \'{kreis_regionalschluessel}\',\n  now()\n)\non duplicate key update\n  id = values(id),\n  strasse = values(strasse),\n  plz = values(plz),\n  ort = values(ort),\n  ortsteil = values(ortsteil),\n  amtlicher_gemeindeschluessel = values(amtlicher_gemeindeschluessel),\n  regionalschluessel = values(regionalschluessel),\n  landkreis = values(landkreis),\n  kreis_regionalschluessel= values(kreis_regionalschluessel)';
                  id = md5(row.strasse + row.zipcode + row.amtlicher_gemeindeschluessel);
                  sql = sql.replace('{id}', id);
                  sql = sql.replace('{strasse}', row.strasse);
                  sql = sql.replace('{plz}', row.zipcode);
                  sql = sql.replace('{ort}', row.ort);
                  sql = sql.replace('{ortsteil}', row.ortsteil);
                  sql = sql.replace('{amtlicher_gemeindeschluessel}', row.amtlicher_gemeindeschluessel);
                  sql = sql.replace('{regionalschluessel}', row.regionalschluessel);
                  sql = sql.replace('{landkreis}', row.landkreis);
                  sql = sql.replace('{kreis_regionalschluessel}', row.kreis_regionalschluessel);
                  process.stdout.write(sql + ";");
                  process.stdout.write("\n");
                } else {
                  process.stdout.write([row.id, row.strasse, row.zipcode, row.amtlicher_gemeindeschluessel, row.regionalschluessel, row.ort, row.landkreis, row.kreis_regionalschluessel].join(';'));
                  process.stdout.write("\n");
                }
              }
              db.disconnect();
              return me.exportStreets(options, index + 1);
            }
          });
        });
      }
    };

    return ExportStreets;

  })(Command);

}).call(this);
