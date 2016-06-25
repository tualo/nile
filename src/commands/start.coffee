{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
Template = require 'tualo-template'
{Server} = require '../classes/server/server'
{tileConfig} = require '../classes/server/server'
Carto = require 'carto'

module.exports =
class Start extends Command
  @commandName: 'start'
  @commandArgs: []
  @commandShortDescription: 'start the server'
  @options: [
    {parameter: "-d, --debug [debug]", description: "enable the debug mode"}
    {parameter: "-s, --style [style]", description: "point a mml style"}
  ]


  @help: () ->
    """
    start nile server.

    """

  action: (options,args) ->
    if options.style
      renderer = new Carto.Renderer({filename: options.style})
      data = JSON.parse(fs.readFileSync(options.style, 'utf-8'))
      data.Stylesheet = data.Stylesheet.map (x) ->
        if typeof x != 'string'
          return {id: x, data: x.data }
        return { id: x, data: fs.readFileSync(path.join(path.dirname(options.style), x), 'utf8') }
      output = renderer.render(data)
      tileConfig output,path.dirname(options.style)


    config =
      http:
        active: true
        ip: '127.0.0.1'
        port: 8080

      https:
        active: true
        ip: '127.0.0.1'
        port: 8443

    server = new Server

    server.set config
    if options.debug
      server.setDebug true
    server.start()
