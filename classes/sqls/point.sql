SELECT
  ST_AsGeoJSON(
      ST_TransScale(##way_column, ##transscale),
      0
  ) AS data,
z_order,
  hstore2json(cast(tags as hstore)) AS tags,
  Null AS reprpoint
FROM
  ##prefix_point
WHERE
  ST_Intersects(##way_column , ##srid )
  ##cond
