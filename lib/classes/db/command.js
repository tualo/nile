(function() {
  var Command, EventEmitter, pg,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  pg = require('pg');

  module.exports = Command = (function(superClass) {
    extend(Command, superClass);

    function Command(options) {
      this.own_connection = true;
      this.singleRow = false;
      if (typeof options.dbconnection === 'object') {
        this.own_connection = false;
        this.client = options.dbconnection;
      } else {
        this.client = new pg.Client('postgres://localhost:' + options.port + '/' + options.database);
      }
    }

    Command.prototype.getOne = function(sql, callback) {
      this.sql = sql;
      this.callback = callback;
      this.singleRow = true;
      if (this.own_connection) {
        return this.client.connect((function(_this) {
          return function(err) {
            return _this.onConnect(err);
          };
        })(this));
      } else {
        return this.onConnected();
      }
    };

    Command.prototype.query = function(sql, callback) {
      this.sql = sql;
      this.callback = callback;
      if (this.own_connection) {
        return this.client.connect((function(_this) {
          return function(err) {
            return _this.onConnect(err);
          };
        })(this));
      } else {
        return this.onConnected();
      }
    };

    Command.prototype.onConnect = function(err) {
      if (err) {
        return this.callback(err);
      } else {
        return this.onConnected();
      }
    };

    Command.prototype.onConnected = function() {
      return this.client.query(this.sql, (function(_this) {
        return function(err, result) {
          return _this.onQuery(err, result);
        };
      })(this));
    };

    Command.prototype.onQuery = function(err, result) {
      if (this.own_connection) {
        this.client.end();
      }
      if (this.singleRow) {
        result = result.rows.length > 0 ? result.rows[0] : [];
      }
      return this.callback(err, result);
    };

    return Command;

  })(EventEmitter);

}).call(this);
