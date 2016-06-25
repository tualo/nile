
create table streets (
  ID  SERIAL PRIMARY KEY,
  streetname varchar(255) not null,
  postal_code varchar(255) not null,
  way geometry(LineString,900913) not null,
  adm_6 varchar(255),
  adm_7 varchar(255),
  adm_8 varchar(255),
  adm_9 varchar(255),
  adm_10 varchar(255),
  adm_11 varchar(255)
);


insert into streets (streetname,postal_code,way)
select
  str.name,
  pc.postal_code,
  str.way
from
(
select
  name,highway as typ, way
from
  planet_osm_roads where highway <> '' and name <>''
union
select
  name,highway as typ, way
from
  planet_osm_line where highway <> '' and name <>''
) str,
(
select
  planet_osm_polygon.way,
  planet_osm_polygon.tags->'postal_code' postal_code
from
  planet_osm_polygon
where
  planet_osm_polygon.tags->'postal_code' <> ''
) pc
where str.way && pc.way;



update streets set adm_6 = (
select
  max(name) n
from
  planet_osm_polygon
where
  admin_level in ('6') and boundary='administrative'
  and ST_Intersects(planet_osm_polygon.way, streets.way)
);

update streets set adm_7 = (
select
  max(name) n
from
  planet_osm_polygon
where
  admin_level in ('7') and boundary='administrative'
  and ST_Intersects(planet_osm_polygon.way, streets.way)
);

update streets set adm_8 = (
select
  max(name) n
from
  planet_osm_polygon
where
  admin_level in ('8') and boundary='administrative'
  and ST_Intersects(planet_osm_polygon.way, streets.way)
);

update streets set adm_9 = (
select
  max(name) n
from
  planet_osm_polygon
where
  admin_level in ('9') and boundary='administrative'
  and ST_Intersects(planet_osm_polygon.way, streets.way)
);

update streets set adm_10 = (
select
  max(name) n
from
  planet_osm_polygon
where
  admin_level in ('10') and boundary='administrative'
  and ST_Intersects(planet_osm_polygon.way, streets.way)
);


create or replace view streetlist as
SELECT streetname,postal_code,
 CASE
      WHEN adm_8<>'' THEN adm_8
      WHEN adm_7<>'' THEN adm_7
      ELSE adm_6
 END as city,
 CASE
      WHEN adm_9<>'' THEN adm_9
      WHEN adm_10<>'' THEN adm_10
      ELSE adm_11
 END as district
FROM streets;
