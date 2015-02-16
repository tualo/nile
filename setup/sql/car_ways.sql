create table car_ways as
SELECT
  ways.*
FROM ways, classes c
WHERE class_id = c.id
AND c.name in (
  'lane',
  'living_street',
  'opposite',
  'opposite_lane',
  'residential',
  'motorway',
  'motorway_junction',
  'motorway_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'trunk',
  'trunk_link',
  'unclassified'
);
select pgr_createVerticesTable('car_ways');
