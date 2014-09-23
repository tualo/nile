create table gc_cities (name varchar(255) primary key,metaphone varchar(255));
delete from gc_cities;
insert
  into gc_cities (name,metaphone)
  select
    tags->'name',
    dmetaphone(tags->'name')
  from planet_osm_polygon
  where
    tags->'name'<>'' and
    tags->'boundary'='administrative'
  group by tags->'name';

create table gc_streets (name varchar(255) primary key,metaphone varchar(255));
insert into gc_streets (name,metaphone)
  select
    tags->'name',
    dmetaphone(tags->'name')
  from
    planet_osm_line
  where
    tags->'highway'<>'' and tags->'name'<>''
group by tags->'name';
