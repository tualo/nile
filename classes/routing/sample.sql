CREATE TABLE edge_table (
id serial,
dir character varying,
source integer,
target integer,
cost double precision,
reverse_cost double precision,
x1 double precision,
y1 double precision,
x2 double precision,
y2 double precision,
the_geom geometry
);

SELECT seq, id1 AS node, id2 AS edge, cost FROM pgr_dijkstra('SELECT gid AS id, source::integer, target::integer, length As cost, 'x' as Y
  FROM ways, classes c WHERE class_id = c.id AND class_id != 111', 13386, 3060, false, false);

SELECT seq, id1 AS node, id2 AS edge, cost FROM pgr_dijkstra('SELECT gid AS id, source::integer, target::integer, length As cost, 'x' as Y
  FROM ways, classes c WHERE class_id = c.id AND class_id != 111', 13386, 3060, false, false);


CREATE OR REPLACE FUNCTION WhatAmINear(lat float8, lon float8, radius_mi float8, num int DEFAULT 10)
    RETURNS SETOF "ways" AS
$body$
SELECT *
FROM "ways"
WHERE ST_Distance_Sphere(the_geom, ST_MakePoint(lon, lat)) <= radius_mi * 1609.34
ORDER BY ST_Distance_Sphere(the_geom, ST_MakePoint(lon, lat)) asc
LIMIT num;
$body$
LANGUAGE sql VOLATILE;



CREATE OR REPLACE FUNCTION pgr_dijkstra(
                IN tbl varchar,
                IN source integer,
                IN target integer,
                OUT seq integer,
                OUT gid integer,
                OUT geom geometry
        )
        RETURNS SETOF record AS
$BODY$
DECLARE
        sql     text;
        rec     record;
BEGIN
        seq     := 0;
        sql     := 'SELECT gid,the_geom FROM ' ||
                        'pgr_dijkstra(''SELECT gid as id, source::int, target::int, '
                                        || 'length::float AS cost FROM '
                                        || quote_ident(tbl) || ''', '
                                        || quote_literal(source) || ', '
                                        || quote_literal(target) || ' , false, false), '
                                || quote_ident(tbl) || ' WHERE id2 = gid ORDER BY seq';

        FOR rec IN EXECUTE sql
        LOOP
                seq     := seq + 1;
                gid     := rec.gid;
                geom    := rec.the_geom;
                RETURN NEXT;
        END LOOP;
        RETURN;
END;
$BODY$
LANGUAGE 'plpgsql' VOLATILE STRICT;


--
--DROP FUNCTION pgr_fromAtoB(varchar, double precision, double precision,
--                           double precision, double precision);

CREATE OR REPLACE FUNCTION pgr_fromAtoB(
                IN tbl varchar,
                IN x1 double precision,
                IN y1 double precision,
                IN x2 double precision,
                IN y2 double precision,
                OUT seq integer,
                OUT gid integer,
                OUT name text,
                OUT heading double precision,
                OUT cost double precision,
                OUT geom geometry
        )
        RETURNS SETOF record AS
$BODY$
DECLARE
        sql     text;
        rec     record;
        source integer;
        target integer;
        point integer;

BEGIN
	-- Find nearest node
	EXECUTE 'SELECT id::integer FROM ways_vertices_pgr
			ORDER BY the_geom <-> ST_GeometryFromText(''POINT('
			|| x1 || ' ' || y1 || ')'',4326) LIMIT 1' INTO rec;
	source := rec.id;

	EXECUTE 'SELECT id::integer FROM ways_vertices_pgr
			ORDER BY the_geom <-> ST_GeometryFromText(''POINT('
			|| x2 || ' ' || y2 || ')'',4326) LIMIT 1' INTO rec;
	target := rec.id;

	-- Shortest path query (TODO: limit extent by BBOX)
        seq := 0;
        sql := 'SELECT gid, the_geom, name, cost, source, target,
				ST_Reverse(the_geom) AS flip_geom FROM ' ||
                        'pgr_dijkstra(''SELECT gid as id, source::int, target::int, '
                                        || 'length::float AS cost FROM '
                                        || quote_ident(tbl) || ''', '
                                        || source || ', ' || target
                                        || ' , false, false), '
                                || quote_ident(tbl) || ' WHERE id2 = gid ORDER BY seq';

	-- Remember start point
        point := source;

        FOR rec IN EXECUTE sql
        LOOP
		-- Flip geometry (if required)
		IF ( point != rec.source ) THEN
			rec.the_geom := rec.flip_geom;
			point := rec.source;
		ELSE
			point := rec.target;
		END IF;

		-- Calculate heading (simplified)
		EXECUTE 'SELECT degrees( ST_Azimuth(
				ST_StartPoint(''' || rec.the_geom::text || '''),
				ST_EndPoint(''' || rec.the_geom::text || ''') ) )'
			INTO heading;

		-- Return record
                seq     := seq + 1;
                gid     := rec.gid;
                name    := rec.name;
                cost    := rec.cost;
                geom    := rec.the_geom;
                RETURN NEXT;
        END LOOP;
        RETURN;
END;
$BODY$
LANGUAGE 'plpgsql' VOLATILE STRICT;



SELECT
gid,
x1,
y1,
length,
name,
ST_Distance_Sphere(the_geom, ST_MakePoint(11.0343049912,50.9666443000)) dist
FROM "ways"
WHERE ST_Distance_Sphere(the_geom, ST_MakePoint(11.0343049912,50.9666443000)) <= 0.5 * 1609.34
ORDER BY ST_Distance_Sphere(the_geom, ST_MakePoint( 11.0343049912, 50.9666443000)) asc



SELECT
gid,
x1,
y1,
length,
name,
ST_DWithin(the_geom, ST_SetSRID(ST_MakePoint( 11.0343049912, 50.9666443000),4269),100) w
FROM "ways"
WHERE ST_DWithin(the_geom, ST_SetSRID(ST_MakePoint( 11.0343049912, 50.9666443000),4269),100)
ORDER BY ST_DWithin(the_geom, ST_SetSRID(ST_MakePoint( 11.0343049912, 50.9666443000),4269),100) asc


WHERE ST_DWithin(ST_Transform(the_geom,4269), ST_Transform(ST_MakePoint( 11.0343049912, 50.9666443000),4269), 100)

11.0343049912, 50.9666443000,12.0343049912, 53.9666443000

SELECT seq, id1 AS node, id2 AS edge, cost FROM pgr_dijkstra('
                SELECT gid AS id,
                         source::integer,
                         target::integer,
                         length As cost
                        FROM ways, classes c
                        WHERE class_id = c.id AND class_id != 111',
                13386, 3060, false, false);
