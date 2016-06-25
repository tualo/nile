{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'
DBCommand = require '../db/command'


module.exports =
class CalculatePostcodes extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'calculatePostcodes'
    @options = options

  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'calculate postcodes'
      @deleteTypeP()
    else
      @done()

  deleteTypeP: () ->
    debug @msg_tag, 'type p'
    command = new DBCommand @options
    command.query 'DELETE from placex where osm_type=\'P\'', (err,result) => @onDeleteTypeP(err,result)
  onDeleteTypeP: (err,result) ->
    if err
      error @msg_tag, err
    else
      @insertTypeP()

  insertTypeP: () ->
    debug @msg_tag, 'type p'
    sql = '
    insert into placex (osm_type,osm_id,class,type,postcode,calculated_country_code,geometry)
		select \'P\',nextval(\'seq_postcodes\'),\'place\',\'postcode\',postcode,calculated_country_code,
		ST_SetSRID(ST_Point(x,y),4326) as geometry from (select calculated_country_code,postcode,
		avg(st_x(st_centroid(geometry))) as x,avg(st_y(st_centroid(geometry))) as y
		from placex where postcode is not null group by calculated_country_code,postcode) as x
    '
    command = new DBCommand @options
    command.query sql, (err,result) => @onInsertTypeP(err,result)
  onInsertTypeP: (err,result) ->
    if err
      error @msg_tag, err
    else
      @insertUSTypeP()


  insertUSTypeP: () ->
    debug @msg_tag, 'type p'
    sql = '
		insert into placex (osm_type,osm_id,class,type,postcode,calculated_country_code,geometry)
		select \'P\',nextval(\'seq_postcodes\'),\'place\',\'postcode\',postcode,\'us\',
		ST_SetSRID(ST_Point(x,y),4326) as geometry from us_postcode
    '
    command = new DBCommand @options
    command.query sql, (err,result) => @onInsertUSTypeP(err,result)
  onInsertUSTypeP: (err,result) ->
    if err
      error @msg_tag, err
    @done()

  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
