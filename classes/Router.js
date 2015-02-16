var Geocoder = require('./Geocoder').Geocoder;

//
var Router = function(system,debug){
  var self = this;
  self.debug=false;
  if (typeof debug==='boolean'){
    self.debug = debug;
  }
  self.system = system;
  self.tbl = 'carways';
}

Router.prototype.routeAddress = function(city_from,street_from,city_to,street_to,callback){
  var self = this,
  start_lon,
  start_lat,
  stop_lon,
  stop_lat,
  geocoder = new Geocoder(self.system,self.debug);

  geocoder.geoCode(city_from,street_from,function(err,res){
    if(err){
      callback(err);
    }else{
      if (res.length>0){
        start_lon = res[0].lon;
        start_lat = res[0].lat;
        geocoder.geoCode(city_to,street_to,function(err,res){
          if(err){
            callback(err);
          }else{
            if (res.length>0){
              stop_lon = res[0].lon;
              stop_lat = res[0].lat;

              self.route(start_lon,start_lat,stop_lon,stop_lat,callback);


            }else{
              callback("could not find "+city_to+","+street_to+"");
            }
          }
        })
      }else{
        callback("could not find "+city_from+","+street_from+"");
      }
    }
  })
}

/*
Retreive all avaialable classes.
@params {function} callback callback-function (error,records)
*/
Router.prototype.getClasses = function(callback){

  var self = this,
  client = self.system.client,
  sql = 'SELECT id, name, cost, priority, default_maxspeed FROM classes';

  client.query( sql , function(err, results){

    if (err){
      self.system.logger.log('error',err);
      callback(err, null);
    }else{
      callback(false, results.rows);
    }
  });
}

Router.prototype.sortListBy = function(list,key){
  var l = [],
  res = [],
  h = {},
  i = 0,
  s,
  j,
  n,
  m = list.length;
  for(i=0;i<m;i++){
    l.push(list[i][key] + 100000);
    if (typeof h[ list[i][key] ] === 'undefined'){
      h[ list[i][key] ] = [];
    }
    h[ list[i][key] ].push(list[i]);
  }
  l.sort();
  for(i in l){
    if (h.hasOwnProperty(i)){
      s = h[i];
      n= s.length;
      for(j=0;j<n;j++){
        res.push(s[j]);
      }
    }
  }
  return res;
}

Router.prototype.tsp = function(list,callback){
  var self=this,
  sessionkey = (new Date().getTime()),
  client = self.system.client,
  sql = '',
  i=0,
  m=0,
  l,
  j=0,
  n=0;

  self._tsp_fill_ids(sessionkey,list,0,function(err,new_list,start,stop){

    if (err){
      console.log('tsp',err);

      callback(err);
    }else{

      console.log('tsp',new_list,start,stop);
      if (typeof start==='undefined'){
        start = new_list[0].id;
      }


      if (typeof stop==='undefined'){
        stop = new_list[0].id;
      }
      sql = 'SELECT * from pgr_tsp(\'SELECT distinct id, x, y  '+
      'FROM tsp_vertex_table where session = '+sessionkey+' \','+start+','+stop+')';
      console.log('tsp',sql);

      client.query( sql , function(err, results){
        if (err){
          callback(err);
          client.query( 'delete from tsp_vertex_table where session =  '+sessionkey+'  ' , function(err, results){ });

        }else{
          if (results.rows.length>0){
            m = results.rows.length;
            for(i=0;i<m;i++){
              l = self.indexMap[results.rows[i].id2];
              n = l.length;
              for (j=0;j<n;j++){
                new_list[l[j]].seq = results.rows[i].seq;
              }
            }
            if (typeof self.indexMap[-999999]  !== 'undefined'){
              new_list[ self.indexMap[-999999][0] ].seq = m;
            }

            console.log('tsp',results,new_list);

            callback(err, self.sortListBy(new_list,'seq') );

            client.query( 'delete from tsp_vertex_table where session =  '+sessionkey+'  ' , function(err, results){ });

          }else{
            callback("no result");
            client.query( 'delete from tsp_vertex_table where session =  '+sessionkey+'  ' , function(err, results){ });
            //SELECT dmatrix, ids from pgr_makeDistanceMatrix('SELECT id, x, y FROM tsp_vertex_table');
            //client.query( 'delete from tsp_vertex_table where session =  '+sessionkey+'  ' , function(err, results){
            //});
          }
        }
      })
    }
    // 'SELECT seq, id1, id2, round(cost::numeric, 2) AS cost FROM pgr_tsp('SELECT id, x, y FROM tsp_vertex_tabl',42673) '
  })
}
/*
drop table tsp_vertex_table;
create table tsp_vertex_table (
id int4,
x double precision,
y double precision,
session int8
);
*/

Router.prototype._tsp_fill_ids = function(sessionkey,list,index,callback,start,stop){
  var self=this,
  client = self.system.client,
  sql = [
  'SELECT '+self.tbl+'_vertices_pgr.id::integer as id,st_x('+self.tbl+'_vertices_pgr.the_geom) as lng,st_y('+self.tbl+'_vertices_pgr.the_geom) as lat FROM '+self.tbl+'_vertices_pgr join ',
  ' '+self.tbl+' on '+self.tbl+'_vertices_pgr.id='+self.tbl+'.gid ',
  ' ORDER BY '+self.tbl+'_vertices_pgr.the_geom <-> ST_GeometryFromText(\'POINT({lng} {lat})\',4326) LIMIT 1'
  ].join(' '),
  insertTPL= [
  'insert into tsp_vertex_table ',
  '(id,x,y,session) values ',
  '({id},{x},{y}, {session} )'
  ].join(' '),
  insert='';

  /*
  select i, array_agg(dist) as arow from (
  select a.id as i, b.id as j, st_distance(st_makepoint(a.x, a.y), st_makepoint(b.x, b.y)) as dist
  from tsp_vertex_table a, tsp_vertex_table b
  order by a.id, b.id
) as foo group by i order by i
*/
if (typeof self.indexMap === 'undefined'){
  self.indexMap = {};
}
if (index < list.length){
  sql = sql.replace('{lng}',list[index].lng).replace('{lat}',list[index].lat);
  client.query( sql , function(err, results){
    if (err){
      callback(err, null);
      //self._tsp_fill_ids(sessionkey,list,index+1,callback);
    }else{
      if (results.rows.length===1){
        if (typeof self.indexMap[results.rows[0].id]==='undefined'){
          self.indexMap[results.rows[0].id]=[];
        }
        self.indexMap[results.rows[0].id].push(index);

        list[index].id = results.rows[0].id;

        if ( typeof list[index].refid !== 'undefined' ){

          if (list[index].refid == 'STARTPOINT' ){
            if ( typeof start === 'undefined' ){
              start = results.rows[0].id;
              console.log('STARTPOINT',start);
            }
          }


          if (list[index].refid == 'STOPPOINT' ){
            if ( typeof stop === 'undefined' ){

              stop = results.rows[0].id;
              console.log('STOPPOINT',stop);
              if (stop === start){
                self.indexMap[-999999]=[];
                self.indexMap[-999999].push(index);
              }
            }
          }

        }
        insert = insertTPL;
        insert = insert.replace('{id}',results.rows[0].id);
        insert = insert.replace('{y}',results.rows[0].lng);
        insert = insert.replace('{x}',results.rows[0].lat);
        insert = insert.replace('{session}',sessionkey);
        client.query( insert , function(err, results){
          self._tsp_fill_ids(sessionkey,list,index+1,callback,start,stop);
        })
      }else{
        callback("node not found");
      }
    }
  })
}else{
  callback(null,list,start,stop);
}
}

Router.prototype.routeList = function(list,callback,index){
  var self = this;

  if (typeof index === 'undefined'){
    list[0].len=0;
    index = 1;
  }
  if (index < list.length){
    self.route(list[index-1].lng,list[index-1].lat,list[index].lng,list[index].lat,function(err,results){
      if (err){
        callback(err);
      }else{
        //console.log(results);

        if (results.length>0){
          list[index].len = results[0].len;
          list[index].way = results[0].way;
        }else{
          list[index].len = 0;
        }

        self.routeList(list,callback,index + 1);
      }
    })
  }else{
    callback(null,list);
  }
}

Router.prototype.route = function(lng_from,lat_from,lng_to,lat_to,callback){
  var self = this,
  client = self.system.client,

  sql = ['select',
  '  ST_AsGEOJSON(ST_UNION(geom)) way,',
  '  sum(cost) len',
  'from',
  '  pgr_fromAtoB(\''+self.tbl+'\',{lng_from}, {lat_from},{lng_to}, {lat_to})'].join(' ');
  sql = sql.replace('{lng_from}',lng_from)
  .replace('{lat_from}',lat_from)
  .replace('{lng_to}',lng_to)
  .replace('{lat_to}',lat_to);

  client.query( sql , function(err, results){

    if (err){
      self.system.logger.log('error',err);
      callback(err, null);
    }else{
      callback(false, results.rows);
    }
  })


}

exports.Router = Router;
