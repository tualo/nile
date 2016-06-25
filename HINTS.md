#OSX

## Install

Start postgres manually:
```
brew install postgres
brew install postgis
brew install osm2pgsql
brew install osmosis
export POSTGRESQL_PGXS=/usr/local/Cellar/postgresql/9.4.4/lib/pgxs/src/makefiles/pgxs.mk
```

Start postgres manually:
```
postgres -D /usr/local/var/postgres

bin/nile geojson \
  --dbname gnile \
  --field "tags::hstore->'de:amtlicher_gemeindeschluessel'" \
  --filter "tags::hstore->'de:amtlicher_gemeindeschluessel' like '03%'"> \
  export.geojson && topojson --properties -- export.geojson > \
  export.topojson && mv export.topojson ~/

```
