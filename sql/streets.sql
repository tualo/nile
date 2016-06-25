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
    where boundary = 'postal_code' and tags::hstore->'postal_code' = '36466'
    ) as plz
    INNER JOIN

    (
    select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
    and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 8
    ) as gemeinden
    ON ST_Intersects(plz.way,gemeinden.way)

    INNER JOIN

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
    where boundary = 'postal_code' and tags::hstore->'postal_code' = '36466'
    ) as plz
    INNER JOIN

    (
    select tags,name,way from planet_osm_polygon where exist(tags,'de:amtlicher_gemeindeschluessel')
    and length(tags::hstore->'de:amtlicher_gemeindeschluessel')= 8
    ) as gemeinden
    ON ST_Intersects(plz.way,gemeinden.way)

    INNER JOIN

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
