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
Kothic =  require('node-kothic').Kothic,
convert          = require('./convert');

var cpus = 1;
var configs = [
  path.join(path.sep,'etc','nile','config.json'),
  path.join(__dirname,'..','config','config.json'),
  path.join(__dirname,'..','config','sample.json')
];

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
  var system;
  system = new System();
  system.config = config;
  system.startService();
}



function findConfiguration(_index){
  var config,
  file;
  if (typeof _index==='undefined'){
    _index = 0;
  }
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
        initialize(config);
      }else{
        findConfiguration(_index + 1);
      }
    });
  }else{
    console.log('there is no config file');
  }
}


function startup(){
  findConfiguration();
}

exports.startup = startup;
