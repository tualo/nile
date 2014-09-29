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
/*
Finding city, street and housenumber of an given string array (each word as an item)
@params {array} list the word list
@params {function} the callback function to be called on error and success
@params [{integer}] index optional, set by the function for recursive uses
@params [{object}] result optional, set by the function for recursive uses
*/
Geocoder.prototype.analyse = function(list,callback,index,result){
  var self= this,
      i,
      h,
      street,
      streets,
      city,
      housenumber,
      item,
      itemIndex,
      numberCheck;

  if (typeof result==='undefined'){
    result = {
      streets: []
    };
    index=0;
  }

  if (index<list.length){
    item = list[index];
    numberCheck = list[index].match(/(\d+([\-\/\w])*)$/i);
    if (numberCheck!==null){
      housenumber = numberCheck[0];
      list[index]=list[index].substring(0,list[index].length -numberCheck[0].length).trim();
      item=list[index];
    }
    if (typeof result[item]==='undefined'){
      result[item] = {
        text: item,
        isCity: null,
        isStreet: null,
        bestMatchStreet: '',
        streets: [],
        bestMatchCity: '',
        housenumber: housenumber
      };
      index=0;
    }



    self.isStreet(list[index],function(err,res){
      if (err){
        callback(err);
      }else{
        // /((\w+)\s?)+\s+(\d+.*)^/i
        //console.log(res);
        //todo linestring size matching
        result[item].isStreet=(res[0])?res[0].diff:99999;
        result[item].bestMatchStreet=(res[0])?res[0].name:'';
        result[item].streets = [];
        result[item].housenumber = housenumber;

        for(i=0;i< res.length;i++){
          if (res[i].diff < (item.length / 3)) {
            result[item].streets.push(res[i].name);
          }
        }
      }


      self.isCity(list[index],function(err,res){
        if (err){
          callback(err);
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

          housenumber = result[i].housenumber;

          street = result[i].bestMatchStreet;
          streets = result[i].streets;
        }

        //h=true;
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

Geocoder.prototype.selectStreets = function(streets,bounds,callback,index,result){
  var self = this,
      sql = "select tags->'name' as name,   ST_AsGeoJSON(ST_StartPoint( ST_Union(way))) as start_point, ST_AsGeoJSON(ST_EndPoint( ST_Union(way))) as stop_point, ST_AsGeoJSON(ST_PointOnSurface(ST_Union(way))) as simple_point , ST_AsGeoJSON(ST_Union(way)) way_line,'$geom' as citybound from planet_osm_line where tags->'highway'<>'' and tags->'name' in ($streets) and ST_Intersects(way,ST_GeomFromText('$geom',900913)) group by tags->'name'";

  if (typeof index ==='undefined'){
    index = 0;
    result = [];
  }
  if (index < bounds.length){
    self.system.client.query(
      sql.replace(/\$geom/g,bounds[index].geom).replace(/\$streets/g, "'"+streets.join("','")+"'"),
      function(err, roads){
        if (err){
          callback(err);
        }else{
          result = result.concat(result,roads.rows);
          self.selectStreets(streets,bounds,callback,index+1,result);
        }
      }
    );
  }else{
    callback(false,result);
  }
}

Geocoder.prototype.exactAddress = function(gres,callback,index,result){
  var self = this,
      sql = "select ST_AsGeoJSON(ST_PointOnSurface(way)) as exact_point from planet_osm_polygon where tags->'addr:street' = '$street' and tags->'addr:housenumber' = '$housenumber' and ST_Intersects(way,ST_GeomFromText('$geom',900913)) ";

  if (typeof index ==='undefined'){
    index = 0;
    result = [];
  }
  if (index < gres.streets.length){
    sql = sql.replace(/\$geom/g,gres.streets[index].citybound).replace(/\$housenumber/g,gres.housenumber).replace(/\$street/g, gres.streets[index].name);
    self.system.client.query(
      sql,
      function(err, pointResult){
        if (err){
          callback(err);
        }else{
          if (pointResult.rows.length>0){
            gres.streets[index].exact_point = pointResult.rows[0].exact_point;
          }
          self.exactAddress(gres,callback,index+1,result);
        }
      }
    );
  }else{
    callback(false,gres);
  }
}


Geocoder.prototype.nextLowerAddress = function(gres,callback,index,result){
  var self = this,
      sql = "select ST_AsGeoJSON(ST_PointOnSurface(way)) as next_lower,tags->'addr:housenumber' as housenumber from planet_osm_polygon where tags->'addr:street' = '$street' and tags->'addr:housenumber' < '$housenumber' and ST_Intersects(way,ST_GeomFromText('$geom',900913)) order by housenumber desc";

  if (typeof index ==='undefined'){
    index = 0;
    result = [];
  }
  if (index < gres.streets.length){
    sql = sql.replace(/\$geom/g,gres.streets[index].citybound).replace(/\$housenumber/g,gres.housenumber).replace(/\$street/g, gres.streets[index].name);
    self.system.client.query(
      sql,
      function(err, pointResult){
        if (err){
          callback(err);
        }else{
          if (pointResult.rows.length>0){
            gres.streets[index].next_lower = pointResult.rows[0].next_lower;
            gres.streets[index].next_lower_number = pointResult.rows[0].housenumber;
          }
          self.nextLowerAddress(gres,callback,index+1,result);
        }
      }
    );
  }else{
    callback(false,gres);
  }
}


Geocoder.prototype.nextUpperAddress = function(gres,callback,index,result){
  var self = this,
      sql = "select ST_AsGeoJSON(ST_PointOnSurface(way)) as next_upper,tags->'addr:housenumber' as housenumber from planet_osm_polygon where tags->'addr:street' = '$street' and tags->'addr:housenumber' > '$housenumber' and ST_Intersects(way,ST_GeomFromText('$geom',900913)) order by housenumber asc";

  if (typeof index ==='undefined'){
    index = 0;
    result = [];
  }
  if (index < gres.streets.length){
    sql = sql.replace(/\$geom/g,gres.streets[index].citybound).replace(/\$housenumber/g,gres.housenumber).replace(/\$street/g, gres.streets[index].name);
    self.system.client.query(
      sql,
      function(err, pointResult){
        if (err){
          callback(err);
        }else{
          if (pointResult.rows.length>0){
            gres.streets[index].next_upper = pointResult.rows[0].next_upper;
            gres.streets[index].next_upper_number = pointResult.rows[0].housenumber;
          }
          self.nextUpperAddress(gres,callback,index+1,result);
        }
      }
    );
  }else{
    callback(false,gres);
  }
}

Geocoder.prototype.geoCode = function(address,callback){
  var i,
      self = this,
      a,
      b,
      next,
      prev,
      nextnr,
      prevnr,
      ratio,
      aprox,
      sql = (fs.readFileSync(path.join(__dirname,'geocode','query.street.loaction.sql'))).toString(),
      parts = address.split(',');
  for(i=0;i<parts.length;i++){
    parts[i] = parts[i].replace(/^(\s)+/,'').replace(/(\s)+$/,'');
  }
  self.analyse(parts,function(err,res){
    if (err){
        callback(err);
    }else{
      if (res.city !== '' ){
        if (typeof res.streets==='undefined'){
          res.streets=[];
        }
        sql = "select ST_AsText(way) geom from planet_osm_polygon where tags->'boundary'='administrative' and tags->'name'='$city'";
        self.system.client.query(
          sql.replace(/\$city/g,res.city).replace(/\$streets/g, "'"+res.streets.join("','")+"'"),
          function(err, city_bounds){
            if (err){
              callback(err);
            }else{

              if (res.street !== '' ){
                self.selectStreets(res.streets,city_bounds.rows,function(err,roads){
                  self.exactAddress(
                    {
                      housenumber: res.housenumber,
                      city: res.city,
                      streets: roads
                    },
                    function(err,gres){
                      if (err){
                        callback(err);
                      }else{
                        self.nextUpperAddress(gres,function(err,gres){
                          if (err){
                            callback(err);
                          }else{
                            self.nextLowerAddress(gres,function(err,gres){
                              if (err){
                                callback(err);
                              }else{

                                for(i=0;i<gres.streets.length;i++){

delete gres.streets[i].way_line;
delete gres.streets[i].citybound;
                                  if (typeof gres.streets[i].exact_point==='undefined'){
                                    try{
                                      //if (gres.streets[i].next_lower)
                                      prev = JSON.parse(gres.streets[i].next_lower).coordinates;
                                      next = JSON.parse(gres.streets[i].next_upper).coordinates;

                                      prevnr = gres.streets[i].next_lower_number*1;
                                      nextnr = gres.streets[i].next_upper_number*1;

                                      ratio = (gres.housenumber - prevnr)/(nextnr - prevnr) ;

                                      a = (prev[1]-next[1])/(prev[0]-next[0]);
                                      b = prev[1] - a*prev[0];

                                      aprox = [
                                        prev[0] + (next[0]-prev[0])*ratio,
                                        a*( prev[0] +  ( next[0]-prev[0])*ratio ) +b
                                      ];

                                      gres.streets[i].aprox_point = {
                                        type: 'Point',
                                        coordinates: aprox
                                      };
                                    }catch(e){
                                      console.log('geocoder.js (line:504)',address,e,gres);

                                    }


                                  }else{

                                    gres.streets[i].exact_point = JSON.parse(gres.streets[i].exact_point);
                                  }
                                  gres.streets[i].simple_point = JSON.parse(gres.streets[i].simple_point);
                                  //console.log(aprox,ratio);
                                }
                                callback(err,gres);
                              }
                            })
                          }
                        })
                      }
                    }
                  )

                })
              }
            }
          }
        );

      }
    }
  });

}


exports.Geocoder = Geocoder;
