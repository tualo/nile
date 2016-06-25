{EventEmitter} = require 'events'
{spawn} = require 'child_process'
os = require 'os'

module.exports =
class OSM2PSQLCache extends EventEmitter
  constructor: (options) ->
    @msg_tag = 'osm2pgsqlCache'
    @options = options
  start: () ->
    @totalMemory = os.freemem() / 1024 / 1024
    @memory = Math.floor @totalMemory * 0.8
    if @options['cache']
      if @cache > @totalMemory
        error @msg_tag, 'osm2pgsqlcache is larger than total memory'
      else
        @memory = @totalMemory
    @options['cache'] = @memory
    @options['cpus'] = os.cpus()
    @options['instances'] = @options['cpus'].length
    @done()
  done: () ->
    @emit 'done'
