{EventEmitter} = require 'events'
{spawn} = require 'child_process'
os = require 'os'
DBCommand = require '../db/command'

module.exports =
class Partitions extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'partitions'
    @options = options
  start: () ->
    command = new DBCommand @options
    command.query 'select distinct partition from country_name', (err,result) => @onQuery(err,result)
  onQuery: (err,result)->
    @options['partitions'] = result.rows
    @done()
  done: () ->
    @emit 'done'
