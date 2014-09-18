var express = require('express'),
    path        = require('path'),
    System      = require('../classes/System').System,
    Tile      = require('../classes/Tile').Tile,
    fs          = require('fs'),
    mkdirp = require('mkdirp'),
    cluster = require('cluster'),
    forks = 16;

var configs = [
  path.join(path.sep,'etc','nile','config.json'),
  path.join(__dirname,'..','config.json'),
  path.join(__dirname,'..','config','config.json'),
  path.join(__dirname,'..','config','sample.json')
];

function initialize(config,cb){
  system = new System();
  system.config = config;
  if (typeof cb === 'function'){
    system.loadStyles(function(){
      cb(system);
    });
  }
}


function startService(system){
  if (cluster.isMaster){
    for (var i=0; i< forks; i++){

      cluster.fork();
    }
    cluster.on("exit", function(worker, code, signal)
    {
      //console.log("WORKER STOPPED");
      cluster.fork();
    });
    //console.log('Master has started.');
  }else{
    //console.log(cluster);
    //console.log('OK');
    system.startService();
  }
}



function findConfiguration(_index,cb){
  var config,
  file;

  if (_index<configs.length){
    file = configs[_index];
    fs.exists(file,function(exists){
      if (exists){
        try{
          config = require(file);
        }catch(e){
          console.log('error','The configuration is invalid.',file,e);
          return;
        }
        initialize(config,cb);
      }else{
        findConfiguration(_index + 1,cb);
      }
    });
  }else{
    console.log('there is no config file');
  }
}

function init(cb){
  findConfiguration(0,function(system){
    if(typeof cb==='function'){
      cb(system);
    }
  });
}


function startup(){
  findConfiguration(0,function(system){
    startService(system);
  });
}

exports.startup = startup;
exports.init = init;
