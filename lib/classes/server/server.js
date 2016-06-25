(function() {
  var GISDB, SampleSSL, Server, Tile, bodyParser, express, fs, http, https, jade, log, path, reqall, tileConfig, xtile;

  express = require('express');

  http = require('http');

  https = require('https');

  path = require('path');

  fs = require('fs');

  jade = require('jade');

  bodyParser = require('body-parser');

  SampleSSL = require('./samplessl');

  reqall = require('../../reqall');

  log = require('../../log');

  GISDB = require('./classes/gisdb');

  Tile = require('../../../build/Release/tile').Tile;

  xtile = new Tile(512, 512);

  xtile.dataSourcePath("/usr/local/lib/mapnik/input/");

  tileConfig = function(xml, base) {
    xtile.fontPath("/Users/thomashoffmann/Documents/Projects/node/tualo-carto/fonts");
    return xtile.loadMap(xml, base);
  };

  Server = (function() {
    function Server() {
      this.debugMode = false;
      this.classesList = [];
      this.routesList = [];
      this.middlewaresList = [];
    }

    Server.prototype.set = function(config) {
      return this.config = config;
    };

    Server.prototype.setDebug = function(mode) {
      return this.debugMode = mode;
    };

    Server.prototype.classes = function(libpath, list) {
      var i, item, len, opt, results;
      results = [];
      for (i = 0, len = list.length; i < len; i++) {
        item = list[i];
        opt = item;
        opt.library = libpath;
        results.push(this.classesList.push(opt));
      }
      return results;
    };

    Server.prototype.routes = function(libpath, list) {
      var i, item, len, opt, results;
      results = [];
      for (i = 0, len = list.length; i < len; i++) {
        item = list[i];
        opt = item;
        opt.library = libpath;
        results.push(this.routesList.push(opt));
      }
      return results;
    };

    Server.prototype.middlewares = function(libpath, list) {
      var i, item, len, opt, results;
      results = [];
      for (i = 0, len = list.length; i < len; i++) {
        item = list[i];
        opt = item;
        opt.library = libpath;
        results.push(this.middlewaresList.push(opt));
      }
      return results;
    };

    Server.prototype.initModules = function() {
      var C, M, cl, i, j, k, len, len1, len2, mw, o, ref, ref1, ref2, results, rt;
      this.classesList.sort(this.byLoadOrder);
      this.middlewaresList.sort(this.byLoadOrder);
      this.routesList.sort(this.byLoadOrder);
      ref = this.classesList;
      for (i = 0, len = ref.length; i < len; i++) {
        cl = ref[i];
        C = require(path.join(cl.library, cl.file));
        this.classes[cl.name] = C;
      }
      ref1 = this.middlewaresList;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        mw = ref1[j];
        M = require(path.join(mw.library, mw.file));
        o = new M(this);
      }
      ref2 = this.routesList;
      results = [];
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        rt = ref2[k];
        M = require(path.join(rt.library, rt.file));
        results.push(o = new M(this));
      }
      return results;
    };

    Server.prototype.byLoadOrder = function(a, b) {
      var result;
      result = 0;
      if (typeof a.loadorder === 'undefined') {
        a.loadorder = 0;
      }
      if (typeof b.loadorder === 'undefined') {
        b.loadorder = 0;
      }
      if (a.loadorder > b.loadorder) {
        result = 1;
      }
      if (a.loadorder < b.loadorder) {
        result = -1;
      }
      return result;
    };

    Server.prototype.start = function() {
      var MapTile, encoderOptions, streets, tile;
      this.app = express();
      this.app.set('view engine', 'jade');
      this.app.use(function(request, result, next) {
        var gisdbOptions;
        next();
        if (false) {
          gisdbOptions = {
            database: 'nile',
            port: 5432
          };
          request.gisdb = new GISDB(gisdbOptions);
          request.once('end', function() {
            debug('gisdb', 'disconnect');
            return request.gisdb.disconnect();
          });
          return request.gisdb.connect(function() {
            result.locals = {
              errors: [],
              messages: [],
              informations: [],
              warnings: [],
              title: 'nile',
              headline: 'No headline',
              teasertext: 'No teasertext',
              content: 'main content',
              navigation: []
            };
            return result.page = 'login';
          });
        }
      });
      encoderOptions = {
        extended: false
      };
      this.app.use(bodyParser.urlencoded(encoderOptions));
      MapTile = require('./routes/maptile');
      tile = new MapTile(xtile);
      this.app.use('/tiles', tile.router());
      streets = require('./routes/streets');
      this.app.use('/streets', streets);
      this.app.use(express["static"](path.join(__dirname, '..', '..', '..', 'public')));
      this.app.set('views', path.join(__dirname, '..', '..', '..', 'template'));
      this.app.set('view engine', 'jade');
      this.app.get('/', function(req, res, next) {
        return res.render('index', {});
      });
      this.startHttp();
      return this.startHttps();
    };

    Server.prototype.startHttp = function() {
      if (this.config.http.active) {
        this.httpServer = http.createServer(this.app);
        return this.httpServer.listen(this.config.http.port, this.config.http.ip, this.startHttpCallback);
      }
    };

    Server.prototype.startHttpCallback = function(err) {
      if (err != null) {
        return error('start http', 'http(s) server', err);
      }
    };

    Server.prototype.startHttps = function() {
      var ssl;
      ssl = new SampleSSL(this.config);
      ssl.on('done', (function(_this) {
        return function() {
          var credentials;
          debug('https server sample ssl', 'done');
          if (_this.config.https.active) {
            credentials = {
              key: fs.readFileSync(_this.config.https.credentials.key, 'utf8')
            };
            if (_this.config.https.credentials.cert != null) {
              credentials.cert = fs.readFileSync(_this.config.https.credentials.cert, 'utf8');
            }
            if (_this.config.https.credentials.ca != null) {
              credentials.ca = fs.readFileSync(_this.config.https.credentials.ca, 'utf8');
            }
            _this.httpsServer = https.createServer(credentials, _this.app);
            return _this.httpsServer.listen(_this.config.https.port, _this.config.https.ip, _this.startHttpCallback);
          }
        };
      })(this));
      ssl.on('error', function(err) {
        return error('ssl error', 'https server sample ssl', err);
      });
      return ssl.run();
    };

    return Server;

  })();

  module.exports = {
    tileConfig: tileConfig,
    Server: Server
  };

}).call(this);
