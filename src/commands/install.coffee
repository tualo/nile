{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
{Install} = require '../main'

module.exports =
class InstallCMD extends Command
  @commandName: 'install'
  @commandArgs: [
  ]
  @options: [

    { parameter: "--osmfile [osmfile]", description: "" },
    { parameter: "--style-file [stylefile]", description: ""},
    { parameter: "--osm2pgsql-cache [cache]", description: "" },
    { parameter: "--MaxWordFrequency [maxwordfreq]", description: "" },

    { parameter: "--all", description: "" },
    { parameter: "--create-db", description: "" },
    { parameter: "--setup-db", description: "" },
    { parameter: "--no-partitions", description: "" },
    { parameter: "--import-data", description: "" },
    { parameter: "--create-functions", description: "" },
    { parameter: "--enable-diff-updates", description: "" },
    { parameter: "--enable-debug-statements", description: "" },
    { parameter: "--limit-reindexing", description: "" },
    { parameter: "--no-partitions", description: "" },
    { parameter: "--no-token-precalc", description: "" },
    { parameter: "--create-minimal-tables", description: "" },
    { parameter: "--create-tables", description: "" },
    { parameter: "--create-partition-tables", description: "" },
    { parameter: "--create-partition-functions", description: "" },
    { parameter: "--load-data", description: "" },
    { parameter: "--calculate-postcodes", description: "" },
    { parameter: "--osmosis-init", description: "" },
    { parameter: "--index", description: "" },
    { parameter: "--create-search-indices", description: "" }
    { parameter: "--create-street-table", description: "" }


    #
    # { parameter: "--ignore-errors", description: "" },
    # { parameter: "--create-partition-functions", description: "" },
    # { parameter: "--import-wikipedia-articles", description: "" },
    # { parameter: "--load-data", description: "" },
    #
    # { parameter: "--osmosis-init", description: "" },
    # { parameter: "--index-noanalyse", description: "" },
    # { parameter: "--index-output", description: "" },
    # { parameter: "--create-search-indices", description: "" }

  ]

  @commandShortDescription: 'install the server'

  @help: () ->
    """

    """

  action: (options,args) ->
    @install = new Install options
    @install.start()
