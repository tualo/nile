(function() {
  var EventEmitter, OSM2PSQLCache, os, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  os = require('os');

  module.exports = OSM2PSQLCache = (function(superClass) {
    extend(OSM2PSQLCache, superClass);

    function OSM2PSQLCache(options) {
      this.msg_tag = 'osm2pgsqlCache';
      this.options = options;
    }

    OSM2PSQLCache.prototype.start = function() {
      this.totalMemory = os.freemem() / 1024 / 1024;
      this.memory = Math.floor(this.totalMemory * 0.8);
      if (this.options['cache']) {
        if (this.cache > this.totalMemory) {
          error(this.msg_tag, 'osm2pgsqlcache is larger than total memory');
        } else {
          this.memory = this.totalMemory;
        }
      }
      this.options['cache'] = this.memory;
      this.options['cpus'] = os.cpus();
      this.options['instances'] = this.options['cpus'].length;
      return this.done();
    };

    OSM2PSQLCache.prototype.done = function() {
      return this.emit('done');
    };

    return OSM2PSQLCache;

  })(EventEmitter);

}).call(this);
