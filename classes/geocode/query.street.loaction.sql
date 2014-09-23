select
  ST_AsGeoJSON(planet_osm_line.way) geom,
  planet_osm_line.tags
from
  (
    select
      ST_AsText(way) txt
    from
      planet_osm_polygon
    where
      tags->'boundary'='administrative'
      and tags->'name'='$city'

  ) As area
  join
  planet_osm_line on ST_Intersects(planet_osm_line.way,area.way)
where
  planet_osm_line.tags->highway <> ''
  and planet_osm_line.tags->'name' in ($streets)
