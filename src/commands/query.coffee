{Command} = require 'tualo-commander'
fs = require 'fs'
path = require 'path'
Geocode = require '../classes/db/geocode'
GISDB = require '../classes/server/classes/gisdb'


module.exports =
class Query extends Command
  @commandName: 'query'
  @commandArgs: ['query']
  @commandShortDescription: 'query an address'
  @options: [
    {parameter: "-d, --debug [debug]", description: "enable the debug mode"}
  ]


  @help: () ->
    """
    """

  action: (options,args) ->
    if args.query
      @query = args.query
      gisdbOptions =
        database: options.dbname||'nile'
        port: 5432
      @db = new GISDB gisdbOptions
      @db.connect () => @onDBConnect()

  onDBConnect: () ->
    @geocode = new Geocode @db
    @geocode.setQuery @query
    @geocode.lookup()
