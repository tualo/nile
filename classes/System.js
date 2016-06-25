"use strict";

var EventEmitter = require('events').EventEmitter,
utilities = require('./Utilities'),
pg = require('pg'),
fs = require('fs'),
path = require('path'),
//MapCSS = require('node-kothic').MapCSS,
//Kothic = require('node-kothic').Kothic,
Tile = require('./Tile').Tile,
Geocoder = require('./Geocoder').Geocoder,
Router = require('./Router').Router,
express = require('express'),
timeout = require('connect-timeout'),
glob = require("glob"),
http = require('http'),
bodyparser = require('body-parser'),
mkdirp = require("mkdirp"),
constants = require('constants'),
Renderer =  require('nile-style').Renderer,
StyleInstructions =  require('nile-style').StyleInstructions;

var System = function(){
  var self = this;

  self.logMessages = { debug: true,info: true, warn: true, error: true };



  self.logger = {
    log: function(tag,msg){
      if (  (typeof self.logMessages[tag]==='boolean') &&  (self.logMessages[tag]===true) ){
        console.log(tag,msg);
      }
    }
  };
  self._styles = {};

  return self;
}

utilities.inherits(System, EventEmitter, {
  get config () { return this._config; },
  set config (v) { this._config = v; return this; },

  get client () { return this._client; },
  set client (v) { this._client = v; return this; },

  get app () { return this._app; },
  set app (v) { this._app = v; return this; },

  get styles () { return this._styles; },
  set styles (v) { this._styles = v; return this; },


});

System.prototype.hashedSQL = function(sql,hash){
  var field;
  for(field in hash){
    if (typeof hash[field]==='string'){
      sql = sql.replace(new RegExp('{'+field+'}','g'),"'"+hash[field]+"'");
    }else{
      sql = sql.replace(new RegExp('{'+field+'}','g'),hash[field]);
    }
  }
  return sql;
}


System.prototype.startService = function(){
  var self = this;
  //self.logger.log('debug','connecting to DB');
  self.connect(function(err){
    if(err){
      self.logger.log('error','DB problems',err);
      process.exit();
    }else{

      self.startHTTPService();

    }
  });
}

System.prototype.loadStyles = function(callback){
  var styleInstructions,styleName,dirName,i,self = this;
  mkdirp(path.join(__dirname,'..','styles','instructions'), function (err) {
    glob( path.join(__dirname,'..','styles','*.less'), function (er, files) {
      for(i=0;i<files.length;i++){
        dirName = path.dirname(files[i]);
        styleName = path.basename(files[i],'.less');
        //system.logger.log('debug','compile '+ styleName);
        styleInstructions = new StyleInstructions(path.join(__dirname,'..','styles',styleName+'.less'));
        styleInstructions.create(path.join(__dirname,'..','styles','instructions',styleName+'.js'));
        try{

          self.styles[styleName] = require(path.join(__dirname,'..','styles','instructions',styleName));
        }catch(e){
          console.log( path.join(__dirname,'..','styles','instructions',styleName) ,'failed');
        }

      }
      callback();
    });
  })
}

System.prototype.connect = function(callback){
  var self = this;
  self.client = new pg.Client(self.config.database);
  self.client.connect(function(err){
    if (err){
      self.logger.log('error','Connection to database failed. Returning.');
      callback(err, null);
    }else{
      callback(false);
    }
  });
}

System.prototype.disconnect = function(callback){
  var self = this;
  if (typeof callback!=='function'){
    callback=function(){};
  }
  self.client.once('end',callback);
  self.client.end();
}

System.prototype.startHTTPService = function(){
  var self = this,
      server_https,
      server_http;
  //self.logger.log('debug','starting service');

  self.app = express();

if (typeof this.config.http === 'object'){
  if (typeof this.config.http.timeout === 'number'){
    //this.config.http.timeout = 600000;
    self.app.use(timeout(this.config.http.timeout+'s'));
  }
}else if (typeof this.config.https === 'object'){
  if (typeof this.config.https.timeout === 'number'){
    //this.config.http.timeout = 600000;
    self.app.use(timeout(this.config.https.timeout+'s'));
  }
}


  self.app.use(express.static(path.join(__dirname ,'..', 'public')));
  self.app.set('views', path.join(__dirname ,'..', 'template'));
  self.app.set('view engine', 'jade');

  self.app.all('*',function(req,res,next){
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','X-Requested-With');
    next();
  });

  self.app.use(bodyparser.urlencoded({limit: '50mb', extended: false }));
  self.app.use(bodyparser.json({limit: '50mb'}));

  self.app.route('/').get(function(req,res,next){
    return res.render('index',{});
  });


  self.app.route('/geocode').post(function(req,res,next){

    var geocoder = new Geocoder(self);
    if (typeof req.body.city==='string'){
      geocoder.geoCode(req.body.city,req.body.street,function(err,result){
        if (err){
          res.json(err);
        }else{
          res.json(result);
        }
      });
    }else if (typeof req.body.list === 'string'){
      geocoder.geoCodeList(JSON.parse(req.body.list),function(err,result){
        if (err){
          res.json(err);
        }else{
          res.json(result);
        }
      });
    }else{
      res.json({error: 'missing parameter'});
    }
  });


  self.app.route('/route/classes').post(function(req,res,next){

    var router = new Router(self);
    router.getClasses(function(err,result){
      if (err){
        res.json(err);
      }else{
        res.json(result);
      }
    });

  });

  self.app.route('/get').post(function(req,res,next){
    var sql = [
    'select ST_ASGeoJSON(way) geojson, hstore2json(tags) info from planet_osm_polygon where osm_id = {osm_id} ',
    'select ST_ASGeoJSON(way) geojson, hstore2json(tags) info from planet_osm_line where osm_id = {osm_id} ',
    'select ST_ASGeoJSON(way) geojson, hstore2json(tags) info from planet_osm_point where osm_id = {osm_id} '
    ].join(' union ')
    if (typeof req.body.osm_id!=='undefined'){
      sql = sql.replace(/\{osm_id\}/g,req.body.osm_id);
      self.client.query( sql , function(err, results){
        if (err){
          res.json(err);
        }else{
          res.json(results.rows);
        }
      })
    }else{
      res.json("osm_id is missing");
    }
  });



  self.app.route('/route/tsp').post(function(req,res,next){

    var router = new Router(self);
    if (typeof req.body.type==='string'){
      if (req.body.type==='feet'){
        router.tbl = 'feet_ways';
      }
      if (req.body.type==='car'){
        router.tbl = 'car_ways';
      }
      if (req.body.type==='cycle'){
        router.tbl = 'cycle_ways';
      }
    }

    router.tsp(JSON.parse(req.body.list),function(err,result){
      if (err){
        res.json(err);
      }else{

        router.routeList(result,function(err,result2){
          if (err){
            res.json(err);
          }else{
            res.json(result2);
          }
        });
      }
    });

  });

  self.app.route('/route').post(function(req,res,next){

    var router = new Router(self);

    if (typeof req.body.type==='string'){
      if (req.body.type==='feet'){
        router.tbl = 'feet_ways';
      }
      if (req.body.type==='car'){
        router.tbl = 'car_ways';
      }
      if (req.body.type==='cycle'){
        router.tbl = 'cycle_ways';
      }
    }
    if (typeof req.body.list==='string'){
      router.routeList(JSON.parse(req.body.list),function(err,result){
        if (err){
          res.json(err);
        }else{
          res.json(result);
        }
      });
    }else{
      router.routeAddress(
        req.body.from_city,req.body.from_street,
        req.body.to_city,req.body.to_street
        ,function(err,result){
          if (err){
            res.json(err);
          }else{
            res.json(result);
          }
        });
      }
    });

    self.app.route('/live/:style/:zoom/:x/:y.png').get(function(req,res,next){

      req.params.live = true;
      self.getTileImage(req,function(error,fileName){
        if (error){
          console.log(error);
          next();
        }else{
          res.sendFile(fileName);
        }
      });

    });

    self.app.route('/-/:style/:zoom/:x/:y.png').get(function(req,res,next){
      var t = new Tile();
      t.z = req.params.zoom;
      t.x = req.params.x;
      t.y = req.params.y;
      t._updateBBox();
      console.log(t.getDatabaseQuery());



      req.params.live = false;
      self.getTileImage(req,function(error,fileName){
        if (error){
          console.log(error);
          next();
        }else{
          res.sendFile(fileName);
        }
      });

    });

    if ( (typeof this.config.https!='undefined') && (this.config.https.active == true)){
      var https = require('https');
      var privateKey  = fs.readFileSync(this.config.https.key, 'utf8');
      var certificate = fs.readFileSync(this.config.https.cert, 'utf8');

      var credentials = {
        ca: "",
        key: privateKey,
        cert: certificate,
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2,
        ciphers: 'AES128-GCM-SHA256:!RC4:!HIGH:!MD5:!aNULL:!EDH',
        honorCipherOrder: true
      };


      if (typeof this.config.https.ca_files !== "undefined"){

        credentials.ca = (function(files) {
          var _i, _len, _results, file;

          _results = [];
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            _results.push( (fs.readFileSync(file)).toString() );
          }
          return _results;

        })(this.config.https.ca_files);
      }

      if (typeof this.config.https.ciphers === 'string'){
        credentials.ciphers = this.config.https.ciphers;
      }

      if (typeof this.config.https.port == 'undefined'){
        this.config.https.port = 443;
      }

      if (typeof this.config.https.timeout == 'undefined'){
        this.config.https.timeout = 600000;
      }
      server_https = https.createServer(credentials, this.app).listen(this.config.https.port, this.config.https.ip);
      try{
      server_https.setTimeout(this.config.https.timeout,function(){
        system.logger.log('info','timeout');
      });
    }catch(e){

    }
      system.logger.log('info','service is started at port '+this.config.https.port+' on '+ this.config.https.ip);
    }


    if ( (typeof this.config.http!='undefined') && (this.config.http.active == true)){
      if (typeof this.config.http.port == 'undefined'){
        this.config.http.port = 80;
      }
      if (typeof this.config.http.timeout == 'undefined'){
        this.config.http.timeout = 600000;
      }
      server_http = http.createServer(this.app).listen(this.config.http.port, this.config.http.ip);
      server_http.setTimeout(this.config.http.timeout,function(){
        system.logger.log('info','timeout');
      });
      system.logger.log('info','service is started at port '+this.config.http.port+' on '+this.config.http.ip);
    }

  }

  System.prototype.getTileImage = function(request,callback){
    var system = this,
    style = request.params.style,
    coords = {
      x: request.params.x,
      y: request.params.y,
      zoom: request.params.zoom
    },
    imageFile = path.join(__dirname,'..','public','map',style,coords.zoom,coords.x,coords.y+'.png');

    if(typeof system.styles[style]==='undefined'){
      callback('no such style');
    }else{

      fs.exists( imageFile, function(exists){
        if (exists && ( !request.params.live ) ){
          callback(false,imageFile);
        }else{


          system.getGeoJSON(request,function(err,data){
            if (err){
              callback(err,null);
            }else{


              var renderer = new Renderer(system.styles[style].style, 256, coords.zoom*1, data);
              renderer.orderZIndex();

              renderer.render(imageFile,function(err){
                if (err){
                  callback(err);
                }else{
                  callback(false,imageFile);
                }
              });
            }
          });

        }
      });
    }
  }

  /*
  * Quering the geoJSON of the requested tile,
  * if the data are allready cached, the cached files be read
  *
  * @param {object} request the request object containing an params object with zoom, x and y.
  * @param {function} callback the callback function(error,data)
  */
  System.prototype.getGeoJSON = function(request,callback,filter){
    var system = this,
    style = request.params.style,
    coords = {
      x: request.params.x,
      y: request.params.y,
      zoom: request.params.zoom
    },
    json_path = path.join(__dirname,'..','public','map',style,coords.zoom,coords.x),
    data;

    if (typeof filter==='undefined'){
      filter = {};
    }
    if(typeof system.styles[style]==='undefined'){
      callback('no such style');
    }else{

      fs.exists(path.join(json_path,coords.y+'.geojson'),function(exists){

        if (exists  && ( !request.params.live ) ){
          fs.readFile(path.join(json_path,coords.y+'.geojson'),function(err,data){
            if (err){
              callback(err,null);
            }else{
              callback( false,JSON.parse( data.toString() ) );
            }
          });
        }else{
          mkdirp(json_path, function (err) {
            var tile,
            filters,
            output;

            if (err){
              callback(err,null);
            }else{

              tile = new Tile(system);
              filters = system.styles[style].filter(coords.zoom);

              output = path.join(json_path,coords.y+'.png');
              tile.z = coords.zoom;
              tile.x = coords.x;
              tile.y = coords.y;
              tile.filter = filters;
              tile._updateBBox();
              tile.queryAsGeoJSON(function(err,data){
                if (err){
                  callback(err,null);
                }else{
                  fs.writeFile(path.join(json_path,coords.y+'.geojson'),JSON.stringify(data,null,2),function(err){
                    if (err){
                      callback(err,null);
                    }else{
                      callback( false, data );
                    }
                  });
                }
              })
            }
          });
        }
      });
    }
  }


  System.prototype.middleware = function(){
    var self = this;
    return function (req, res, next) {
      self.logger.log('debug',req);
      next();
    }
  }



  exports.System = System;
