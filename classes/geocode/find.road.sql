select
  tags->'name' as name,
  highway,
  boundary,
  place,
  difference(tags->'name','$search') as diff,
  levenshtein(tags->'name','$search') as lv,
  way
from
  planet_osm_line
where
  dmetaphone(tags->'name') like dmetaphone('$search')
  and ST_Intersects(way, ST_GeomFromText('$boundary',900913))
