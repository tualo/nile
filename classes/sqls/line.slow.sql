SELECT
  ST_AsGeoJSON(
    ST_TransScale(
      ST_Intersection(##way_column, ##srid),
      ##transscale
    )
    , 0
  ) AS data,

  hstore2json( tags ) as tags,
  Null AS reprpoint
FROM
  (
    SELECT
      (
        ST_Dump(
          ST_Multi(
            ST_SimplifyPreserveTopology(
              ST_LineMerge(##way_column), ##buffer
            )
          )
        )
      ).geom AS ##way_column,

      tags
    FROM
      (
        SELECT
          ST_Union(##way_column) AS ##way_column,


          tags
        FROM
          ##prefix_line
        WHERE
          ST_Intersects(  ##way_column, ##srid )
          ##cond
        GROUP BY


          tags
      ) p
  ) p
