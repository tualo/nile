var express = require('express'),
http        = require('http'),
https       = require('https'),
path        = require('path'),
System      = require('../classes/System').System,
Tile      = require('../classes/Tile').Tile,
fs          = require('fs'),
css          = require('css'),
mkdirp = require('mkdirp'),
svg2png = require('svg2png'),
cluster = require('cluster'),
convert          = require('./convert');

var cpus = 4;

function initialize(config){
  if (cluster.isMaster){
    for (var i=0; i<cpus; i++){
      cluster.fork();
    }
    cluster.on("exit", function(worker, code, signal)
    {
      console.log("WORKER STOPPED");
      cluster.fork();
    });
    console.log('Master has started.');
  }else{
    console.log('Client started');
    _initialize(config);
  }
}

function _initialize(config){
  var app,
  credentials = {},
  httpsServer,
  httpServer,
  system;



  /*
  fs.readFile(path.join(__dirname,'..','public','css','map','standard','1.css'), function (err, data) {
    if (err) throw err;
    var obj = css.parse(data.toString(), {});
    console.log(obj.stylesheet);
    console.log(obj.stylesheet.rules);
    // 9, 268, 172
    for(var i in obj.stylesheet.rules){

      if (obj.stylesheet.rules[i].selectors.length===1){
        sel = obj.stylesheet.rules[i].selectors[0].split('.');
        if (sel.length === 2){
          column = sel[0];
          value = sel[1];
        }
        console.log(obj.stylesheet.rules[i].declarations);
      }
    }

  });
  */

  system = new System();
  system.config = config;
  system.connect(function(err){
    if(err){
      system.logger.log('error','DB problems',err);
      process.exit();
    }

    app = express();
    app.set('views', path.join(__dirname ,'..', 'template'));
    app.set('view engine', 'jade');
    app.set('base path', (config.basePath)?config.basePath:'/');
    app.set('system', system);

    app.get('/',function(req,res,next){
      return res.render('index',{});
    })

    app.get('/map/:zoom/:x/:y.png',function(req,res,next){

      var tile = new Tile(system);

      tile.z = req.params.zoom;
      tile.x = req.params.x;
      tile.y = req.params.y;
      tile._updateBBox();

      tile.queryAsSVG(function(err,svg){
        if(err){
          console.log('SVG problems',err);
          process.exit();
        }



        var image_path = path.join(__dirname,'..','public','map',req.params.zoom,req.params.x);
        mkdirp(image_path, function (err) {
          if (err){
            console.error(err);
            next();
          }else{
            var svg_data = '<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>'+"\n"+
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"'+"\n" +
            '"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">'+"\n"+svg;

            fs.writeFile(path.join(__dirname,'..','public','map',req.params.zoom,req.params.x,req.params.y+'.svg'),svg_data,function(err){
              if (err){
                console.error(err);
                next();
              }else{
                var input = path.join(__dirname,'..','public','map',req.params.zoom,req.params.x,req.params.y+'.svg');
                var output = path.join(__dirname,'..','public','map',req.params.zoom,req.params.x,req.params.y+'.png');
                svg2png(input, output, function (err) {
                  if (err){
                    console.error(err);
                    next();
                  }else{
                    res.sendFile(output);
                  }
                });

              }
            });


          }
        });


      });
    });

    app.get('/map/:zoom/:x/:y.svg',function(req,res,next){

      var tile = new Tile(system);
      tile.z = req.params.zoom;
      tile.x = req.params.x;
      tile.y = req.params.y;
      tile._updateBBox();

      tile.queryAsSVG(function(err,svg){
        if(err){
          console.log('SVG problems',err);
          process.exit();
        }
        res.setHeader('Content-type','image/svg+xml');
        res.end('<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>'+"\n"+
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"'+"\n" +
        '"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">'+"\n"+svg);
        //console.log(svg);
      });
    });

    app.use(express.static('public'));
    app.use(system.middleware());



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
