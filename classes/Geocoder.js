var EventEmitter = require('events').EventEmitter,
  utilities = require('./Utilities'),
  pg = require('pg'),
  path = require('path'),
  fs = require('fs');

// CREATE EXTENSION fuzzystrmatch; is needed!

var Geocoder = function(system){
  var self = this;
  self.system = system;
}

Geocoder.accuracy = {
  EXACT:        10,
  NOPOSTALCODE:  7,
  CALCULATED:    6,
  UNDEFINED:     0
}

//name    housenumber  street  postal_code  city
//1       1            1       1            1


Geocoder.prototype.createOrUpdate = function(callback){

  var self = this,
      client = self.system.client,
      rowIndex = 0,
      item,
      items = [],
      sql = (fs.readFileSync(path.join(__dirname,'geocode','points.sql'))).toString();

  client.query(sql, function(err, results){
    //console.log(err,results);
    system.logger.log('info','found',results.rowCount,'results');
    for(rowIndex=0;rowIndex<results.rowCount;rowIndex++){
      item = results.rows[rowIndex];
      if (
        (item.postal_code === null) &&
        (item.postcode !== null)
      ){
        item.postal_code = item.postcode;
      }
      delete item.postcode;
      items.accuracy = Geocoder.accuracy.UNDEFINED;
      items.push(item);
    }
    self.updatePostalCode(items,0,callback);
    //callback();
  });

}

Geocoder.prototype.updatePostalCode = function(items,index,callback){
  var self = this,
      client = self.system.client,
      rowIndex = 0,
      sql = (fs.readFileSync(path.join(__dirname,'geocode','postal.polygon.sql'))).toString();

  if (index<items.length){
    if (items[index].postal_code === null){
      client.query(self.system.hashedSQL(sql,items[index]), function(err, results){
        system.logger.log('info','postal_code found ' + results.rowCount + ' results');
        if (results.rowCount>0){
          items[index].postal_code = results.rows[0].postal_code;
        }
        self.updatePostalCode(items,index+1,callback);
      });
    }else{
      self.updatePostalCode(items,index+1,callback);
    }
  }else{
    self.insertItems(items,0,callback);
  }
}

Geocoder.prototype.insertItems = function(items,index,callback){
  var self = this,
      client = self.system.client,
      rowIndex = 0,
      sql = (fs.readFileSync(path.join(__dirname,'geocode','insert.sql'))).toString();

  if (index<items.length){
    //
    items[index].accuracy = 0;
    items[index].address = '';
    console.log(self.system.hashedSQL(sql,items[index]));
/*
    select
    abc.tags
    from
    ( select * from planet_osm_polygon ) abc
    join ( select way from planet_osm_polygon where tags->'name'='Eichenberg') xyz
    on ST_Intersects(abc.way,xyz.way)
    join ( select way from planet_osm_line where tags->'name'='Ringstraße') vuw
    on ST_Intersects(abc.way,vuw.way)
*/

    client.query(self.system.hashedSQL(sql,items[index]), function(err, results){
      self.insertItems(items,index+1,callback);
    });
  }else{
    callback();
  }
}


Geocoder.prototype.geoCode = function(address){
  var parts = address.split(' '),
      i;

  for(i=0;i<parts.length;i++){
    client.query("select tags->'name' ort,way from planet_osm_polygon where tags->'boundary'='administrative' and tags->'name' like '%'++'%'", function(err, results){
      self.insertItems(items,index+1,callback);
    });

  }

}

exports.Geocoder = Geocoder;
