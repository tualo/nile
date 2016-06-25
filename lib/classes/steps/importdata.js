(function() {
  var DBCommand, EventEmitter, ImportDB, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  DBCommand = require('../db/command');

  path = require('path');

  fs = require('fs');

  os = require('os');

  module.exports = ImportDB = (function(superClass) {
    extend(ImportDB, superClass);

    function ImportDB(options) {
      this.msg_tag = 'importData';
      this.options = options;
    }

    ImportDB.prototype.start = function() {
      var opt, params, proc;
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'import data');
        params = [];
        params.push('-c');
        params.push('-l');
        params.push('-s');
        params.push('--hstore-all');
        params.push('--hstore-add-index');
        params.push('--keep-coastlines');
        params.push('-C');
        params.push(this.options['cache']);
        if (this.options['styleFile']) {
          params.push('-S');
          params.push(this.options['styleFile']);
        } else {
          params.push('-S');
          params.push(path.join(process.cwd(), 'osm2pgsql', 'default.style'));
        }
        console.log(this.options);
        params.push('-P');
        params.push(this.options.port);
        params.push('-d');
        params.push(this.options.database);
        params.push(this.options['osmfile']);
        opt = {
          cwd: path.join(process.cwd(), 'osm2pgsql')
        };
        console.log('osm2pgsql', params.join(' '));
        proc = spawn('osm2pgsql', params, opt);
        proc.on('error', (function(_this) {
          return function(err) {
            return _this.procError(err);
          };
        })(this));
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

    ImportDB.prototype.start_gazetteer = function() {
      var opt, params, proc;
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'import data');
        params = [];
        params.push('-c');
        params.push('-l');
        params.push('-s');
        params.push('-O');
        params.push('gazetteer');
        params.push('--hstore-all');
        params.push('--hstore-add-index');
        params.push('--keep-coastlines');
        params.push('-C');
        params.push(this.options['cache']);
        if (this.options['styleFile']) {
          params.push('-S');
          params.push(this.options['styleFile']);
        } else {
          params.push('-S');
          params.push(path.join(process.cwd(), 'osm2pgsql', 'default.style'));
        }
        console.log(this.options);
        params.push('-P');
        params.push(this.options.port);
        params.push('-d');
        params.push(this.options.database);
        params.push(this.options['osmfile']);
        opt = {
          cwd: path.join(process.cwd(), 'osm2pgsql')
        };
        console.log('osm2pgsql', params.join(' '));
        proc = spawn('osm2pgsql', params, opt);
        proc.on('error', (function(_this) {
          return function(err) {
            return _this.procError(err);
          };
        })(this));
        proc.on('close', (function(_this) {
          return function(code) {
            return _this.close_gazetter(code);
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

    ImportDB.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.start_gazetteer();
    };

    ImportDB.prototype.close_gazetter = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.check();
    };

    ImportDB.prototype.procError = function(err) {
      if (err.errno === 'ENOENT' && err.path === 'osm2pgsql') {
        error(this.msg_tag, 'osm2pgsql is missing, please install first');
        return this.emit('error', true);
      } else {
        error(this.msg_tag, err);
        return this.emit('error', true);
      }
    };

    ImportDB.prototype.check = function() {
      var command;
      command = new DBCommand(this.options);
      return command.query('select * from place limit 1', (function(_this) {
        return function(err, result) {
          return _this.onCheck(err, result);
        };
      })(this));
    };

    ImportDB.prototype.onCheck = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        if (result.rows.length > 0) {
          return this.done();
        } else {
          return this.procError('no data imported');
        }
      }
    };

    ImportDB.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    ImportDB.prototype.error = function(data) {
      return debug(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    ImportDB.prototype.done = function() {
      return this.emit('done');
    };

    return ImportDB;

  })(EventEmitter);

}).call(this);
