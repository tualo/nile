{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
Template = require 'tualo-template'
Server = require '../classes/server/server'
MSS = require '../classes/server/classes/mss'
Tile = require '../classes/server/routes/tile'
GISDB = require '../classes/server/classes/gisdb'


module.exports =
class Start extends Command
  @commandName: 'mss'
  @commandArgs: ['filename','zoom','x','y']
  @commandShortDescription: 'compile mss'
  @options: [
    {parameter: "-d, --debug [debug]", description: "enable the debug mode"}
  ]


  @help: () ->
    """
    compile mss.
    """

  action: (options,args) ->
    if args.filename and args.zoom and args.x and args.y


      gisdbOptions =
        database: 'nile'
        port: 5432
      db = new GISDB gisdbOptions
      db.connect () ->
        tile = new Tile args.filename
        tile.queryTile db,args.zoom,args.x,args.y, (err,data) ->
          db.disconnect()
          renderer = tile.getImage data, 512
          renderer.save 'sampl.png'


    else
      options.help()
