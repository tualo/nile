select
  tags->'name' as name,
  highway,
  boundary,
  place,
  difference(tags->'name','$search') as diff,
  levenshtein(tags->'name','$search') as lv,
  ST_AsText(way) way
from
  planet_osm_polygon
where
  dmetaphone(tags->'name') like dmetaphone('$search')
