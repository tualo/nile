(function() {
  var CreateFunctions, EventEmitter, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  module.exports = CreateFunctions = (function(superClass) {
    extend(CreateFunctions, superClass);

    function CreateFunctions(options) {
      this.msg_tag = 'createFunctions';
      this.options = options;
      this.modulePath = path.join(process.cwd(), 'module');
      this.options['modulepath'] = this.modulePath;
      this.moduleFile = path.join(this.modulePath, 'nominatim.so');
      this.templateFile = path.join(process.cwd(), 'sql', 'functions.sql');
    }

    CreateFunctions.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'create functions');
        return fs.exists(this.moduleFile, (function(_this) {
          return function(exists) {
            return _this.libExists(exists);
          };
        })(this));
      } else {
        return this.done();
      }
    };

    CreateFunctions.prototype.libExists = function(exists) {
      if (exists) {
        debug(this.msg_tag, 'nominatim library found');
        return fs.readFile(this.templateFile, (function(_this) {
          return function(err, data) {
            return _this.onReadFile(err, data);
          };
        })(this));
      } else {
        error(this.msg_tag, 'nominatim library is missing');
        return this.done();
      }
    };

    CreateFunctions.prototype.onReadFile = function(err, data) {
      var output;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        output = Template.render(this.options, data.toString('utf-8'));
        if (this.options.enableDiffUpdates) {
          debug(this.msg_tag, 'enable-diff-updates');
          output = output.replace('RETURN NEW; -- @DIFFUPDATES@', '--');
        }
        if (this.options.enableDebugStatements) {
          debug(this.msg_tag, 'enable-debug-statements');
          output = output.replace(/--DEBUG/g, '');
        }
        if (this.options.limitReindexing) {
          debug(this.msg_tag, 'limit-reindexing');
          output = output.replace(/--DEBUG/g, '');
        }
        return fs.writeFile(path.join(os.tmpdir(), 'functions.sql'), output, (function(_this) {
          return function(err) {
            return _this.onWriteFile(err);
          };
        })(this));
      }
    };

    CreateFunctions.prototype.onWriteFile = function(err) {
      var opt, proc;
      if (err) {
        error(this.msg_tag, err);
      } else {
        info(this.msg_tag, 'functions script created');
      }
      opt = {
        cwd: process.cwd(),
        env: process.env
      };
      proc = spawn('psql', ['-f', path.join(os.tmpdir(), 'functions.sql'), '-p', this.options.port, this.options.database], opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onLoadFunctions(code);
        };
      })(this));
      return proc.stderr.on('data', (function(_this) {
        return function(data) {
          return _this.error(data);
        };
      })(this));
    };

    CreateFunctions.prototype.onLoadFunctions = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'functions not loaded');
      } else {
        info(this.msg_tag, 'functions loaded');
      }
      return this.done();
    };

    CreateFunctions.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.done();
    };

    CreateFunctions.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    CreateFunctions.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    CreateFunctions.prototype.done = function() {
      return this.emit('done');
    };

    return CreateFunctions;

  })(EventEmitter);

}).call(this);
