(function() {
  var Canvas, Command, PathText, Start, fs, gm, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  fs = require('fs');

  path = require('path');

  Canvas = require('canvas');

  gm = require('gm');

  PathText = require('../classes/server/classes/pathtext');

  module.exports = Start = (function(superClass) {
    extend(Start, superClass);

    function Start() {
      return Start.__super__.constructor.apply(this, arguments);
    }

    Start.commandName = 'text';

    Start.commandArgs = ['text'];

    Start.commandShortDescription = 'test path on text';

    Start.options = [
      {
        parameter: "-d, --debug [debug]",
        description: "enable the debug mode"
      }
    ];

    Start.help = function() {
      return "test path on text.";
    };

    Start.prototype.action = function(options, args) {
      var coord, filename, i, index, len, p, pt, x, y;
      if (args.text) {
        this.tileSize = 512;
        this.canvas = new Canvas(this.tileSize, this.tileSize);
        console.log(this.canvas.Path);
        this.ctx = this.canvas.getContext('2d');
        pt = new PathText(this.ctx);
        p = [];
        p.push([10, 10]);
        p.push([50, 100]);
        p.push([50, 150]);
        p.push([210, 210]);
        pt.setPath(p);
        pt.setText(args.text);
        this.ctx.textBaseline = "middle";
        this.ctx.font = '12px OpenSans';
        this.ctx.font = '22px Arial';
        this.ctx.lineWidth = 50;
        this.ctx.strokeWidth = 50;
        this.ctx.strokeStyle = '#00f';
        this.ctx.fillStyle = '#fff';
        pt.draw();
        console.log(this.ctx.textDrawingMode);
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00f';
        index = 0;
        for (i = 0, len = p.length; i < len; i++) {
          coord = p[i];
          x = coord[0];
          y = coord[1];
          if (index === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
          index++;
        }
        this.ctx.stroke();
        filename = 'path.png';
        return this.canvas.toBuffer(function(err, buf) {
          return fs.writeFile(filename, buf, function(err) {
            return process.nextTick(function() {
              return console.log('done');
            });
          });
        });
      }
    };

    return Start;

  })(Command);

}).call(this);
