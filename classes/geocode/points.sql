select
  osm_id,
  tags->'addr:city' as city,
  tags->'addr:name' as name,
  tags->'addr:street' as street,
  tags->'postal_code' as postal_code,
  tags->'addr:postcode' as postcode,
  tags->'addr:country' as country,
  tags->'addr:housenumber' as housenumber,
  ST_AsText(way) point
from
  planet_osm_point
where
  tags->'addr:housenumber' <> ''

explain select
  *
from
  ( select tags->'name' strasse,way from planet_osm_line where highway<>'') r,
  ( select tags->'name' ort,way from planet_osm_polygon where boundary='administrative') b
where ST_Intersects(r.way,b.way)

explain select
  *
from
  ( select tags->'name' strasse,way from planet_osm_line where tags->'highway'<>'') r,
  ( select tags->'name' ort,way from planet_osm_polygon where tags->'boundary'='administrative') b
where ST_Intersects(r.way,b.way)
