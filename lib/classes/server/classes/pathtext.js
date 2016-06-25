(function() {
  var PathText;

  module.exports = PathText = (function() {
    function PathText(ctx) {
      this.ctx = ctx;
    }

    PathText.prototype.setPath = function(path) {
      return this.path = path;
    };

    PathText.prototype.setText = function(text) {
      return this.text = text;
    };

    PathText.prototype.draw = function() {
      var best_index, holeTextLength, i, index, j, l, len, len1, p, pathParts, strategy, sum, textPartLength, textParts;
      this.ctx.textDrawingMode = "glyph";
      this.pathSegment = 0;
      this.wordPathOffset = 0;
      this.totalWordOffset = 0;
      this.totalPathOffset = 0;
      this.charSpacing = 1;
      pathParts = this.pathLength(this.path);
      textParts = this.split(this.text);
      textPartLength = [];
      for (i = 0, len = textParts.length; i < len; i++) {
        p = textParts[i];
        textPartLength.push(this.ctx.measureText(p).width);
      }
      holeTextLength = this.ctx.measureText(this.text).width;
      strategy = 'strategie_1';
      best_index = 0;
      index = 0;
      sum = 0;
      for (j = 0, len1 = pathParts.length; j < len1; j++) {
        l = pathParts[j];
        sum += l;
        if (l > holeTextLength) {
          strategy = 'strategie_3';
          console.log('found one A* place for text', index);
          best_index = index;
        }
        if (textPartLength.length > 0) {
          if (l > textPartLength[0]) {
            textPartLength.shift();
          }
        }
        index++;
      }
      if (textPartLength.length === 0 && strategy !== 'strategie_3') {
        strategy = 'strategie_2';
      }
      if (sum < holeTextLength + this.charSpacing * this.text.length) {
        strategy = 'strategie_0';
      }
      console.log('using ', strategy);
      console.log('path ', this.path);
      console.log('holePathLength ', sum);
      console.log('holeTextLength ', holeTextLength * this.charSpacing * this.text.length);
      console.log('pathParts ', pathParts);
      return this[strategy](best_index);
    };

    PathText.prototype.split = function(text) {
      var i, index, parts, ref, result;
      result = [];
      parts = text.split(/-/);
      for (index = i = 0, ref = parts.length - 1; 0 <= ref ? i <= ref : i >= ref; index = 0 <= ref ? ++i : --i) {
        if (index !== parts.length - 1) {
          parts[index] += '-';
        }
        result = result.concat(parts[index].split(/\s/));
      }
      return result;
    };

    PathText.prototype.pathLength = function(path) {
      var i, ref, result, seg;
      result = [];
      for (seg = i = 0, ref = path.length - 2; 0 <= ref ? i <= ref : i >= ref; seg = 0 <= ref ? ++i : --i) {
        result.push(this.getLength(path[seg][0], path[seg][1], path[seg + 1][0], path[seg + 1][1]));
      }
      return result;
    };

    PathText.prototype.strategie_3 = function(index) {
      var angle;
      this.pathSegment = index;
      angle = this.getAngle(this.path[this.pathSegment][0], this.path[this.pathSegment][1], this.path[this.pathSegment + 1][0], this.path[this.pathSegment + 1][1]);
      this.ctx.save();
      this.ctx.translate(this.path[this.pathSegment][0], this.path[this.pathSegment][1]);
      this.ctx.rotate(angle);
      this.ctx.strokeText(this.text, 0, 0);
      this.ctx.fillText(this.text, 0, 0);
      return this.ctx.restore();
    };

    PathText.prototype.strategie_2 = function() {
      var angle, i, index, j, l, len, len1, p, pathParts, results, text, textPartLength, textParts;
      pathParts = this.pathLength(this.path);
      textParts = this.split(this.text);
      textPartLength = [];
      for (i = 0, len = textParts.length; i < len; i++) {
        p = textParts[i];
        textPartLength.push(this.ctx.measureText(p).width);
      }
      index = 0;
      results = [];
      for (j = 0, len1 = pathParts.length; j < len1; j++) {
        l = pathParts[j];
        if (textPartLength.length > 0) {
          if (l > textPartLength[0]) {
            textPartLength.shift();
            text = textParts.shift();
            this.pathSegment = index;
            angle = this.getAngle(this.path[this.pathSegment][0], this.path[this.pathSegment][1], this.path[this.pathSegment + 1][0], this.path[this.pathSegment + 1][1]);
            this.ctx.save();
            this.ctx.translate(this.path[this.pathSegment][0], this.path[this.pathSegment][1]);
            this.ctx.rotate(angle);
            this.ctx.strokeText(this.text, 0, 0);
            this.ctx.fillText(this.text, 0, 0);
            this.ctx.restore();
          }
        }
        results.push(index++);
      }
      return results;
    };

    PathText.prototype.strategie_1 = function() {
      var aPart, angle, bPart, char, charBBox, currentPathLength, error, i, index, lengthOfPath, letterCenter, pointXOnPath, pointYOnPath, ref, results;
      try {
        results = [];
        for (index = i = 0, ref = this.text.length - 1; 0 <= ref ? i <= ref : i >= ref; index = 0 <= ref ? ++i : --i) {
          char = this.text.charAt(index);
          charBBox = this.ctx.measureText(char);
          angle = 0.5;
          angle = this.getAngle(this.path[this.pathSegment][0], this.path[this.pathSegment][1], this.path[this.pathSegment + 1][0], this.path[this.pathSegment + 1][1]);
          debug('angle', angle);
          pointXOnPath = 0;
          pointYOnPath = 0;
          currentPathLength = this.getLength(this.path[this.pathSegment][0], this.path[this.pathSegment][1], this.path[this.pathSegment + 1][0], this.path[this.pathSegment + 1][1]);
          if (this.wordPathOffset + charBBox.width < currentPathLength) {
            letterCenter = charBBox.width / 2;
            lengthOfPath = this.wordPathOffset;
            aPart = 0;
            bPart = 0;
            if (currentPathLength !== 0) {
              aPart = (this.path[this.pathSegment + 1][0] - this.path[this.pathSegment][0]) * lengthOfPath / currentPathLength;
              bPart = (this.path[this.pathSegment + 1][1] - this.path[this.pathSegment][1]) * lengthOfPath / currentPathLength;
            }
            pointXOnPath = this.path[this.pathSegment + 0][0] + aPart;
            pointYOnPath = this.path[this.pathSegment + 0][1] + bPart;
            this.wordPathOffset += charBBox.width;
            this.wordPathOffset += this.charSpacing;
          } else {
            this.totalPathOffset += currentPathLength;
            this.pathSegment++;
            this.wordPathOffset = 0;
            letterCenter = charBBox.width / 2;
            lengthOfPath = this.wordPathOffset;
            aPart = 0;
            bPart = 0;
            if (currentPathLength !== 0) {
              aPart = (this.path[this.pathSegment + 1][0] - this.path[this.pathSegment][0]) * lengthOfPath / currentPathLength;
              bPart = (this.path[this.pathSegment + 1][1] - this.path[this.pathSegment][1]) * lengthOfPath / currentPathLength;
            }
            pointXOnPath = this.path[this.pathSegment + 0][0] + aPart;
            pointYOnPath = this.path[this.pathSegment + 0][1] + bPart;
            this.wordPathOffset += charBBox.width;
            this.wordPathOffset += this.charSpacing;
          }
          this.totalWordOffset += charBBox.width;
          this.totalWordOffset += this.charSpacing;
          this.ctx.save();
          this.ctx.translate(pointXOnPath, pointYOnPath);
          this.ctx.rotate(angle);
          this.ctx.strokeText(this.text, 0, 0);
          this.ctx.fillText(this.text, 0, 0);
          results.push(this.ctx.restore());
        }
        return results;
      } catch (_error) {
        error = _error;
      }
    };

    PathText.prototype.strategie_0 = function() {};

    PathText.prototype.getAngle = function(x1, y1, x2, y2) {
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

    PathText.prototype.getLength = function(x1, y1, x2, y2) {
      var a, b, c;
      a = x2 - x1;
      b = y2 - y1;
      return c = Math.sqrt(a * a + b * b);
    };

    return PathText;

  })();

}).call(this);
