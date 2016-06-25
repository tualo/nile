(function() {
  var DBCommand, EventEmitter, Index, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  DBCommand = require('../db/command');

  module.exports = Index = (function(superClass) {
    extend(Index, superClass);

    function Index(options) {
      this.msg_tag = 'index';
      this.options = options;
      this.params = ['-i', '-d', this.options.database, '-P', this.options.port, '-t', this.options.instances];
      this.cmd = path.join(process.cwd(), 'nominatim', 'nominatim');
    }

    Index.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'index');
        return this.indexR4();
      } else {
        return this.done();
      }
    };

    Index.prototype.indexR4 = function(exists) {
      var opt, params, proc;
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      debug(this.msg_tag, path.join(process.cwd(), 'nominatim'));
      params = this.params.slice(0, this.params.length);
      params.push('-R');
      params.push('4');
      proc = spawn(this.cmd, params, opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onIndexR4(code);
        };
      })(this));
      proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
      return proc.stdout.on('data', (function(_this) {
        return function(data) {
          return _this.output(data);
        };
      })(this));
    };

    Index.prototype.onIndexR4 = function(code) {
      var command;
      debug(this.msg_tag, 'index R4');
      command = new DBCommand(this.options);
      return command.query('ANALYSE', (function(_this) {
        return function(err, result) {
          return _this.onIndexR4Analyse(err, result);
        };
      })(this));
    };

    Index.prototype.onIndexR4Analyse = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.indexR25();
      }
    };

    Index.prototype.indexR25 = function(exists) {
      var opt, params, proc;
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      debug(this.msg_tag, path.join(process.cwd(), 'nominatim'));
      params = this.params.slice(0, this.params.length);
      params.push('-r');
      params.push('5');
      params.push('-R');
      params.push('25');
      proc = spawn(this.cmd, params, opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onIndexR25(code);
        };
      })(this));
      proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
      return proc.stdout.on('data', (function(_this) {
        return function(data) {
          return _this.output(data);
        };
      })(this));
    };

    Index.prototype.onIndexR25 = function(code) {
      var command;
      debug(this.msg_tag, 'index R25');
      command = new DBCommand(this.options);
      return command.query('ANALYSE', (function(_this) {
        return function(err, result) {
          return _this.onIndexR25Analyse(err, result);
        };
      })(this));
    };

    Index.prototype.onIndexR25Analyse = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.indexR26();
      }
    };

    Index.prototype.indexR26 = function(exists) {
      var opt, params, proc;
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      debug(this.msg_tag, path.join(process.cwd(), 'nominatim'));
      params = this.params.slice(0, this.params.length);
      params.push('-r');
      params.push('26');
      proc = spawn(this.cmd, params, opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onIndexR26(code);
        };
      })(this));
      proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
      return proc.stdout.on('data', (function(_this) {
        return function(data) {
          return _this.output(data);
        };
      })(this));
    };

    Index.prototype.onIndexR26 = function(code) {
      var command;
      debug(this.msg_tag, 'index R26');
      command = new DBCommand(this.options);
      return command.query('ANALYSE', (function(_this) {
        return function(err, result) {
          return _this.onIndexR26Analyse(err, result);
        };
      })(this));
    };

    Index.prototype.onIndexR26Analyse = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.done();
      }
    };

    Index.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    Index.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    Index.prototype.done = function() {
      return this.emit('done');
    };

    return Index;

  })(EventEmitter);

}).call(this);
