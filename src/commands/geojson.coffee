{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
Template = require 'tualo-template'
Server = require '../classes/server/server'
GISDB = require '../classes/server/classes/gisdb'
Geocoords = require 'geocoords'

module.exports =
class GeoJSON extends Command
  @commandName: 'geojson'
  @commandArgs: []
  @commandShortDescription: 'export geojson'
  @options: [
    {parameter: "--hint", description: "show hints"}

    {parameter: "--zoom [zoom]", description: "enable use mml"}
    {parameter: "--x [x]", description: "enable use mml"}
    {parameter: "--y [y]", description: "enable use mml"}

    {parameter: "-m, --mml [mml]", description: "enable use mml"}
    {parameter: "-i, --id [id]", description: "mml id"}
    {parameter: "-c, --csv [csv]", description: "enable the csv export"}
    {parameter: "-d, --debug [debug]", description: "enable the debug mode"}
    {parameter: "-n, --dbname [dbname]", description: "postgis db"}
    {parameter: "-f, --field [field]", description: "id field"}
    {parameter: "-t, --filter [filter]", description: "filter"}
  ]


  hint: () ->
    console.log """
    exporting geojson.

    sample:
      bin/nile geojson \\
      --dbname nile \\
      --field "tags::hstore->'de:amtlicher_gemeindeschluessel'" \\
      --filter "tags::hstore->'de:amtlicher_gemeindeschluessel' like '03%'"> \\
      export.geojson && topojson --properties -- export.geojson > \\
      export.topojson && mv export.topojson ~/

    """

  action: (options,args) ->
    if options.hint
      @hint()
    else
      me = @
      gisdbOptions =
        database: options.dbname||'nile'
        port: 5432
      @db = new GISDB gisdbOptions

      @db.connect () ->
        if options.mml
          pathname = path.dirname options.mml
          mmlSource = fs.readFileSync options.mml
          mml = JSON.parse mmlSource
          #me.bbox = Geocoords.from4326To900913( Geocoords.getBbox options.zoom, options.x, options.y).slice(0,4)
          me.bbox = Geocoords.getBbox options.zoom, options.x, options.y
          if options.id
            (me.exportMML(item) for item in mml.Layer when item.id==options.id)
          else
            (me.exportMML(item,true) for item in mml.Layer)
        else
          @exportJSON options,args

  exportMML: (item,keep) ->
    if item.type=='posgis'
      me = @
      tolerance = 0
      console.log @bbox
      srid = "ST_SetSRID('BOX("+(@bbox[0]-tolerance)+" "+(@bbox[1]-tolerance)+","+(@bbox[2]+tolerance)+" "+(@bbox[3]+tolerance)+")'::box2d,4326) " #900913
      sql = 'select ST_ASGeoJSON('+item.Datasource.geometry_field+') j,* from '+item.Datasource.table + ' '
      sql+= ' where ST_Intersects(   '+item.Datasource.geometry_field+', '+srid+'  )'
      #select * FROM planet_osm_polygon where ST_Intersects(   way, ST_SetSRID('BOX(11 50,8 53)'::box2d,4326)) limit 10
      #bin/nile-geojson --dbname gnile --mml /Users/thomashoffmann/Documents/Projects/node/osm-bright/osm-bright/osm-bright.osm2pgsql.mml --id roads_high --zoom 12 --x 2139 --y 1332
      console.log '###',sql
      @db.query sql+' limit 10' , (err,res) ->
        if err
          console.log err
        else
          features=[]
          for i in res.rows
            if i.j
              properties = {}
              ( (properties[fld.name]=i[fld.name]) for fld in res.fields when fld.name!=item.Datasource.geometry_field and fld.name!='j')

              features.push
                "type":"Feature"
                "geometry": JSON.parse(i.j),
                "properties": properties
          fs.writeFileSync item.id+'.output.geojson','module.exports = '+JSON.stringify({"type":"FeatureCollection","features":features},null,0)

        if keep==true
          me.db.disconnect()

  exportJSON: (options,args) ->
    sql = '''
    select
      name,
      source,
      ST_ASGeoJSON(w) j
    from ( select name,
    '''
    sql += options.field||'tags::hstore->\'de:amtlicher_gemeindeschluessel\''
    sql += ''' source,   ST_Union(way) w from planet_osm_roads where '''
    sql+=options.filter||'tags::hstore->\'de:amtlicher_gemeindeschluessel\' like \'03______\''
    sql+=''' group by '''
    sql+=options.field||'tags::hstore->\'de:amtlicher_gemeindeschluessel\''
    sql+=''',name ) as G limit 100000 '''
    @db.query sql, (err,res) ->

      output = true
      if err
        console.error err
        output=false

      if output
        process.stdout.write '{"type": "FeatureCollection", "features": ['
        i=0
        csv=""
        for row in res.rows
          csv+='"'+row.name+'","'+row.source+'"'+"\n"
          if (i!=0)
            process.stdout.write ','
          process.stdout.write '{"type": "Feature","geometry":'+row.j+',"properties":{"name": "'+row.name.replace(/ä/g,'&auml;').replace(/ö/g,'&ouml;').replace(/ü/g,'&uuml;').replace(/Ä/g,'&Auml;').
          replace(/Ö/g,'&Ouml;').replace(/ß/g,'&szlig;').replace(/Ü/g,'&Uuml;')+'"},"id":"'+row.source+'"}'
          i++
        if options.csv
          fs.writeFileSync options.csv,csv
        process.stdout.write ']}'
      @db.disconnect()

  actionX: (options,args) ->
    if options.help
      @help()

    gisdbOptions =
      database: options.dbname||'nile'
      port: 5432
    db = new GISDB gisdbOptions
    db.connect () ->
      sql = '''
      select
        name,
        tags::hstore->'de:amtlicher_gemeindeschluessel' source,
        ST_ASGeoJSON( ST_MakePolygon(way) ) j
      from
        planet_osm_roads
      where tags::hstore->'de:amtlicher_gemeindeschluessel' <> ''
      and way && ST_MakeEnvelope(6.6545841239,51.2954150799,11.3132037822,55.0573747014, 4326)
      and st_isclosed(way)

      union

      select
        name,
        tags::hstore->'de:amtlicher_gemeindeschluessel' source,
        ST_ASGeoJSON( way ) j
      from
        planet_osm_roads
      where tags::hstore->'de:amtlicher_gemeindeschluessel' = '03453007'

      limit 100000
      '''
      sql = '''
      select
        name,
        source,
        ST_ASGeoJSON(w) j
      from (
      select
        name,
        tags::hstore->'de:amtlicher_gemeindeschluessel' source,
        ST_Union(way) w
      from
        planet_osm_roads
      where tags::hstore->'de:amtlicher_gemeindeschluessel' in ('11000000',
      '13059002',
      '13076159',
      '03241001',
      '03251047',
      '03352005',
      '03357002',
      '03361012',
      '03401000',
      '03403000',
      '03405000',
      '03451001',
      '03451002',
      '03451004',
      '03451005',
      '03451007',
      '03451008',
      '03452001',
      '03453001',
      '03453002',
      '03453003',
      '03453004',
      '03453005',
      '03453006',
      '03453007',
      '03453008',
      '03453009',
      '03453010',
      '03453011',
      '03453012',
      '03453013',
      '03455007',
      '03455014',
      '03455015',
      '03455020',
      '03455021',
      '03455025',
      '03455026',
      '03455027',
      '03457010',
      '03458001',
      '03458002',
      '03458003',
      '03458004',
      '03458005',
      '03458006',
      '03458007',
      '03458008',
      '03458009',
      '03458010',
      '03458011',
      '03458012',
      '03458013',
      '03458014',
      '03458015',
      '03460001',
      '03460002',
      '03460003',
      '03460004',
      '03460005',
      '03460006',
      '03460007',
      '03460008',
      '03460009',
      '03460010',
      '03461001',
      '03461002',
      '03461003',
      '03461004',
      '03461005',
      '03461006',
      '03461007',
      '03461008',
      '03461009',
      '04011000',
      '04012000',
      '05513000',
      '06438009',
      '07141006')
      group by tags::hstore->'de:amtlicher_gemeindeschluessel',name
      ) as G
      limit 100000
      '''

      db.query sql, (err,res) ->
        output = true
        if err
          console.error err
          output=false

        if output
          process.stdout.write '{"type": "FeatureCollection", "features": ['
          i=0
          for row in res.rows
            if (i!=0)
              process.stdout.write ','
            process.stdout.write '{"type": "Feature","geometry":'+row.j+',"properties":{"name": "'+row.name+'"},"id":"'+row.source+'"}'
            i++

          process.stdout.write ']}'
        db.disconnect()
