#Install

##DB

At first you have to import all OSm data into your database.

  osm2pgsql -cGs -d map -S /usr/local/share/osm2pgsql/default.style --hstore-match-only ~/Downloads/your_file.osm.pbf

or

  nohup osm2pgsql -c -d map -C 24000 --flat-nodes=/var/lib/postgresql/nodes.cache --slim --number-processes 7 --hstore-all ~/planet/planet-latest.osm.pbf &


CREATE EXTENSION postgis;
CREATE EXTENSION pgrouting;
CREATE EXTENSION hstore;


osm2pgrouting -file thueringen-latest.osm  -dbname routing -conf mapconfig.xml -user postgres -passwd ****

From Sources

# build on osx mavericks
## Postgres
Install postgres

  brew install postgres
  brew install postgis

## pgrouting
Download pgrouting, remove the -fno-delete-null-pointer-checks flag, this
leads to an error during compilation.

  wget https://github.com/pgRouting/pgrouting/archive/v2.0.0.tar.gz
  tar xzfv v2.0.0.tar.gz
  cd pgrouting-2.0.0/cmake
  nano ../src/apsp_johnson/src/CMakeLists.txt
  cmake -DPOSTGRESQL_EXECUTABLE:FILEPATH=/usr/local/Cellar/postgresql/9.3.5_1/bin/postgres -DPOSTGRESQL_PG_CONFIG:FILEPATH=/usr/local/Cellar/postgresql/9.3.5_1/bin/pg_config -DPOSTGRESQL_INCLUDE_DIR=/usr/local/Cellar/postgresql/9.3.5_1/include/server ..
  make
  make install

Note: on "declaration of 'mkdtemp' has a different language linkage" errors add *#include <unistd.h>* before *#include "postgres.h*

  nano ../src/astar/src/astar.h
  nano ../src/dijkstra/src/dijkstra.h
  nano ../src/driving_distance/src/drivedist.h

## protobuf

  wget https://protobuf.googlecode.com/files/protobuf-2.5.0.tar.bz2
  tar xfvj protobuf-2.5.0.tar.bz2
  cd protobuf-2.5.0
  ./configure CC=clang CXX=clang++ CXXFLAGS='-std=c++11 -stdlib=libc++ -O3 -g' LDFLAGS='-stdlib=libc++' LIBS="-lc++ -lc++abi"
  make -j 4
  sudo make install

## Nominatim



  cat > /usr/local/Cellar/postgresql/9.3.5_1/include/byteswap.h <<EOF
  /*
  This is a simple compatibility shim to convert
  Linux byte swap macros to the Mac OS X equivalents.
  It is public domain.
  */

  #include <libkern/OSByteOrder.h>

  #define bswap_16(x) OSSwapInt16(x)
  #define bswap_32(x) OSSwapInt32(x)
  #define bswap_64(x) OSSwapInt64(x)
  EOF

  git clone --recursive https://github.com/twain47/Nominatim.git
  brew install lua protobuf
  brew install protobuf-c
  brew install automake autoconf libtool libxml2
  brew link libxml2 --force
  ./autogen.sh
  ./configure
  php 
