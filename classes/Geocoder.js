var EventEmitter = require('events').EventEmitter,
utilities = require('./Utilities'),
pg = require('pg'),
path = require('path'),
fs = require('fs'),
http = require('http'),
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

var json,
    self = this,
    data = '',
    req,
    options = {
      hostname: self.system.config.geocode.host,
      port: self.system.config.geocode.port,
      path:  self.system.config.geocode.path,
      method: 'GET'
    };

  options.path.replace('{address}',encodeURI(address))
  req = http.request(options, function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data+=chunk;
    });
    res.on('end', function (chunk) {
      data+=chunk;
      json = JSON.parse(data);
      callback(null,json);
      console.log('BODY: ' + data);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    callback(e);
  });

  // write data to request body
  //  req.write('data\n');
  //  req.write('data\n');
  req.end();

/*
  var child,
  self = this,
  json;

  child = exec(self.system.config.nominatim+' --search "'+address+'"', function (error, stdout, stderr) {
    if (self.debug){
      console.log('exec: ',error,stdout,stderr);
    }
    if (error){
      callback(error);
    }else{
      try{
        json = JSON.parse(stdout);
        callback(null,json);
      }catch(e){
        callback(e);
      }
    }
  });
*/
}


exports.Geocoder = Geocoder;
