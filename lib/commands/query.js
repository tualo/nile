(function() {
  var Command, GISDB, Geocode, Query, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  fs = require('fs');

  path = require('path');

  Geocode = require('../classes/db/geocode');

  GISDB = require('../classes/server/classes/gisdb');

  module.exports = Query = (function(superClass) {
    extend(Query, superClass);

    function Query() {
      return Query.__super__.constructor.apply(this, arguments);
    }

    Query.commandName = 'query';

    Query.commandArgs = ['query'];

    Query.commandShortDescription = 'query an address';

    Query.options = [
      {
        parameter: "-d, --debug [debug]",
        description: "enable the debug mode"
      }
    ];

    Query.help = function() {
      return "    ";
    };

    Query.prototype.action = function(options, args) {
      var gisdbOptions;
      if (args.query) {
        this.query = args.query;
        gisdbOptions = {
          database: options.dbname || 'nile',
          port: 5432
        };
        this.db = new GISDB(gisdbOptions);
        return this.db.connect((function(_this) {
          return function() {
            return _this.onDBConnect();
          };
        })(this));
      }
    };

    Query.prototype.onDBConnect = function() {
      this.geocode = new Geocode(this.db);
      this.geocode.setQuery(this.query);
      return this.geocode.lookup();
    };

    return Query;

  })(Command);

}).call(this);
