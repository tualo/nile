var express = require('express'),
http        = require('http'),
https       = require('https'),
path        = require('path'),
System      = require('../classes/System').System,
Tile      = require('../classes/Tile').Tile,
fs          = require('fs');

function geoJSON2SVG(obj){
  console.log(obj);
  var svg = "";
  if (obj){
    switch(obj.type){
      case "Polygon":
        var paths = [];
        for(var i in obj.coordinates){
          var poly = obj.coordinates[i];
          var path = [];
          for(var j in poly){
            var coord = poly[j];
            path.push(coord.join(','));
          }
          paths.push('<path style="fill:#ddddff" d="m '+path.join(' ')+' z"/>')
        }
        svg = paths.join("\n");
        break;
      }
    }

    return svg;

  }
  function initialize(config){
    var app,
    credentials = {},
    httpsServer,
    httpServer,
    system;


    system = new System();
    system.config = config;
    system.connect(function(err){
      if(err){
        console.log('DB problems',err);
        process.exit();
      }

      app = express();
      app.set('views', path.join(__dirname ,'..', 'template'));
      app.set('view engine', 'jade');
      app.set('base path', (config.basePath)?config.basePath:'/');
      app.set('system', system);
      app.use(express.static('public'));
      app.use(system.middleware());

      var tile = new Tile(system);

      tile.z = 12;
      tile.x = tile.long2tile(10.8546678698337,tile.z);
      tile.y = tile.lat2tile(51.0254948152166,tile.z);
      tile.queryAsSVG(function(err,svg){
        if(err){
          console.log('SVG problems',err);
          process.exit();
        }
        console.log(svg);
      });
/*
tile.z = 8;
tile.x = 547,
tile.y = 685;

tile.z = 8;
tile.x = 547,
tile.y = 685;



tile.base = 'polygon';
tile.type = 'water';
tile.values = ['river'];//['reservoir','lake','river'];
tile.as = 'SVG';
tile.query(function(err,data){
  for(var i in data){
    if (data[i].data!=''){
      svg.push('<path style="fill:#0000ff" d=\"'+data[i].data+'\" />');
    }
  }

  //var tile = new Tile(system);
  tile.base = 'roads';
  tile.type = 'highway';
  tile.values = ['primary'];
  tile.as = 'SVG';
  tile.query(function(err,data){
    for(var i in data){
      if (data[i].data!=''){
        svg.push('<path style="fill:none;stroke:#ffff00;stroke-width:3.6;stroke-miterlimit:4;stroke-dasharray:none;stroke-linejoin:round;stroke-linecap:round" d="'+data[i].data+'" />');
      }
    }

    tile.base = 'roads';
    tile.type = 'highway';
    tile.values = ['secondary'];
    tile.as = 'SVG';
    tile.query(function(err,data){
      for(var i in data){
        if (data[i].data!=''){
          svg.push('<path style="fill:none;stroke:#eeeeaa;stroke-width:2.6;stroke-miterlimit:4;stroke-dasharray:none;stroke-linejoin:round;stroke-linecap:round" d="'+data[i].data+'" />');
        }
      }
      svg.push("</svg>");
      console.log(svg.join("\n"));
      process.exit();
    });
  });
});
*/

if ( (typeof config.http!='undefined') && (config.http.active == true)){

  if (typeof config.http.port == 'undefined'){
    config.http.port = 80;
  }

  httpServer = http.createServer(app);
  httpServer.listen(config.http.port, function(){
    system.logger.log('info',"System listening on port " + config.http.port);
  });


}

if ( (typeof config.https!='undefined') && (config.https.active == true)){
  if (typeof config.https.port == 'undefined'){
    config.https.port = 443;
  }

  if (typeof config.privateKey!='undefined'){
    credentials.key = fs.readFileSync(config.privateKey, 'utf8');
  }
  if (typeof config.certificate!='undefined'){
    credentials.cert = fs.readFileSync(config.certificate, 'utf8');
  }
  if (typeof config.ca!='undefined'){
    credentials.ca = fs.readFileSync(config.ca, 'utf8');
  }

  httpsServer = https.createServer(credentials, app);
  httpsServer.listen(config.https.port, function(){
    system.logger.log('info',"System listening on port " + config.https.port);
  });
}


    })


  }


  function findConfiguration(){
    var config;
    fs.exists(path.join(path.sep,'etc','nile','config.json'),function(exists){
      if (exists){
        try{
          config = require(path.join(path.sep,'etc','nile','config.json'));
          initialize(config);
        }catch(e){
          console.log('error','The configuration is invalid *1. '+e);
        }
      }else{
        fs.exists(path.join(__dirname,'..','config','config.json'),function(exists){
          if (exists){
            try{
              config = require(path.join(__dirname,'..','config','config.json'));
              initialize(config);
            }catch(e){
              console.log('error','The configuration *'+path.join(__dirname,'..','config','config.json')+'* is invalid.'+e);
            }
          }else{
            fs.exists(path.join(__dirname,'..','config','sample.json'),function(exists){
              if (exists){
                try{
                  config = require(path.join(__dirname,'..','config','sample.json'));
                }catch(e){
                  console.log('error','The configuration *'+path.join(__dirname,'..','config','sample.json')+'* is invalid.');
                }
                initialize(config);
              }else{
                console.log('error','There is no configuration file.');
                process.exit();
              }
            });
          }
        });
      }
    });
  }


  function startup(){
    findConfiguration();
  }

  exports.startup = startup;
