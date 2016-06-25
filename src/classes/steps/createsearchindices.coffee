{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'
DBCommand = require '../db/command'


module.exports =
class CreateSearchIndices extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'createSearchIndices'
    @options = options
    @templateFile = path.join process.cwd(), 'sql', 'indices.src.sql'
  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'index'
      @readFile()
    else
      @done()

  readFile: () ->
    debug @msg_tag, @templateFile + ' found'
    fs.readFile @templateFile, (err,data) => @onReadFile(err,data)

  onReadFile: (err,data) ->
    if err
      error @msg_tag, err
    else
      output = Template.render @options, data.toString('utf-8')
      fs.writeFile path.join( os.tmpdir(),'indices.src.sql' ),output,(err) => @onWriteFile(err)

  onWriteFile: (err)->
    if err
      error @msg_tag, err
    else
      info @msg_tag, 'script created'
    opt =
      cwd: process.cwd()
      env: process.env
    proc = spawn 'psql',['-f', path.join( os.tmpdir(),'indices.src.sql' ), '-p', @options.port,@options.database], opt
    proc.on 'close', (code) => @onLoadScript(code)
    proc.stderr.on 'data', (data) => @error(data)

  onLoadScript: (code) ->
    if code!=0
      error @msg_tag, 'script not loaded'
    else
      info @msg_tag, 'script loaded'
    @done()

  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
