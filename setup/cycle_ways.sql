create table cycle_ways as
SELECT
  ways.*
FROM ways, classes c
WHERE class_id = c.id
AND c.name in (
  'lane',
  'track',
  'bridleway',
  'footway',
  'byway',
  'cycleway',
  'living_street',
  'path',
  'residential',
  'primary'
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'track',
  'service'
  'steps',
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5'
);
