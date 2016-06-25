(function() {
  var DBCommand, EventEmitter, Partitions, os, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  os = require('os');

  DBCommand = require('../db/command');

  module.exports = Partitions = (function(superClass) {
    extend(Partitions, superClass);

    function Partitions(options) {
      this.msg_tag = 'partitions';
      this.options = options;
    }

    Partitions.prototype.start = function() {
      var command;
      command = new DBCommand(this.options);
      return command.query('select distinct partition from country_name', (function(_this) {
        return function(err, result) {
          return _this.onQuery(err, result);
        };
      })(this));
    };

    Partitions.prototype.onQuery = function(err, result) {
      this.options['partitions'] = result.rows;
      return this.done();
    };

    Partitions.prototype.done = function() {
      return this.emit('done');
    };

    return Partitions;

  })(EventEmitter);

}).call(this);
