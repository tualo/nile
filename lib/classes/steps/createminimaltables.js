(function() {
  var CreateMinimalTables, EventEmitter, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('tualo-template');

  module.exports = CreateMinimalTables = (function(superClass) {
    extend(CreateMinimalTables, superClass);

    function CreateMinimalTables(options) {
      this.msg_tag = 'createMinimalTables';
      this.options = options;
      this.templateFile = path.join(process.cwd(), 'sql', 'tables-minimal.sql');
    }

    CreateMinimalTables.prototype.start = function() {
      var opt, proc;
      if (this.options[this.msg_tag]) {
        opt = {
          cwd: process.cwd(),
          env: process.env
        };
        proc = spawn('psql', ['-f', this.templateFile, '-p', this.options.port, this.options.database], opt);
        proc.on('close', (function(_this) {
          return function(code) {
            return _this.onLoadMinimalTables(code);
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

    CreateMinimalTables.prototype.onLoadMinimalTables = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'tables-minimal not loaded');
      } else {
        info(this.msg_tag, 'tables-minimal loaded');
      }
      return this.done();
    };

    CreateMinimalTables.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.done();
    };

    CreateMinimalTables.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    CreateMinimalTables.prototype.error = function(data) {
      return error(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    CreateMinimalTables.prototype.done = function() {
      return this.emit('done');
    };

    return CreateMinimalTables;

  })(EventEmitter);

}).call(this);
