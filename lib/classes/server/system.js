(function() {
  var EventEmitter, System,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  module.exports = System = (function(superClass) {
    extend(System, superClass);

    function System(server) {
      this.server = server;
    }

    System.prototype.loadMiddleware = function(middleware) {
      if (typeof middleware === 'function') {
        return this.server.app.use(middleware);
      }
    };

    System.prototype.loadRoute = function(path, routeFile) {
      var error, route;
      try {
        route = require(routeFile);
        return this.server.app.use(path, route);
      } catch (_error) {
        error = _error;
        return server.error("system init route", error);
      }
    };

    return System;

  })(EventEmitter);

}).call(this);
