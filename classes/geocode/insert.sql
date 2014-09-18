insert into nile_geocode (
  osm_id,
  city,
  name,
  street,
  postal_code,
  country,
  housenumber,
  address,
  accuracy,
  way
) values (
  {osm_id},
  {city},
  {name},
  {street},
  {postal_code},
  {country},
  {housenumber},
  {address},
  {accuracy},
  ST_GeomFromText({point},900913)
);
