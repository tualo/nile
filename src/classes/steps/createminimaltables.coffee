{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require 'tualo-template'


module.exports =
class CreateMinimalTables extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'createMinimalTables'
    @options = options
    @templateFile = path.join process.cwd(), 'sql', 'tables-minimal.sql'
  start: () ->
    if @options[@msg_tag]
      opt =
        cwd: process.cwd()
        env: process.env
      proc = spawn 'psql',['-f', @templateFile, '-p', @options.port,@options.database], opt
      proc.on 'close', (code) => @onLoadMinimalTables(code)
      proc.stderr.on 'data', (data) => @error(data)
    else
      @done()
  onLoadMinimalTables: (code) ->
    if code!=0
      error @msg_tag, 'tables-minimal not loaded'
    else
      info @msg_tag, 'tables-minimal loaded'
    @done()
  close: (code) ->
    debug @msg_tag, 'exit #'+code
    @done()
  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    error @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
