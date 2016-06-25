{EventEmitter} = require 'events'
module.exports =
class System extends EventEmitter
  constructor: (server) ->
    @server = server
  loadMiddleware: (middleware) ->
    if typeof middleware == 'function'
      @server.app.use middleware
  loadRoute: (path, routeFile) ->
    try
      route = require routeFile
      @server.app.use path, route
    catch error
      server.error "system init route", error
