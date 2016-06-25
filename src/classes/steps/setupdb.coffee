{EventEmitter} = require 'events'
{spawn} = require 'child_process'
DBCommand = require '../db/command'
path = require 'path'
fs = require 'fs'


module.exports =
class SetupDB extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'setupDb'
    @options = options

  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'setup database'
      proc = spawn 'createlang',['plpgsql','-p '+@options.port,@options.database]
      proc.on 'close', (code) => @close(code)
      proc.stdout.on 'data', (data) => @output(data)
      proc.stderr.on 'data', (data) => @error(data)
    else
      @done()

  close: (code) ->
    debug @msg_tag, 'exit #'+code
    @postgres_version()

  postgres_version: () ->
    command = new DBCommand @options
    command.getOne 'select version()', (err,result) => @onPostgres_version(err,result)

  onPostgres_version: (err,result) ->
    if err
      error @msg_tag, err
    else
      m = result.version.match(/PostgreSQL\s([0-9]+)[.]([0-9]+)[^0-9]/)
      if m
        v = m.slice(1,3).join('.')
        @options.postgres_version = v
        info @msg_tag+' '+'postgis version', v
      else
        error @msg_tag, 'can\'t read postgres version'
    @hstore()

  hstore: () ->
    command = new DBCommand @options
    command.query 'CREATE EXTENSION hstore', (err,result) => @onHstore(err,result)

  onHstore: (err,result) ->
    if err
      error @msg_tag, err
    else
      info @msg_tag, 'hstore extension created'
    @postgis()
  postgis: () ->
    command = new DBCommand @options
    command.query 'CREATE EXTENSION postgis', (err,result) => @onPostgis(err,result)

  onPostgis: (err,result) ->
    if err
      error @msg_tag, err
    else
      info @msg_tag, 'postgis extension created'
    @postgis_version()

  postgis_version: () ->
    command = new DBCommand @options
    command.getOne 'select postgis_full_version()', (err,result) => @onPostgis_version(err,result)
  onPostgis_version: (err,result) ->
    if err
      error @msg_tag, err
    else
      m = result.postgis_full_version.match(/POSTGIS="([0-9]+)[.]([0-9]+)[.]([0-9]+)( r([0-9]+))?"/)
      if m
        v = m.slice(1,4).join('.')
        @options.postgis_version = v
        info @msg_tag+' '+'postgis version', v
      else
        error @msg_tag, 'can\'t read postgis version'
    @loadCountryName()

  loadCountryName: () ->
    opt =
      cwd: process.cwd()
      env: process.env
    proc = spawn 'psql',['-f'+path.join( 'sql', 'country_name.sql' ),'-p '+@options.port,@options.database], opt
    proc.on 'close', (code) => @onLoadCountryName(code)
    proc.stderr.on 'data', (data) => @error(data)
  onLoadCountryName: (code) ->
    if code!=0
      error @msg_tag, 'country_name not loaded'
    else
      info @msg_tag, 'country_name loaded'
    @loadCountryNaturalearthdata()

  loadCountryNaturalearthdata: () ->
    opt =
      cwd: process.cwd()
      env: process.env
    proc = spawn 'psql',['-f'+path.join( 'sql', 'country_naturalearthdata.sql' ),'-p '+@options.port,@options.database], opt
    proc.on 'close', (code) => @onLoadCountryNaturalearthdata(code)
    proc.stderr.on 'data', (data) => @error(data)
  onLoadCountryNaturalearthdata: (code) ->
    if code!=0
      error @msg_tag, 'country_naturalearthdata not loaded'
    else
      info @msg_tag, 'country_naturalearthdata loaded'
    @loadCountryOsmGrid()

  loadCountryOsmGrid: () ->
    opt =
      cwd: process.cwd()
      env: process.env
    proc = spawn 'psql',['-f'+path.join( 'sql', 'country_osm_grid.sql' ),'-p '+@options.port,@options.database], opt
    proc.on 'close', (code) => @onLoadCountryOsmGrid(code)
    proc.stderr.on 'data', (data) => @error(data)
  onLoadCountryOsmGrid: (code) ->
    if code!=0
      error @msg_tag, 'country_osm_grid not loaded'
    else
      info @msg_tag, 'country_osm_grid loaded'
    if @options['partitions']
      @place_boundingbox()
    else
      @no_partitions()


  no_partitions: () ->
    info @msg_tag, 'no-partitions'
    command = new DBCommand @options
    command.getOne 'update country_name set partition = 0', (err,result) => @onNo_partitions(err,result)
  onNo_partitions: (err,result) ->
    if err
      error @msg_tag, err
    @place_boundingbox()

  place_boundingbox: () ->
    debug @msg_tag, 'place_boundingbox'
    command = new DBCommand @options
    command.query 'CREATE TABLE place_boundingbox ()', (err,result) => @onPlace_boundingbox(err,result)
  onPlace_boundingbox: (err,result) ->
    if err
      error @msg_tag, err
    @wikipedia_article_match()


  wikipedia_article_match: () ->
    command = new DBCommand @options
    command.query 'create type wikipedia_article_match as ()', (err,result) => @onWikipedia_article_match(err,result)
  onWikipedia_article_match: (err,result) ->
    if err
      error @msg_tag, err
    @done()

  output: (data) ->
    debug @msg_tag, data.toString().replace(/\n$/,'')
  error: (data) ->
    error @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
