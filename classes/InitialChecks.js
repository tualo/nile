
var InitialChecks = function(system,debug){
  var self = this;
  self.debug=false;
  if (typeof debug==='boolean'){
    self.debug = debug;
  }
  self.system = system;
  self.functions;
  self.extensions;
  self.tables;
}

InitialChecks.prototype.checkTable = function(name,callback){
  var self = this,
  client = self.system.client,
  sql = [
  'SELECT c.relname ',
  '    FROM   pg_catalog.pg_class c',
  '    JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
  '    WHERE  n.nspname = current_schema()'
  ].join(' ');
  name = name.toLowerCase();
  if (typeof self.tables!=='undefined'){
    callback(null,self.tables.indexOf(name) > -1);
  }else{
    self.tables = [];
    client.query( sql , function(err, results){

      if (err){
        self.system.logger.log('error',err);
        //callback(err, null);
        callback(err,false);
      }else{
        for (i=0,m=results.rows.length;i<m;i++){
          self.tables.push(results.rows[i].relname);
        }
        callback(null,self.tables.indexOf(name) > -1);
      }
    });
  }
}


InitialChecks.prototype.checkExtension = function(name,callback){
  var self = this,
  client = self.system.client,
  sql = [
  'select name from pg_available_extensions()'
  ].join(' ');
  name = name.toLowerCase();
  if (typeof self.extensions!=='undefined'){
    callback(null,self.extensions.indexOf(name) > -1);
  }else{
    self.extensions = [];
    client.query( sql , function(err, results){

      if (err){
        self.system.logger.log('error',err);
        //callback(err, null);
        callback(err,false);
      }else{
        for (i=0,m=results.rows.length;i<m;i++){
          self.extensions.push(results.rows[i].name);
        }
        callback(null,self.extensions.indexOf(name) > -1);
      }
    });
  }
}

InitialChecks.prototype.checkFunction = function(name,callback){
  var self = this,
  client = self.system.client,
  sql = [
  'SELECT format_type(p.prorettype, NULL) as "Result",',
  'lower(p.proname) as "Function",',
  'oidvectortypes(p.proargtypes) as "Arguments"',
  'FROM pg_proc p',
  'WHERE p.prorettype <> 0 and (pronargs = 0 or',
  'oidvectortypes(p.proargtypes) <> \'\')',
  'ORDER BY "Function", "Result", "Arguments"'
  ].join(' ');
  name = name.toLowerCase();
  if (typeof self.functions!=='undefined'){
    callback(null,self.functions.indexOf(name) > -1);
  }else{
    self.functions = [];
    client.query( sql , function(err, results){

      if (err){
        self.system.logger.log('error',err);
        //callback(err, null);
        callback(err,false);
      }else{
        for (i=0,m=results.rows.length;i<m;i++){
          self.functions.push(results.rows[i].Function);
        }
        callback(null,self.functions.indexOf(name) > -1);
      }
    });
  }
}


exports.InitialChecks = InitialChecks;
