(function() {
  var Command, Install, InstallCMD, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Command = require('tualo-commander').Command;

  path = require('path');

  fs = require('fs');

  Install = require('../main').Install;

  module.exports = InstallCMD = (function(superClass) {
    extend(InstallCMD, superClass);

    function InstallCMD() {
      return InstallCMD.__super__.constructor.apply(this, arguments);
    }

    InstallCMD.commandName = 'install';

    InstallCMD.commandArgs = [];

    InstallCMD.options = [
      {
        parameter: "--osmfile [osmfile]",
        description: ""
      }, {
        parameter: "--style-file [stylefile]",
        description: ""
      }, {
        parameter: "--osm2pgsql-cache [cache]",
        description: ""
      }, {
        parameter: "--MaxWordFrequency [maxwordfreq]",
        description: ""
      }, {
        parameter: "--all",
        description: ""
      }, {
        parameter: "--create-db",
        description: ""
      }, {
        parameter: "--setup-db",
        description: ""
      }, {
        parameter: "--no-partitions",
        description: ""
      }, {
        parameter: "--import-data",
        description: ""
      }, {
        parameter: "--create-functions",
        description: ""
      }, {
        parameter: "--enable-diff-updates",
        description: ""
      }, {
        parameter: "--enable-debug-statements",
        description: ""
      }, {
        parameter: "--limit-reindexing",
        description: ""
      }, {
        parameter: "--no-partitions",
        description: ""
      }, {
        parameter: "--no-token-precalc",
        description: ""
      }, {
        parameter: "--create-minimal-tables",
        description: ""
      }, {
        parameter: "--create-tables",
        description: ""
      }, {
        parameter: "--create-partition-tables",
        description: ""
      }, {
        parameter: "--create-partition-functions",
        description: ""
      }, {
        parameter: "--load-data",
        description: ""
      }, {
        parameter: "--calculate-postcodes",
        description: ""
      }, {
        parameter: "--osmosis-init",
        description: ""
      }, {
        parameter: "--index",
        description: ""
      }, {
        parameter: "--create-search-indices",
        description: ""
      }, {
        parameter: "--create-street-table",
        description: ""
      }
    ];

    InstallCMD.commandShortDescription = 'install the server';

    InstallCMD.help = function() {
      return "";
    };

    InstallCMD.prototype.action = function(options, args) {
      this.install = new Install(options);
      return this.install.start();
    };

    return InstallCMD;

  })(Command);

}).call(this);
