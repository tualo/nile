{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require '../db/template'
DBCommand = require '../db/command'
request = require 'request'

module.exports =
class OsmosisInit extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'osmosisInit'
    @options = options
    @settingsPath = path.join process.cwd(),'settings'
    @stateTXTFile = path.join process.cwd(),'settings','state.txt'
    @settingsFile = path.join @settingsPath,'configuration.txt'
    @replicationURL = 'http://planet.openstreetmap.org/replication/minute'

  start: () ->
    if @options[@msg_tag]
      debug @msg_tag, 'osmosis init'
      fs.exists @settingsFile, (exists)=> @initSettings(exists)
    else
      @done()

  initSettings: (exists) ->
    if exists==false
      opt =
        cwd: process.cwd()
        env: process.env
      proc = spawn 'osmosis',['--read-replication-interval-init', @settingsPath], opt
      proc.on 'close', (code) => @onInitSettings(code)
      proc.stderr.on 'data', (data) => @error(data)
      proc.stdout.on 'data', (data) => @output(data)
    else
      @maxID()

  onInitSettings: (code) ->
    @maxID()

  maxID:() ->
    sql = 'select max(osm_id) m from place where osm_type = \'N\''
    command = new DBCommand @options
    command.getOne sql, (err,result) => @onMaxID(err,result)

  onMaxID: (err,result) ->
    if err
      error @msg_tag, err
    else
      @iLastOSMID = result.m
      @nodeRequest()

  nodeRequest: () ->
    request 'http://www.openstreetmap.org/api/0.6/node/'+@iLastOSMID+'/1', (error, response, body) => @onNodeRequest(error, response, body)

  onNodeRequest: (err, response, body) ->
    if err
      error @msg_tag, err
    else
      if response.statusCode == 200
        @lastNodeXML = body
        m = @lastNodeXML.match(/(([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})Z)/)
        if m
          lastNodeDate = new Date(m[1])
          @lastNodeDate = new Date( lastNodeDate.getTime() - (3*60*60*1000) )
          @getStateFile()
        else
          error @msg_tag, 'error while parsing last node xml'



      else
        error @msg_tag, response.statusCode

  getStateFile: () ->
    request @replicationURL+'/?C=M;O=D;F=1', (error, response, body) => @onGetStateFile(error, response, body)
  onGetStateFile: (err, response, body) ->
    if err
      error @msg_tag, err
    else
      if response.statusCode == 200
        m = body.match /<a\shref="[0-9]{3}\/">([0-9]{3}\/)<\/a>\s*([-0-9a-zA-Z]+\s[0-9]{2}:[0-9]{2})/gi
        if not m
          error @msg_tag, 'error while reading '+@replicationURL
        else
          date = new Date
          link = ''
          dates = []
          (dates.push( {date: (dt.replace(/(\s){2}/gi,'#').split('#') ).pop() ,link:(dt.replace(/(\s){2}/gi,'#').split('#') ).shift()} ) for dt in m)
          fn = (a,b) ->
            res = 0
            if a.date>b.date
              res = 1
            if a.date<b.date
              res = -1
            res
          dates.sort(fn)
          dates.reverse()

          for dt in dates
            if (new Date(dt.date)) < @lastNodeDate
              break
            date = (new Date(dt.date))
            p = dt.link.match /([0-9]){3}/
            if p
              link = p[0]
          if link!=''
            @subReplicationURL = @replicationURL+'/'+link+''
            @getStateFile2()
      else
        error @msg_tag, response.statusCode

  getStateFile2: () ->
    request @subReplicationURL+'/?C=M;O=D;F=1', (error, response, body) => @onGetStateFile2(error, response, body)
  onGetStateFile2: (err, response, body) ->
    if err
      error @msg_tag, err
    else
      if response.statusCode == 200
        m = body.match /<a\shref="[0-9]{3}\/">([0-9]{3}\/)<\/a>\s*([-0-9a-zA-Z]+\s[0-9]{2}:[0-9]{2})/gi
        if not m
          error @msg_tag, 'error while reading '+@subReplicationURL
        else
          date = new Date
          link = ''
          dates = []
          (dates.push( {date: (dt.replace(/(\s){2}/gi,'#').split('#') ).pop() ,link:(dt.replace(/(\s){2}/gi,'#').split('#') ).shift()} ) for dt in m)
          fn = (a,b) ->
            res = 0
            if a.date>b.date
              res = 1
            if a.date<b.date
              res = -1
            res
          dates.sort(fn)
          dates.reverse()

          for dt in dates
            if (new Date(dt.date)) < @lastNodeDate
              break
            date = (new Date(dt.date))
            p = dt.link.match /([0-9]){3}/
            if p
              link = p[0]

          #console.log link
          if link!=''
            @subSubReplicationURL = @subReplicationURL+'/'+link+''
            @getStateFile3()
      else
        error @msg_tag, response.statusCode

  getStateFile3: () ->
    request @subSubReplicationURL+'/?C=M;O=D;F=1', (error, response, body) => @onGetStateFile3(error, response, body)
  onGetStateFile3: (err, response, body) ->
    if err
      error @msg_tag, err
    else
      if response.statusCode == 200
        m = body.match />([0-9]){3}.state.txt<\/a>\s*([-0-9a-zA-Z]+\s[0-9]{2}:[0-9]{2})/gi
        if not m
          error @msg_tag, 'error while reading '+@subSubReplicationURL
        else
          date = new Date
          link = ''
          dates = []
          (dates.push( {date: (dt.replace(/(\s){2}/gi,'#').split('#') ).pop() ,link:(dt.replace(/(\s){2}/gi,'#').split('#') ).shift()} ) for dt in m)
          fn = (a,b) ->
            res = 0
            if a.date>b.date
              res = 1
            if a.date<b.date
              res = -1
            res
          dates.sort(fn)
          dates.reverse()

          for dt in dates
            if (new Date(dt.date)) < @lastNodeDate
              break
            date = dt.date
            p = dt.link.match /([0-9]){3}/
            if p
              link = p[0]
          if link!=''
            @stateTXT = @subSubReplicationURL+'/'+link+'.state.txt'+''
            @lastDate = date
            @getStateTXT()
      else
        error @msg_tag, response.statusCode

  getStateTXT: () ->
    request @stateTXT, (error, response, body) => @onGetStateTXT(error, response, body)
  onGetStateTXT: (err, response, body) ->
    if err
      error @msg_tag, err
    else
      if response.statusCode == 200
        fs.writeFile @stateTXTFile, body, (err) => @onWriteStateTXT(err)
      else
        error @msg_tag, response.statusCode
  onWriteStateTXT: (err) ->
    if err
      error @msg_tag, err
    else
      info @msg_tag, 'state file written'
      @deleteImportStatus()

  deleteImportStatus:() ->
    sql = 'TRUNCATE import_status'
    command = new DBCommand @options
    command.query sql, (err,result) => @onDeleteImportStatus(err,result)
  onDeleteImportStatus: (err,result) ->
    if err
      error @msg_tag, err
    @importStatus()

  importStatus: () ->
    sql = 'INSERT INTO import_status VALUES(\''+@lastDate+'\')'
    command = new DBCommand @options
    command.query sql, (err,result) => @onImportStatus(err,result)
  onImportStatus: (err,result) ->
    if err
      error @msg_tag, err
    info @msg_tag, 'state stored'
    @done()

  output: (data) ->
    debug @msg_tag, data.toString()
  error: (data) ->
    info @msg_tag, data.toString().replace(/\n$/,'')
  done: () ->
    @emit 'done'
