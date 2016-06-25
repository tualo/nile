@natural =
  style: 'natural.mss'
  variaticValues: []
  queries:
    zoom:
      '8':
        table: 'planet_osm_polygon'
        column: 'natural'
        values: [
          'wood',
          'forest',
          'water'
        ]
@water =
  style: 'water.mss'
  variaticValues: []
  queries:
    zoom:
      '8':
        table: 'planet_osm_polygon'
        column: 'water'
        values: [
          'river',
          'lake',
          'reservoir',
          'fish_pond',
          'pond'
        ]
@waterway =
  style: 'waterway.mss'
  variaticValues: []
  queries:
    zoom:
      '8':
        table: 'planet_osm_polygon'
        column: 'waterway'
        values: [
          #'drain'
          'lock'
          'pond'
          'weir'
          'reservoir'
          #'ditch'
          'dam'
          'river'
          #'bog'
          'riverbank'
          'stream'
          'lake'
        ]
#@building =
#  style: 'building.mss'
#  variaticValues: []
#  queries:
#    zoom:
#      '12':
#        table: 'planet_osm_polygon'
#        column: 'building'
#        notNull: true
        #values: [
        #  'townhall'
        #  'commercial'
        #  'warehouse'
        #  'house'
        #  'residential'
        #  'hospital'
        #
        #]

@rail =
  style: 'rail.mss'
  variaticValues: ['_link']
  queries:
    zoom:
      '1':
        table: 'planet_osm_roads'
        column: 'railway'
        values: [
          'rail'
        ]
      '13':
        table: 'planet_osm_line'
        column: 'railway'
        values: [
          'rail'
        ]
@roads =
  style: 'roads.mss'
  variaticValues: ['_link']
  queries:
    zoom:
      '1':
        table: 'planet_osm_roads'
        column: 'highway'
        values: [
          'motorway'
          'trunk'
        ]
      '7':
        table: 'planet_osm_roads'
        column: 'highway'
        values: [
          'motorway'
          'trunk'
          'primary'
          'secondary'
        ]
      '11':
        table: 'planet_osm_line'
        column: 'highway'
        values: [
          'motorway'
          'trunk'
          'primary'
          'secondary'
        ]
      '12':
        additionalValues: [
          'tertiary'
        ]
      '13':
        additionalValues: [
          'residential'
        ]
      '14':
        additionalValues: [
          'living_street'
        ]
      '15':
        additionalValues: [
          'service'
          'footway'
          'track'
        ]
@roadtext =
  style: 'roadtext.mss'
  variaticValues: []
  noTolerance: true
  queries:
    zoom:
      '13':
        table: 'planet_osm_line'
        column: 'highway'
        values: [
          'residential'
        ]
      '14':
        additionalValues: [
          'living_street'
        ]
      '15':
        additionalValues: [
          'service'
          'footway'
          'track'
        ]
