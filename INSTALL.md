#Install

##DB

At first you have to import all OSm data into your database.

  osm2pgsql -cGs -d map -S /usr/local/share/osm2pgsql/default.style --hstore-match-only ~/Downloads/your_file.osm.pbf

or

  nohup osm2pgsql -c -d map -C 24000 --flat-nodes=/var/lib/postgresql/nodes.cache --slim --number-processes 7 --hstore-all ~/planet/planet-latest.osm.pbf &
