{Command} = require 'tualo-commander'
path = require 'path'
fs = require 'fs'
Template = require 'tualo-template'
Server = require '../classes/server/server'
GISDB = require '../classes/server/classes/gisdb'
Geocoords = require 'geocoords'
md5 = require 'md5'
bigint = require 'big-integer'

module.exports =
class ExportStreets extends Command
  @commandName: 'exportstreets'
  @commandArgs: []
  @commandShortDescription: 'export streets and zip codes'
  @options: [
    {parameter: "--hint", description: "show hints"}

    {parameter: "-s, --sql", description: "enable the sql export"}
    {parameter: "-d, --debug [debug]", description: "enable the debug mode"}
    {parameter: "-n, --dbname [dbname]", description: "postgis db"}
  ]


  hint: () ->
    console.log """
    exporting streets and zip codes'.

    sample:
      bin/nile geojson \\
      --dbname nile \\
      > \\
      export.csv

    """

  action: (options,args) ->
    if options.hint
      @hint()
    else
      me = @
      @export options,args


  export: (options,args) ->

    me = @
    me.sqlexport = options.sql
    gisdbOptions =
      database: options.dbname||'nile'
      port: 5432
    db = new GISDB gisdbOptions
    db.connect () ->
      sql = '''
        select name, way, tags::hstore->'postal_code' as zipcode, tags from planet_osm_polygon where boundary = 'postal_code'
      '''
      db.query sql, (err,res) ->
        output = true
        if err
          console.error err
          output=false
        me.rows = res.rows
        db.disconnect()
        if me.sqlexport
          #
        else
          process.stdout.write ['id','strasse', 'zipcode', 'amtlicher_gemeindeschluessel', 'regionalschluessel', 'ort', 'landkreis', 'kreis_regionalschluessel'].join(';')
          process.stdout.write "\n"
        me.exportStreets(options,0)

  exportStreets:  (options,index) ->
    me = @
    if index<me.rows.length
      zipcode = me.rows[index].zipcode
      gisdbOptions =
        database: options.dbname||'nile'
        port: 5432
      db = new GISDB gisdbOptions
      db.connect () ->
        sql = '''
select
  z.street as strasse,
  z.zipcode,
  z.gemeinde as ort,
  z.ortsteil,
  gemeinden_tags::hstore->'de:amtlicher_gemeindeschluessel' as amtlicher_gemeindeschluessel,
  gemeinden_tags::hstore->'de:regionalschluessel' as regionalschluessel,
  kreis.name landkreis,
  kreis.tags::hstore->'de:regionalschluessel' as kreis_regionalschluessel
from
 (
  select
    y.id,
    y.street,
    y.zipcode,
    y.gemeinde,
    y.gemeinden_tags,
    y.ortsteil,
    y.way
  from (
    select

      x.id,
      x.street,
      x.zipcode,
      x.gemeinde,
      x.gemeinden_tags,
      ot.name as ortsteil,
      x.way
    from
      (
        select
          roads.id,
          roads.street,
          roads.zipcode,
          roads.way,
          gemeinden.name as gemeinde,
          gemeinden.tags as gemeinden_tags
        from
          (select * from plz_roads where zipcode='{zipcode}') as roads
          INNER JOIN
          (
            select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
            and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 8
          ) as gemeinden

          ON ST_Intersects(roads.way,gemeinden.way)
      ) x
      LEFT OUTER  JOIN
        ( select name,tags,way from planet_osm_polygon where boundary='administrative' and admin_level='10' ) as ot
      ON ST_Intersects(x.way,ot.way)
  ) y
  ) z

  LEFT OUTER  JOIN

  (
  select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
  and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 5
  ) as kreis
  ON ST_Intersects(z.way,kreis.way) and
  substring(z.gemeinden_tags::hstore->'de:amtlicher_gemeindeschluessel',1,5) = kreis.tags::hstore->'de:amtlicher_gemeindeschluessel'

group by

street,
zipcode,
gemeinde,
ortsteil,
landkreis,
amtlicher_gemeindeschluessel,
regionalschluessel,
gemeinden_tags::hstore->'de:amtlicher_gemeindeschluessel',
gemeinden_tags::hstore->'de:regionalschluessel',
kreis.tags::hstore->'de:regionalschluessel'

        '''
        sql_alt = '''
        select
        max(id) id,
        strasse,
        zipcode,
        amtlicher_gemeindeschluessel,
        regionalschluessel,
        ort,
        landkreis,
        kreis_regionalschluessel
        from (

          select
            roads.osm_id as id,
            roads.name as strasse,
            plz.zipcode,
            gemeinden.tags::hstore->'de:amtlicher_gemeindeschluessel' as amtlicher_gemeindeschluessel,
            gemeinden.tags::hstore->'de:regionalschluessel' as regionalschluessel,
            gemeinden.name as ort,
            kreis.name landkreis,
            kreis.tags::hstore->'de:regionalschluessel' as kreis_regionalschluessel
          from

            (select way,tags::hstore->'postal_code' as zipcode from planet_osm_polygon
            where boundary = 'postal_code' and tags::hstore->'postal_code' = '{zipcode}'
            ) as plz
            INNER JOIN

            (
            select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
            and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 8
            ) as gemeinden
            ON ST_Intersects(plz.way,gemeinden.way)

            LEFT OUTER  JOIN

            (
            select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
            and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 5
            ) as kreis
            ON ST_Intersects(plz.way,kreis.way) and
            substring(gemeinden.tags::hstore->'de:amtlicher_gemeindeschluessel',1,5) = kreis.tags::hstore->'de:amtlicher_gemeindeschluessel'

            INNER JOIN
            (select * from planet_osm_line where highway in (
              'secondary',
              'primary',
              'service',
              'steps',
              'residential',
              'living_street',
              'footway'
            ) and name <> '' ) as roads
            ON ST_Intersects(plz.way,roads.way)

          union

          select
            roads.osm_id as id,
            roads.name as strasse,
            plz.zipcode,
            gemeinden.tags::hstore->'de:amtlicher_gemeindeschluessel' as amtlicher_gemeindeschluessel,
            gemeinden.tags::hstore->'de:regionalschluessel' as regionalschluessel,
            gemeinden.name as ort,
            kreis.name landkreis,
            kreis.tags::hstore->'de:regionalschluessel' as kreis_regionalschluessel
          from

            (select way,tags::hstore->'postal_code' as zipcode from planet_osm_polygon
            where boundary = 'postal_code' and tags::hstore->'postal_code' = '{zipcode}'
            ) as plz
            INNER JOIN

            (
            select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
            and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 8
            ) as gemeinden
            ON ST_Intersects(plz.way,gemeinden.way)

            LEFT OUTER  JOIN

            (
            select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
            and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 5
            ) as kreis
            ON ST_Intersects(plz.way,kreis.way) and
            substring(gemeinden.tags::hstore->'de:amtlicher_gemeindeschluessel',1,5) = kreis.tags::hstore->'de:amtlicher_gemeindeschluessel'

            INNER JOIN
            (select * from planet_osm_roads where highway in (
              'secondary',
              'primary',
              'service',
              'steps',
              'residential',
              'living_street',
              'footway'
            ) and name <> '' ) as roads
            ON ST_Intersects(plz.way,roads.way)
        ) j

        group by

        strasse,
        zipcode,
        amtlicher_gemeindeschluessel,
        regionalschluessel,
        ort,
        landkreis,
        kreis_regionalschluessel

        '''

        # select tags,name from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel') limit 1
        db.query sql.replace('{zipcode}',zipcode).replace('{zipcode}',zipcode), (err,res) ->
          output = true
          if err
            console.error err
            output=false
            db.disconnect()
          else
            for row in res.rows

              if me.sqlexport
                sql = '''
                insert into strassenverzeichnis
                (
                  id,
                  strasse,
                  plz,
                  ort,
                  ortsteil,
                  amtlicher_gemeindeschluessel,
                  regionalschluessel,
                  landkreis,
                  kreis_regionalschluessel,
                  create_date
                ) values
                (
                  '{id}',
                  '{strasse}',
                  '{plz}',
                  '{ort}',
                  '{ortsteil}',
                  '{amtlicher_gemeindeschluessel}',
                  '{regionalschluessel}',
                  '{landkreis}',
                  '{kreis_regionalschluessel}',
                  now()
                )
                on duplicate key update
                  id = values(id),
                  strasse = values(strasse),
                  plz = values(plz),
                  ort = values(ort),
                  ortsteil = values(ortsteil),
                  amtlicher_gemeindeschluessel = values(amtlicher_gemeindeschluessel),
                  regionalschluessel = values(regionalschluessel),
                  landkreis = values(landkreis),
                  kreis_regionalschluessel= values(kreis_regionalschluessel)
                '''
                id = md5(row.strasse+row.zipcode+row.amtlicher_gemeindeschluessel)
                sql = sql.replace '{id}', id
                sql = sql.replace '{strasse}', row.strasse
                sql = sql.replace '{plz}', row.zipcode
                sql = sql.replace '{ort}', row.ort
                sql = sql.replace '{ortsteil}', row.ortsteil
                sql = sql.replace '{amtlicher_gemeindeschluessel}', row.amtlicher_gemeindeschluessel
                sql = sql.replace '{regionalschluessel}', row.regionalschluessel
                sql = sql.replace '{landkreis}', row.landkreis
                sql = sql.replace '{kreis_regionalschluessel}', row.kreis_regionalschluessel

                process.stdout.write sql+";"
                process.stdout.write "\n"
              else
                process.stdout.write [row.id,row.strasse, row.zipcode, row.amtlicher_gemeindeschluessel, row.regionalschluessel, row.ort, row.landkreis, row.kreis_regionalschluessel].join(';')
                #process.stdout.write [row.id,row.zipcode,row.name.replace(/;/,','),row.typ].join(';')
                process.stdout.write "\n"
            db.disconnect()
            me.exportStreets options,index+1
