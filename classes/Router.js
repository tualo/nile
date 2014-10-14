var Geocoder = require('./Geocoder').Geocoder;

//
var Router = function(system,debug){
  var self = this;
  self.debug=false;
  if (typeof debug==='boolean'){
    self.debug = debug;
  }
  self.system = system;
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
        start_lon = res[0].lng;
        start_lat = res[0].lat;
        geocoder.geoCode(city_to,street_to,function(err,res){
          if(err){
            callback(err);
          }else{
            if (res.length>0){
              stop_lon = res[0].lng;
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

Router.prototype.route = function(lng_from,lat_from,lng_to,lat_to,callback){
  var self = this,
      client = self.system.client,
      sql = 'select ST_AsText(ST_UNION(geom)) way, sum(cost) len from pgr_fromAtoB(\'ways\',{lng_from}, {lat_from},{lng_to}, {lat_to})';
      sql = sql.replace('{lng_from}',lng_from)
               .replace('{lat_from}',lat_from)
               .replace('{lng_to}',lng_from)
               .replace('{lat_to}',lat_to);

  client.query( sql , function(err, results){

      if (err){
        self.system.logger.log('error',err);
        callback(err, null);
      }else{
        callback(false, results.rows);
      }
  })

});

exports.Router = Router;
