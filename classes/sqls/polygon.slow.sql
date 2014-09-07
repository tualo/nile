select
  ST_AsGeoJSON(
    ST_TransScale(
        ST_ForceRHR(
          ST_Intersection( ##way_column, ##srid )
        )
    ,##transscale)
  , 0 ) as data,


  hstore2json( tags ) AS tags,
  ST_AsGeoJSON(
    ST_TransScale(
      ST_ForceRHR(
        ST_PointOnSurface( ##way_column )
      )
    ,##transscale)
  ,0) AS reprpoint
from
  (
    select
      (
        ST_Dump(
          ST_Multi(
            ST_SimplifyPreserveTopology(
              ST_Buffer(##way_column ,-##buffer)
              , ##buffer
            )
          )
        )
      ).geom as ##way_column,

      tags
    from
      (
        SELECT
          ST_Union(##way_column) AS ##way_column,


          tags
        FROM
          (
            SELECT
              ST_Buffer(##way_column, ##buffer) AS ##way_column,

              tags
            FROM ##prefix_polygon
            WHERE
              ST_Intersects( ##way_column, ##srid )
              AND way_area > ##way_area
              ##cond
          ) p
        GROUP BY

          tags
      ) p
    WHERE
      ST_Area(##way_column) > ##way_area_buffer
    ORDER BY
      ST_Area(##way_column)
  ) p
