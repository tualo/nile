{EventEmitter} = require 'events'
{spawn} = require 'child_process'
DBCommand = require '../db/command'
path = require 'path'
fs = require 'fs'


module.exports =
class SetupDB extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'routing'
    @options = options
    @tables_prefix='routing_'
  start: () ->
    @createNodesTable()

  createNodesTable: () ->
    sql =" CREATE TABLE " + @tables_prefix + "nodes (id bigint PRIMARY KEY, lon decimal(11,8), lat decimal(11,8), numOfUse int);"
    command = new DBCommand @options
    command.query sql, (err,result) => @createWaysTable(err,result)

  createWaysTable: (err,result) ->
    sql = "CREATE TABLE " + @tables_prefix + "ways (gid integer, class_id integer not null, length double precision, name text, x1 double precision, y1 double precision, x2 double precision, y2 double precision, reverse_cost double precision, rule text, to_cost double precision, maxspeed_forward integer, maxspeed_backward integer, osm_id bigint, priority double precision DEFAULT 1);"
    sql += " SELECT AddGeometryColumn('" + @tables_prefix + "ways','the_geom',4326,'LINESTRING',2);"
    command = new DBCommand @options
    command.query sql, (err,result) => @createTypesTable(err,result)

  createTypesTable: (err,result) ->
    sql = "CREATE TABLE " + @tables_prefix + "types (id integer PRIMARY KEY, name text);"
    command = new DBCommand @options
    command.query sql, (err,result) => @createWayTagsTable(err,result)

  createWayTagsTable: (err,result) ->
    sql = "CREATE TABLE " + @tables_prefix + "way_tag (type_id integer, class_id integer, way_id bigint);"
    command = new DBCommand @options
    command.query sql, (err,result) => @createRelationsTable(err,result)

  createRelationsTable: (err,result) ->
    sql = "CREATE TABLE " + @tables_prefix + "relations (relation_id bigint, type_id integer, class_id integer, name text);"
    command = new DBCommand @options
    command.query sql, (err,result) => @createClassesTable(err,result)

  createClassesTable: (err,result) ->
    sql = "CREATE TABLE " + @tables_prefix + "classes (id integer PRIMARY KEY, type_id integer, name text, cost double precision, priority double precision, default_maxspeed integer);"
    command = new DBCommand @options
    command.query sql, (err,result) => @createWaysTable(err,result)

  close: (code) ->
    debug @msg_tag, 'exit #'+code
    @postgres_version()
