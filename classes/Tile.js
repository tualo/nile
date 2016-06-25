"use strict";
var EventEmitter = require('events').EventEmitter,
fs = require('fs'),
path = require('path'),
utilities = require('./Utilities'),
mkdirp = require('mkdirp'),
Styler =  require('nile-style').Renderer;

var conditions = [
/*
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND (tags->'usage'='main')",
"AND ((tags->'usage'='main') OR (tags->'usage'='branch'))",
"AND ((tags->'usage'='main') OR (tags->'usage'='branch') OR (tags->'railway'='disused') OR (tags->'railway'='abandoned') OR (tags->'railway'='proposed') OR (tags->'railway'='construction') OR (tags->'railway'='station') OR (tags->'railway'='narrow_gauge'))",
"AND ((tags->'railway'='rail') OR (tags->'railway'='disused') OR (tags->'railway'='abandoned') OR (tags->'railway'='proposed') OR (tags->'railway'='construction') OR (tags->'railway'='light_rail') OR (tags->'railway'='tram') OR (tags->'railway'='subway') OR (tags->'railway'='narrow_gauge') OR (tags->'railway'='station') OR (tags->'railway'='halt'))"
*/
];



var Tile = function(system){
  var self = this;
  self.system = system;
  self._z = 8;
  self._x = 0;
  self._y = 0;
  self._tileSize = 256;
  self._filter = '';

  return self;
}

utilities.inherits(Tile, EventEmitter, {
  get column () { return this._column; },
  set column (v) { this._column = v; return this; },
  get values () { return this._values; },
  set values (v) { this._values = v; return this; },
  get as () { return this._as; },
  set as (v) { this._as = v; return this; },
  get base () { return this._base; },
  set base (v) { this._base = v; return this; },

  get style () { return this._style; },
  set style (v) { this._style = v; return this; },

  get filter () { return this._filter; },
  set filter (v) { this._filter = v; return this; },

  get x () { return this._x; },
  set x (v) {
    this._x = v*1;
    //this._updateBBox();
    return this;
  },
  get y () { return this._y; },
  set y (v) {
    this._y = v*1;
    //this._updateBBox();
    return this;
  },
  get z () { return this._z; },
  set z (v) {
    this._z = v*1;
    //this._updateBBox();
    return this;
  }

});


Tile.prototype._updateBBox = function(){
  var self = this;
  self.bbox = this.from4326To900913( this.getBbox());
}


Tile.prototype.sqlQuery = function(name){
  var pxtolerance = 1.8;
  var buffer = this.pixelSizeAtZoom(pxtolerance);
  var way_area = (Math.pow(buffer, 2)/ pxtolerance );
  var way_area_buffer = Math.pow(buffer, 2);
  var cond = '';
  var way_column = 'way';
  var prefix = 'planet_osm';
  var parts = [],
  self = this,
  column = this.column,
  values = this.values,
  base = this.base,
  as = this.as,
  bbox = this.bbox;
  var tolerance = (bbox[2]-bbox[0]);
  var granularity  = 10000;
  var cond      = "";
  var xfactor = (granularity/(bbox[2]-bbox[0]));
  var yfactor = (granularity/(bbox[3]-bbox[1]));
  var deltaX = bbox[0]*-1;
  var deltaY = bbox[1]*-1;
  var key = '';
  var filter = '';
  var transscale = ''+(-bbox[0])+', '+(-bbox[1])+', '+granularity/(bbox[2]-bbox[0])+', '+granularity/(bbox[3]-bbox[1])+'';
  var srid = "ST_SetSRID('BOX3D("+(bbox[0]-tolerance)+" "+(bbox[1]-tolerance)+","+(bbox[2]+tolerance)+" "+(bbox[3]+tolerance)+")'::box3d, 900913) "+cond+" ";
  var sql = ( fs.readFileSync( path.join(__dirname,'sqls',name+'.sql') )).toString() ;

  if (typeof conditions[self.z*1] === 'string'){
    cond = conditions[self.z*1];
  }

  if (typeof this.filter==='object'){
    for(key in this.filter){
      var op=this.filter[key].comp;
      if (op === ' === '){
        op = '=';
      }
      if (filter!==''){
        filter+= 'or';
      }
      filter += " tags->'"+this.filter[key].tag+"' "+op+" " + this.filter[key].value + " "
    }
  }
  if (filter!==''){
    cond += ' and ('+ filter + ') ';
  }

  sql = sql.replace(/\#\#way_area_buffer/g,way_area_buffer);
  sql = sql.replace(/\#\#way_area/g,way_area);
  sql = sql.replace(/\#\#way_column/g,way_column);
  sql = sql.replace(/\#\#cond/g,cond);
  sql = sql.replace(/\#\#srid/g,srid);
  sql = sql.replace(/\#\#buffer/g,buffer);
  sql = sql.replace(/\#\#transscale/g,transscale);
  sql = sql.replace(/\#\#prefix/g,prefix);
  //console.log(sql);
  return sql;
}

Tile.prototype.getDatabaseQuery = function(){
  var sql = [
    this.sqlQuery('polygon'),
    this.sqlQuery('line'),
    this.sqlQuery('point')
  ];
  //sql.push(this.__getDatabaseQuery());
  return sql.join(' UNION ') + '  LIMIT 100000';
}


Tile.prototype.__getDatabaseQuery = function(){

  var parts = [],
  self = this,
  column = this.column,
  values = this.values,
  base = this.base,
  as = this.as,
  bbox = this.bbox;


  var tolerance = (bbox[2]-bbox[0]);
  var granularity  = 10000;
  var cond      = "";

  var xfactor = (granularity/(bbox[2]-bbox[0]));
  var yfactor = (granularity/(bbox[3]-bbox[1]));
  var deltaX = bbox[0]*-1;
  var deltaY = bbox[1]*-1;


  var t = "ST_SetSRID('BOX3D("+(bbox[0]-tolerance)+" "+(bbox[1]-tolerance)+","+(bbox[2]+tolerance)+" "+(bbox[3]+tolerance)+")'::box3d, 900913) "+cond+" ";

  for(var j in base){
    parts.push(
      [
      'SELECT',

      'planet_osm_'+base[j]+'.* ,',

      'ST_As'+as+'( ',
      'ST_Affine( ',
      'ST_Transform( ',
      ' ST_ForceRHR(  ',
      'ST_Intersection( '+t+' ,way)',
      ' ) ',
      ' ,900913), ',
      xfactor+', 0, 0, 0,',
      yfactor+', 0, 0, 0, 1, ',
      (deltaX * xfactor)+',',
      (deltaY * yfactor)+', 0 ',
      ' )',
      ') AS data, ',
      'ST_As'+as+'( ',
      ' ST_Affine( ',
      'ST_ForceRHR(ST_PointOnSurface(way)), ',
      xfactor+', 0, 0, 0,',
      yfactor+', 0, 0, 0, 1, ',
      (deltaX * xfactor)+',',
      (deltaY * yfactor)+', 0 ',
      ' ) ',
      ') AS reprpoint',
      'FROM',
      'planet_osm_'+base[j]+' ',
      'WHERE',
      'ST_Intersects( way, '+t+' )   ',
      //' and '+column+'=\''+values[i]+'\' '
      ].join(' ')
    );
  }
  return parts.join(' UNION ');

}

Tile.prototype.invertYAxe = function(data){
  var type,
  coordinates,
  tileSize = data.granularity,
  i,
  j,
  k,
  l,
  feature;
  for (i = 0; i < data.features.length; i++){
    feature = data.features[i];
    coordinates = feature.coordinates;
    type = data.features[i].type;
    if (type === 'Point'){
      coordinates[1] = tileSize - coordinates[1];
    }else if (type === 'MultiPoint' || type === 'LineString'){
      for (j = 0; j < coordinates.length; j++){
        coordinates[j][1] = tileSize - coordinates[j][1];
      }
    }else if (type === 'MultiLineString' || type === 'Polygon'){
      for (k = 0; k < coordinates.length; k++){
        for (j = 0; j < coordinates[k].length; j++){
          coordinates[k][j][1] = tileSize - coordinates[k][j][1];
        }
      }
    }else if (type === 'MultiPolygon'){
      for (l = 0; l < coordinates.length; l++){
        for (k = 0; k < coordinates[l].length; k++){
          for (j = 0; j < coordinates[l][k].length; j++){
            coordinates[l][k][j][1] = tileSize - coordinates[l][k][j][1];
          }
        }
      }

    }else{
      //this.logger.log('warn',"Unexpected GeoJSON type: " + type);
      //throw "Unexpected GeoJSON type: " + type;
    }

    if (feature.hasOwnProperty('reprpoint')){
      feature.reprpoint[1] = tileSize - feature.reprpoint[1];
    }
  }
  return data;
}

Tile.prototype.queryAsGeoJSON = function(callback){
  var data,i,json,field,self=this;
  this.as = 'GeoJSON';
  this.base = ['roads','line','polygon'];
  this.query(function(err,result){
    if (err){
      callback(err,null);
    }else{
      data = {
        features: [],
        granularity: 10000,
        bbox: self.from900913To4326(self.bbox)
      };
      for(i=0;i<result.length;i++){

        json = JSON.parse(result[i].data);
        if (
          (typeof result[i].tags==='string')
          && (result[i].tags!=='')
          && (result[i].tags.substr(0,1)==='{')
        ){
          var p = JSON.parse(result[i].tags);
          p.zorder = result[i].z_order;
          json.properties = p;
        }else{

          /// there is not tags column so we have to build the tags
          json.properties = {};
          for(field in result[i]){
            if (
              (field !== 'data') ||
              (field !== 'way')||
              (field !== 'reprpoint')||
              (field !== 'bbox')
            ){
              if (typeof result[i][field]==='string'){
                json.properties[field] = result[i][field];
              }
            }
          }
        }

        if (typeof result[i].reprpoint==='string'){
          json.reprpoint = (JSON.parse(result[i].reprpoint) ).coordinates;
        }
        if (typeof result[i].bbox==='string'){
          json.bbox = (JSON.parse(result[i].bbox) ).coordinates;
        }

        data.features.push(json);
      }
      callback(false, self.invertYAxe(data));
    }
  });
}


Tile.prototype.query = function(callback){
  var self = this,
  client = self.system.client,
  sql='';
  sql = self.getDatabaseQuery();
  //self.system.logger.log('debug',sql);
  client.query(sql, function(err, results){

    if (err){
      self.system.logger.log('error',err);
      callback(err, null);
    }else{
      callback(false, results.rows);
    }


  });

}

Tile.prototype.getBbox = function(){
  var a = this.getCoords(this.z, this.x, this.y);
  var b = this.getCoords(this.z, this.x+1, this.y+1);
  return new Array(a[0], b[1], b[0], a[1]);
};

// Converts (z,x,y) to coordinates of corner of a tile
Tile.prototype.getCoords = function(z, x, y){
  var normalizedTile = new Array(x/Math.pow(2.0, z), 1.0-(y/Math.pow(2.0, z)));
  var projectedBounds = this.from4326To900913(new Array(-180.0, -85.0511287798, 180.0, 85.0511287798));
  var maxp = new Array(projectedBounds[2]-projectedBounds[0], projectedBounds[3]-projectedBounds[1]);
  var projectedCoords = new Array((normalizedTile[0]*maxp[0])+projectedBounds[0], (normalizedTile[1]*maxp[1])+projectedBounds[1]);
  return this.from900913To4326(projectedCoords);
}

Tile.prototype.from4326To900913 = function(line){
  var serial = false;
  if (!Array.isArray(line[0])){
    serial = true;
    var l1 = new Array();
    for (var i=0; i<line.length; i=i+2){
      l1.push(new Array(line[i], line[i+1]));
    }
    var line = l1;
  }

  var ans = new Array();
  for (var i=0; i<line.length; i++){
    var latRad = this.deg2rad(line[i][1]);
    var xtile = line[i][0]*111319.49079327358;
    var ytile = Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI * 20037508.342789244;

    if (serial){
      ans.push(xtile);
      ans.push(ytile);
    }
    else{
      ans.push(new Array(xtile, ytile));
    }
  }

  return ans;
}
Tile.prototype.from900913To4326 = function(line){
  var serial = false;
  if (!Array.isArray(line[0])){
    serial = true;
    var l1 = new Array();
    for (var i=0; i<line.length; i=i+2){
      l1.push(new Array(line[i], line[i+1]));
    }
    line = l1;
  }
  var ans = new Array();
  for (var i=0; i<line.length; i++){
    var xtile = line[i][0]/111319.49079327358;
    var ytile = this.rad2deg(Math.asin(this.tanh(line[i][1]/20037508.342789244*Math.PI)));
    if (serial){
      ans.push(xtile);
      ans.push(ytile);
    }else{
      ans.push(new Array(xtile, ytile));
    }
  }

  return ans;
}

Tile.prototype.pixelSizeAtZoom = function(l){
  l = l || 1;
  return l*20037508.342789244 / 256*2 / Math.pow(2, this.z);
}

Tile.prototype.deg2rad = function(angle){
  return angle*(Math.PI/180.0);
}

Tile.prototype.tanh = function(i){
  return (Math.exp(i) - Math.exp(-i)) / (Math.exp(i) + Math.exp(-i));
}

// equivalent of rad2deg in PHP
Tile.prototype.rad2deg = function(angle){
  return angle/(Math.PI/180.0);
}


Tile.prototype.long2tile = function(lon,zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}

Tile.prototype.lat2tile = function(lat,zoom)  {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}


var route = function(system,style,zoom,x,y){

  return function(req,res,next){
    var tile = new Tile(system),
    image_path = path.join(__dirname,'..','public','map',coords.zoom,coords.x)
    output = path.join(image_path,req.params.y+'.png');

    tile.z = coords.zoom;
    tile.x = coords.x;
    tile.y = coords.y;
    tile._updateBBox();

    if(fs.existsSync(path.join(image_path,req.params.y+'.geojson'))){
      var data = JSON.parse(fs.readFileSync(path.join(image_path,coords.y+'.geojson')));
      var kothic = new Kothic(1,system.mapCSS);
      kothic.setOptions({
        styles: [style]
      });
      kothic.setZoom(coords.zoom);
      kothic.setGeoJSON(data);
      kothic.run(output,function(){
        res.sendFile(output);
        //console.log(coords,'!');
      });

    }else{
      mkdirp(image_path, function (err) {
        if (err){
          console.error(err);
          next();
        }else{


          tile.queryAsGeoJSON(function(err,data){
            var kothic;

            fs.writeFile(path.join(image_path,coords.y+'.geojson'),JSON.stringify(data,null,4),function(err){

            });

            kothic = new Kothic(1,system.mapCSS);
            kothic.setOptions({
              styles: [style]
            });

            kothic.setZoom(coords.zoom);
            kothic.setGeoJSON(data);
            kothic.run(output,function(){
              //console.log(coords,'***');
              res.sendFile(output);
            });

          });
        }
      });
    }
  }


}

exports.route = route;

exports.Tile = Tile;
