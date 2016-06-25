(function() {
  var Canvas, Geocoords, MSSRenderer, PathText, Template, fs;

  Canvas = require('canvas');

  fs = require('fs');

  Geocoords = require('geocoords');

  Template = require('tualo-template');

  PathText = require('./pathtext');

  module.exports = MSSRenderer = (function() {
    function MSSRenderer(mss, data) {
      this.data = data;
      this.mss = mss;
      this.scale = 1;
    }

    MSSRenderer.prototype.toBuffer = function(callback) {
      return this.canvas.toBuffer(callback);
    };

    MSSRenderer.prototype.save = function(filename, callback) {
      return this.canvas.toBuffer(function(err, buf) {
        return fs.writeFile(filename, buf, function(err) {
          return process.nextTick(function() {
            if (typeof callback === 'function') {
              return callback(err);
            }
          });
        });
      });
    };

    MSSRenderer.prototype.render = function(tileSize) {
      var name, results;
      this.item_hash = {};
      this.granularity = 10000;
      this.tileSize = tileSize;
      this.canvas = new Canvas(this.tileSize, this.tileSize);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(this.tileSize / this.granularity, this.tileSize / this.granularity);
      debug('render', tileSize);
      results = [];
      for (name in this.data) {
        results.push(this.renderItem(name));
      }
      return results;
    };

    MSSRenderer.prototype.renderItem = function(oname) {
      var item, j, lbbox, len, lonlatbbox, name, ref, results;
      name = oname;
      if (name === 'Map') {
        lbbox = this.data['Map'].lbbox;
        lonlatbbox = Geocoords.from900913To4326(lbbox);
        this.meterScale = this.granularity / this.lonlat2meters(lonlatbbox[0], lonlatbbox[1], lonlatbbox[2], lonlatbbox[3]);
        this.x_offset = 0;
        this.y_offset = 0;
        this.scale = 1;
        debug('meterScale', this.meterScale);
        this.defaultProperties();
        debug('scale', this.scale);
        debug('x_offset', this.x_offset);
        return debug('y_offset', this.y_offset);
      } else {
        name = name.replace(/^#/, '');
        if (typeof this.mss.instructions['#' + name] === 'object') {
          ref = this.data[oname];
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            item = ref[j];
            results.push(this.renderDataItem(this.mss.instructions['#' + name], item, name));
          }
          return results;
        }
      }
    };

    MSSRenderer.prototype.renderDataItem = function(instruction, item, debugName) {
      var coord, index, j, k, len, len1, len2, len3, len4, linestring, n, o, q, ref, ref1, ref2, x, y;
      index = 0;
      this.defaultProperties();
      this.setupCTX(instruction, item);
      if (item.data.type === 'Polygon') {
        this.ctx.beginPath();
        ref = item.data.coordinates;
        for (j = 0, len = ref.length; j < len; j++) {
          linestring = ref[j];
          for (k = 0, len1 = linestring.length; k < len1; k++) {
            coord = linestring[k];
            x = (coord[0] - this.x_offset) * this.scale;
            y = this.granularity - (coord[1] - this.y_offset) * this.scale;
            if (index === 0) {
              this.ctx.moveTo(x, y);
            } else {
              this.ctx.lineTo(x, y);
            }
            index++;
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }
      if (item.data.type === 'MultiLineString') {
        ref1 = item.data.coordinates;
        for (n = 0, len2 = ref1.length; n < len2; n++) {
          linestring = ref1[n];
          this.ctx.beginPath();
          for (o = 0, len3 = linestring.length; o < len3; o++) {
            coord = linestring[o];
            x = (coord[0] - this.x_offset) * this.scale;
            y = this.granularity - (coord[1] - this.y_offset) * this.scale;
            if (index === 0) {
              this.ctx.moveTo(x, y);
            } else {
              this.ctx.lineTo(x, y);
            }
            index++;
          }
          this.ctx.stroke();
          if (debugName === 'roadtext') {
            if (item.name != null) {
              this.ctx.textBaseline = "middle";
              this.ctx.fillStyle = 'black';
              this.ctx.strokeStyle = 'white';
              this.ctx.font = '360px sans-serif';
              this.drawText(this.ctx, '   ' + item.name, this.preprocessCoorinates(item.data.coordinates));
            }
          }
        }
      }
      if (item.data.type === 'LineString') {
        this.ctx.beginPath();
        ref2 = item.data.coordinates;
        for (q = 0, len4 = ref2.length; q < len4; q++) {
          coord = ref2[q];
          x = (coord[0] - this.x_offset) * this.scale;
          y = this.granularity - (coord[1] - this.y_offset) * this.scale;
          if (index === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
          index++;
        }
        this.ctx.stroke();
        if (debugName === 'roadtext') {
          if (item.name != null) {
            this.ctx.textBaseline = "middle";
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
            this.ctx.font = '360px sans-serif';
            return this.drawText(this.ctx, '   ' + item.name, this.preprocessCoorinates(item.data.coordinates));
          }
        }
      }
    };

    MSSRenderer.prototype.preprocessCoorinates = function(coords) {
      var coord, j, len, result, x, y;
      result = [];
      for (j = 0, len = coords.length; j < len; j++) {
        coord = coords[j];
        x = (coord[0] - this.x_offset) * this.scale;
        y = this.granularity - ((coord[1] - this.y_offset) * this.scale);
        result.push([x, y]);
      }
      return result;
    };

    MSSRenderer.prototype.getSegments = function(path) {
      var index, j, k, l, lastpoint, list, p, point, ref, ref1;
      list = [];
      lastpoint = path[0];
      for (index = j = 1, ref = path.length - 1; 1 <= ref ? j <= ref : j >= ref; index = 1 <= ref ? ++j : --j) {
        point = path[index];
        l = Math.floor(this.getLength(point[0], point[1], lastpoint[0], lastpoint[1]));
        for (p = k = 0, ref1 = l; 0 <= ref1 ? k <= ref1 : k >= ref1; p = 0 <= ref1 ? ++k : --k) {
          list.push(index - 1);
        }
        lastpoint = point;
      }
      return list;
    };

    MSSRenderer.prototype.getAngles = function(path) {
      var index, j, lastpoint, list, point, ref;
      list = [];
      lastpoint = path[0];
      for (index = j = 1, ref = path.length - 1; 1 <= ref ? j <= ref : j >= ref; index = 1 <= ref ? ++j : --j) {
        point = path[index];
        list.push(this.getAngle(point[0], point[1], lastpoint[0], lastpoint[1]));
        lastpoint = point;
      }
      return list;
    };

    MSSRenderer.prototype.getAngle = function(x1, y1, x2, y2) {
      var c, r;
      c = this.getLength(x1, y1, x2, y2);
      r = 0;
      if (x1 > x2) {
        r = Math.asin((y1 - y2) / c) - Math.PI;
      } else {
        r = Math.asin((y2 - y1) / c);
      }
      return r;
    };

    MSSRenderer.prototype.getLength = function(x1, y1, x2, y2) {
      var a, b, c;
      a = x2 - x1;
      b = y2 - y1;
      return c = Math.sqrt(a * a + b * b);
    };

    MSSRenderer.prototype.drawText = function(ctx, text, data) {
      var currentX, i, j, l, m, pathSequence, ref, sequenceLength, strategie, textLength, w;
      m = data.length;
      ctx.textDrawingMode = "glyph";
      textLength = text.length;
      sequenceLength = [];
      w = ctx.measureText(text).width;
      l = 0;
      pathSequence = 0;
      for (i = j = 0, ref = m - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        if (i > 0) {
          currentX = this.getLength(data[i - 1][0], data[i - 1][1], data[i][0], data[i][1]);
          if (currentX > w) {
            strategie = 1;
            pathSequence = i - 1;
          }
          sequenceLength.push(w);
          l += currentX;
        }
      }
      currentX = 0;
      if (w > l) {

      } else {
        ctx.textBaseline = 'middle';
        if (m > 0) {
          if (strategie === 1) {
            ctx.save();
            ctx.translate(data[pathSequence][0], data[pathSequence][1]);
            ctx.rotate(this.getAngle(data[pathSequence][0], data[pathSequence][1], data[pathSequence + 1][0], data[pathSequence + 1][1]));
            ctx.strokeText(text, currentX, 0, 10000);
            ctx.fillText(text, currentX, 0, 10000);
            ctx.translate(data[pathSequence][0] * -1, data[pathSequence][1] * -1);
            return ctx.restore();
          }
        }
      }
    };

    MSSRenderer.prototype.setupCTX = function(instruction, item) {
      var name, results;
      this.setupProperties(instruction.properties, instruction.variables, item.tags);
      results = [];
      for (name in instruction.instructions) {
        if (this.matches(item, name)) {
          results.push(this.setupProperties(instruction.instructions[name].properties, instruction.variables, item.tags));
        }
      }
      return results;
    };

    MSSRenderer.prototype.matches = function(item, name) {
      var eq, gr, gt, j, key, len, lo, lt, names, result, value;
      result = false;
      names = name.split(',');
      for (j = 0, len = names.length; j < len; j++) {
        name = names[j];
        if (name.charAt(0) === '[' && name.charAt(name.length - 1) === ']') {
          name = name.substring(1, name.length - 1);
          gt = name.indexOf('>=');
          lt = name.indexOf('<=');
          eq = name.indexOf('=');
          gr = name.indexOf('>');
          lo = name.indexOf('<');
          if (gt > 0) {
            key = name.substring(0, gt);
            value = name.substring(gt + 1);
            result = item[key] >= value ? true : false;
          } else if (lt > 0) {
            key = name.substring(0, lt);
            value = name.substring(lt + 1);
            result = item[key] <= value ? true : false;
          } else if (eq > 0) {
            key = name.substring(0, eq);
            value = name.substring(eq + 1);
            result = item[key] + '' === value + '' ? true : false;
          } else if (gr > 0) {
            key = name.substring(0, gr);
            value = name.substring(gr + 1);
            result = item[key] > value ? true : false;
          } else if (lo > 0) {
            key = name.substring(0, lo);
            value = name.substring(lo + 1);
            result = item[key] < value ? true : false;
          }
          if (value = '*') {
            result = true;
          }
          if (result) {
            return result;
          }
        }
      }
      return result;
    };

    MSSRenderer.prototype.setupProperties = function(properties, variables, tags) {
      var prop, results;
      results = [];
      for (prop in properties) {
        results.push(this.setProperty(prop, properties[prop], variables, tags));
      }
      return results;
    };

    MSSRenderer.prototype.setProperty = function(prop, value, variables, tags) {
      var amt, b, col, cols, e, g, j, k, len, len1, matches, name, num, orig, r, rgb, sctx, str;
      matches = value.match(/(@[a-zA-Z0-9]+)+/g);
      if (matches != null) {
        for (j = 0, len = matches.length; j < len; j++) {
          str = matches[j];
          if (typeof variables[str.substring(1)] !== 'undefined') {
            value = value.replace(str, variables[str.substring(1)]);
          }
          if (typeof tags[str.substring(1)] !== 'undefined') {
            value = value.replace(str, tags[str.substring(1)]);
          }
        }
        sctx = new Template.Shunt.Context();
        for (name in tags) {
          sctx.def(name, tags[name]);
        }
        sctx.def('add', function(a, b) {
          return a * 1 + b * 1;
        });
        sctx.def('mult', function(a, b) {
          return a * 1 * b * 1;
        });
        sctx.def('rgb', function(r, g, b) {
          var c;
          c = (g | (b << 8) | (r << 16)).toString(16);
          while (c.length < 6) {
            c = '0' + c;
          }
          return '#' + c;
        });
        sctx.def('lighten', function(col, amt) {
          var b, c, g, num, r, usePound;
          usePound = false;
          if (col[0] === "#") {
            col = col.slice(1);
            usePound = true;
          }
          num = parseInt(col, 16);
          r = (num >> 16) + amt;
          if (r > 255) {
            r = 255;
          } else if (r < 0) {
            r = 0;
          }
          b = ((num >> 8) & 0x00FF) + amt;
          if (b > 255) {
            b = 255;
          } else if (b < 0) {
            b = 0;
          }
          g = (num & 0x0000FF) + amt;
          if (g > 255) {
            g = 255;
          } else if (g < 0) {
            g = 0;
          }
          c = (g | (b << 8) | (r << 16)).toString(16);
          while (c.length < 6) {
            c = '0' + c;
          }
          return "#" + c;
        });
        try {
          cols = value.match(/(#[a-f0-9]+)/g);
          if (cols != null) {
            for (k = 0, len1 = cols.length; k < len1; k++) {
              col = cols[k];
              orig = col;
              col = col.slice(1);
              if (col.length === 3) {
                col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];
              }
              amt = 0;
              num = parseInt(col, 16);
              r = (num >> 16) + amt;
              if (r > 255) {
                r = 255;
              } else if (r < 0) {
                r = 0;
              }
              b = ((num >> 8) & 0x00FF) + amt;
              if (b > 255) {
                b = 255;
              } else if (b < 0) {
                b = 0;
              }
              g = (num & 0x0000FF) + amt;
              if (g > 255) {
                g = 255;
              } else if (g < 0) {
                g = 0;
              }
              rgb = 'rgb(' + r + ',' + g + ',' + b + ')';
              value = value.replace(new RegExp(orig, "g"), rgb);
            }
          }
          value = Shunt.parse(value, sctx);
        } catch (_error) {
          e = _error;
        }
      }
      debug('setProperty*', prop + '#' + value);
      if (prop === 'line-width') {
        this.ctx.lineWidth = value * this.meterScale;
      }
      if (prop === 'line-color') {
        this.ctx.strokeStyle = value;
      }
      if (prop === 'fill-color') {
        this.ctx.fillStyle = value;
      }
      if (prop === 'background-color') {
        return this.ctx.fillStyle = value;
      }
    };

    MSSRenderer.prototype.lonlat2meters = function(lat1, lon1, lat2, lon2) {
      var R, a, c, d, delta1, delta2, o1, o2;
      R = 6371;
      o1 = this.toRad(lat1);
      o2 = this.toRad(lat2);
      delta1 = this.toRad(lat2 - lat1);
      delta2 = this.toRad(lon2 - lon1);
      a = Math.sin(delta1 / 2) * Math.sin(delta1 / 2) + Math.cos(o1) * Math.cos(o2) * Math.sin(delta2 / 2) * Math.sin(delta2 / 2);
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      d = R * c;
      return d * 1000;
    };

    MSSRenderer.prototype.toRad = function(v) {
      return v * Math.PI / 180;
    };

    MSSRenderer.prototype.defaultProperties = function() {
      this.ctx.globalAlpha = 1;
      this.ctx.lineWidth = 0.00001;
      this.ctx.fillStyle = "none";
      this.ctx.strokeStyle = "none";
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.shadowBlur = 0;
      return this.ctx.shadowColor = 'transparent';
    };

    return MSSRenderer;

  })();

}).call(this);
