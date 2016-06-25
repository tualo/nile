(function() {
  var DBCommand, Geocode, commandOpt, geo, opt;

  Geocode = require('../classes/geocode');

  DBCommand = require('../classes/db/command');

  commandOpt = {
    database: 'nile',
    port: 5432
  };

  opt = {
    db: new DBCommand(commandOpt)
  };

  geo = new Geocode(opt.db);

  geo.setLanguagePreference(['name:de']);

  geo.getDetails(['100000']);

}).call(this);
