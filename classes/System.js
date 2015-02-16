"use strict";

var EventEmitter = require('events').EventEmitter,
utilities = require('./Utilities'),
pg = require('pg'),
fs = require('fs'),
path = require('path'),
//MapCSS = require('node-kothic').MapCSS,
//Kothic = require('node-kothic').Kothic,
Tile = require('./Tile').Tile,
Geocoder = require('./Geocoder').Geocoder,
Router = require('./Router').Router,
express = require('express'),
timeout = require('connect-timeout'),
glob = require("glob"),
http = require('http'),
bodyparser = require('body-parser'),
mkdirp = require("mkdirp"),
constants = require('constants'),
Renderer =  require('nile-style').Renderer,
StyleInstructions =  require('nile-style').StyleInstructions;

var System = function(){
  var self = this;

  self.logMessages = { debug: true,info: true, warn: true, error: true };



  self.logger = {
    log: function(tag,msg){
      if (  (typeof self.logMessages[tag]==='boolean') &&  (self.logMessages[tag]===true) ){
        console.log(tag,msg);
      }
    }
  };
  self._styles = {};

  return self;
}

utilities.inherits(System, EventEmitter, {
  get config () { return this._config; },
  set config (v) { this._config = v; return this; },

  get client () { return this._client; },
  set client (v) { this._client = v; return this; },

  get app () { return this._app; },
  set app (v) { this._app = v; return this; },

  get styles () { return this._styles; },
  set styles (v) { this._styles = v; return this; },


});

System.prototype.hashedSQL = function(sql,hash){
  var field;
  for(field in hash){
    if (typeof hash[field]==='string'){
      sql = sql.replace(new RegExp('{'+field+'}','g'),"'"+hash[field]+"'");
    }else{
      sql = sql.replace(new RegExp('{'+field+'}','g'),hash[field]);
    }
  }
  return sql;
}


System.prototype.startService = function(){
  var self = this;
  //self.logger.log('debug','connecting to DB');
  self.connect(function(err){
    if(err){
      self.logger.log('error','DB problems',err);
      process.exit();
    }else{

      self.startHTTPService();

    }
  });
}

System.prototype.loadStyles = function(callback){
  var styleInstructions,styleName,dirName,i,self = this;
  mkdirp(path.join(__dirname,'..','styles','instructions'), function (err) {
    glob( path.join(__dirname,'..','styles','*.less'), function (er, files) {
      for(i=0;i<files.length;i++){
        dirName = path.dirname(files[i]);
        styleName = path.basename(files[i],'.less');
        //system.logger.log('debug','compile '+ styleName);
        styleInstructions = new StyleInstructions(path.join(__dirname,'..','styles',styleName+'.less'));
        styleInstructions.create(path.join(__dirname,'..','styles','instructions',styleName+'.js'));
        try{

          self.styles[styleName] = require(path.join(__dirname,'..','styles','instructions',styleName));
        }catch(e){
          console.log( path.join(__dirname,'..','styles','instructions',styleName) ,'failed');
        }

      }
      callback();
    });
  })
}

System.prototype.connect = function(callback){
  var self = this;
  self.client = new pg.Client(self.config.database);
  self.client.connect(function(err){
    if (err){
      self.logger.log('error','Connection to database failed. Returning.');
      callback(err, null);
    }else{
      callback(false);
    }
  });
}

System.prototype.disconnect = function(callback){
  var self = this;
  if (typeof callback!=='function'){
    callback=function(){};
  }
  self.client.once('end',callback);
  self.client.end();
}

System.prototype.startHTTPService = function(){
  var self = this,
      server_https,
      server_http;
  //self.logger.log('debug','starting service');

  self.app = express();

if (typeof this.config.http === 'object'){
  if (typeof this.config.http.timeout === 'number'){
    //this.config.http.timeout = 600000;
    self.app.use(timeout(this.config.http.timeout+'s'));
  }
}else if (typeof this.config.https === 'object'){
  if (typeof this.config.https.timeout === 'number'){
    //this.config.http.timeout = 600000;
    self.app.use(timeout(this.config.https.timeout+'s'));
  }
}


  self.app.use(express.static(path.join(__dirname ,'..', 'public')));
  self.app.set('views', path.join(__dirname ,'..', 'template'));
  self.app.set('view engine', 'jade');

  self.app.all('*',function(req,res,next){
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','X-Requested-With');
    next();
  });

  self.app.use(bodyparser.urlencoded({limit: '50mb', extended: false }));
  self.app.use(bodyparser.json({limit: '50mb'}));

  self.app.route('/').get(function(req,res,next){
    return res.render('index',{});
  });


  self.app.route('/geocode').post(function(req,res,next){

    var geocoder = new Geocoder(self);
    if (typeof req.body.city==='string'){
      geocoder.geoCode(req.body.city,req.body.street,function(err,result){
        if (err){
          res.json(err);
        }else{
          res.json(result);
        }
      });
    }else if (typeof req.body.list === 'string'){
      geocoder.geoCodeList(JSON.parse(req.body.list),function(err,result){
        if (err){
          res.json(err);
        }else{
          res.json(result);
        }
      });
    }else{
      res.json({error: 'missing parameter'});
    }
  });


  self.app.route('/route/classes').post(function(req,res,next){

    var router = new Router(self);
    router.getClasses(function(err,result){
      if (err){
        res.json(err);
      }else{
        res.json(result);
      }
    });

  });

  self.app.route('/get').post(function(req,res,next){
    var sql = [
    'select ST_ASGeoJSON(way) geojson, hstore2json(tags) info from planet_osm_polygon where osm_id = {osm_id} ',
    'select ST_ASGeoJSON(way) geojson, hstore2json(tags) info from planet_osm_line where osm_id = {osm_id} ',
    'select ST_ASGeoJSON(way) geojson, hstore2json(tags) info from planet_osm_point where osm_id = {osm_id} '
    ].join(' union ')
    if (typeof req.body.osm_id!=='undefined'){
      sql = sql.replace(/\{osm_id\}/g,req.body.osm_id);
      self.client.query( sql , function(err, results){
        if (err){
          res.json(err);
        }else{
          res.json(results.rows);
        }
      })
    }else{
      res.json("osm_id is missing");
    }
  });


  var t = [{"refid":"141-1421089777314","lng":11.3235902139,"lat":50.97900935},{"refid":"141-1421100594184","lng":11.327228471,"lat":50.98242985},{"refid":"141-1421100597345","lng":11.327228471,"lat":50.98242985},{"refid":"141-1421099914489","lng":11.326931897,"lat":50.9826181},{"refid":"141-1421091621345","lng":11.3263162274,"lat":50.9824849},{"refid":"141-1421092027973","lng":11.3257907,"lat":50.9831024},{"refid":"141-1421092030638","lng":11.3257907,"lat":50.9831024},{"refid":"141-1421099012316","lng":11.3257932153,"lat":50.98296285},{"refid":"141-1421099772765","lng":11.3255002766,"lat":50.9833629},{"refid":"141-1421099593623","lng":11.3258659,"lat":50.9834659},{"refid":"141-1421099596521","lng":11.3258659,"lat":50.9834659},{"refid":"141-1421100260406","lng":11.3258659,"lat":50.9834659},{"refid":"141-1421090864024","lng":11.3250989081,"lat":50.9837444},{"refid":"141-1421091055078","lng":11.3250989081,"lat":50.9837444},{"refid":"141-1421091522125","lng":11.3250989081,"lat":50.9837444},{"refid":"141-1421092159426","lng":11.3262769,"lat":50.9839889},{"refid":"141-1421098908553","lng":11.3262769,"lat":50.9839889},{"refid":"141-1421099050205","lng":11.3262483399,"lat":50.9839204},{"refid":"141-1421101179027","lng":11.3262769,"lat":50.9839889},{"refid":"141-1421091677274","lng":11.3269685161,"lat":50.98430025},{"refid":"141-1421100876353","lng":11.3268546933,"lat":50.98404335},{"refid":"141-1421101691277","lng":11.3265775,"lat":50.9860916},{"refid":"141-1421091164097","lng":11.3252619,"lat":50.9818765},{"refid":"141-1421090759627","lng":11.3265428958,"lat":50.98243225},{"refid":"141-1421091527534","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421091573679","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421091576063","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099349984","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099352039","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099372353","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099376583","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099479076","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099484188","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099490780","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099493404","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099495099","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421099496867","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421101669556","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421101754326","lng":11.325849859,"lat":50.9824525},{"refid":"141-1421090546167","lng":11.3266874071,"lat":50.983423},{"refid":"141-1421090775267","lng":11.3266874071,"lat":50.983423},{"refid":"141-1421090941371","lng":11.3266874071,"lat":50.983423},{"refid":"141-1421091859904","lng":11.3266874071,"lat":50.983423},{"refid":"141-1421101218773","lng":11.3266874071,"lat":50.983423},{"refid":"141-1421099500676","lng":11.3279839517,"lat":50.9830515},{"refid":"141-1421099922002","lng":11.3279839517,"lat":50.9830515},{"refid":"141-1421099925378","lng":11.3279839517,"lat":50.9830515},{"refid":"141-1421101475132","lng":11.3287791507,"lat":50.9832901},{"refid":"141-1421101479029","lng":11.3287791507,"lat":50.9832901},{"refid":"141-1421099127192","lng":11.3287949786,"lat":50.9841759},{"refid":"141-1421100694371","lng":11.3287949786,"lat":50.9841759},{"refid":"141-1421100755797","lng":11.3287949786,"lat":50.9841759},{"refid":"141-1421100759789","lng":11.3287949786,"lat":50.9841759},{"refid":"141-1421100760933","lng":11.3287949786,"lat":50.9841759},{"refid":"141-1421100249404","lng":11.3276112579,"lat":50.9843711},{"refid":"141-1421091955220","lng":11.3293968465,"lat":50.9840757},{"refid":"141-1421101119146","lng":11.3295371403,"lat":50.98417785},{"refid":"141-1421091044254","lng":11.329957932,"lat":50.98417315},{"refid":"141-1421091048230","lng":11.329957932,"lat":50.98417315},{"refid":"141-1421091244109","lng":11.3299124348,"lat":50.9840227},{"refid":"141-1421091682426","lng":11.329957932,"lat":50.98417315},{"refid":"141-1421091307527","lng":11.3289623215,"lat":50.98247815},{"refid":"141-1421099068829","lng":11.3293941604,"lat":50.9824554},{"refid":"141-1421099141440","lng":11.3293941604,"lat":50.9824554},{"refid":"141-1421099890633","lng":11.3294879348,"lat":50.9827678},{"refid":"141-1421100021629","lng":11.3301773937,"lat":50.98339525},{"refid":"141-1421100026229","lng":11.3301773937,"lat":50.98339525},{"refid":"141-1421092006157","lng":11.3303564079,"lat":50.98295875},{"refid":"141-1421099417817","lng":11.3310193732,"lat":50.98300875},{"refid":"141-1421099476300","lng":11.3312087875,"lat":50.9833256},{"refid":"141-1421099036364","lng":11.3312149094,"lat":50.9838017},{"refid":"141-1421099554918","lng":11.3312149094,"lat":50.9838017},{"refid":"141-1421099588928","lng":11.3312149094,"lat":50.9838017},{"refid":"141-1421100620609","lng":11.3312149094,"lat":50.9838017},{"refid":"141-1421100747141","lng":11.3312149094,"lat":50.9838017},{"refid":"141-1421089948065","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421091262677","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421091485268","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421091488348","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421091703603","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421091755021","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421092149073","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421098928161","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421101944952","lng":11.330470698,"lat":50.9846986},{"refid":"141-1421090613357","lng":11.3310966339,"lat":50.98280625},{"refid":"141-1421099444707","lng":11.3310966339,"lat":50.98280625},{"refid":"141-1421099447539","lng":11.3310966339,"lat":50.98280625},{"refid":"141-1421091558809","lng":11.3315052583,"lat":50.98275915},{"refid":"141-1421101113162","lng":11.3315052583,"lat":50.98275915},{"refid":"141-1421101115338","lng":11.3315052583,"lat":50.98275915},{"refid":"141-1421100652650","lng":11.3321480564,"lat":50.98248805},{"refid":"141-1421091272071","lng":11.3324867173,"lat":50.98217405},{"refid":"141-1421099319310","lng":11.3324867173,"lat":50.98217405},{"refid":"141-1421090719297","lng":11.3298713,"lat":50.9823026},{"refid":"141-1421099095663","lng":11.3298713,"lat":50.9823026},{"refid":"141-1421099150641","lng":11.3298713,"lat":50.9823026},{"refid":"141-1421100562415","lng":11.3301144761,"lat":50.98202035},{"refid":"141-1421101225878","lng":11.3298396456,"lat":50.98184435},{"refid":"141-1421100928475","lng":11.3298991652,"lat":50.98173375},{"refid":"141-1421100931204","lng":11.3298991652,"lat":50.98173375},{"refid":"141-1421100467267","lng":11.3301266,"lat":50.9816102},{"refid":"141-1421090839023","lng":11.3297534493,"lat":50.9814459},{"refid":"141-1421100735109","lng":11.3297534493,"lat":50.9814459},{"refid":"141-1421091503748","lng":11.3302695433,"lat":50.98107165},{"refid":"141-1421092038854","lng":11.3306658928,"lat":50.98126485},{"refid":"141-1421100604689","lng":11.3311421008,"lat":50.9813074},{"refid":"141-1421100607089","lng":11.3311421008,"lat":50.9813074},{"refid":"141-1421100608305","lng":11.3311421008,"lat":50.9813074},{"refid":"141-1421091390408","lng":11.3309596,"lat":50.9807284},{"refid":"141-1421100699004","lng":11.3309596,"lat":50.9807284},{"refid":"141-1421091363856","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421099247112","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421099267293","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421099270117","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421099272527","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421100335999","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421100338311","lng":11.3309104,"lat":50.9801611},{"refid":"141-1421099550885","lng":11.3313075,"lat":50.9805376},{"refid":"141-1421099553446","lng":11.3313075,"lat":50.9805376},{"refid":"141-1421098979083","lng":11.3308842754,"lat":50.9806493},{"refid":"141-1421101172851","lng":11.3305835,"lat":50.9803949},{"refid":"141-1421098985516","lng":11.3305727,"lat":50.9800198},{"refid":"141-1421098986532","lng":11.3305727,"lat":50.9800198},{"refid":"141-1421100194683","lng":11.3308193,"lat":50.9794813},{"refid":"141-1421090122822","lng":11.3302687,"lat":50.9794644},{"refid":"141-1421101583760","lng":11.3302687,"lat":50.9794644},{"refid":"141-1421101678253","lng":11.3302687,"lat":50.9794644},{"refid":"141-1421089850205","lng":11.3311964,"lat":50.9784704},{"refid":"141-1421091510388","lng":11.3311964,"lat":50.9784704},{"refid":"141-1421099088318","lng":11.3311964,"lat":50.9784704},{"refid":"141-1421100836216","lng":11.3311964,"lat":50.9784704},{"refid":"141-1421099459450","lng":11.3332876607,"lat":50.9791544},{"refid":"141-1421099534109","lng":11.3332876607,"lat":50.9791544},{"refid":"141-1421099536837","lng":11.3332876607,"lat":50.9791544},{"refid":"141-1421100627913","lng":11.3302611618,"lat":50.97972055},{"refid":"141-1421101175611","lng":11.3304249142,"lat":50.98003735},{"refid":"141-1421102028840","lng":11.3304249142,"lat":50.98003735},{"refid":"141-1421089866573","lng":11.3295327,"lat":50.9808118},{"refid":"141-1421102012031","lng":11.329562736,"lat":50.9805498},{"refid":"141-1421102063912","lng":11.329562736,"lat":50.9805498},{"refid":"141-1421090706792","lng":11.3297728,"lat":50.9801883},{"refid":"141-1421099932874","lng":11.3294608,"lat":50.9801491},{"refid":"141-1421101235757","lng":11.3294608,"lat":50.9801491},{"refid":"141-1421101391994","lng":11.3297728,"lat":50.9801883},{"refid":"141-1421101395402","lng":11.3297728,"lat":50.9801883},{"refid":"141-1421102084961","lng":11.3294608,"lat":50.9801491},{"refid":"141-1421091192218","lng":11.329463608,"lat":50.9796928},{"refid":"141-1421100106097","lng":11.3291233356,"lat":50.9796478},{"refid":"141-1421100789894","lng":11.329463608,"lat":50.9796928},{"refid":"141-1421100987845","lng":11.329463608,"lat":50.9796928},{"refid":"141-1421101031327","lng":11.329463608,"lat":50.9796928},{"refid":"141-1421101764928","lng":11.329463608,"lat":50.9796928},{"refid":"141-1421101770263","lng":11.329463608,"lat":50.9796928},{"refid":"141-1421091552087","lng":11.3290312232,"lat":50.9790734},{"refid":"141-1421091554703","lng":11.3290312232,"lat":50.9790734},{"refid":"141-1421098944137","lng":11.3288482404,"lat":50.97930435},{"refid":"141-1421098947625","lng":11.3288482404,"lat":50.97930435},{"refid":"141-1421098949226","lng":11.3288482404,"lat":50.97930435},{"refid":"141-1421099286102","lng":11.3297805,"lat":50.978935},{"refid":"141-1421099703843","lng":11.3290312232,"lat":50.9790734},{"refid":"141-1421100130560","lng":11.3297805,"lat":50.978935},{"refid":"141-1421100921811","lng":11.3292808,"lat":50.979089},{"refid":"141-1421091227500","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421091718124","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421091721012","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421091721948","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421092125480","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421092128401","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421092129145","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421099396600","lng":11.3294733221,"lat":50.9782915},{"refid":"141-1421099403473","lng":11.3294733221,"lat":50.9782915},{"refid":"141-1421099404648","lng":11.3294733221,"lat":50.9782915},{"refid":"141-1421099407000","lng":11.3294733221,"lat":50.9782915},{"refid":"141-1421099408112","lng":11.3294733221,"lat":50.9782915},{"refid":"141-1421101859929","lng":11.3292423639,"lat":50.9782451},{"refid":"141-1421089902375","lng":11.3296812253,"lat":50.97777875},{"refid":"141-1421099518332","lng":11.3297315482,"lat":50.97846995},{"refid":"141-1421099520974","lng":11.3297315482,"lat":50.97846995},{"refid":"141-1421100218876","lng":11.3300246813,"lat":50.9774118},{"refid":"141-1421100222340","lng":11.3300246813,"lat":50.9774118},{"refid":"141-1421090765251","lng":11.3308807665,"lat":50.9775595},{"refid":"141-1421101327176","lng":11.3289381843,"lat":50.97880875},{"refid":"141-1421091457299","lng":11.3291692,"lat":50.9780327},{"refid":"141-1421099967276","lng":11.3291176,"lat":50.9779551},{"refid":"141-1421099969788","lng":11.3291176,"lat":50.9779551},{"refid":"141-1421099970804","lng":11.3291176,"lat":50.9779551},{"refid":"141-1421100870465","lng":11.3291176,"lat":50.9779551},{"refid":"141-1421091072519","lng":11.3283319,"lat":50.97789},{"refid":"141-1421091353352","lng":11.3283319,"lat":50.97789},{"refid":"141-1421091654770","lng":11.3281910098,"lat":50.9778039},{"refid":"141-1421091515741","lng":11.3280781238,"lat":50.9775108},{"refid":"141-1421091518317","lng":11.3280781238,"lat":50.9775108},{"refid":"141-1421090684986","lng":11.3283628975,"lat":50.976962},{"refid":"141-1421101053959","lng":11.3283628975,"lat":50.976962},{"refid":"141-1421090601997","lng":11.3282000585,"lat":50.9764844},{"refid":"141-1421099507413","lng":11.3285945,"lat":50.9764565},{"refid":"141-1421100318018","lng":11.3283676,"lat":50.97628495},{"refid":"141-1421100320745","lng":11.3283676,"lat":50.97628495},{"refid":"141-1421091789294","lng":11.3286461493,"lat":50.97600715},{"refid":"141-1421091563534","lng":11.3287314581,"lat":50.97563665},{"refid":"141-1421091565958","lng":11.3287314581,"lat":50.97563665},{"refid":"141-1421092087136","lng":11.3287314581,"lat":50.97563665},{"refid":"141-1421092090080","lng":11.3287314581,"lat":50.97563665},{"refid":"141-1421100227356","lng":11.3290712114,"lat":50.97538655},{"refid":"141-1421099259333","lng":11.3294679,"lat":50.975011},{"refid":"141-1421099781133","lng":11.3292326285,"lat":50.9728916},{"refid":"141-1421091983750","lng":11.3279634186,"lat":50.97738615},{"refid":"141-1421101058216","lng":11.3274917812,"lat":50.97801645},{"refid":"141-1421091912154","lng":11.3267284156,"lat":50.97822555},{"refid":"141-1421091915226","lng":11.3267284156,"lat":50.97822555},{"refid":"141-1421091916050","lng":11.3267284156,"lat":50.97822555},{"refid":"141-1421091917130","lng":11.3267284156,"lat":50.97822555},{"refid":"141-1421091846920","lng":11.3262310863,"lat":50.97870975},{"refid":"141-1421099601352","lng":11.3264523111,"lat":50.97850275},{"refid":"141-1421099604407","lng":11.3264523111,"lat":50.97850275},{"refid":"141-1421099605928","lng":11.3264523111,"lat":50.97850275},{"refid":"141-1421099607391","lng":11.3264523111,"lat":50.97850275},{"refid":"141-1421090080621","lng":11.3258825,"lat":50.9787294},{"refid":"141-1421090902504","lng":11.3255826978,"lat":50.97856845},{"refid":"141-1421091610656","lng":11.3255196002,"lat":50.9791688},{"refid":"141-1421091781565","lng":11.3255196002,"lat":50.9791688},{"refid":"141-1421100456531","lng":11.3258825,"lat":50.9787294},{"refid":"141-1421101524311","lng":11.3252406561,"lat":50.97932015},{"refid":"141-1421101530031","lng":11.3252406561,"lat":50.97932015},{"refid":"141-1421099623664","lng":11.3264077134,"lat":50.97809085},{"refid":"141-1421099626192","lng":11.3264077134,"lat":50.97809085},{"refid":"141-1421101729637","lng":11.3264197677,"lat":50.97828755},{"refid":"141-1421101709621","lng":11.3273978592,"lat":50.97748445},{"refid":"141-1421091628257","lng":11.3271886,"lat":50.976915},{"refid":"141-1421100666322","lng":11.3271886,"lat":50.976915},{"refid":"141-1421100669714","lng":11.3271886,"lat":50.976915},{"refid":"141-1421101195515","lng":11.3271886,"lat":50.976915},{"refid":"141-1421101197203","lng":11.3271886,"lat":50.976915},{"refid":"141-1421101198812","lng":11.3271886,"lat":50.976915},{"refid":"141-1421101200300","lng":11.3271886,"lat":50.976915},{"refid":"141-1421101621123","lng":11.3276733326,"lat":50.9762154},{"refid":"141-1421101623531","lng":11.3276733326,"lat":50.9762154},{"refid":"141-1421091901337","lng":11.3274484038,"lat":50.97520775},{"refid":"141-1421101149315","lng":11.3275661931,"lat":50.97534625},{"refid":"141-1421100116752","lng":11.3281021035,"lat":50.97471345},{"refid":"141-1421089880302","lng":11.327445963,"lat":50.97453445},{"refid":"141-1421089796716","lng":11.3272818,"lat":50.9757614},{"refid":"141-1421103457848","lng":11.3272818,"lat":50.9757614},{"refid":"141-1421099277460","lng":11.3288043045,"lat":50.9770059},{"refid":"141-1421099280073","lng":11.3288043045,"lat":50.9770059},{"refid":"141-1421100086472","lng":11.3288043045,"lat":50.9770059},{"refid":"141-1421100181331","lng":11.3288043045,"lat":50.9770059},{"refid":"141-1421100184034","lng":11.3288043045,"lat":50.9770059},{"refid":"141-1421091544822","lng":11.3289333918,"lat":50.97981785},{"refid":"141-1421091548991","lng":11.3289333918,"lat":50.97981785},{"refid":"141-1421090594741","lng":11.3286541556,"lat":50.97999995},{"refid":"141-1421099312311","lng":11.3287295743,"lat":50.9797904},{"refid":"141-1421099610704","lng":11.3286541556,"lat":50.97999995},{"refid":"141-1421100135338","lng":11.3284848313,"lat":50.97997675},{"refid":"141-1421099332047","lng":11.328084883,"lat":50.97974145},{"refid":"141-1421099544365","lng":11.328084883,"lat":50.97974145},{"refid":"141-1421100552230","lng":11.3281876502,"lat":50.9797346},{"refid":"141-1421089827059","lng":11.3281564176,"lat":50.9790881},{"refid":"141-1421089831477","lng":11.3281564176,"lat":50.9790881},{"refid":"141-1421089833606","lng":11.3281564176,"lat":50.9790881},{"refid":"141-1421089976601","lng":11.3283894,"lat":50.9792787},{"refid":"141-1421090711393","lng":11.3285674276,"lat":50.97934245},{"refid":"141-1421090848879","lng":11.3283857314,"lat":50.97937305},{"refid":"141-1421091161233","lng":11.3280934,"lat":50.9788955},{"refid":"141-1421099862473","lng":11.3280934,"lat":50.9788955},{"refid":"141-1421099866187","lng":11.3280934,"lat":50.9788955},{"refid":"141-1421099868621","lng":11.3280934,"lat":50.9788955},{"refid":"141-1421090924257","lng":11.3276376,"lat":50.9787109},{"refid":"141-1421091126464","lng":11.3276376,"lat":50.9787109},{"refid":"141-1421100908635","lng":11.3276376,"lat":50.9787109},{"refid":"141-1421101008765","lng":11.3276376,"lat":50.9787109},{"refid":"141-1421101065192","lng":11.3276376,"lat":50.9787109},{"refid":"141-1421101192683","lng":11.3272413,"lat":50.9792504},{"refid":"141-1421090779620","lng":11.3274824168,"lat":50.9799705},{"refid":"141-1421100766814","lng":11.3277351834,"lat":50.9801179},{"refid":"141-1421100770277","lng":11.3277351834,"lat":50.9801179},{"refid":"141-1421091400497","lng":11.3271090745,"lat":50.97955905},{"refid":"141-1421099945356","lng":11.3271933711,"lat":50.97944695},{"refid":"141-1421091592703","lng":11.3266267,"lat":50.9793851},{"refid":"141-1421092077447","lng":11.3266267,"lat":50.9793851},{"refid":"141-1421101208628","lng":11.3266267,"lat":50.9793851},{"refid":"141-1421090069107","lng":11.3288231,"lat":50.9814258},{"refid":"141-1421090073100","lng":11.3288231,"lat":50.9814258},{"refid":"141-1421091424450","lng":11.3287073351,"lat":50.9808548},{"refid":"141-1421091426618","lng":11.3287073351,"lat":50.9808548},{"refid":"141-1421104405392","lng":11.3287073351,"lat":50.9808548},{"refid":"141-1421100439355","lng":11.3283637805,"lat":50.9804914},{"refid":"141-1421090580140","lng":11.3288559339,"lat":50.9806733},{"refid":"141-1421090582276","lng":11.3288559339,"lat":50.9806733},{"refid":"141-1421101882202","lng":11.3288559339,"lat":50.9806733},{"refid":"141-1421090696264","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421091479541","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421091828056","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421091872089","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421099877122","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421100533734","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421102093785","lng":11.3281928,"lat":50.9813145},{"refid":"141-1421099583198","lng":11.3286326023,"lat":50.9820566},{"refid":"141-1421089971432","lng":11.3286484324,"lat":50.98256575},{"refid":"141-1421090654471","lng":11.3279369943,"lat":50.9826619},{"refid":"141-1421090752218","lng":11.3279369943,"lat":50.9826619},{"refid":"141-1421090754730","lng":11.3279369943,"lat":50.9826619},{"refid":"141-1421090756170","lng":11.3279369943,"lat":50.9826619},{"refid":"141-1421092133721","lng":11.3274568583,"lat":50.98244515},{"refid":"141-1421091771605","lng":11.32734965,"lat":50.9815881},{"refid":"141-1421099292197","lng":11.3274212923,"lat":50.98138925},{"refid":"141-1421100075151","lng":11.32734965,"lat":50.9815881},{"refid":"141-1421101105369","lng":11.3272775395,"lat":50.9818561},{"refid":"141-1421101812305","lng":11.327637129,"lat":50.98154725},{"refid":"141-1421098936682","lng":11.3268606113,"lat":50.98137295},{"refid":"141-1421100330800","lng":11.327146962,"lat":50.98092165},{"refid":"141-1421100386401","lng":11.327146962,"lat":50.98092165},{"refid":"141-1421100838920","lng":11.3271502031,"lat":50.98132075},{"refid":"141-1421100173891","lng":11.3276950185,"lat":50.98136845},{"refid":"141-1421100176835","lng":11.3276950185,"lat":50.98136845},{"refid":"141-1421100541030","lng":11.3276950185,"lat":50.98136845},{"refid":"141-1421100544214","lng":11.3276950185,"lat":50.98136845},{"refid":"141-1421100545022","lng":11.3276950185,"lat":50.98136845},{"refid":"141-1421101018334","lng":11.3268498494,"lat":50.98090315},{"refid":"141-1421103511360","lng":11.3268877,"lat":50.9811732},{"refid":"141-1421101186707","lng":11.3264193234,"lat":50.98084495},{"refid":"141-1421091948931","lng":11.3257502397,"lat":50.98042155},{"refid":"141-1421099761197","lng":11.3257502397,"lat":50.98042155},{"refid":"141-1421099764685","lng":11.3257502397,"lat":50.98042155},{"refid":"141-1421100996069","lng":11.3257502397,"lat":50.98042155},{"refid":"141-1421091317022","lng":11.326199,"lat":50.9809667},{"refid":"141-1421091645153","lng":11.3257513447,"lat":50.980725},{"refid":"141-1421091649201","lng":11.3257513447,"lat":50.980725},{"refid":"141-1421091650497","lng":11.3257513447,"lat":50.980725},{"refid":"141-1421091651609","lng":11.3257513447,"lat":50.980725},{"refid":"141-1421100641425","lng":11.326199,"lat":50.9809667},{"refid":"141-1421101146410","lng":11.3254156736,"lat":50.9804145},{"refid":"141-1421100484500","lng":11.3247033704,"lat":50.98092855},{"refid":"141-1421090646711","lng":11.3245757819,"lat":50.98018015},{"refid":"141-1421090650079","lng":11.3245757819,"lat":50.98018015},{"refid":"141-1421090724929","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421090728417","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421090799043","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421091038990","lng":11.3245301583,"lat":50.9805271},{"refid":"141-1421091924522","lng":11.3245757819,"lat":50.98018015},{"refid":"141-1421091927202","lng":11.3245757819,"lat":50.98018015},{"refid":"141-1421099054885","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421099061909","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421099064909","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421099103736","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421099106079","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421099106999","lng":11.3248269112,"lat":50.98039335},{"refid":"141-1421100675579","lng":11.3245757819,"lat":50.98018015},{"refid":"141-1421100684924","lng":11.3245757819,"lat":50.98018015},{"refid":"141-1421099073166","lng":11.3242395,"lat":50.9802318},{"refid":"141-1421100851744","lng":11.3242395,"lat":50.9802318},{"refid":"141-1421100325064","lng":11.3233738077,"lat":50.9806226},{"refid":"141-1421091885465","lng":11.3228802,"lat":50.9806728},{"refid":"141-1421091897017","lng":11.3228802,"lat":50.9806728},{"refid":"141-1421099993501","lng":11.3227978,"lat":50.981251},{"refid":"141-1421099776182","lng":11.3221885,"lat":50.9819795},{"refid":"141-1421090929105","lng":11.3220906961,"lat":50.981241},{"refid":"141-1421098917081","lng":11.3247603528,"lat":50.97892635},{"refid":"141-1421090884584","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421090886952","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421090887920","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421091438674","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421091441635","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421092117704","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421092120496","lng":11.3243822728,"lat":50.9784709},{"refid":"141-1421092121657","lng":11.3243822728,"lat":50.9784709}]
var r = [{ refid: '141-1421090765251',
    lng: 11.3308807665,
    lat: 50.9775595,
    id: 55820,
    seq: 57 },
  { refid: '141-1421101327176',
    lng: 11.3289381843,
    lat: 50.97880875,
    id: 73547,
    seq: 58 },
  { refid: '141-1421091457299',
    lng: 11.3291692,
    lat: 50.9780327,
    id: 33305,
    seq: 59 }
  ];
  var router = new Router(self);
  router.tbl = 'carways';

  router.routeList(r,function(err,result2){
    if (err){

    }else{
      console.log(result2);
    }
  });

  /*
  router.tsp(t,function(err,result){
    console.log(result);
    router.routeList(result,function(err,result2){
      if (err){

      }else{
        console.log(result2);
      }
    });
  });
  */


  self.app.route('/route/tsp').post(function(req,res,next){

    var router = new Router(self);
    if (typeof req.body.type==='string'){
      if (req.body.type==='feet'){
        router.tbl = 'feetways';
      }
      if (req.body.type==='car'){
        router.tbl = 'carways';
      }
      if (req.body.type==='cycle'){
        router.tbl = 'cycleways';
      }
    }

    router.tsp(JSON.parse(req.body.list),function(err,result){
      if (err){
        res.json(err);
      }else{

        router.routeList(result,function(err,result2){
          if (err){
            res.json(err);
          }else{
            res.json(result2);
          }
        });
      }
    });

  });

  self.app.route('/route').post(function(req,res,next){

    var router = new Router(self);

    if (typeof req.body.type==='string'){
      if (req.body.type==='feet'){
        router.tbl = 'feetways';
      }
      if (req.body.type==='car'){
        router.tbl = 'carways';
      }
      if (req.body.type==='cycle'){
        router.tbl = 'cycleways';
      }
    }
    if (typeof req.body.list==='string'){
      router.routeList(JSON.parse(req.body.list),function(err,result){
        if (err){
          res.json(err);
        }else{
          res.json(result);
        }
      });
    }else{
      router.routeAddress(
        req.body.from_city,req.body.from_street,
        req.body.to_city,req.body.to_street
        ,function(err,result){
          if (err){
            res.json(err);
          }else{
            res.json(result);
          }
        });
      }
    });

    self.app.route('/live/:style/:zoom/:x/:y.png').get(function(req,res,next){

      req.params.live = true;
      self.getTileImage(req,function(error,fileName){
        if (error){
          console.log(error);
          next();
        }else{
          res.sendFile(fileName);
        }
      });

    });

    self.app.route('/-/:style/:zoom/:x/:y.png').get(function(req,res,next){

      req.params.live = false;
      self.getTileImage(req,function(error,fileName){
        if (error){
          console.log(error);
          next();
        }else{
          res.sendFile(fileName);
        }
      });

    });

    if ( (typeof this.config.https!='undefined') && (this.config.https.active == true)){
      var https = require('https');
      var privateKey  = fs.readFileSync(this.config.https.key, 'utf8');
      var certificate = fs.readFileSync(this.config.https.cert, 'utf8');

      var credentials = {
        ca: "",
        key: privateKey,
        cert: certificate,
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2,
        ciphers: 'AES128-GCM-SHA256:!RC4:!HIGH:!MD5:!aNULL:!EDH',
        honorCipherOrder: true
      };


      if (typeof this.config.https.ca_files !== "undefined"){

        credentials.ca = (function(files) {
          var _i, _len, _results, file;

          _results = [];
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            _results.push( (fs.readFileSync(file)).toString() );
          }
          return _results;

        })(this.config.https.ca_files);
      }

      if (typeof this.config.https.ciphers === 'string'){
        credentials.ciphers = this.config.https.ciphers;
      }

      if (typeof this.config.https.port == 'undefined'){
        this.config.https.port = 443;
      }

      if (typeof this.config.https.timeout == 'undefined'){
        this.config.https.timeout = 600000;
      }
      server_https = https.createServer(credentials, this.app).listen(this.config.https.port, this.config.https.ip);
      try{
      server_https.setTimeout(this.config.https.timeout,function(){
        system.logger.log('info','timeout');
      });
    }catch(e){

    }
      system.logger.log('info','service is started at port '+this.config.https.port+' on '+ this.config.https.ip);
    }


    if ( (typeof this.config.http!='undefined') && (this.config.http.active == true)){
      if (typeof this.config.http.port == 'undefined'){
        this.config.http.port = 80;
      }
      if (typeof this.config.http.timeout == 'undefined'){
        this.config.http.timeout = 600000;
      }
      server_http = http.createServer(this.app).listen(this.config.http.port, this.config.http.ip);
      server_http.setTimeout(this.config.http.timeout,function(){
        system.logger.log('info','timeout');
      });
      system.logger.log('info','service is started at port '+this.config.http.port+' on '+this.config.http.ip);
    }

  }

  System.prototype.getTileImage = function(request,callback){
    var system = this,
    style = request.params.style,
    coords = {
      x: request.params.x,
      y: request.params.y,
      zoom: request.params.zoom
    },
    imageFile = path.join(__dirname,'..','public','map',style,coords.zoom,coords.x,coords.y+'.png');

    if(typeof system.styles[style]==='undefined'){
      callback('no such style');
    }else{

      fs.exists( imageFile, function(exists){
        if (exists && ( !request.params.live ) ){
          callback(false,imageFile);
        }else{


          system.getGeoJSON(request,function(err,data){
            if (err){
              callback(err,null);
            }else{


              var renderer = new Renderer(system.styles[style].style, 256, coords.zoom*1, data);
              renderer.orderZIndex();

              renderer.render(imageFile,function(err){
                if (err){
                  callback(err);
                }else{
                  callback(false,imageFile);
                }
              });
            }
          });

        }
      });
    }
  }

  /*
  * Quering the geoJSON of the requested tile,
  * if the data are allready cached, the cached files be read
  *
  * @param {object} request the request object containing an params object with zoom, x and y.
  * @param {function} callback the callback function(error,data)
  */
  System.prototype.getGeoJSON = function(request,callback,filter){
    var system = this,
    style = request.params.style,
    coords = {
      x: request.params.x,
      y: request.params.y,
      zoom: request.params.zoom
    },
    json_path = path.join(__dirname,'..','public','map',style,coords.zoom,coords.x),
    data;

    if (typeof filter==='undefined'){
      filter = {};
    }
    if(typeof system.styles[style]==='undefined'){
      callback('no such style');
    }else{

      fs.exists(path.join(json_path,coords.y+'.geojson'),function(exists){
        if (exists  && ( !request.params.live ) ){
          fs.readFile(path.join(json_path,coords.y+'.geojson'),function(err,data){
            if (err){
              callback(err,null);
            }else{
              callback( false,JSON.parse( data.toString() ) );
            }
          });
        }else{
          mkdirp(json_path, function (err) {
            var tile,
            filters,
            output;

            if (err){
              callback(err,null);
            }else{

              tile = new Tile(system);
              filters = system.styles[style].filter(coords.zoom);

              output = path.join(json_path,coords.y+'.png');
              tile.z = coords.zoom;
              tile.x = coords.x;
              tile.y = coords.y;
              tile.filter = filters;
              tile._updateBBox();
              tile.queryAsGeoJSON(function(err,data){
                if (err){
                  callback(err,null);
                }else{
                  fs.writeFile(path.join(json_path,coords.y+'.geojson'),JSON.stringify(data,null,2),function(err){
                    if (err){
                      callback(err,null);
                    }else{
                      callback( false, data );
                    }
                  });
                }
              })
            }
          });
        }
      });
    }
  }


  System.prototype.middleware = function(){
    var self = this;
    return function (req, res, next) {
      self.logger.log('debug',req);
      next();
    }
  }



  exports.System = System;
