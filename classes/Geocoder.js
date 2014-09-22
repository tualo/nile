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

Geocoder.prototype.isCity = function(name,callback){
  var self=this,
      sql,
      i,
      m,
      item,
      res_list=[],
      exact_res_list=[],
      len=name.length;
  sql ="select name,metaphone,levenshtein(lower(name),lower( '"+name+"' )) as lv from gc_cities where metaphone like concat('%',  dmetaphone('"+name+"'),  '%') order by lv asc";
  self.system.client.query(
    sql,
    function(err, results){
      if (err){
        callback(err);
      }else{
        m=results.rows.length;
        for(i=0;i<m;i++){
          item={
            name: results.rows[i].name,
            diff: (results.rows[i].lv) //===0)?1:len/results.rows[i].lv
          }

          res_list.push(item);
          if (results.rows[i].lv===0){
            exact_res_list.push(item);
          }
        }

        if (exact_res_list.length>0){
          callback(false,exact_res_list);
        }else{
          callback(false,res_list);
        }
      }

    }
  )
}


Geocoder.prototype.isStreet = function(name,callback){
  var self=this,
      sql,
      i,
      m,
      item,
      res_list=[],
      exact_res_list=[],
      len=name.length;

  sql ="select name,metaphone,levenshtein(lower(name),lower( '"+name+"' )) as lv from gc_streets where metaphone like concat('%',  dmetaphone('"+name+"'),  '%') order by lv asc";
  self.system.client.query(
    sql,
    function(err, results){
      if (err){
        callback(err);
      }else{
        m=results.rows.length;
        for(i=0;i<m;i++){
          item={
            name: results.rows[i].name,
            diff: (results.rows[i].lv) //===0)?1:len/results.rows[i].lv
          }

          res_list.push(item);
          if (results.rows[i].lv===0){
            exact_res_list.push(item);
          }
        }

        if (exact_res_list.length>0){
          callback(false,exact_res_list);
        }else{
          callback(false,res_list);
        }
      }

    }
  )
}

Geocoder.prototype.analyse = function(list,callback,index,result){
  var self= this,
      i,
      h,
      street,
      streets,
      city,
      housenumber,
      item,
      itemIndex;

  if (typeof result==='undefined'){
    result = {};
    index=0;
  }

  if (index<list.length){
    item = list[index];
    if (typeof result[item]==='undefined'){
      result[item] = {
        text: item,
        isCity: null,
        isStreet: null,
        bestMatchStreet: '',
        streets: [],
        bestMatchCity: ''
      };
      index=0;
    }

    self.isStreet(list[index],function(err,res){
      if (err){
        result[item].error=err;
      }else{
        //console.log(res);
        //todo linestring size matching
        result[item].isStreet=(res[0])?res[0].diff:99999;
        result[item].bestMatchStreet=(res[0])?res[0].name:'';
        result[item].streets = [];
        for(i=0;i< res.length;i++){
          if (res[i].diff < (item.length / 4)) {
            result[item].streets.push(res[i].name);
          }
        }
      }


      self.isCity(list[index],function(err,res){
        if (err){
          result[item].error=err;
        }else{
          result[item].isCity=(res[0])?res[0].diff:99999;
          result[item].bestMatchCity=(res[0])?res[0].name:'';
        }
        self.analyse(list,callback,index+1,result);
      });

    });


  }else{
    h=false;
    for(itemIndex=0;itemIndex< list.length;itemIndex++){
      i=list[itemIndex];
      if ((h) && (/^(\d)+/.test(i))){
        housenumber = i;
      }
      if (
        (result[i].isCity<result[i].isStreet)
      ){

        if (typeof city==='undefined'){
          city = result[i].bestMatchCity;
        }

      }else if (
        (!h) &&
        (
          (result[i].isStreet<result[i].isCity)
        )
      ){

        if (typeof street==='undefined'){

          street = result[i].bestMatchStreet;
          streets = result[i].streets;
        }

        h=true;
      }else{
        if (h){
          h=false;
        }
      }
    }
    callback(false,{
      city: city,
      street: street,
      streets: streets,
      housenumber: housenumber
    });
  }

}

Geocoder.prototype.geoCode = function(address,callback){
  var i,
      self = this,
      parts = address.split(' ');

  self.analyse(parts,callback);
  /*
  self._findBounds(address,function(err,bounds){
    //console.log(bounds);
    self._findRoadInBounds(address,bounds,function(err,res){
      //console.log(res);
      callback(false,res);
    })
  })
*/
  /*
  create table gc_cities (name varchar(255) primary key,metaphone varchar(255));
  delete from gc_cities;
  insert
    into gc_cities (name,metaphone)
    select
      tags->'name',
      dmetaphone(tags->'name')
    from planet_osm_polygon
    where
      tags->'name'<>'' and
      tags->'boundary'='administrative'
    group by tags->'name';

  create table gc_streets (name varchar(255) primary key,metaphone varchar(255));
  insert into gc_streets (name,metaphone)
    select
      tags->'name',
      dmetaphone(tags->'name')
    from
      planet_osm_line
    where
      tags->'highway'<>'' and tags->'name'<>''
  group by tags->'name';
  */
}

Geocoder.prototype._findBounds = function(address,callback,parts,index,res){
  var i,
      self= this,
      sql = (fs.readFileSync(path.join(__dirname,'geocode','find.sql'))).toString();

  if (typeof index==='undefined'){
    parts = address.split(' ');
    index = 0;
    res = [];
  }
  if (index<parts.length){
    self.system.client.query(
      sql.replace(/\$search/g,parts[index]),
      function(err, results){
        //console.log(results.rows);
        for(i=0;i<results.rows.length;i++){
          if (results.rows[i].boundary==='administrative'){
            res.push(results.rows[i]);
          }
        }
        self._findBounds(address,callback,parts,index+1,res);
      }
    );
  }else{
    callback(false,res);
  }

}



Geocoder.prototype._findRoadInBounds= function(address,boundaries,callback,index,res){
  var self=this;
  if (typeof index==='undefined'){
    res=[];
    index=0;
  }
  if (index < boundaries.length){
    self._findRoadInBound(address,boundaries[index].way,function(err,list){
      //console.log('*',list);
      res = res.concat(list);
      self._findRoadInBounds(address,boundaries,callback,index+1,res);
    })
  }else{
    callback(false,res);
  }

}

Geocoder.prototype._findRoadInBound= function(address,boundary,callback,parts,index,res){
  var i,
      self= this,
      sql = (fs.readFileSync(path.join(__dirname,'geocode','find.road.sql'))).toString();

  if (typeof index==='undefined'){
    parts = address.split(' ');
    index = 0;
    res = [];
  }
  if (index<parts.length){
    console.log(sql.replace(/\$search/g,parts[index]).replace(/\$boundary/g,boundary));
    self.system.client.query(
      sql.replace(/\$search/g,parts[index]).replace(/\$boundary/g,boundary),
      function(err, results){
        //console.log(err);
        for(i=0;i<results.rows.length;i++){
          //if (results.rows[i].boundary==='administrative'){
            res.push(results.rows[i]);
          //}
        }
        self._findRoadInBound(address,boundary,callback,parts,index+1,res);
      }
    );
  }else{
    callback(false,res);
  }

}


exports.Geocoder = Geocoder;
