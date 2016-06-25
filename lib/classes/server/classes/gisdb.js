(function() {
  var EventEmitter, GISDB, pg, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  pg = require('pg');

  module.exports = GISDB = (function(superClass) {
    extend(GISDB, superClass);

    function GISDB(options) {
      this.client = new pg.Client('postgres://localhost:' + options.port + '/' + options.database);
    }

    GISDB.prototype.connect = function(connectCB) {
      this.connectCB = connectCB;
      return this.client.connect((function(_this) {
        return function(err) {
          return _this.onConnect(err);
        };
      })(this));
    };

    GISDB.prototype.disconnect = function() {
      return this.client.end();
    };

    GISDB.prototype.query = function() {
      var args, cback, others, sql;
      sql = arguments[0], others = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      args = [];
      cback = function() {};
      if (typeof others[0] === 'function') {
        cback = others[0];
      } else {
        args = others[0];
        cback = others[1];
      }
      return this.client.query(sql, args, function(err, result) {
        return cback(err, result);
      });
    };

    GISDB.prototype.onConnect = function(err) {
      if (err) {
        return this.connectCB(err, null);
      } else {
        return this.connectCB(null, true);
      }
    };

    return GISDB;

  })(EventEmitter);

}).call(this);
