{EventEmitter} = require 'events'
{spawn} = require 'child_process'
pg = require 'pg'


module.exports =
class GISDB extends EventEmitter
  constructor: (options) ->
    @client = new pg.Client 'postgres://localhost:'+options.port+'/'+options.database
  connect: (connectCB) ->
    @connectCB = connectCB
    @client.connect (err) => @onConnect(err)
  disconnect: () ->
    @client.end()

  query: (sql, others...) ->
    args = []
    cback = () ->
      #nothing
    if typeof others[0]=='function'
      cback = others[0]
    else
      args = others[0]
      cback = others[1]
    @client.query sql,args, (err,result) ->
      cback err,result

  onConnect: (err) ->
    if err
      @connectCB err, null
    else
      @connectCB null, true
