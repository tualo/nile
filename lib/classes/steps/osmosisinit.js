(function() {
  var DBCommand, EventEmitter, OsmosisInit, Template, fs, os, path, request, spawn,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  spawn = require('child_process').spawn;

  fs = require('fs');

  os = require('os');

  path = require('path');

  Template = require('../db/template');

  DBCommand = require('../db/command');

  request = require('request');

  module.exports = OsmosisInit = (function(superClass) {
    extend(OsmosisInit, superClass);

    function OsmosisInit(options) {
      this.msg_tag = 'osmosisInit';
      this.options = options;
      this.settingsPath = path.join(process.cwd(), 'settings');
      this.stateTXTFile = path.join(process.cwd(), 'settings', 'state.txt');
      this.settingsFile = path.join(this.settingsPath, 'configuration.txt');
      this.replicationURL = 'http://planet.openstreetmap.org/replication/minute';
    }

    OsmosisInit.prototype.start = function() {
      if (this.options[this.msg_tag]) {
        debug(this.msg_tag, 'osmosis init');
        return fs.exists(this.settingsFile, (function(_this) {
          return function(exists) {
            return _this.initSettings(exists);
          };
        })(this));
      } else {
        return this.done();
      }
    };

    OsmosisInit.prototype.initSettings = function(exists) {
      var opt, proc;
      if (exists === false) {
        opt = {
          cwd: process.cwd(),
          env: process.env
        };
        proc = spawn('osmosis', ['--read-replication-interval-init', this.settingsPath], opt);
        proc.on('close', (function(_this) {
          return function(code) {
            return _this.onInitSettings(code);
          };
        })(this));
        proc.stderr.on('data', (function(_this) {
          return function(data) {
            return _this.error(data);
          };
        })(this));
        return proc.stdout.on('data', (function(_this) {
          return function(data) {
            return _this.output(data);
          };
        })(this));
      } else {
        return this.maxID();
      }
    };

    OsmosisInit.prototype.onInitSettings = function(code) {
      return this.maxID();
    };

    OsmosisInit.prototype.maxID = function() {
      var command, sql;
      sql = 'select max(osm_id) m from place where osm_type = \'N\'';
      command = new DBCommand(this.options);
      return command.getOne(sql, (function(_this) {
        return function(err, result) {
          return _this.onMaxID(err, result);
        };
      })(this));
    };

    OsmosisInit.prototype.onMaxID = function(err, result) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        this.iLastOSMID = result.m;
        return this.nodeRequest();
      }
    };

    OsmosisInit.prototype.nodeRequest = function() {
      return request('http://www.openstreetmap.org/api/0.6/node/' + this.iLastOSMID + '/1', (function(_this) {
        return function(error, response, body) {
          return _this.onNodeRequest(error, response, body);
        };
      })(this));
    };

    OsmosisInit.prototype.onNodeRequest = function(err, response, body) {
      var lastNodeDate, m;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        if (response.statusCode === 200) {
          this.lastNodeXML = body;
          m = this.lastNodeXML.match(/(([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})Z)/);
          if (m) {
            lastNodeDate = new Date(m[1]);
            this.lastNodeDate = new Date(lastNodeDate.getTime() - (3 * 60 * 60 * 1000));
            return this.getStateFile();
          } else {
            return error(this.msg_tag, 'error while parsing last node xml');
          }
        } else {
          return error(this.msg_tag, response.statusCode);
        }
      }
    };

    OsmosisInit.prototype.getStateFile = function() {
      return request(this.replicationURL + '/?C=M;O=D;F=1', (function(_this) {
        return function(error, response, body) {
          return _this.onGetStateFile(error, response, body);
        };
      })(this));
    };

    OsmosisInit.prototype.onGetStateFile = function(err, response, body) {
      var date, dates, dt, fn, i, j, len, len1, link, m, p;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        if (response.statusCode === 200) {
          m = body.match(/<a\shref="[0-9]{3}\/">([0-9]{3}\/)<\/a>\s*([-0-9a-zA-Z]+\s[0-9]{2}:[0-9]{2})/gi);
          if (!m) {
            return error(this.msg_tag, 'error while reading ' + this.replicationURL);
          } else {
            date = new Date;
            link = '';
            dates = [];
            for (i = 0, len = m.length; i < len; i++) {
              dt = m[i];
              dates.push({
                date: (dt.replace(/(\s){2}/gi, '#').split('#')).pop(),
                link: (dt.replace(/(\s){2}/gi, '#').split('#')).shift()
              });
            }
            fn = function(a, b) {
              var res;
              res = 0;
              if (a.date > b.date) {
                res = 1;
              }
              if (a.date < b.date) {
                res = -1;
              }
              return res;
            };
            dates.sort(fn);
            dates.reverse();
            for (j = 0, len1 = dates.length; j < len1; j++) {
              dt = dates[j];
              if ((new Date(dt.date)) < this.lastNodeDate) {
                break;
              }
              date = new Date(dt.date);
              p = dt.link.match(/([0-9]){3}/);
              if (p) {
                link = p[0];
              }
            }
            if (link !== '') {
              this.subReplicationURL = this.replicationURL + '/' + link + '';
              return this.getStateFile2();
            }
          }
        } else {
          return error(this.msg_tag, response.statusCode);
        }
      }
    };

    OsmosisInit.prototype.getStateFile2 = function() {
      return request(this.subReplicationURL + '/?C=M;O=D;F=1', (function(_this) {
        return function(error, response, body) {
          return _this.onGetStateFile2(error, response, body);
        };
      })(this));
    };

    OsmosisInit.prototype.onGetStateFile2 = function(err, response, body) {
      var date, dates, dt, fn, i, j, len, len1, link, m, p;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        if (response.statusCode === 200) {
          m = body.match(/<a\shref="[0-9]{3}\/">([0-9]{3}\/)<\/a>\s*([-0-9a-zA-Z]+\s[0-9]{2}:[0-9]{2})/gi);
          if (!m) {
            return error(this.msg_tag, 'error while reading ' + this.subReplicationURL);
          } else {
            date = new Date;
            link = '';
            dates = [];
            for (i = 0, len = m.length; i < len; i++) {
              dt = m[i];
              dates.push({
                date: (dt.replace(/(\s){2}/gi, '#').split('#')).pop(),
                link: (dt.replace(/(\s){2}/gi, '#').split('#')).shift()
              });
            }
            fn = function(a, b) {
              var res;
              res = 0;
              if (a.date > b.date) {
                res = 1;
              }
              if (a.date < b.date) {
                res = -1;
              }
              return res;
            };
            dates.sort(fn);
            dates.reverse();
            for (j = 0, len1 = dates.length; j < len1; j++) {
              dt = dates[j];
              if ((new Date(dt.date)) < this.lastNodeDate) {
                break;
              }
              date = new Date(dt.date);
              p = dt.link.match(/([0-9]){3}/);
              if (p) {
                link = p[0];
              }
            }
            if (link !== '') {
              this.subSubReplicationURL = this.subReplicationURL + '/' + link + '';
              return this.getStateFile3();
            }
          }
        } else {
          return error(this.msg_tag, response.statusCode);
        }
      }
    };

    OsmosisInit.prototype.getStateFile3 = function() {
      return request(this.subSubReplicationURL + '/?C=M;O=D;F=1', (function(_this) {
        return function(error, response, body) {
          return _this.onGetStateFile3(error, response, body);
        };
      })(this));
    };

    OsmosisInit.prototype.onGetStateFile3 = function(err, response, body) {
      var date, dates, dt, fn, i, j, len, len1, link, m, p;
      if (err) {
        return error(this.msg_tag, err);
      } else {
        if (response.statusCode === 200) {
          m = body.match(/>([0-9]){3}.state.txt<\/a>\s*([-0-9a-zA-Z]+\s[0-9]{2}:[0-9]{2})/gi);
          if (!m) {
            return error(this.msg_tag, 'error while reading ' + this.subSubReplicationURL);
          } else {
            date = new Date;
            link = '';
            dates = [];
            for (i = 0, len = m.length; i < len; i++) {
              dt = m[i];
              dates.push({
                date: (dt.replace(/(\s){2}/gi, '#').split('#')).pop(),
                link: (dt.replace(/(\s){2}/gi, '#').split('#')).shift()
              });
            }
            fn = function(a, b) {
              var res;
              res = 0;
              if (a.date > b.date) {
                res = 1;
              }
              if (a.date < b.date) {
                res = -1;
              }
              return res;
            };
            dates.sort(fn);
            dates.reverse();
            for (j = 0, len1 = dates.length; j < len1; j++) {
              dt = dates[j];
              if ((new Date(dt.date)) < this.lastNodeDate) {
                break;
              }
              date = dt.date;
              p = dt.link.match(/([0-9]){3}/);
              if (p) {
                link = p[0];
              }
            }
            if (link !== '') {
              this.stateTXT = this.subSubReplicationURL + '/' + link + '.state.txt' + '';
              this.lastDate = date;
              return this.getStateTXT();
            }
          }
        } else {
          return error(this.msg_tag, response.statusCode);
        }
      }
    };

    OsmosisInit.prototype.getStateTXT = function() {
      return request(this.stateTXT, (function(_this) {
        return function(error, response, body) {
          return _this.onGetStateTXT(error, response, body);
        };
      })(this));
    };

    OsmosisInit.prototype.onGetStateTXT = function(err, response, body) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        if (response.statusCode === 200) {
          return fs.writeFile(this.stateTXTFile, body, (function(_this) {
            return function(err) {
              return _this.onWriteStateTXT(err);
            };
          })(this));
        } else {
          return error(this.msg_tag, response.statusCode);
        }
      }
    };

    OsmosisInit.prototype.onWriteStateTXT = function(err) {
      if (err) {
        return error(this.msg_tag, err);
      } else {
        info(this.msg_tag, 'state file written');
        return this.deleteImportStatus();
      }
    };

    OsmosisInit.prototype.deleteImportStatus = function() {
      var command, sql;
      sql = 'TRUNCATE import_status';
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onDeleteImportStatus(err, result);
        };
      })(this));
    };

    OsmosisInit.prototype.onDeleteImportStatus = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      return this.importStatus();
    };

    OsmosisInit.prototype.importStatus = function() {
      var command, sql;
      sql = 'INSERT INTO import_status VALUES(\'' + this.lastDate + '\')';
      command = new DBCommand(this.options);
      return command.query(sql, (function(_this) {
        return function(err, result) {
          return _this.onImportStatus(err, result);
        };
      })(this));
    };

    OsmosisInit.prototype.onImportStatus = function(err, result) {
      if (err) {
        error(this.msg_tag, err);
      }
      info(this.msg_tag, 'state stored');
      return this.done();
    };

    OsmosisInit.prototype.output = function(data) {
      return debug(this.msg_tag, data.toString());
    };

    OsmosisInit.prototype.error = function(data) {
      return info(this.msg_tag, data.toString().replace(/\n$/, ''));
    };

    OsmosisInit.prototype.done = function() {
      return this.emit('done');
    };

    return OsmosisInit;

  })(EventEmitter);

}).call(this);
