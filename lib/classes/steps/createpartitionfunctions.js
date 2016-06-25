(function() {
  var CreatePartitionFunctions, EventEmitter, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  module.exports = CreatePartitionFunctions = (function(superClass) {
    extend(CreatePartitionFunctions, superClass);

    function CreatePartitionFunctions(options) {
      this.msg_tag = 'createPartitionFunctions';
      this.options = options;
      this.templateFile = path.join(process.cwd(), 'sql', 'partition-functions.src.sql');
    }

    CreatePartitionFunctions.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'create partition functions');
        return fs.exists(this.templateFile, (function(_this) {
          return function(exists) {
            return _this.libExists(exists);
          };
        })(this));
      } else {
        return this.done();
      }
    };

    CreatePartitionFunctions.prototype.libExists = function(exists) {
      if (exists) {
        debug(this.msg_tag, this.templateFile + ' found');
        return fs.readFile(this.templateFile, (function(_this) {
          return function(err, data) {
            return _this.onReadFile(err, data);
          };
        })(this));
      } else {
        error(this.msg_tag, this.templateFile + ' is missing');
        return this.done();
      }
    };

    CreatePartitionFunctions.prototype.onReadFile = function(err, data) {
      var output;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        output = Template.render(this.options, data.toString('utf-8'));
        return fs.writeFile(path.join(os.tmpdir(), 'partition-functions.sql'), output, (function(_this) {
          return function(err) {
            return _this.onWriteFile(err);
          };
        })(this));
      }
    };

    CreatePartitionFunctions.prototype.onWriteFile = function(err) {
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
      proc = spawn('psql', ['-f', path.join(os.tmpdir(), 'partition-functions.sql'), '-p', this.options.port, this.options.database], opt);
      proc.on('close', (function(_this) {
        return function(code) {
          return _this.onLoadScript(code);
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

    CreatePartitionFunctions.prototype.onLoadScript = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'script not loaded');
      } else {
        info(this.msg_tag, 'script loaded');
        this.options.createFunctions = true;
      }
      return this.done();
    };

    CreatePartitionFunctions.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.done();
    };

    CreatePartitionFunctions.prototype.output = function(data) {};

    CreatePartitionFunctions.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    CreatePartitionFunctions.prototype.done = function() {
      return this.emit('done');
    };

    return CreatePartitionFunctions;

  })(EventEmitter);

}).call(this);
