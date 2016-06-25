express  = require 'express'
http     = require 'http'
https    = require 'https'
path     = require 'path'
fs       = require 'fs'
jade     = require 'jade'
bodyParser = require 'body-parser'

SampleSSL = require './samplessl'
reqall = require '../../reqall'
log = require '../../log'
GISDB = require './classes/gisdb'
{Tile} = require '../../../build/Release/tile'

xtile = new Tile(512,512)
xtile.dataSourcePath("/usr/local/lib/mapnik/input/")
#xtile.fontPath("/Users/thomashoffmann/Documents/Projects/node/tualo-carto/fonts")
#xtile.loadMap("/Users/thomashoffmann/Documents/Projects/node/tualo-carto/carto.xml")

tileConfig = (xml,base)->
  xtile.fontPath("/Users/thomashoffmann/Documents/Projects/node/tualo-carto/fonts")
  xtile.loadMap(xml,base)



class Server
  constructor: () ->
    @debugMode = false
    @classesList = []
    @routesList = []
    @middlewaresList = []

  set: (config) ->
    @config = config



  setDebug: (mode) ->
    @debugMode = mode

  classes: (libpath,list) ->
    for item in list
      opt = item
      opt.library = libpath
      @classesList.push opt

  routes: (libpath,list) ->
    for item in list
      opt = item
      opt.library = libpath
      @routesList.push opt

  middlewares: (libpath,list) ->
    for item in list
      opt = item
      opt.library = libpath
      @middlewaresList.push opt

  initModules: () ->
    @classesList.sort @byLoadOrder
    @middlewaresList.sort @byLoadOrder
    @routesList.sort @byLoadOrder

    for cl in @classesList
      C = require(path.join(cl.library,cl.file))
      @classes[cl.name] = C

    for mw in @middlewaresList
      M = require(path.join(mw.library,mw.file))
      o = new M @
    for rt in @routesList
      M = require(path.join(rt.library,rt.file))
      o = new M @


  byLoadOrder: (a,b) ->
    result = 0
    if typeof a.loadorder=='undefined'
      a.loadorder=0
    if typeof b.loadorder=='undefined'
      b.loadorder=0
    if a.loadorder > b.loadorder
      result = 1
    if a.loadorder < b.loadorder
      result = -1
    result

  start: () ->
    @app = express()
    @app.set 'view engine', 'jade'
    @app.use (request,result,next) ->
      next()
      if false
        gisdbOptions =
          database: 'nile'
          port: 5432

        request.gisdb = new GISDB gisdbOptions
        request.once 'end', () ->
          debug 'gisdb','disconnect'
          request.gisdb.disconnect()
        request.gisdb.connect () ->
          result.locals =
            errors: []
            messages: []
            informations: []
            warnings: []
            title: 'nile'
            headline: 'No headline'
            teasertext: 'No teasertext'
            content: 'main content'
            navigation: []

          result.page = 'login'


    encoderOptions =
      extended: false
    @app.use bodyParser.urlencoded( encoderOptions )

    #Tile = require('./routes/tile')
    #tile = new Tile process.cwd()+'/test/sample.mss'
    #@app.use '/tiles', tile.router()

    MapTile = require('./routes/maptile')
    tile = new MapTile xtile
    @app.use '/tiles', tile.router()

    streets = require('./routes/streets')
    @app.use '/streets', streets

    @app.use express.static(path.join(__dirname ,'..','..','..', 'public'))
    @app.set 'views', path.join(__dirname ,'..','..','..', 'template')
    @app.set 'view engine', 'jade'

    @app.get '/', (req,res,next) ->
      res.render 'index', {}

    @startHttp()
    @startHttps()

  startHttp: () ->
    if @config.http.active
      @httpServer = http.createServer @app
      @httpServer.listen @config.http.port, @config.http.ip, @startHttpCallback

  startHttpCallback: (err) ->
    if err?
      error 'start http','http(s) server', err

  startHttps: () ->
    ssl = new SampleSSL @config
    ssl.on 'done', () =>

      debug 'https server sample ssl','done'
      if @config.https.active
        credentials =
          key: fs.readFileSync @config.https.credentials.key, 'utf8'

        if @config.https.credentials.cert?
          credentials.cert = fs.readFileSync @config.https.credentials.cert, 'utf8'

        if @config.https.credentials.ca?
          credentials.ca = fs.readFileSync @config.https.credentials.ca, 'utf8'
        #console.log @config.https
        @httpsServer = https.createServer credentials, @app
        @httpsServer.listen @config.https.port, @config.https.ip, @startHttpCallback

    ssl.on 'error', (err) ->
      error 'ssl error', 'https server sample ssl', err
    ssl.run()

module.exports =
  tileConfig: tileConfig
  Server: Server
