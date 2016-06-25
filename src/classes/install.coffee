{EventEmitter} = require 'events'
{spawn} = require 'child_process'
path = require 'path'

module.exports =
class Install extends EventEmitter
  @list: [
    'osm2pgsqlcache',
    'createdb',
    'setupdb',
    'importdata',
    'partitions',
    'createfunctions',
    'createminimaltables',
    'createtables',
    'createfunctions', # re-run!,
    'createpartitiontables',
    'createpartitionfunctions',
    'loaddata',
    'calculatepostcodes',
    'osmosisinit',
    'index',
    'createsearchindices',
    'createstreettable'
    #'enablediffupdates'
  ]
  constructor: (options) ->
    @msg_tag = 'class install'
    @options = options

    @options.osm2pgsqlCache = true
    @options.partitions = true

    if @options.maxwordfreq
      @options.maxwordfreq = parseInt @options.maxwordfreq
    else
      @options.maxwordfreq = 50000

    if @options.all == true
      @options.createDb = true
      @options.setupDb = true
      @options.importData = true
      @options.createFunctions = true
      @options.createMinimalTables = true
      @options.createTables = true
      @options.createPartitionTables = true
      @options.createPartitionFunctions = true
      @options.loadData = true
      @options.calculatePostcodes = true
      @options.osmosisInit = true
      @options.createSearchIndices = true
      @options.createStreetTable = true

      warn @msg_tag, 'append all entries here'
    @options.database = 'gnile'
    @options.port = 5432
  start: () ->
    @step = -1
    @next()

  next: () ->
    me = @
    @step++
    if @step < Install.list.length
      try
        Step = require '.' + path.sep + path.join 'steps', Install.list[@step]
        step = new Step(@options)
        step.on 'done', () => @next()
        step.on 'error', () => @fatalError()
        step.start()
      catch err
        error @msg_tag, err
    else
      info @msg_tag, 'done'

  fatalError: () ->
    error @msg_tag, 'stopped'
    process.exit()
