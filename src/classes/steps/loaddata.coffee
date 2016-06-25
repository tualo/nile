{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'
DBCommand = require '../db/command'


module.exports =
class LoadData extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'loadData'
    @options = options
    @index = 0
    @wordsFile = path.join process.cwd(),'sql','words.sql'

  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'load data'
      @truncateWord()
    else
      @done()

  truncateWord: () ->
    debug @msg_tag, 'word'
    command = new DBCommand @options
    command.query 'TRUNCATE word', (err,result) => @onTruncateWord(err,result)
  onTruncateWord: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncatePlacex()

  truncatePlacex: () ->
    debug @msg_tag, 'placex'
    command = new DBCommand @options
    command.query 'TRUNCATE placex', (err,result) => @onTruncatePlacex(err,result)
  onTruncatePlacex: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncatePlace_addressline()

  truncatePlace_addressline: () ->
    debug @msg_tag, 'place_addressline'
    command = new DBCommand @options
    command.query 'TRUNCATE place_addressline', (err,result) => @onTruncatePlace_addressline(err,result)
  onTruncatePlace_addressline: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncatePlace_boundingbox()

  truncatePlace_boundingbox: () ->
    debug @msg_tag, 'place_boundingbox'
    command = new DBCommand @options
    command.query 'TRUNCATE place_boundingbox', (err,result) => @onTruncatePlace_boundingbox(err,result)
  onTruncatePlace_boundingbox: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncateLocation_area()

  truncateLocation_area: () ->
    debug @msg_tag, 'location_area'
    command = new DBCommand @options
    command.query 'TRUNCATE location_area', (err,result) => @onTruncateLocation_area(err,result)
  onTruncateLocation_area: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncateSearch_name()

  truncateSearch_name: () ->
    debug @msg_tag, 'place_addressline'
    command = new DBCommand @options
    command.query 'TRUNCATE search_name', (err,result) => @onTruncateSearch_name(err,result)
  onTruncateSearch_name: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncateSearch_name_blank()

  truncateSearch_name_blank: () ->
    debug @msg_tag, 'search_name_blank'
    command = new DBCommand @options
    command.query 'TRUNCATE search_name_blank', (err,result) => @onTruncateSearch_name_blank(err,result)
  onTruncateSearch_name_blank: (err,result) ->
    if err
      error @msg_tag, err
    else
      @dropSequenceSeqPlace()

  dropSequenceSeqPlace: () ->
    debug @msg_tag, 'place_addressline'
    command = new DBCommand @options
    command.query 'DROP SEQUENCE seq_place', (err,result) => @onDropSequenceSeqPlace(err,result)
  onDropSequenceSeqPlace: (err,result) ->
    if err
      error @msg_tag, err
    else
      @createSequenceSeqPlace()

  createSequenceSeqPlace: () ->
    debug @msg_tag, 'seq_place'
    command = new DBCommand @options
    command.query 'CREATE SEQUENCE seq_place start 100000', (err,result) => @onCreateSequenceSeqPlace(err,result)
  onCreateSequenceSeqPlace: (err,result) ->
    if err
      error @msg_tag, err
    else
      @truncatePartitions()

  truncatePartitions: () ->
    debug @msg_tag, 'location_road_* ('+@index+'/ '+@options['partitions'].length+')'
    if @index < @options['partitions'].length
      command = new DBCommand @options
      command.query 'TRUNCATE location_road_'+@options['partitions'][@index].partition, (err,result) => @onTruncatePartitions(err,result)
    else
      @createGet_maxwordfreq()

  onTruncatePartitions: (err,result) ->
    @index++
    @truncatePartitions()

  createGet_maxwordfreq: () ->
    sql = '
    CREATE OR REPLACE FUNCTION get_maxwordfreq()
    RETURNS integer AS $$ SELECT '+@options.maxwordfreq+' as maxwordfreq; $$
    LANGUAGE SQL IMMUTABLE'
    command = new DBCommand @options
    command.query sql, (err,result) => @onCreateGet_maxwordfreq(err,result)

  onCreateGet_maxwordfreq: (err,result) ->
    if err
      error @msg_tag, err
    else
      @loadWords()

  loadWords: () ->
    if @options.tokenPrecalc
      opt =
        cwd: process.cwd()
        env: process.env
      proc = spawn 'psql',['-f', @wordsFile, '-p', @options.port, @options.database], opt
      proc.on 'close', (code) => @onLoadWords(code)
      proc.stderr.on 'data', (data) => @error(data)
      proc.stdout.on 'data', (data) => @output(data)
    else
      @loadPlaceX()
  onLoadWords: (code) ->
    if code!=0
      error @msg_tag, 'script not loaded'
    else
      info @msg_tag, 'script loaded'
    @loadPlaceX()

  loadPlaceX:() ->
    @fin = @options.instances
    for index in [1..@options.instances]
      sql = 'insert into placex (osm_type, osm_id, class, type, name, admin_level,
  		housenumber, street, addr_place, isin, postcode, country_code, extratags,
      geometry) select * from place where osm_id % '+@options.instances+' = '+index
      command = new DBCommand @options
      command.query sql, (err,result) => @onLoadPlaceX(err,result)

  onLoadPlaceX: (err,result) ->
    if err
      error @msg_tag, err
    @fin--
    debug @msg_tag, @fin
    if @fin==0
      @analyse()

  analyse:() ->
    sql = 'ANALYSE'
    command = new DBCommand @options
    command.query sql, (err,result) => @onAnalyse(err,result)

  onAnalyse: (err,result) ->
    if err
      error @msg_tag, err
    @done()

  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
