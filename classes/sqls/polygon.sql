select
  ST_AsGeoJSON(
    ST_TransScale(
        ST_ForceRHR(
          ST_Intersection( ##way_column, ##srid )
        )
    ,##transscale)
  , 0 ) as data,

  z_order,

  hstore2json( cast(tags as hstore) ) AS tags,
  ST_AsGeoJSON(
    ST_TransScale(
      ST_ForceRHR(
        ST_PointOnSurface( ##way_column )
      )
    ,##transscale)
  ,0) AS reprpoint,
  ST_AsGeoJSON(
    ST_TransScale(
      ST_Envelope(##way_column)
    ,##transscale)
  ) as bbox
FROM ##prefix_polygon
WHERE
  ST_Intersects( ##way_column, ##srid )
  AND way_area > ##way_area
  AND ST_Area(##way_column) > ##way_area_buffer
  ##cond
