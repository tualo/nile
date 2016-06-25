{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'
DBCommand = require '../db/command'


module.exports =
class Index extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'index'
    @options = options
    @params = ['-i','-d', @options.database,'-P', @options.port,'-t',@options.instances]
    @cmd = path.join process.cwd(), 'nominatim','nominatim'

  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'index'
      @indexR4()
    else
      @done()

  indexR4: (exists) ->
    opt =
      cwd: process.cwd()
      env: process.env
    debug @msg_tag, path.join( process.cwd(), 'nominatim')
    params = @params.slice(0,@params.length)
    params.push '-R'
    params.push '4'
    proc = spawn @cmd,params, opt
    proc.on 'close', (code) => @onIndexR4(code)
    proc.stderr.on 'data', (data) => @error(data)
    proc.stdout.on 'data', (data) => @output(data)
  onIndexR4: (code) ->
    debug @msg_tag, 'index R4'
    command = new DBCommand @options
    command.query 'ANALYSE', (err,result) => @onIndexR4Analyse(err,result)
  onIndexR4Analyse: (err,result) ->
    if err
      error @msg_tag, err
    else
      @indexR25()

  indexR25: (exists) ->
    opt =
      cwd: process.cwd()
      env: process.env
    debug @msg_tag, path.join( process.cwd(), 'nominatim')
    params = @params.slice(0,@params.length)
    params.push '-r'
    params.push '5'
    params.push '-R'
    params.push '25'
    proc = spawn @cmd,params, opt
    proc.on 'close', (code) => @onIndexR25(code)
    proc.stderr.on 'data', (data) => @error(data)
    proc.stdout.on 'data', (data) => @output(data)
  onIndexR25: (code) ->
    debug @msg_tag, 'index R25'
    command = new DBCommand @options
    command.query 'ANALYSE', (err,result) => @onIndexR25Analyse(err,result)
  onIndexR25Analyse: (err,result) ->
    if err
      error @msg_tag, err
    else
      @indexR26()


  indexR26: (exists) ->
    opt =
      cwd: process.cwd()
      env: process.env
    debug @msg_tag, path.join( process.cwd(), 'nominatim')
    params = @params.slice(0,@params.length)
    params.push '-r'
    params.push '26'
    proc = spawn @cmd,params, opt
    proc.on 'close', (code) => @onIndexR26(code)
    proc.stderr.on 'data', (data) => @error(data)
    proc.stdout.on 'data', (data) => @output(data)
  onIndexR26: (code) ->
    debug @msg_tag, 'index R26'
    command = new DBCommand @options
    command.query 'ANALYSE', (err,result) => @onIndexR26Analyse(err,result)
  onIndexR26Analyse: (err,result) ->
    if err
      error @msg_tag, err
    else
      @done()


  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
