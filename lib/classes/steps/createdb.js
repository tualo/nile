(function() {
  var CreateDB, EventEmitter, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  module.exports = CreateDB = (function(superClass) {
    extend(CreateDB, superClass);

    function CreateDB(options) {
      this.msg_tag = 'createDb';
      this.options = options;
    }

    CreateDB.prototype.start = function() {
      var proc;
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'create database');
        proc = spawn('createdb', ['-E UTF-8', '-p ' + this.options.port, this.options.database]);
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

    CreateDB.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.done();
    };

    CreateDB.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    CreateDB.prototype.error = function(data) {
      return error(this.msg_tag, data.toString());
    };

    CreateDB.prototype.done = function() {
      return this.emit('done');
    };

    return CreateDB;

  })(EventEmitter);

}).call(this);
