var EventEmitter = require('events').EventEmitter,
fs = require('fs'),
path = require('path'),
css = require('css'),
Entities = require('html-entities').AllHtmlEntities,
utilities = require('./Utilities');

entities = new Entities();


var Tile = function(system){
  var self = this;
  self.system = system;
  self._z = 8;
  self._x = 0;
  self._y = 0;
  this._style = 'standard';

  this.svg_ns = [
  'xmlns="http://www.w3.org/2000/svg"',
  'xmlns:xlink="http://www.w3.org/1999/xlink"'
  ];



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


Tile.prototype.getDatabaseQuery = function(){
  var parts = [],
  self = this,
  column = this.column,
  values = this.values,
  base = this.base,
  as = this.as,
  bbox = this.bbox;

  //  console.log(bbox);
  var tolerance = 0;
  var cond      = "";

  var t = "ST_SetSRID('BOX3D("+(bbox[0]-tolerance)+" "+(bbox[1]-tolerance)+","+(bbox[2]+tolerance)+" "+(bbox[3]+tolerance)+")'::box3d, 900913) "+cond+" ";

  for(var j in base){

    for(var i in values){
      parts.push(
        [
        'SELECT',
        ' \''+base[j]+'\' as qtype,',
        'osm_id,',
        'name,',
        column+',',
        'ST_As'+as+'( ST_Transform( ST_Intersection( '+t+' ,way) ,900913) ) AS data',
        'FROM',
        'planet_osm_'+base[j]+' ',
        'WHERE',
        'ST_Intersects( way, '+t+' )  and ',
        ''+column+'=\''+values[i]+'\' '
        ].join(' ')
      );
    }
  }
  console.log("Zoom: ",this.z, this.x,this.y ,parts.join(' UNION '));
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

Tile.prototype.getStyle = function(callback){
  var styleFile = path.join(__dirname,'..','public','css','map',this.style,this.z+'.css'),
  obj,
  sel,
  i,
  def,
  styles = {};
  fs.readFile(styleFile,function(err,data){

    if (err){
      callback(err,null);
    }else{
      obj = css.parse(data.toString(), {});
      for(i in obj.stylesheet.rules){
        if (obj.stylesheet.rules[i].type === 'rule'){
          if (obj.stylesheet.rules[i].selectors.length===1){
            sel = obj.stylesheet.rules[i].selectors[0].split('.');
            if (sel.length === 2){
              column = sel[0];
              value = sel[1];
              def='';
              for(j in obj.stylesheet.rules[i].declarations){
                if (obj.stylesheet.rules[i].declarations[j].type === 'declaration'){
                  def+= ' '+obj.stylesheet.rules[i].declarations[j].property+'="'+obj.stylesheet.rules[i].declarations[j].value+'"'+' ';
                }
              }
              if (typeof styles[column]==='undefined'){
                styles[column]={};
              }
              if (typeof styles[column][value]==='undefined'){
                styles[column][value]='';
              }
              styles[column][value]+=def;
            }
            //console.log(obj.stylesheet.rules[i].declarations);
          }
        }
      }
      callback(false,styles);
    }
  });

}

Tile.prototype.queryAsSVG = function(callback,_svg,_columns,_index,_style){
  var column,
  self = this,
  values=[],
  bbox = this.bbox,
  transformBox = bbox;//self.from900913To4326(bbox);

  this.as = 'SVG';



  if (typeof _columns === 'undefined'){
    var data = self.getStyle(function(err,data){
      if (err){
        _svg.push('<svg width="256px" height="256px" '+self.svg_ns.join(" ")+'>');
        _svg.push('<rect x="1" y="1" w="254" h="254" fill="gray" opacity="0.5"/>'+"\n");
        _svg.push("</svg>");

        //console.log(_svg.join("\n"));
        callback(false,_svg.join("\n"));
        return;
      }else{


        _svg = [];
        _svg.push('<svg width="512px" height="512px" '+self.svg_ns.join(" ")+'>');


        //_svg.push('<defs><style>'+data.toString()+'</style></defs>'+"\n");
        //_svg.push('<rect x="10" y="10" w="226" h="226" fill="none" stroke="black"/>'+"\n");


        var x = transformBox[2] - transformBox[0];
        var scale = 512/x;
        _svg.push('<g transform="scale('+scale+' '+scale+')">');
        _svg.push('<g transform="translate('+transformBox[0]*-1+','+transformBox[3]*1+')">');
        _columns = [];
        _index = 0;
        _style = data;

        for(column in _style){
          _columns.push(column);
        }
        self.queryAsSVG(callback,_svg,_columns,_index,_style);
      }
    });

  }else if (_index < _columns.length){
    column = _columns[_index];
    for(value in _style[column]){
      values.push(value);
    }

    self.values = values;
    self.column = column;
    self.base = [ 'roads', 'line', 'polygon' ];

    this.query(function(err,result){

      if (err){
        callback(err,null);
      }else{
        console.log(result);
        for(var i in result){
          if (result[i].data!=''){
            _svg.push('<path id="'+result[i].osm_id+'" '+_style[column][result[i][column]]+' vector-effect="non-scaling-stroke" d=\"'+result[i].data+'\" />');
            if (typeof result[i].name==='string'){
              _svg.push('<text font-size = "40">');
              _svg.push('<textPath xlink:href = "#'+result[i].osm_id+'">');
              _svg.push('<![CDATA['+entities.encode(result[i].name)+']]>');
              _svg.push('</textPath>');
              _svg.push('</text>>');
            }
          }
        }
        self.queryAsSVG(callback,_svg,_columns,_index+1,_style);
      }

    });

  }else{
    // return with callback
    _svg.push('</g>');
    _svg.push('</g>');
    _svg.push("</svg>");

    //console.log(_svg.join("\n"));
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
