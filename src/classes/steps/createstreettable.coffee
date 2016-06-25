{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'
DBCommand = require '../db/command'




module.exports =
class CreateStreetTable extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'createStreetTable'
    @options = options

  start: () ->
    if @options[@msg_tag]
      @streets()
    else
      @done()
  streets: () ->
    sql = """
    select
      str.name,
      str.typ,
      str.way,
      pc.postal_code
    from
    (
    select
      name,highway as typ, way
    from
      planet_osm_roads where highway <> '' and name <>''
    union
    select
      name,highway as typ, way
    from
      planet_osm_line where highway <> '' and name <>''
    ) str,
    (
    select
      planet_osm_polygon.way,
      planet_osm_polygon.tags->'postal_code' postal_code
    from
      planet_osm_polygon
    where
      planet_osm_polygon.tags->'postal_code' <> ''
    ) pc
    where str.way && pc.way
    """
    command = new DBCommand @options
    command.query sql, (err,result) => @onStreets(err,result)
  onStreets: (err,result) ->
    if err
      error @msg_tag, err
    else
      @streetlist = result.rows
      debug 'streets', result.rows.length
      @adm 6,0

  adm: (adm,index) ->
    if index < @streetlist.length
      me = @
      strid = @streetlist[index].way
      sql = """
      select
        name,
        way
      from
        planet_osm_polygon
      where
        admin_level in ('"""+adm+"""') and boundary='administrative'
        and ST_Intersects(planet_osm_polygon.way, '"""+strid+"""')
      """
      command = new DBCommand @options
      command.query sql, (err,result) ->
        if err
          error 'adm',err
        else
          if result.rows.length>0
            me.streetlist[index]['adm_'+adm] = result.rows[0].name

        if index%100==0
          debug 'adm_'+adm,index
        me.adm adm,index+1
    else
      adm+=1
      if adm<12
        me.adm adm,0
      else
        @done()



  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    console.log @streetlist.length
    @emit 'done'
