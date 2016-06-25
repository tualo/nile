(function() {
  var MSS;

  module.exports = MSS = (function() {
    function MSS(css, variables, cmss) {
      var name;
      if (typeof variables === 'undefined') {
        variables = {};
      }
      this.offset = 0;
      this.css = css.replace(/\s/g, '');
      this.css = this.css.replace(/\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g, '');
      this.properties = {};
      this.instructions = {};
      this.variables = variables;
      if (typeof cmss !== 'undefined') {
        this.instructions = cmss.instructions;
        this.properties = cmss.properties;
        for (name in cmss.variables) {
          this.variables[name] = cmss.variables[name];
        }
      }
    }

    MSS.prototype.parse = function() {
      this.last = '';
      while (this.offset < this.css.length) {
        this.currentChar = this.css.charAt(this.offset);
        if (this.comment() && this.block() && this.semicolon()) {
          this.last += this.currentChar;
        }
        this.offset++;
      }
      delete this.offset;
      delete this.css;
      delete this.semicolon;
      delete this.block;
      delete this.findCloseBlock;
      delete this.comment;
      delete this.last;
      return delete this.currentChar;
    };

    MSS.prototype.semicolon = function() {
      var p;
      if (this.currentChar === ';') {
        p = this.last.indexOf(':');
        if (p > 0) {
          if (this.last.charAt(0) === '@') {
            this.variables[this.last.substring(1, p)] = this.last.substring(p + 1);
          } else {
            this.properties[this.last.substring(0, p)] = this.last.substring(p + 1);
          }
        } else {
          error('semicolon error on', this.last);
        }
        this.last = '';
        return false;
      } else {
        return true;
      }
    };

    MSS.prototype.block = function() {
      var closePos;
      if (this.currentChar === '{') {
        closePos = this.findCloseBlock();
        this.instructions[this.last] = new MSS(this.css.substring(this.offset + 1, closePos), this.variables, this.instructions[this.last]);
        this.instructions[this.last].parse();
        this.last = '';
        this.offset = closePos;
        return false;
      } else {
        return true;
      }
    };

    MSS.prototype.findCloseBlock = function() {
      var char, intend, position;
      position = this.offset + 1;
      intend = 0;
      while (position < this.css.length) {
        char = this.css.charAt(position);
        if (char === '}' && intend === 0) {
          break;
        } else if (char === '{') {
          intend++;
        } else if (char === '}') {
          intend--;
        }
        position++;
      }
      return position;
    };

    MSS.prototype.comment = function() {
      var stop;
      if (this.css.substring(this.offset, 2) === '/*') {
        stop = this.css.indexOf('*/', this.offset);
        if (stop > this.offset) {
          this.offset = stop + 1;
          this.last = "";
        } else {
          throw Error('missing closed comment');
        }
        return false;
      } else {
        return true;
      }
    };

    return MSS;

  })();

}).call(this);
