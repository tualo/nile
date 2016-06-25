mkdirp = require 'mkdirp'
path = require 'path'
mkdirp = require 'mkdirp'
fs = require 'fs'
glob = require 'glob'
SphericalMercator = require 'sphericalmercator'
spawn = require('child_process').spawn



module.exports =
class MapTile
  constructor: (xtile) ->
    @xtile = xtile
    #'/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/project.xml'
    #/Users/thomashoffmann/Documents/Projects/node/mapnik/osm.xml

    #xmlfile = '/Users/thomashoffmann/Documents/Projects/maps/OSM-Swiss-Style/carto.xml'
    #options =
    #  cwd: path.join(path.dirname(xmlfile),"fonts")
    #glob "*.ttf", options,  (er, files)->
    #  (mapnik.registerFonts(path.join(options.cwd,file)) for file in files)
    #console.log Tile
    #@tiles = new Tile.Tile
    #@tiles.init xmlfile
    #@tiles.getTile 16,34779,21948, "/Users/thomashoffmann/Documents/Projects/maps/name.png"


    #console.log '->',xmlfile
    #@tileSize = 256
    #@merc = new SphericalMercator {size: @tileSize}
    #initOptions =
    #  size: @tileSize
    #  bufferSize: 256
    #@xmlfile = xmlfile
    #@mapOptions =
    #  base: path.dirname xmlfile
    #@pool = mapnikPool.fromString fs.readFileSync(xmlfile, 'utf8'), initOptions, @mapOptions
  router: (req, res, next) ->
    express = require 'express'
    route = express.Router()
    me = @
    #route.get 'mvt/:zoom/:x/:y.:ext(png|geojson)',  (req, res,next) => @onMVTRequest(req, res,next)
    route.get '/:zoom/:x/:y.:ext(png|geojson)',  (req, res,next) => @onFileRequest(req, res,next)




  onFileRequest: (req, res,next) ->
    folder = path.resolve __dirname,'..','..','..','..','tile-cache', req.params.zoom, req.params.x
    name = path.resolve folder, req.params.y
    name = name+'.'+req.params.ext
    req.folder = folder
    req.filename = name
    fs.exists  name, (exists) => @onFileExists(exists,req, res,next)
  onFileExists: (exists,req, res,next) ->
    if exists
      res.sendFile req.filename
    else
      #@onTileRequest req, res,next
      folder = path.resolve __dirname,'..','..','..','..','tile-cache', req.params.zoom, req.params.x
      name = path.resolve folder, req.params.y
      name = name+'.'+req.params.ext
      me = @
      mkdirp folder, (err) ->
        if err
        else
          me.xtile.getTile req.params.zoom, req.params.x, req.params.y,name
          res.sendFile name

  onTileRequestX: (req, res,next) ->
    #./tile sample.xml test.png 16 34775 21946
    folder = path.resolve __dirname,'..','..','..','..','tile-cache', req.params.zoom, req.params.x
    name = path.resolve folder, req.params.y
    name = name+'.'+req.params.ext
    xmlfile = path.resolve __dirname,'..','..','..','..','cartostyle','carto.xml'
    tile = spawn '/Users/thomashoffmann/Documents/Projects/node/tualo-carto/tile',[xmlfile,name,req.params.zoom,req.params.x,req.params.y]
    tile.on 'close', () ->
      mkdirp folder, (err) ->
        if err
        else
          #xmlfile = path.resolve __dirname,'..','..','..','..','cartostyle','carto.xml'
          #me.tiles.getTile req.params.zoom, req.params.x, req.params.y, name
          res.sendFile name

  onTileRequest: (req, res,next) ->
    if @map
      map = @map
    else
      @map = new Tile @tileSize,@tileSize #,'+init=epsg:4326'#,'+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over'
      @map.waitingRequest = []

      @map.dataSourcePath "/usr/local/lib/mapnik/input/"
      @map.fontPath "/Users/thomashoffmann/Documents/Projects/node/tualo-carto/fonts"
      @map.loadMap @xmlfile#fs.readFileSync(, 'utf8')
      map = @map
    if false #@map.status()==true
      console.log "wait"
      @map.waitingRequest.push [null, map,req, res,next]
    else
      @onAccuireMap(null, map,req, res,next)
    #@pool.acquire (err, map) => @onAccuireMap(err, map,req, res,next)
  onMapReadyAgain: () ->
    if @map.waitingRequest.length>0
      args = @map.waitingRequest.pop()
      @onAccuireMap.apply(@,args)
  onAccuireMap: (err, map, req, res, next) ->
    if err
      console.log 'error on acquire pool', err
      next()
    else
      #map.extent = @merc.bbox(parseInt(req.params.x), parseInt(req.params.y), parseInt(req.params.zoom), false, '900913')
      #im = new mapnik.Image map.width, map.height
      #opts =
      #  scale: 1
      #  scale_denominator: 1
      #map.isUse = true
      #map.render im,opts, (err,result) => @onRenderMap(err,result, req, res, next,im)
      folder = path.resolve __dirname,'..','..','..','..','tile-cache', req.params.zoom, req.params.x
      name = path.resolve folder, req.params.y
      name = name+'.'+req.params.ext
      mkdirp folder, (err) ->
        if err
        else
          console.log "here", name
          map.getTile parseInt(req.params.zoom),parseInt(req.params.x), parseInt(req.params.y),name
          res.sendFile name



  onRenderMap: (err,result, req, res, next,im) ->
    if err
      console.log 'error on render map'
      console.trace err
      next()
    else
      im.encode 'png24', (err, encoded) => @onEncodeMap(err, encoded,req, res, next)
  onEncodeMap: (err, encoded,req, res, next) ->
    if err
      console.log 'error on encode map', err
      next()
    else
      res.writeHead 200, {'Content-Type': 'image/png' }
      res.end encoded, 'binary'
      folder = path.resolve __dirname,'..','..','..','..','tile-cache', req.params.zoom, req.params.x
      name = path.resolve folder, req.params.y
      name = name+'.'+req.params.ext
      @onMapReadyAgain()
      mkdirp folder, (err) ->
        if err
        else
          fs.writeFile name,encoded, (err) ->
            if err
              console.log 'error while write file'
