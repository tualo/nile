{EventEmitter} = require 'events'
pg = require 'pg'

module.exports =
class Command extends EventEmitter
  constructor: (options) ->
    @own_connection = true
    @singleRow = false
    if typeof options.dbconnection == 'object'
      @own_connection = false
      @client = options.dbconnection
    else
      @client = new pg.Client 'postgres://localhost:'+options.port+'/'+options.database

  getOne: (sql, callback) ->
    @sql = sql
    @callback = callback

    @singleRow = true
    if @own_connection
      @client.connect (err) => @onConnect(err)
    else
      @onConnected()

  query: (sql, callback) ->
    @sql = sql
    @callback = callback

    if @own_connection
      @client.connect (err) => @onConnect(err)
    else
      @onConnected()

  onConnect: (err) ->
    if err
      @callback err
    else
      @onConnected()

  onConnected: ->
    @client.query @sql, (err,result) => @onQuery(err,result)

  onQuery: (err,result) ->
    if @own_connection
      @client.end()
    if @singleRow
      result = if result.rows.length > 0 then result.rows[0] else []
    @callback err, result
