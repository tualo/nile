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

Geocoder.accuracy = {
  EXACT:        10,
  NOPOSTALCODE:  7,
  CALCULATED:    6,
  UNDEFINED:     0
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
  //sql ="select name,metaphone,levenshtein(lower(name),lower( '"+name+"' )) as lv from gc_cities where metaphone like concat('%',  dmetaphone('"+name+"'),  '%') order by lv asc";
  sql ="select name,metaphone,levenshtein(lower(name),lower( '"+name+"' )) as lv from gc_cities where metaphone =  metaphone('"+name+"',10) order by lv asc";
  if (self.debug){
    console.time('is city '+name);
  }
  self.system.client.query(
    sql,
    function(err, results){
      if (self.debug){
        console.timeEnd('is city '+name);
      }
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

  //sql ="select name,metaphone,levenshtein(lower(name),lower( '"+name+"' )) as lv from gc_streets where metaphone like concat('%',  dmetaphone('"+name+"'),  '%') order by lv asc";
  // todo find faster indices
  sql ="select name,metaphone,levenshtein(lower(name),lower( '"+name+"' )) as lv from gc_streets where metaphone = metaphone('"+name+"',10) order by lv asc";
  if (self.debug){
    console.time('is street '+name);
  }
  self.system.client.query(
    sql,
    function(err, results){
      if (self.debug){
        console.timeEnd('is street '+name);
      }
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
Geocoder.prototype.analyse = function(list,callback,index,result,housenumber){
  var self= this,
  i,
  h,
  street,
  streets,
  city,
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
      if (self.debug){
        console.log('found housenumber',housenumber);
      }
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
        housenumber: null
      };
      index=0;
    }





    self.isStreet(list[index],function(err,res){
      if (err){
        callback(err);
      }else{
        // /((\w+)\s?)+\s+(\d+.*)^/i
        //todo linestring size matching
        result[item].isStreet=(res[0])?res[0].diff:99999;
        result[item].bestMatchStreet=(res[0])?res[0].name:'';
        result[item].streets = [];
        //result[item].housenumber = housenumber;

        for(i=0;i< res.length;i++){
          if (res[i].diff < (item.length )) {
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
        self.analyse(list,callback,index+1,result,housenumber);
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

          //housenumber = result[i].housenumber;

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
    sql = sql.replace(/\$geom/g,bounds[index].geom).replace(/\$streets/g, "'"+streets.join("','")+"'");
    //console.log(sql);
    self.system.client.query(
      sql,
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
  sql = "select ST_AsGeoJSON(ST_PointOnSurface(way)) as next_lower,tags->'addr:housenumber' as housenumber from planet_osm_polygon where tags->'addr:street' = '$street' and cast( coalesce(SUBSTRING(tags->'addr:housenumber', '.*?(\d\d\d)'),coalesce(SUBSTRING(tags->'addr:housenumber', '.*?(\d\d)'),SUBSTRING(tags->'addr:housenumber', '.*?(\d)'))) as int8) < $housenumber and ST_Intersects(way,ST_GeomFromText('$geom',900913)) order by housenumber desc";

  if (typeof index ==='undefined'){
    index = 0;
    result = [];
  }
  if (index < gres.streets.length){
    sql = sql.replace(/\$geom/g,gres.streets[index].citybound).replace(/\$housenumber/g,parseInt(gres.housenumber)).replace(/\$street/g, gres.streets[index].name);
    self.system.client.query(
      sql,
      function(err, pointResult){
        if (err){
          console.log(err);
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

  sql = "select ST_AsGeoJSON(ST_PointOnSurface(way)) as next_upper,tags->'addr:housenumber' as housenumber from planet_osm_polygon where tags->'addr:street' = '$street' and cast ( coalesce(SUBSTRING(tags->'addr:housenumber', '.*?(\d\d\d)'),coalesce(SUBSTRING(tags->'addr:housenumber', '.*?(\d\d)'),SUBSTRING(tags->'addr:housenumber', '.*?(\d)'))) as int8) > $housenumber and ST_Intersects(way,ST_GeomFromText('$geom',900913)) order by housenumber asc ";

  if (typeof index ==='undefined'){
    index = 0;
    result = [];
  }
  if (index < gres.streets.length){
    sql = sql.replace(/\$geom/g,gres.streets[index].citybound).replace(/\$housenumber/g,parseInt(gres.housenumber)).replace(/\$street/g, gres.streets[index].name);
    //console.log(sql);
    self.system.client.query(
      sql,
      function(err, pointResult){
        if (err){
          console.log(err);
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

var child;
child = exec('php /root/Nominatim-2.3.0/utils/query.php "'+address+'"', function (error, stdout, stderr) {
  console.log('exec: ',error,stdout,stderr);
if (error !== null) {
  callback(error,stdout);
}
});


  if (false){
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
  if (self.debug){
    console.time('analyse '+address);
  }
  self.analyse(parts,function(err,res){
    if (self.debug){
      console.timeEnd('analyse '+address);
    }
    if (err){
      callback(err);
    }else{
      if ( (typeof res.city !== 'undefined' ) && (res.city !== '' )){
        if (typeof res.streets==='undefined'){
          res.streets=[];
        }
        sql = "select ST_AsText(way) geom from planet_osm_polygon where boundary='administrative' and name='$city'";
        if (self.debug){
          console.time('city_bounds '+address);
        }
        sql = sql.replace(/\$city/g,res.city).replace(/\$streets/g, "'"+res.streets.join("','")+"'");

        self.system.client.query(
          sql,
          function(err, city_bounds){
            if (self.debug){
              console.timeEnd('city_bounds '+address);
            }
            if (err){
              callback(err);
            }else{

              if (res.street !== '' ){
                if (self.debug){
                  console.time('streets '+address);
                }
                self.selectStreets(res.streets,city_bounds.rows,function(err,roads){
                  if (self.debug){
                    console.timeEnd('streets '+address);
                  }

                  if (self.debug){
                    console.time('exactAddress '+address);
                  }
                  self.exactAddress(
                    {
                      housenumber: res.housenumber,
                      city: res.city,
                      streets: roads
                    },
                    function(err,gres){
                      if (self.debug){
                        console.timeEnd('exactAddress '+address);
                      }
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
                                      if (gres.streets[i].stop_point===null){
                                          gres.streets[i].stop_point= JSON.parse(gres.streets[i].simple_point);
                                      }
                                      if (gres.streets[i].start_point===null){
                                          gres.streets[i].start_point= JSON.parse(gres.streets[i].simple_point);
                                      }
                                      if (typeof gres.streets[i].next_lower==='undefined'){
                                        gres.streets[i].next_lower = gres.streets[i].start_point;
                                        gres.streets[i].next_lower_number=1;
                                      }

                                      if (typeof gres.streets[i].next_upper==='undefined'){
                                        gres.streets[i].next_upper = gres.streets[i].stop_point;
                                        gres.streets[i].next_upper_number=50;
                                      }

                                      prev = JSON.parse(gres.streets[i].next_lower).coordinates;
                                      next = JSON.parse(gres.streets[i].next_upper).coordinates;

                                      prevnr = gres.streets[i].next_lower_number*1;
                                      nextnr = gres.streets[i].next_upper_number*1;

                                      ratio = (parseInt( gres.housenumber ) - prevnr)/(nextnr - prevnr) ;

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
                                      //if (aprox[0]==null){
                                        //console.log('null error ','ratio',ratio,'a',a,'b',b,'p0',prev[0],'p1',prev[1]);
                                      //}
                                    }catch(e){
                                      if (self.debug){
                                        console.log('geocoder.js (line:504)',address,e,gres);
                                      }

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
}


exports.Geocoder = Geocoder;
