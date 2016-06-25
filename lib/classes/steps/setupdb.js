(function() {
  var DBCommand, EventEmitter, SetupDB, fs, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  DBCommand = require('../db/command');

  path = require('path');

  fs = require('fs');

  module.exports = SetupDB = (function(superClass) {
    extend(SetupDB, superClass);

    function SetupDB(options) {
      this.msg_tag = 'setupDb';
      this.options = options;
    }

    SetupDB.prototype.start = function() {
      var proc;
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'setup database');
        proc = spawn('createlang', ['plpgsql', '-p ' + this.options.port, this.options.database]);
        proc.on('close', (function(_this) {
          return function(code) {
            return _this.close(code);
          };
        })(this));
        proc.stdout.on('data', (function(_this) {
          return function(data) {
            return _this.output(data);
          };
        })(this));
        return proc.stderr.on('data', (function(_this) {
          return function(data) {
            return _this.error(data);
          };
        })(this));
      } else {
        return this.done();
      }
    };

    SetupDB.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.postgres_version();
    };

    SetupDB.prototype.postgres_version = function() {
      var command;
      command = new DBCommand(this.options);
      return command.getOne('select version()', (function(_this) {
        return function(err, result) {
          return _this.onPostgres_version(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onPostgres_version = function(err, result) {
      var m, v;
      if (err) {
        error(this.msg_tag, err);
      } else {
        m = result.version.match(/PostgreSQL\s([0-9]+)[.]([0-9]+)[^0-9]/);
        if (m) {
          v = m.slice(1, 3).join('.');
          this.options.postgres_version = v;
          info(this.msg_tag + ' ' + 'postgis version', v);
        } else {
          error(this.msg_tag, 'can\'t read postgres version');
        }
      }
      return this.hstore();
    };

    SetupDB.prototype.hstore = function() {
      var command;
      command = new DBCommand(this.options);
      return command.query('CREATE EXTENSION hstore', (function(_this) {
        return function(err, result) {
          return _this.onHstore(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onHstore = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      } else {
        info(this.msg_tag, 'hstore extension created');
      }
      return this.postgis();
    };

    SetupDB.prototype.postgis = function() {
      var command;
      command = new DBCommand(this.options);
      return command.query('CREATE EXTENSION postgis', (function(_this) {
        return function(err, result) {
          return _this.onPostgis(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onPostgis = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      } else {
        info(this.msg_tag, 'postgis extension created');
      }
      return this.postgis_version();
    };

    SetupDB.prototype.postgis_version = function() {
      var command;
      command = new DBCommand(this.options);
      return command.getOne('select postgis_full_version()', (function(_this) {
        return function(err, result) {
          return _this.onPostgis_version(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onPostgis_version = function(err, result) {
      var m, v;
      if (err) {
        error(this.msg_tag, err);
      } else {
        m = result.postgis_full_version.match(/POSTGIS="([0-9]+)[.]([0-9]+)[.]([0-9]+)( r([0-9]+))?"/);
        if (m) {
          v = m.slice(1, 4).join('.');
          this.options.postgis_version = v;
          info(this.msg_tag + ' ' + 'postgis version', v);
        } else {
          error(this.msg_tag, 'can\'t read postgis version');
        }
      }
      return this.loadCountryName();
    };

    SetupDB.prototype.loadCountryName = function() {
      var opt, proc;
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      proc = spawn('psql', ['-f' + path.join('sql', 'country_name.sql'), '-p ' + this.options.port, this.options.database], opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onLoadCountryName(code);
        };
      })(this));
      return proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
    };

    SetupDB.prototype.onLoadCountryName = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'country_name not loaded');
      } else {
        info(this.msg_tag, 'country_name loaded');
      }
      return this.loadCountryNaturalearthdata();
    };

    SetupDB.prototype.loadCountryNaturalearthdata = function() {
      var opt, proc;
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      proc = spawn('psql', ['-f' + path.join('sql', 'country_naturalearthdata.sql'), '-p ' + this.options.port, this.options.database], opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onLoadCountryNaturalearthdata(code);
        };
      })(this));
      return proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
    };

    SetupDB.prototype.onLoadCountryNaturalearthdata = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'country_naturalearthdata not loaded');
      } else {
        info(this.msg_tag, 'country_naturalearthdata loaded');
      }
      return this.loadCountryOsmGrid();
    };

    SetupDB.prototype.loadCountryOsmGrid = function() {
      var opt, proc;
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      proc = spawn('psql', ['-f' + path.join('sql', 'country_osm_grid.sql'), '-p ' + this.options.port, this.options.database], opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onLoadCountryOsmGrid(code);
        };
      })(this));
      return proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
    };

    SetupDB.prototype.onLoadCountryOsmGrid = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'country_osm_grid not loaded');
      } else {
        info(this.msg_tag, 'country_osm_grid loaded');
      }
      if (this.options['partitions']) {
        return this.place_boundingbox();
      } else {
        return this.no_partitions();
      }
    };

    SetupDB.prototype.no_partitions = function() {
      var command;
      info(this.msg_tag, 'no-partitions');
      command = new DBCommand(this.options);
      return command.getOne('update country_name set partition = 0', (function(_this) {
        return function(err, result) {
          return _this.onNo_partitions(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onNo_partitions = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      return this.place_boundingbox();
    };

    SetupDB.prototype.place_boundingbox = function() {
      var command;
      debug(this.msg_tag, 'place_boundingbox');
      command = new DBCommand(this.options);
      return command.query('CREATE TABLE place_boundingbox ()', (function(_this) {
        return function(err, result) {
          return _this.onPlace_boundingbox(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onPlace_boundingbox = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      return this.wikipedia_article_match();
    };

    SetupDB.prototype.wikipedia_article_match = function() {
      var command;
      command = new DBCommand(this.options);
      return command.query('create type wikipedia_article_match as ()', (function(_this) {
        return function(err, result) {
          return _this.onWikipedia_article_match(err, result);
        };
      })(this));
    };

    SetupDB.prototype.onWikipedia_article_match = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      return this.done();
    };

    SetupDB.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    SetupDB.prototype.error = function(data) {
      return error(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    SetupDB.prototype.done = function() {
      return this.emit('done');
    };

    return SetupDB;

  })(EventEmitter);

}).call(this);
