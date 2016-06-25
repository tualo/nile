(function() {
  var CalculatePostcodes, DBCommand, EventEmitter, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  DBCommand = require('../db/command');

  module.exports = CalculatePostcodes = (function(superClass) {
    extend(CalculatePostcodes, superClass);

    function CalculatePostcodes(options) {
      this.msg_tag = 'calculatePostcodes';
      this.options = options;
    }

    CalculatePostcodes.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'calculate postcodes');
        return this.deleteTypeP();
      } else {
        return this.done();
      }
    };

    CalculatePostcodes.prototype.deleteTypeP = function() {
      var command;
      debug(this.msg_tag, 'type p');
      command = new DBCommand(this.options);
      return command.query('DELETE from placex where osm_type=\'P\'', (function(_this) {
        return function(err, result) {
          return _this.onDeleteTypeP(err, result);
        };
      })(this));
    };

    CalculatePostcodes.prototype.onDeleteTypeP = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.insertTypeP();
      }
    };

    CalculatePostcodes.prototype.insertTypeP = function() {
      var command, sql;
      debug(this.msg_tag, 'type p');
      sql = 'insert into placex (osm_type,osm_id,class,type,postcode,calculated_country_code,geometry) select \'P\',nextval(\'seq_postcodes\'),\'place\',\'postcode\',postcode,calculated_country_code, ST_SetSRID(ST_Point(x,y),4326) as geometry from (select calculated_country_code,postcode, avg(st_x(st_centroid(geometry))) as x,avg(st_y(st_centroid(geometry))) as y from placex where postcode is not null group by calculated_country_code,postcode) as x';
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onInsertTypeP(err, result);
        };
      })(this));
    };

    CalculatePostcodes.prototype.onInsertTypeP = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.insertUSTypeP();
      }
    };

    CalculatePostcodes.prototype.insertUSTypeP = function() {
      var command, sql;
      debug(this.msg_tag, 'type p');
      sql = 'insert into placex (osm_type,osm_id,class,type,postcode,calculated_country_code,geometry) select \'P\',nextval(\'seq_postcodes\'),\'place\',\'postcode\',postcode,\'us\', ST_SetSRID(ST_Point(x,y),4326) as geometry from us_postcode';
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onInsertUSTypeP(err, result);
        };
      })(this));
    };

    CalculatePostcodes.prototype.onInsertUSTypeP = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      return this.done();
    };

    CalculatePostcodes.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    CalculatePostcodes.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    CalculatePostcodes.prototype.done = function() {
      return this.emit('done');
    };

    return CalculatePostcodes;

  })(EventEmitter);

}).call(this);
