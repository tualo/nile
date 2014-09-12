
select
  tags->'postal_code' as postal_code
from
  planet_osm_polygon
where
  boundary = 'postal_code'
  and
  ST_Intersects(way,
    ST_SetSRID(
      ST_GeomFromText({point}),
      900913
    )
  )
