var EventEmitter = require('events').EventEmitter,
    utilities = require('./Utilities'),
    pg = require('pg'),
    fs = require('fs'),
    path = require('path'),
    Tiles = require('./Tile'),
    express = require('express');


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
  self._cached_styles = {};
  return self;
}

utilities.inherits(System, EventEmitter, {
  get config () { return this._config; },
  set config (v) { this._config = v; return this; },

  get client () { return this._client; },
  set client (v) { this._client = v; return this; },

  get app () { return this._app; },
  set app (v) { this._app = v; return this; },

  get cachedStyles () { return this._cached_styles; },
  set cachedStyles (v) { this._cached_styles = v; return this; },


});



System.prototype.startService = function(){
  var self = this;
  self.logger.log('debug','connecting to DB');
  self.connect(function(err){
    if(err){
      self.logger.log('error','DB problems',err);
      process.exit();
    }else{

      self.startHTTPService();
    }
  });
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

System.prototype.startHTTPService = function(){
  var self = this;
  self.logger.log('debug','starting service');

  self.app = express();
  self.app.use(express.static(path.join(__dirname ,'..', 'public')));
  self.app.set('views', path.join(__dirname ,'..', 'template'));
  self.app.set('view engine', 'jade');
  self.app.route('/').get(function(req,res,next){
    return res.render('index',{});
  });

  self.app.route('/map/:zoom/:x/:y.png').get(function(req,res,next){
    Tiles.route(self,'osmosnimki',req.params.zoom,req.params.x,req.params.y)(req,res,next);
  });

  self.app.route('/live/:zoom/:x/:y.png').get(function(req,res,next){
    Tiles.route(self,'osmosnimki',req.params.zoom,req.params.x,req.params.y)(req,res,next);
  });

  if ( (typeof this.config.http!='undefined') && (this.config.http.active == true)){
    if (typeof this.config.http.port == 'undefined'){
      this.config.http.port = 80;
    }
    this.app.listen(this.config.http.port);
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
