# nile

 nile (n(ode )tile) aims to be a tileserver using [NodeJS](http://nodejs.org/).

# Requirements

  Nile uses osm - postgis database for rendering, therefor you need a

  * PostgreSQL with PostGIS
  * imported OpenStreetMap data (see [Installation](http://wiki.openstreetmap.org/wiki/PostGIS/Installation))
  * Cairo, needed for [node-canvas](https://github.com/Automattic/node-canvas)

  You have to import the OpenStreetMap with the --hstore-match-only or --hstore-all
  option. Nile uses the tags-column for filtering.

# Install

  You can simply install nile with

      npm install nile -g

  Atfer that you can set up your service by creating a config file a sample
  configuration can be found at config/sample.json. At the startup the service
  searches at the folowing paths for a config file.

  * /etc/nile/config.json
  * <program-path>/config.json
  * <program-path>/config/config.json
  * <program-path>/config/sample.json
