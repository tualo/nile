(function() {
  var DBCommand, EventEmitter, LoadData, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  DBCommand = require('../db/command');

  module.exports = LoadData = (function(superClass) {
    extend(LoadData, superClass);

    function LoadData(options) {
      this.msg_tag = 'loadData';
      this.options = options;
      this.index = 0;
      this.wordsFile = path.join(process.cwd(), 'sql', 'words.sql');
    }

    LoadData.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'load data');
        return this.truncateWord();
      } else {
        return this.done();
      }
    };

    LoadData.prototype.truncateWord = function() {
      var command;
      debug(this.msg_tag, 'word');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE word', (function(_this) {
        return function(err, result) {
          return _this.onTruncateWord(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncateWord = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncatePlacex();
      }
    };

    LoadData.prototype.truncatePlacex = function() {
      var command;
      debug(this.msg_tag, 'placex');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE placex', (function(_this) {
        return function(err, result) {
          return _this.onTruncatePlacex(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncatePlacex = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncatePlace_addressline();
      }
    };

    LoadData.prototype.truncatePlace_addressline = function() {
      var command;
      debug(this.msg_tag, 'place_addressline');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE place_addressline', (function(_this) {
        return function(err, result) {
          return _this.onTruncatePlace_addressline(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncatePlace_addressline = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncatePlace_boundingbox();
      }
    };

    LoadData.prototype.truncatePlace_boundingbox = function() {
      var command;
      debug(this.msg_tag, 'place_boundingbox');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE place_boundingbox', (function(_this) {
        return function(err, result) {
          return _this.onTruncatePlace_boundingbox(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncatePlace_boundingbox = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncateLocation_area();
      }
    };

    LoadData.prototype.truncateLocation_area = function() {
      var command;
      debug(this.msg_tag, 'location_area');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE location_area', (function(_this) {
        return function(err, result) {
          return _this.onTruncateLocation_area(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncateLocation_area = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncateSearch_name();
      }
    };

    LoadData.prototype.truncateSearch_name = function() {
      var command;
      debug(this.msg_tag, 'place_addressline');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE search_name', (function(_this) {
        return function(err, result) {
          return _this.onTruncateSearch_name(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncateSearch_name = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncateSearch_name_blank();
      }
    };

    LoadData.prototype.truncateSearch_name_blank = function() {
      var command;
      debug(this.msg_tag, 'search_name_blank');
      command = new DBCommand(this.options);
      return command.query('TRUNCATE search_name_blank', (function(_this) {
        return function(err, result) {
          return _this.onTruncateSearch_name_blank(err, result);
        };
      })(this));
    };

    LoadData.prototype.onTruncateSearch_name_blank = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.dropSequenceSeqPlace();
      }
    };

    LoadData.prototype.dropSequenceSeqPlace = function() {
      var command;
      debug(this.msg_tag, 'place_addressline');
      command = new DBCommand(this.options);
      return command.query('DROP SEQUENCE seq_place', (function(_this) {
        return function(err, result) {
          return _this.onDropSequenceSeqPlace(err, result);
        };
      })(this));
    };

    LoadData.prototype.onDropSequenceSeqPlace = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.createSequenceSeqPlace();
      }
    };

    LoadData.prototype.createSequenceSeqPlace = function() {
      var command;
      debug(this.msg_tag, 'seq_place');
      command = new DBCommand(this.options);
      return command.query('CREATE SEQUENCE seq_place start 100000', (function(_this) {
        return function(err, result) {
          return _this.onCreateSequenceSeqPlace(err, result);
        };
      })(this));
    };

    LoadData.prototype.onCreateSequenceSeqPlace = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.truncatePartitions();
      }
    };

    LoadData.prototype.truncatePartitions = function() {
      var command;
      debug(this.msg_tag, 'location_road_* (' + this.index + '/ ' + this.options['partitions'].length + ')');
      if (this.index < this.options['partitions'].length) {
        command = new DBCommand(this.options);
        return command.query('TRUNCATE location_road_' + this.options['partitions'][this.index].partition, (function(_this) {
          return function(err, result) {
            return _this.onTruncatePartitions(err, result);
          };
        })(this));
      } else {
        return this.createGet_maxwordfreq();
      }
    };

    LoadData.prototype.onTruncatePartitions = function(err, result) {
      this.index++;
      return this.truncatePartitions();
    };

    LoadData.prototype.createGet_maxwordfreq = function() {
      var command, sql;
      sql = 'CREATE OR REPLACE FUNCTION get_maxwordfreq() RETURNS integer AS $$ SELECT ' + this.options.maxwordfreq + ' as maxwordfreq; $$ LANGUAGE SQL IMMUTABLE';
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onCreateGet_maxwordfreq(err, result);
        };
      })(this));
    };

    LoadData.prototype.onCreateGet_maxwordfreq = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        return this.loadWords();
      }
    };

    LoadData.prototype.loadWords = function() {
      var opt, proc;
      if (this.options.tokenPrecalc) {
        opt = {
          cwd: process.cwd(),
          env: process.env
        };
        proc = spawn('psql', ['-f', this.wordsFile, '-p', this.options.port, this.options.database], opt);
        proc.on('close', (function(_this) {
          return function(code) {
            return _this.onLoadWords(code);
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
      } else {
        return this.loadPlaceX();
      }
    };

    LoadData.prototype.onLoadWords = function(code) {
      if (code !== 0) {
        error(this.msg_tag, 'script not loaded');
      } else {
        info(this.msg_tag, 'script loaded');
      }
      return this.loadPlaceX();
    };

    LoadData.prototype.loadPlaceX = function() {
      var command, i, index, ref, results, sql;
      this.fin = this.options.instances;
      results = [];
      for (index = i = 1, ref = this.options.instances; 1 <= ref ? i <= ref : i >= ref; index = 1 <= ref ? ++i : --i) {
        sql = 'insert into placex (osm_type, osm_id, class, type, name, admin_level, housenumber, street, addr_place, isin, postcode, country_code, extratags, geometry) select * from place where osm_id % ' + this.options.instances + ' = ' + index;
        command = new DBCommand(this.options);
        results.push(command.query(sql, (function(_this) {
          return function(err, result) {
            return _this.onLoadPlaceX(err, result);
          };
        })(this)));
      }
      return results;
    };

    LoadData.prototype.onLoadPlaceX = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      this.fin--;
      debug(this.msg_tag, this.fin);
      if (this.fin === 0) {
        return this.analyse();
      }
    };

    LoadData.prototype.analyse = function() {
      var command, sql;
      sql = 'ANALYSE';
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onAnalyse(err, result);
        };
      })(this));
    };

    LoadData.prototype.onAnalyse = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      return this.done();
    };

    LoadData.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    LoadData.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    LoadData.prototype.done = function() {
      return this.emit('done');
    };

    return LoadData;

  })(EventEmitter);

}).call(this);
