{EventEmitter} = require 'events'
{spawn} = require 'child_process'
DBCommand = require '../db/command'
path = require 'path'
fs = require 'fs'
os = require 'os'


module.exports =
class ImportDB extends EventEmitter
  constructor: (options) ->

    @msg_tag = 'importData'
    @options = options

  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'import data'
      params = []

      params.push '-c' # create tables
      params.push '-l' # lon/ lat
      params.push '-s' # slim

      params.push '--hstore-all'
      params.push '--hstore-add-index'
      params.push '--keep-coastlines'

      params.push '-C'
      params.push @options['cache']

      if @options['styleFile']
        params.push '-S'
        params.push @options['styleFile']
      else
        params.push '-S'
        params.push ( path.join( process.cwd(), 'osm2pgsql', 'default.style') )

      console.log @options

      params.push '-P'
      params.push @options.port
      params.push '-d'
      params.push @options.database
      params.push @options['osmfile']
      opt =
        cwd: path.join process.cwd(), 'osm2pgsql'

      console.log('osm2pgsql',params.join(' '))
      #process.exit()
      proc = spawn 'osm2pgsql',params, opt
      proc.on 'error', (err) => @procError(err)
      proc.on 'close', (code) => @close(code)
      proc.stdout.on 'data', (data) => @output(data)
      proc.stderr.on 'data', (data) => @error(data)
    else
      @done()

  start_gazetteer: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'import data'
      params = []

      params.push '-c' # create tables
      params.push '-l' # lon/ lat
      params.push '-s' # slim


      params.push '-O'
      params.push 'gazetteer'

      params.push '--hstore-all'
      params.push '--hstore-add-index'
      params.push '--keep-coastlines'

      params.push '-C'
      params.push @options['cache']

      if @options['styleFile']
        params.push '-S'
        params.push @options['styleFile']
      else
        params.push '-S'
        params.push ( path.join( process.cwd(), 'osm2pgsql', 'default.style') )

      console.log @options

      params.push '-P'
      params.push @options.port
      params.push '-d'
      params.push @options.database
      params.push @options['osmfile']
      opt =
        cwd: path.join process.cwd(), 'osm2pgsql'

      console.log('osm2pgsql',params.join(' '))
      #process.exit()
      proc = spawn 'osm2pgsql',params, opt
      proc.on 'error', (err) => @procError(err)
      proc.on 'close', (code) => @close_gazetter(code)
      proc.stdout.on 'data', (data) => @output(data)
      proc.stderr.on 'data', (data) => @error(data)
    else
      @done()

  close: (code) ->
    debug @msg_tag, 'exit #'+code
    @start_gazetteer()

  close_gazetter: (code) ->
    debug @msg_tag, 'exit #'+code
    @check()

  procError: (err) ->
    if err.errno == 'ENOENT' and err.path == 'osm2pgsql'
      error @msg_tag, 'osm2pgsql is missing, please install first'
      @emit 'error', true
    else
      error @msg_tag, err
      @emit 'error', true

  check: () ->
    command = new DBCommand @options
    command.query 'select * from place limit 1', (err,result) => @onCheck(err,result)
  onCheck: (err,result) ->
    if err
      error @msg_tag, err
    else
      if result.rows.length > 0
        @done()
      else
        @procError 'no data imported'

  output: (data) ->
    debug @msg_tag, data.toString().replace(/\n$/,'')
  error: (data) ->
    debug @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
