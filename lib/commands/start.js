(function() {
  var Carto, Command, Server, Start, Template, fs, path, tileConfig,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  Template = require('tualo-template');

  Server = require('../classes/server/server').Server;

  tileConfig = require('../classes/server/server').tileConfig;

  Carto = require('carto');

  module.exports = Start = (function(superClass) {
    extend(Start, superClass);

    function Start() {
      return Start.__super__.constructor.apply(this, arguments);
    }

    Start.commandName = 'start';

    Start.commandArgs = [];

    Start.commandShortDescription = 'start the server';

    Start.options = [
      {
        parameter: "-d, --debug [debug]",
        description: "enable the debug mode"
      }, {
        parameter: "-s, --style [style]",
        description: "point a mml style"
      }
    ];

    Start.help = function() {
      return "start nile server.\n";
    };

    Start.prototype.action = function(options, args) {
      var config, data, output, renderer, server;
      if (options.style) {
        renderer = new Carto.Renderer({
          filename: options.style
        });
        data = JSON.parse(fs.readFileSync(options.style, 'utf-8'));
        data.Stylesheet = data.Stylesheet.map(function(x) {
          if (typeof x !== 'string') {
            return {
              id: x,
              data: x.data
            };
          }
          return {
            id: x,
            data: fs.readFileSync(path.join(path.dirname(options.style), x), 'utf8')
          };
        });
        output = renderer.render(data);
        tileConfig(output, path.dirname(options.style));
      }
      config = {
        http: {
          active: true,
          ip: '127.0.0.1',
          port: 8080
        },
        https: {
          active: true,
          ip: '127.0.0.1',
          port: 8443
        }
      };
      server = new Server;
      server.set(config);
      if (options.debug) {
        server.setDebug(true);
      }
      return server.start();
    };

    return Start;

  })(Command);

}).call(this);
