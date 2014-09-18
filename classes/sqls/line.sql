SELECT
  ST_AsGeoJSON(
    ST_TransScale(
      ST_Intersection(##way_column, ##srid),
      ##transscale
    )
    , 0
  ) AS data,
z_order,

	hstore2json( cast(tags as hstore) ) as tags,
	Null AS reprpoint,
  Null As bbox
FROM
  ##prefix_line
WHERE
  ST_Intersects(  ##way_column, ##srid )
  ##cond
