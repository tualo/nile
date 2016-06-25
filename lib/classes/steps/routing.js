(function() {
  var DBCommand, EventEmitter, SetupDB, fs, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  DBCommand = require('../db/command');

  path = require('path');

  fs = require('fs');

  module.exports = SetupDB = (function(superClass) {
    extend(SetupDB, superClass);

    function SetupDB(options) {
      this.msg_tag = 'routing';
      this.options = options;
      this.tables_prefix = 'routing_';
    }

    SetupDB.prototype.start = function() {
      return this.createNodesTable();
    };

    SetupDB.prototype.createNodesTable = function() {
      var command, sql;
      sql = " CREATE TABLE " + this.tables_prefix + "nodes (id bigint PRIMARY KEY, lon decimal(11,8), lat decimal(11,8), numOfUse int);";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.createWaysTable(err, result);
        };
      })(this));
    };

    SetupDB.prototype.createWaysTable = function(err, result) {
      var command, sql;
      sql = "CREATE TABLE " + this.tables_prefix + "ways (gid integer, class_id integer not null, length double precision, name text, x1 double precision, y1 double precision, x2 double precision, y2 double precision, reverse_cost double precision, rule text, to_cost double precision, maxspeed_forward integer, maxspeed_backward integer, osm_id bigint, priority double precision DEFAULT 1);";
      sql += " SELECT AddGeometryColumn('" + this.tables_prefix + "ways','the_geom',4326,'LINESTRING',2);";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.createTypesTable(err, result);
        };
      })(this));
    };

    SetupDB.prototype.createTypesTable = function(err, result) {
      var command, sql;
      sql = "CREATE TABLE " + this.tables_prefix + "types (id integer PRIMARY KEY, name text);";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.createWayTagsTable(err, result);
        };
      })(this));
    };

    SetupDB.prototype.createWayTagsTable = function(err, result) {
      var command, sql;
      sql = "CREATE TABLE " + this.tables_prefix + "way_tag (type_id integer, class_id integer, way_id bigint);";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.createRelationsTable(err, result);
        };
      })(this));
    };

    SetupDB.prototype.createRelationsTable = function(err, result) {
      var command, sql;
      sql = "CREATE TABLE " + this.tables_prefix + "relations (relation_id bigint, type_id integer, class_id integer, name text);";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.createClassesTable(err, result);
        };
      })(this));
    };

    SetupDB.prototype.createClassesTable = function(err, result) {
      var command, sql;
      sql = "CREATE TABLE " + this.tables_prefix + "classes (id integer PRIMARY KEY, type_id integer, name text, cost double precision, priority double precision, default_maxspeed integer);";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.createWaysTable(err, result);
        };
      })(this));
    };

    SetupDB.prototype.close = function(code) {
      debug(this.msg_tag, 'exit #' + code);
      return this.postgres_version();
    };

    return SetupDB;

  })(EventEmitter);

}).call(this);
