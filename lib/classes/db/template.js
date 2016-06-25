(function() {
  var EventEmitter, STemplate, Template, fs, os, path, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('tualo-template');

  module.exports = STemplate = (function(superClass) {
    extend(STemplate, superClass);

    function STemplate() {
      return STemplate.__super__.constructor.apply(this, arguments);
    }

    STemplate.startstop = function(data) {
      var i, len, line, lines, opt, res, state;
      lines = data.split("\n");
      res = [];
      state = 0;
      for (i = 0, len = lines.length; i < len; i++) {
        line = lines[i];
        if (line === '-- start') {
          state = 1;
        }
        if (line === '-- end') {
          state = 0;
        }
        if (res.length > 0 && res[res.length - 1].state === state) {
          res[res.length - 1].txt += "\n";
          res[res.length - 1].txt += line;
        } else {
          opt = {
            state: state,
            txt: line
          };
          res.push(opt);
        }
      }
      return res;
    };

    STemplate.render = function(options, data) {
      var i, j, len, len1, m, obj, r, ref, res, row, s, template, txt;
      template = new Template(data);
      obj = {
        'www-user': 'www-data',
        'modulepath': options['modulepath'] ? options['modulepath'] : '',
        'ts:address-data': options['addressData'] ? 'TABLESPACE "' + options['addressData'] + '"' : '',
        'ts:address-index': options['addressIndex'] ? 'TABLESPACE "' + options['addressIndex'] + '"' : '',
        'ts:search-data': options['searchData'] ? 'TABLESPACE "' + options['searchData'] + '"' : '',
        'ts:search-index': options['searchIndex'] ? 'TABLESPACE "' + options['searchIndex'] + '"' : '',
        'ts:aux-data': options['auxIndex'] ? 'TABLESPACE "' + options['auxIndex'] + '"' : '',
        'ts:aux-index': options['auxData'] ? 'TABLESPACE "' + options['auxData'] + '"' : ''
      };
      txt = template.render(obj);
      res = [];
      if (typeof options['partitions'] === 'object') {
        r = /--\sstart.*?--\send/g;
        m = STemplate.startstop(txt);
        for (i = 0, len = m.length; i < len; i++) {
          s = m[i];
          if (s.state === 0) {
            res.push(s.txt);
          } else {
            ref = options['partitions'];
            for (j = 0, len1 = ref.length; j < len1; j++) {
              row = ref[j];
              res.push(s.txt.replace(/-partition-/g, row.partition));
            }
          }
        }
      }
      return res.join("\n");
    };

    return STemplate;

  })(EventEmitter);

}).call(this);
