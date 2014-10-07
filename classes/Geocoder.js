var EventEmitter = require('events').EventEmitter,
utilities = require('./Utilities'),
pg = require('pg'),
path = require('path'),
fs = require('fs'),
exec = require('child_process').exec;

// CREATE EXTENSION fuzzystrmatch; is needed!

var Geocoder = function(system,debug){
  var self = this;
  self.debug=false;
  if (typeof debug==='boolean'){
    self.debug = debug;
  }
  self.system = system;
}

Geocoder.prototype.geoCode = function(address,callback){

  var child,
  json;

  child = exec(self.system.config.nominatim+' --search "'+address+'"', function (error, stdout, stderr) {
    console.log('exec: ',error,stdout,stderr);
    if (error){
      callback(e);
    }else{
      try{
        json = JSON.parse(stdout);
        callback(null,json);
      }catch(e){
        callback(e);
      }
    }
  });
}


exports.Geocoder = Geocoder;
