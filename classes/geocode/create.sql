create table nile_geocode (
  osm_id bigint,
  city text,
  name text,
  street text,
  postal_code text,
  country text,
  housenumber text,
  address text,
  accuracy integer,
  way geometry(Point,900913)
);
