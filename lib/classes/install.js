(function() {
  var EventEmitter, Install, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  path = require('path');

  module.exports = Install = (function(superClass) {
    extend(Install, superClass);

    Install.list = ['osm2pgsqlcache', 'createdb', 'setupdb', 'importdata', 'partitions', 'createfunctions', 'createminimaltables', 'createtables', 'createfunctions', 'createpartitiontables', 'createpartitionfunctions', 'loaddata', 'calculatepostcodes', 'osmosisinit', 'index', 'createsearchindices', 'createstreettable'];

    function Install(options) {
      this.msg_tag = 'class install';
      this.options = options;
      this.options.osm2pgsqlCache = true;
      this.options.partitions = true;
      if (this.options.maxwordfreq) {
        this.options.maxwordfreq = parseInt(this.options.maxwordfreq);
      } else {
        this.options.maxwordfreq = 50000;
      }
      if (this.options.all === true) {
        this.options.createDb = true;
        this.options.setupDb = true;
        this.options.importData = true;
        this.options.createFunctions = true;
        this.options.createMinimalTables = true;
        this.options.createTables = true;
        this.options.createPartitionTables = true;
        this.options.createPartitionFunctions = true;
        this.options.loadData = true;
        this.options.calculatePostcodes = true;
        this.options.osmosisInit = true;
        this.options.createSearchIndices = true;
        this.options.createStreetTable = true;
        warn(this.msg_tag, 'append all entries here');
      }
      this.options.database = 'gnile';
      this.options.port = 5432;
    }

    Install.prototype.start = function() {
      this.step = -1;
      return this.next();
    };

    Install.prototype.next = function() {
      var Step, err, me, step;
      me = this;
      this.step++;
      if (this.step < Install.list.length) {
        try {
          Step = require('.' + path.sep + path.join('steps', Install.list[this.step]));
          step = new Step(this.options);
          step.on('done', (function(_this) {
            return function() {
              return _this.next();
            };
          })(this));
          step.on('error', (function(_this) {
            return function() {
              return _this.fatalError();
            };
          })(this));
          return step.start();
        } catch (_error) {
          err = _error;
          return error(this.msg_tag, err);
        }
      } else {
        return info(this.msg_tag, 'done');
      }
    };

    Install.prototype.fatalError = function() {
      error(this.msg_tag, 'stopped');
      return process.exit();
    };

    return Install;

  })(EventEmitter);

}).call(this);
