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

}


exports.Geocoder = Geocoder;
