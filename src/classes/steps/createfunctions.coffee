{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'


module.exports =
class CreateFunctions extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'createFunctions'
    @options = options
    @modulePath = path.join process.cwd(),'module'
    @options['modulepath'] = @modulePath
    @moduleFile = path.join @modulePath, 'nominatim.so'
    @templateFile = path.join process.cwd(),'sql','functions.sql'
  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'create functions'
      fs.exists @moduleFile, (exists)=> @libExists(exists)
    else
      @done()

  libExists: (exists) ->
    if exists
      debug @msg_tag, 'nominatim library found'
      fs.readFile @templateFile, (err,data) => @onReadFile(err,data)
    else
      error @msg_tag, 'nominatim library is missing'
      @done()
  onReadFile: (err,data) ->
    if err
      error @msg_tag, err
    else
      output = Template.render @options, data.toString('utf-8')
      if @options.enableDiffUpdates
        debug @msg_tag, 'enable-diff-updates'
        output = output.replace 'RETURN NEW; -- @DIFFUPDATES@', '--'
      if @options.enableDebugStatements
        debug @msg_tag, 'enable-debug-statements'
        output = output.replace /--DEBUG/g, ''
      if @options.limitReindexing
        debug @msg_tag, 'limit-reindexing'
        output = output.replace /--DEBUG/g, ''
      fs.writeFile path.join( os.tmpdir(),'functions.sql' ),output,(err) => @onWriteFile(err)

  onWriteFile: (err)->
    if err
      error @msg_tag, err
    else
      info @msg_tag, 'functions script created'
    opt =
      cwd: process.cwd()
      env: process.env
    proc = spawn 'psql',['-f', path.join( os.tmpdir(),'functions.sql' ), '-p', @options.port,@options.database], opt
    proc.on 'close', (code) => @onLoadFunctions(code)
    proc.stderr.on 'data', (data) => @error(data)
  onLoadFunctions: (code) ->
    if code!=0
      error @msg_tag, 'functions not loaded'
    else
      info @msg_tag, 'functions loaded'
    @done()

  close: (code) ->
    debug @msg_tag, 'exit #'+code
    @done()
  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
