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

Geocoder.prototype.geoCode = function(city,street,callback){

city = encodeURIComponent(city);
street = encodeURIComponent(street);

var json,
    self = this,
    data = '',
    url = "http://"+self.system.config.geocode.host+':'+self.system.config.geocode.port+'/'+ (self.system.config.geocode.path.replace('{city}', city).replace('{street}', street)),
    req;
  ///url = url.replace('{address}', address.replace(/\s/g,'%20'));

  console.log(url,http.headers);
  http.get(url,function(res){
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data+=chunk;
    });
    res.on('end', function (chunk) {
      if (typeof chunk === 'string'){
        data+=chunk;
      }
      //console.log(data);
      json = JSON.parse(data);
      callback(null,json);
    });
  })

/*
  req = http.request(options, function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));

  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    callback(e);
  });

  // write data to request body
  //  req.write('data\n');
  //  req.write('data\n');
  req.end();
*/
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
