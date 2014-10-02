create extension fuzzystrmatch;
create index idx_poly_boundary on planet_osm_polygon using gist(way) where boundary is not null;


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
    tags->'name',
    metaphone(tags->'name',10)
  from
    planet_osm_line
  where
    tags->'highway'<>'' and tags->'name'<>''
group by tags->'name';
