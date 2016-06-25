# route for express


path = require 'path'
mkdirp = require 'mkdirp'
fs = require 'fs'
sass = require 'node-sass'
Template = require 'tualo-template'
Canvas = require 'canvas'
NileTile = require 'nile-tile'
Geocoords = require 'geocoords'
mapnik = require 'mapnik'
SphericalMercator = require 'sphericalmercator'
coffee = require 'coffee-script'
MSS = require '../classes/mss'
MSSRenderer = require '../classes/mssrenderer'

mapnik.register_default_input_plugins()
mapnik.register_default_fonts()

mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-Semibold.ttf')
mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-BoldItalic.ttf')
mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-Bold.ttf')
mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-Italic.ttf')
mapnik.registerFonts('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/fonts/OpenSans-SemiboldItalic.ttf')

mapnikPool = require('mapnik-pool')(mapnik)
pool = mapnikPool.fromString(fs.readFileSync('/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/project.xml', 'utf8'),{ size: 512,bufferSize:1024 },{base: '/Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto' })

tilelive = require('tilelive')
require('tilelive-mapnik').registerProtocols(tilelive)



module.exports =
class Tile
  constructor: (mssfile) ->

    @basePath = path.join __dirname,'..','..','..','..','styles','default'
    @styleData = require path.join(@basePath,'data')
    @mss = {}
    for name of @styleData
      data = fs.readFileSync( path.join(@basePath,@styleData[name].style) )
      parser = new MSS(data.toString())
      parser.parse()
      @apply @mss, parser

  getImage: (data,size) ->
    if typeof size=='undefined'
      size = 256


    renderer = new MSSRenderer @mss, data
    renderer.render size
    renderer

  apply: (a,b) ->
    for n of b
      if typeof a[n]=='undefined'
        a[n] = b[n]
      else
        @apply a[n], b[n]
    a

  queryTile: (db,zoom,x,y,cb) ->

    bbox = Geocoords.from4326To900913( Geocoords.getBbox zoom, x, y).slice(0,4)
    list = []
    result =
      Map:
        lbbox: bbox,#[0,0,20000,20000]
        bbox: bbox,#[0,0,20000,20000]


      'roads::outline': []
      roads: []
    for name of @styleData

      #console.log(name,@styleData)

      result[name] = []
      conditions = []
      variaticValues = []
      if typeof @styleData[name].variaticValues != 'undefined'
        variaticValues = @styleData[name].variaticValues
      values = []
      valueColumn = ''
      valueTable = ''
      notNull = false
      for zoomindex in [1..zoom]
        if typeof @styleData[name].queries.zoom[zoomindex]!='undefined'
          if typeof @styleData[name].queries.zoom[zoomindex].table=='string'
            valueTable = @styleData[name].queries.zoom[zoomindex].table
          if typeof @styleData[name].queries.zoom[zoomindex].column=='string'
            valueColumn = @styleData[name].queries.zoom[zoomindex].column
          if typeof @styleData[name].queries.zoom[zoomindex].values=='object'
            values = @styleData[name].queries.zoom[zoomindex].values
          if typeof @styleData[name].queries.zoom[zoomindex].notNull=='boolean'
            notNull = @styleData[name].queries.zoom[zoomindex].notNull
          if typeof @styleData[name].queries.zoom[zoomindex].additionalValues=='object'
            values = values.concat(@styleData[name].queries.zoom[zoomindex].additionalValues)

      vvalues = []
      for val in values
        vvalues.push val
        for vname in variaticValues
          vvalues.push val+vname

      if notNull==true
        conditions = ['"'+valueColumn+'" is not null']
      else
        conditions = ['"'+valueColumn+'" in (\''+vvalues.join('\',\'')+'\')']
      #      console.log valueTable,conditions
      options =
        name: name
        valueTable: valueTable
        conditions: conditions
      list.push options
    @processQuery db,bbox,list,0,cb,result

  processQuery: (db,bbox,list,index,cb,result) ->
    if index < list.length
      name = list[index].name
      conditions = list[index].conditions
      valueTable = list[index].valueTable
      noTolerance = if typeof list[index].noTolerance=='undefined' then false else list[index].noTolerance

      me = @
      console.log '******'
      @qline db, bbox,valueTable, conditions,noTolerance, (err,res) ->
        console.log 'q',err,res
        if err

        else

          result[name+'::outline'] = res
          result[name] = res
          if res.length>0
            result.Map.bbox = JSON.parse(res[0].bbox).coordinates[0]

        me.processQuery db,bbox,list,index+1,cb,result
    else
      cb null, result

  qline: (db, bbox,table,conditions,noTolerance, cb) ->

    if typeof conditions=='undefined'
      conditions=[]
    sconditions = conditions.join(' and ')
    if sconditions!=''
      sconditions = ' and '+sconditions
    sql = '
    SELECT
      ST_AsGeoJSON(
        ST_TransScale(
          ST_Intersection({way_column}, {srid})
        ,{transscale})
      ,0 ) AS data,
      name,
      highway,
      "natural",
      tunnel,
      water,
      waterway,
      building,
      bridge,
      z_order,
      hstore2json(tags) tags,
      ST_AsGeoJSON( ST_TransScale(
        {srid}
      ,{transscale}),0 ) AS  bbox

    FROM
      {table}
    WHERE
      ST_Intersects(   {way_column}, {srid}  )
      {conditions}
    ORDER BY z_order
    '
    granularity = 10000
    tolerance = (bbox[2]-bbox[0])
    if noTolerance
      tolerance = -0.02*(bbox[2]-bbox[0])

    options =
      prefix: 'planet_osm'
      way_column: 'way'
      tolerance: tolerance
      granularity: granularity
      table: table
      conditions: sconditions
      transscale: ''+(-bbox[0])+', '+(-bbox[1])+', '+granularity/(bbox[2]-bbox[0])+', '+granularity/(bbox[3]-bbox[1])+''
      #transscalebox: '0,0, '+granularity/(bbox[2]-bbox[0])+', '+granularity/(bbox[3]-bbox[1])+''
      srid: "ST_SetSRID('BOX3D("+(bbox[0]-tolerance)+" "+(bbox[1]-tolerance)+","+(bbox[2]+tolerance)+" "+(bbox[3]+tolerance)+")'::box3d,900913) "

    box900913 =  Geocoords.from4326To900913 bbox
    template = new Template sql
    sql = template.render options
    console.log sql

    db.query sql, (err,res) ->
      console.log 'query',err, res
      if err
        console.log err
        error 'query', err
        cb error
      else
        console.log 'qline', res
        result = []
        (row.data = JSON.parse(row.data) for row in res.rows)
        for row in res.rows
          if row.tags==null
            row.tags = {}
          else
            row.tags = JSON.parse row.tags
          if typeof row.tags.lanes=='undefined'
            row.tags.lanes = 1
          result.push(row)
        cb null,result


  rad2deg: (angle) ->
    angle/(Math.PI/180.0)
  projectMercToLat: (v) ->
    @rad2deg Math.atan(Math.sinh(v))

  router: (req, res) ->
    express = require 'express'
    route = express.Router()
    me = @
    route.get '/:zoom/:x/:y.:ext',  (req, res) ->
      if false
        tilelive.load 'mapnik:///Users/thomashoffmann/Documents/Projects/node/openstreetmap-carto/project.xml', (err, source) ->
          if (err)
            console.log err
          else
            console.log parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y)
            source.getTile parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y), (err, tile, headers) ->
              console.log 'getTile',err,tile,headers
              res.writeHead 200, {'Content-Type': 'image/png' }
              res.end tile, 'binary'
      if true

        merc = new SphericalMercator {size: 512}
        console.log parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y)
        pool.acquire (err, map)->
          console.log parseInt(req.params.zoom), parseInt(req.params.x), parseInt(req.params.y)
          if err
            console.log 'mapnik renderer',err
            res.end()
          else
            map.extent = merc.bbox(parseInt(req.params.x), parseInt(req.params.y), parseInt(req.params.zoom), false, '900913')
            im = new mapnik.Image map.width, map.height

            map.render im,{scale: 1,scale_denominator: 1}, (err, result)->
              if err
                console.log 'mapnik renderer',err
                res.end()
              else
                im.encode 'png24', (err, encoded)->
                  res.writeHead 200, {'Content-Type': 'image/png' }
                  res.end encoded, 'binary'





      if false
        console.log 'get ',req.params.zoom, req.params.x, req.params.y
        me.queryTile req.gisdb, req.params.zoom, req.params.x, req.params.y, (err,dbResult) ->
          canvas = new Canvas 256, 256
          niletile = new NileTile
          console.log dbResult
          niletile.setGeoJSON dbResult
          #niletile.setCSS fs.readFileSync(program.style)
          niletile.on 'ready', (png) ->
            res.writeHead 200, {'Content-Type': 'image/png' }
            res.end buf, 'binary'
          niletile.render canvas, req.params.x, req.params.y, req.params.zoom


      if false
        folder = path.join(__dirname,'..','..','..','..','tile-cache',path.basename(me.basePath),req.params.zoom,req.params.x)
        file = path.join(folder,req.params.y+'.png')
        fs.exists file, (exists) ->
          if exists
            fs.readFile file, (err,buf) ->
              if err
                res.send "Error"
              else
                res.writeHead 200, {'Content-Type': 'image/png' }
                res.end buf, 'binary'
          else
            me.queryTile req.gisdb, req.params.zoom, req.params.x, req.params.y, (err,dbResult) ->
              #console.log err,dbResult
              renderer = me.getImage dbResult, 512
              renderer.toBuffer (err,buf) ->
                res.writeHead 200, {'Content-Type': 'image/png' }
                res.end buf, 'binary'

                mkdirp folder, (err) ->
                  if err
                  else
                    fs.writeFile file,buf, (err) ->
                      if err
                        error 'route error',err


    route
