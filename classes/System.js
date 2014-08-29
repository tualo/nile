var EventEmitter = require('events').EventEmitter,
    utilities = require('./Utilities'),
    pg = require('pg');


var System = function(){
  var self = this;
  return self;
}

utilities.inherits(System, EventEmitter, {
  get config () { return this._config; },
  set config (v) { this._config = v; return this; },

  get client () { return this._client; },
  set client (v) { this._client = v; return this; },
});

System.prototype.logger = {
  log: function(tag,msg){
    //console.log(tag,msg);
  }
}

System.prototype.connect = function(callback){
  var self = this;
  self.client = new pg.Client(self.config.database);
  self.client.connect(function(err){
    if (err){
      self.system.logger.log('error','Connection to database failed. Returning.');
      callback(err, null);
    }else{
      callback(false);
    }
  });
}

System.prototype.middleware = function(){
  var self = this;
  return function (req, res, next) {
    self.logger.log('debug',req);
    next();
  }
}

exports.System = System;
