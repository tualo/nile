{EventEmitter} = require 'events'
{spawn} = require 'child_process'

module.exports =
class CreateDB extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'createDb'
    @options = options
  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'create database'
      proc = spawn 'createdb',['-E UTF-8','-p '+@options.port,@options.database]
      proc.on 'close', (code) => @close(code)
      proc.stdout.on 'data', (data) => @output(data)
      proc.stderr.on 'data', (data) => @error(data)
    else
      @done()
  close: (code) ->
    debug @msg_tag, 'exit #'+code
    @done()
  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    error @msg_tag, data.toString()
  done: () ->
    @emit 'done'
