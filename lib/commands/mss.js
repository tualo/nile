(function() {
  var Command, GISDB, MSS, Server, Start, Template, Tile, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  Template = require('tualo-template');

  Server = require('../classes/server/server');

  MSS = require('../classes/server/classes/mss');

  Tile = require('../classes/server/routes/tile');

  GISDB = require('../classes/server/classes/gisdb');

  module.exports = Start = (function(superClass) {
    extend(Start, superClass);

    function Start() {
      return Start.__super__.constructor.apply(this, arguments);
    }

    Start.commandName = 'mss';

    Start.commandArgs = ['filename', 'zoom', 'x', 'y'];

    Start.commandShortDescription = 'compile mss';

    Start.options = [
      {
        parameter: "-d, --debug [debug]",
        description: "enable the debug mode"
      }
    ];

    Start.help = function() {
      return "compile mss.";
    };

    Start.prototype.action = function(options, args) {
      var db, gisdbOptions;
      if (args.filename && args.zoom && args.x && args.y) {
        gisdbOptions = {
          database: 'nile',
          port: 5432
        };
        db = new GISDB(gisdbOptions);
        return db.connect(function() {
          var tile;
          tile = new Tile(args.filename);
          return tile.queryTile(db, args.zoom, args.x, args.y, function(err, data) {
            var renderer;
            db.disconnect();
            renderer = tile.getImage(data, 512);
            return renderer.save('sampl.png');
          });
        });
      } else {
        return options.help();
      }
    };

    return Start;

  })(Command);

}).call(this);
