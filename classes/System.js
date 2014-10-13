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
express = require('express'),
glob = require("glob"),
bodyparser = require('body-parser'),
mkdirp = require("mkdirp"),
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
  var self = this;
  //self.logger.log('debug','starting service');

  self.app = express();
  self.app.use(express.static(path.join(__dirname ,'..', 'public')));
  self.app.set('views', path.join(__dirname ,'..', 'template'));
  self.app.set('view engine', 'jade');

  self.app.all('*',function(req,res,next){
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','X-Requested-With');
    next();
  });

  self.app.use(bodyparser.urlencoded({ extended: false }));
  self.app.use(bodyparser.json());

  self.app.route('/').get(function(req,res,next){
    return res.render('index',{});
  });

  self.app.route('/road').get(function(req,res,next){
    res.json(
      {
"type": "FeatureCollection",
"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },

"features": [
      { "type": "Feature", "properties": { "name": "Saint-Luc" }, "geometry": {
      "type":"MultiLineString","coordinates":[
    [
    [1228452.05,6617444.43],[1228440.74,6617469.61],[1228426.32,6617505.95],[1228420.51,6617520.99],
    [1228405.66,6617564.29],[1228391.27,6617606.23],[1228384.62,6617624.71]],
    [[1228384.62,6617624.71],[1228372.07,6617657.65],[1228361.53,6617679.43],[1228347.75,6617705.21],
    [1228316.59,6617764.19],[1228289.55,6617813.61],[1228254.77,6617870.21],[1228217.21,6617925.84],
    [1228187.99,6617965.64],[1228138,6618028.3],[1228106.84,6618062.25],[1228086.92,6618081.84],
    [1228083.38,6618085.04],[1228050.64,6618111.8],[1228017.51,6618136.69]],
    [[1228017.51,6618136.69],[1227989.51,6618157.17]],[[1227762.79,6618300.43],
    [1227801.37,6618309.54],[1227806.16,6618311.18],[1227808.98,6618312.15]],
    [[1227780.48,6618391.3],[1227783.35,6618379.68],[1227790.2,6618352.95],[1227795.36,6618337.9],
    [1227808.98,6618312.15]],[[1227784.34,6618424.24],[1227783.72,6618432.48],[1227781.93,6618441.52],
    [1227774.92,6618459.38],[1227764.87,6618475.58]],[[1227787.9,6618409.16],[1227784.34,6618424.24]],
    [[1227823.81,6618289.93],[1227846.64,6618264.45],[1227883.26,6618235.64],[1227906.64,6618218.37],
    [1227989.51,6618157.17]],[[1227808.98,6618312.15],[1227823.81,6618289.93]],[[1227624.93,6618916.86],[1227619.8,6618933.66]],[[1227647.36,6618859.11],[1227634.04,6618893.82]],[[1227601.32,6618909.26],[1227628.75,6618854.65]],[[1227594.26,6618928.11],[1227601.32,6618909.26]],[[1227634.04,6618893.82],[1227624.93,6618916.86]],
    [[1227635.44,6618839.76],[1227638.48,6618828.9],[1227640.68,6618817.41],[1227642.19,6618795.39],
    [1227643.17,6618741.88],[1227644.01,6618696.1],[1227644.3,6618680.63],[1227645.09,6618638.1]],
    [[1227660.36,6618709.91],[1227659.94,6618728.43],[1227659.02,6618769.36],[1227658.77,6618779.92],[1227657.96,6618804.41],[1227655.12,6618825.74],
    [1227650.85,6618846.68]],[[1227628.75,6618854.65],[1227633.22,6618845.26],[1227635.44,6618839.76]],
    [[1227650.85,6618846.68],[1227647.36,6618859.11]],[[1227764.87,6618475.58],[1227735.4,6618498.55]],[[1227762.44,6618415.44],[1227768.76,6618401.54]],[[1227784.34,6618424.24],[1227776.48,6618421.61],[1227771.84,6618419.86],[1227762.44,6618415.44]],[[1227645.09,6618638.1],[1227647.99,6618614.3],[1227654.26,6618590.13],[1227657.92,6618578.63],
    [1227662.01,6618567.99],[1227669.97,6618551.4],[1227674.09,6618542.59],[1227685.75,6618524.2],[1227698.99,6618508.38],[1227711.22,6618495.12],[1227729.88,6618474.69],[1227735.73,6618466.73],[1227741.44,6618457.01],[1227752.11,6618436.04],[1227762.44,6618415.44]],[[1227735.4,6618498.55],[1227700.6,6618536.72],[1227690.63,6618552.96],[1227678.99,6618574.83],[1227670.18,6618597.27]
    ,[1227665.28,6618616.58],[1227662.21,6618636.26],[1227660.36,6618709.91]]]

  }}]
});

});
  self.app.route('/geocode').post(function(req,res,next){

    var geocoder = new Geocoder(self);
    geocoder.geoCode(req.body.city,req.body.street,function(err,result){
      if (err){
        res.json(err);
      }else{
        res.json(result);
      }
    });

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
    var credentials = {key: privateKey, cert: certificate};
    if (typeof this.config.https.port == 'undefined'){
      this.config.https.port = 80;
    }
    https.createServer(credentials, app).listen(this.config.https.port);
  }


  if ( (typeof this.config.http!='undefined') && (this.config.http.active == true)){
    if (typeof this.config.http.port == 'undefined'){
      this.config.http.port = 80;
    }
    this.app.listen(this.config.http.port);
    system.logger.log('info','service is started at port '+this.config.http.port);
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
