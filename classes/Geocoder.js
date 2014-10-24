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

Geocoder.prototype.geoCodeList = function(list,callback,index){
  var self = this;
  if (typeof index === 'undefined'){
    index = 0;
  }
  if (index < list.length){
    self.geoCode(list[index].city,list[index].street,function(err,res){
      if (err){
        list[index].geocode = err;
      }else{
        list[index].geocode = res;
      }
      self.geoCodeList(list,callback,index + 1);
    })
  }else{
    callback(null,list);
  }
}

Geocoder.prototype.geoCode = function(city,street,callback){

  city = encodeURIComponent(city);
  street = encodeURIComponent(street);

  var json,
  self = this,
  data = '',
  url = "http://"+self.system.config.geocode.host+':'+self.system.config.geocode.port+'/'+ (self.system.config.geocode.path.replace('{city}', city).replace('{street}', street)),
  req;

  try{
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
    });
  }catch(e){
    callback(e);
  }
}


exports.Geocoder = Geocoder;
