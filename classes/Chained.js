
var Chained = function(){
  var self = this;
  self.functions = [];

  self.results = {};
  self.fcs = {};
  self.errorFC = function(){};
  self.resumeOnError=false;
}

Chained.prototype.resumeOnError = function(b){
  var self = this;
  self.resumeOnError = b;
}

Chained.prototype.error = function(fc){
  var self = this;
  self.errorFC = fc;
}

Chained.prototype.add = function(key,fc,args,scope){
  var self = this;
  self.functions.push({
    key: key,
    scope: scope || self,
    fn: fc,
    args: args
  });
}

Chained.prototype.run = function(callback,index){
  var self = this,
  args;
  if (typeof index==='number'){
    if (index < self.functions.length){
      args = [];
      if (typeof self.functions[index].args === 'string' ){
        args.push( self.results[self.functions[index].args]);
      }else{
        args = self.functions[index].args;
      }
      args.push( function(error,result){
        self.results[self.functions[index].key] = result;
        if (error){
          self.error(self.functions[index].key,error);
        }

        if (!error || self.resumeOnError){
          self.run(callback,index+1);
        }else{
          callback(error);
        }

      } )

      try{
        if (typeof self.functions[index].fn==='function'){
          self.functions[index].fn.apply( self.functions[index].scope, args );
        }else{
          self.error(self.functions[index].key,'it is not a function at key');
          if (self.resumeOnError){
            self.run(callback,index+1);
          }else{
            callback('it is not a function at key');
          }
        }
      }catch(e){
        self.error(self.functions[index].key,e);
        if (self.resumeOnError){
          self.run(callback,index+1);
        }else{
          callback(e);
        }
      }
    }else{
      callback(null,self.results);
    }
  }else{
    self.run(callback,0);
  }
}

exports.Chained = Chained;
