create extension fuzzystrmatch;

/*
create index idx_poly_exact_addr on planet_osm_polygon using gist(way) where
  tags->'addr:street' is not null
  and tags->'addr:housenumber' is not null;
*/

create table gc_cities (name varchar(255) primary key,metaphone varchar(255));
delete from gc_cities;
insert
  into gc_cities (name,metaphone)
  select
    tags->'name',
    metaphone(tags->'name',10)
  from planet_osm_polygon
  where
    tags->'name'<>'' and
    boundary='administrative'
  group by tags->'name';

create table gc_streets (name varchar(255) primary key,metaphone varchar(255));
delete from gc_streets;
insert into gc_streets (name,metaphone)
  select
    name,
    metaphone(substring(name,1,100),10)
  from
    planet_osm_line
  where
    highway is not null and  name<>''
group by  name ;


create index idx_poly_boundary on planet_osm_polygon using gist(way) where boundary is not null;
create index idx_poly_city_boundary on planet_osm_polygon(boundary,name) where boundary is not null and name is not null;
create index idx_poly_name on planet_osm_polygon using gist(name) where name is not null;
create index idx_line_name_highway on planet_osm_line(highway,name) where highway is not null and name is not null;
create index idx_mp_gc_cities on gc_cities(metaphone);
create index idx_mp_gc_streets on gc_streets(metaphone);
