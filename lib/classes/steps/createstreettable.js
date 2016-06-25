(function() {
  var CreateStreetTable, DBCommand, EventEmitter, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  DBCommand = require('../db/command');

  module.exports = CreateStreetTable = (function(superClass) {
    extend(CreateStreetTable, superClass);

    function CreateStreetTable(options) {
      this.msg_tag = 'createStreetTable';
      this.options = options;
    }

    CreateStreetTable.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        return this.streets();
      } else {
        return this.done();
      }
    };

    CreateStreetTable.prototype.streets = function() {
      var command, sql;
      sql = "select\n  str.name,\n  str.typ,\n  str.way,\n  pc.postal_code\nfrom\n(\nselect\n  name,highway as typ, way\nfrom\n  planet_osm_roads where highway <> '' and name <>''\nunion\nselect\n  name,highway as typ, way\nfrom\n  planet_osm_line where highway <> '' and name <>''\n) str,\n(\nselect\n  planet_osm_polygon.way,\n  planet_osm_polygon.tags->'postal_code' postal_code\nfrom\n  planet_osm_polygon\nwhere\n  planet_osm_polygon.tags->'postal_code' <> ''\n) pc\nwhere str.way && pc.way";
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onStreets(err, result);
        };
      })(this));
    };

    CreateStreetTable.prototype.onStreets = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        this.streetlist = result.rows;
        debug('streets', result.rows.length);
        return this.adm(6, 0);
      }
    };

    CreateStreetTable.prototype.adm = function(adm, index) {
      var command, me, sql, strid;
      if (index < this.streetlist.length) {
        me = this;
        strid = this.streetlist[index].way;
        sql = "select\n  name,\n  way\nfrom\n  planet_osm_polygon\nwhere\n  admin_level in ('" + adm + "') and boundary='administrative'\nand ST_Intersects(planet_osm_polygon.way, '" + strid + "')";
        command = new DBCommand(this.options);
        return command.query(sql, function(err, result) {
          if (err) {
            error('adm', err);
          } else {
            if (result.rows.length > 0) {
              me.streetlist[index]['adm_' + adm] = result.rows[0].name;
            }
          }
          if (index % 100 === 0) {
            debug('adm_' + adm, index);
          }
          return me.adm(adm, index + 1);
        });
      } else {
        adm += 1;
        if (adm < 12) {
          return me.adm(adm, 0);
        } else {
          return this.done();
        }
      }
    };

    CreateStreetTable.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    CreateStreetTable.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    CreateStreetTable.prototype.done = function() {
      console.log(this.streetlist.length);
      return this.emit('done');
    };

    return CreateStreetTable;

  })(EventEmitter);

}).call(this);
