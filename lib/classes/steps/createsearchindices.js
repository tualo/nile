(function() {
  var CreateSearchIndices, DBCommand, EventEmitter, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  DBCommand = require('../db/command');

  module.exports = CreateSearchIndices = (function(superClass) {
    extend(CreateSearchIndices, superClass);

    function CreateSearchIndices(options) {
      this.msg_tag = 'createSearchIndices';
      this.options = options;
      this.templateFile = path.join(process.cwd(), 'sql', 'indices.src.sql');
    }

    CreateSearchIndices.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'index');
        return this.readFile();
      } else {
        return this.done();
      }
    };

    CreateSearchIndices.prototype.readFile = function() {
      debug(this.msg_tag, this.templateFile + ' found');
      return fs.readFile(this.templateFile, (function(_this) {
        return function(err, data) {
          return _this.onReadFile(err, data);
        };
      })(this));
    };

    CreateSearchIndices.prototype.onReadFile = function(err, data) {
      var output;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        output = Template.render(this.options, data.toString('utf-8'));
        return fs.writeFile(path.join(os.tmpdir(), 'indices.src.sql'), output, (function(_this) {
          return function(err) {
            return _this.onWriteFile(err);
          };
        })(this));
      }
    };

    CreateSearchIndices.prototype.onWriteFile = function(err) {
      var opt, proc;
      if (err) {
        error(this.msg_tag, err);
      } else {
        info(this.msg_tag, 'script created');
      }
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      proc = spawn('psql', ['-f', path.join(os.tmpdir(), 'indices.src.sql'), '-p', this.options.port, this.options.database], opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onLoadScript(code);
        };
      })(this));
      return proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
    };

    CreateSearchIndices.prototype.onLoadScript = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'script not loaded');
      } else {
        info(this.msg_tag, 'script loaded');
      }
      return this.done();
    };

    CreateSearchIndices.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    CreateSearchIndices.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    CreateSearchIndices.prototype.done = function() {
      return this.emit('done');
    };

    return CreateSearchIndices;

  })(EventEmitter);

}).call(this);
