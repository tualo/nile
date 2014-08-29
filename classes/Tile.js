var EventEmitter = require('events').EventEmitter,
utilities = require('./Utilities');



var Tile = function(system){
  var self = this;
  self.system = system;


  self.svgNameSpaces = [];
  self.svgNameSpaces.push('xmlns="http://www.w3.org/2000/svg"');
  self.svgNameSpaces.push('xmlns:xlink="http://www.w3.org/1999/xlink"');


  //nur zum TEST dies sollte aus dem CSS der MAP geladen werden.
  self.svgStyleSheet = {};
  self.svgStyleSheet['highway'] = {};
  self.svgStyleSheet['highway']['motorway'] = {
    stroke: "#006600;",
    fill:   "none;"
  };
  self.svgStyleSheet['highway']['primary'] = {
    stroke: "#666600;",
    fill:   "none;"
  };
  self.svgStyleSheet['highway']['secondary'] = {
    stroke: "#555500;",
    fill:   "none;"
  };
  self.svgStyleSheet['highway']['residential'] = {
    stroke: "#446600;",
    fill:   "none;"
  };


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

  get x () { return this._x; },
  set x (v) { this._x = v; return this; },
  get y () { return this._y; },
  set y (v) { this._y = v; return this; },
  get z () { return this._z; },
  set z (v) { this._z = v; return this; }

});



Tile.prototype.tile2long = function (x,z) {
  return (x/Math.pow(2,z)*360-180);
}

Tile.prototype.tile2lat = function (y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

Tile.prototype.getDatabaseQuery = function(){
  var parts = [],
  self = this,
  column = this.column,
  values = this.values,
  base = this.base,
  as = this.as;

  var tileBox   = self.getBbox();
  //  console.log(tileBox);
  var bbox      = self.from4326To900913(tileBox);
  //  console.log(bbox);
  var tolerance = 0;
  var cond      = "";

  var t = "ST_SetSRID('BOX3D("+(bbox[0]-tolerance)+" "+(bbox[1]-tolerance)+","+(bbox[2]+tolerance)+" "+(bbox[3]+tolerance)+")'::box3d, 900913) "+cond+" ";
  for(var i in values){
    parts.push(
      [
        'SELECT',
          'osm_id,',
          'name,',
          column+',',
          'ST_As'+as+'( ST_Transform( ST_Intersection( '+t+' ,way) ,4326) ) AS data',
        'FROM',
          'planet_osm_'+base+' ',
        'WHERE',
          'ST_Intersects( way, '+t+' )  and ',
          ''+column+'=\''+values[i]+'\' '
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
      throw "Unexpected GeoJSON type: " + type;
    }

    if (feature.hasOwnProperty('reprpoint')){
      feature.reprpoint[1] = tileSize - feature.reprpoint[1];
    }
  }
}

Tile.prototype.queryAsSVG = function(callback,_svg,_columns,_index){
  var column,
  self = this,
  values=[];

  this.as = 'SVG';


  if (typeof _columns === 'undefined'){
    _svg = [];
    _svg.push("<svg "+self.svgNameSpaces.join(" ")+">");

    _svg.push('<style type="text/css" ><![CDATA['+"\n");
    for(column in self.svgStyleSheet){
      for(value in self.svgStyleSheet[column]){
        values.push(value);
        _svg.push('path.'+column+' .'+value+' '+JSON.stringify(self.svgStyleSheet[column][value])+"\n");
      }
    }
    _svg.push(']]></style>'+"\n");

    _columns = [];
    _index = 0;
    for(column in self.svgStyleSheet){
      _columns.push(column);
    }
  }

  if (_index < _columns.length){
    column = _columns[_index];
    for(value in self.svgStyleSheet[column]){
      values.push(value);
    }
    self.values = values;
    self.column = column;
    self.base = 'roads';
    this.query(function(err,result){
      if (err){
        callback(err,null);
      }else{
        //console.log(result);
        for(var i in result){
          if (result[i].data!=''){
            _svg.push('<path class="'+column+' '+result[i][column]+'" d=\"'+result[i].data+'\" />');
          }
        }
        self.queryAsSVG(callback,_svg,_columns,_index+1);
      }

    });

  }else{
    // return with callback
    _svg.push("</svg>");
    callback(false,_svg.join("\n"));

  }
}

Tile.prototype.queryAsGeoJSON = function(callback){
  this.as = 'GeoJSON';
  this.query(callback);
}


Tile.prototype.query = function(callback){
  var self = this,
  client = self.system.client,
  sql='';

  sql = self.getDatabaseQuery();
  self.system.logger.log('debug',sql);
  //console.log(sql);
  client.query(sql, function(err, results){

    if (err){
      console.log(err);
      callback(err, null);
    }else{
      callback(false, results.rows);
    }



        /*
        var content = {};
        content.features = [];
        content.features = self.getJSONFeatures(results);
        if (!content.features){
        content.features = []; //new Array();
      }
      //content.granularity = configuration.intscalefactor;
      content.bbox = bbox;
      client.end();

      self.invertYAxe(content);
      //self.data = content;

      callback(false, content);
      */
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

exports.Tile = Tile;
