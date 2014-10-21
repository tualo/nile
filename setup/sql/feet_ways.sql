create table feet_ways as
SELECT
  ways.*
FROM ways, classes c
WHERE class_id = c.id
AND c.name in (
  'lane',
  'track',
  'byway',
  'bridleway',
  'footway',
  'living_street',
  'path',
  'residential',
  'track',
  'service'
  'steps',
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5'
);
