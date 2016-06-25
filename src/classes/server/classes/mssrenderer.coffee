Canvas = require 'canvas'
fs = require 'fs'
Geocoords = require 'geocoords'
Template = require 'tualo-template'
PathText = require './pathtext'

module.exports =
class MSSRenderer
  constructor: (mss,data) ->
    @data = data
    @mss = mss
    @scale = 1


  toBuffer: (callback)->
    @canvas.toBuffer callback

  save: (filename, callback)->

    @canvas.toBuffer (err, buf) ->
      fs.writeFile filename, buf , (err) ->
        process.nextTick () ->
          if typeof callback=='function'
            callback err


  render: (tileSize) ->
    @item_hash = {}
    @granularity = 10000
    @tileSize = tileSize

    #@tileSize = @granularity
    @canvas = new Canvas @tileSize,@tileSize
    @ctx = @canvas.getContext '2d'
    @ctx.scale @tileSize/ @granularity, @tileSize/ @granularity
    debug 'render',tileSize
    (@renderItem(name) for name of @data)
  renderItem: (oname) ->
    #debug 'renderItem',oname
    name = oname

    if name=='Map'
      #bbox = [[0,0],[0,0],[10000,10000]] # @data['Map'].bbox
      lbbox = @data['Map'].lbbox
      #debug 'bbox', bbox[0][0]

      #width = bbox[2][0]-bbox[0][0]
      #height = bbox[2][1]-bbox[0][1]
      #@scale = @tileSize / width
      #@x_offset = bbox[0][0]
      #@y_offset = bbox[0][1]

      lonlatbbox = Geocoords.from900913To4326 lbbox
      #debug 'lonlatbbox', lonlatbbox
      @meterScale =  @granularity / @lonlat2meters(lonlatbbox[0],lonlatbbox[1],lonlatbbox[2],lonlatbbox[3])

      @x_offset = 0
      @y_offset = 0
      @scale = 1
      #@meterScale = 1


      debug 'meterScale', @meterScale

      @defaultProperties()
      #@setupCTX @mss.instructions['Map'], @data['Map']
      #@ctx.fillRect 0,0,@tileSize*@granularity,@tileSize*@granularity
      #(bbox[0]-@x_offset)*@scale,(bbox[1]-@y_offset)*@scale,(bbox[2]-@x_offset)*@scale,(bbox[3]-@y_offset)*@scale
      #@ctx.stroke()

      #debug 'prop', bbox
      #debug 'prop', width
      #debug 'prop', height
      debug 'scale', @scale
      debug 'x_offset', @x_offset
      debug 'y_offset', @y_offset
      #process.exit()

    else
      name = name.replace /^#/,''
      if typeof @mss.instructions['#'+name] == 'object'
        #console.log('render###############',name,oname,@data)
        (@renderDataItem(@mss.instructions['#'+name],item,name) for item in @data[oname])


  renderDataItem: (instruction, item, debugName) ->

    index = 0
    @defaultProperties()
    @setupCTX(instruction, item)

    if item.data.type == 'Polygon'
      #console.log instruction
      @ctx.beginPath()
      for linestring in item.data.coordinates
        for coord in linestring
          x = (coord[0]-@x_offset)*@scale
          y = @granularity - (coord[1]-@y_offset)*@scale
          #debug 'moveTo', x,y
          if index == 0
            @ctx.moveTo x,y
          else
            @ctx.lineTo x,y
          index++

      @ctx.closePath()
      @ctx.fill()
      @ctx.stroke()
      #@ctx.fillStyle = '#0000ff'
      #debug 'Polygon','end-------'




    if item.data.type == 'MultiLineString'

      for linestring in item.data.coordinates
        @ctx.beginPath()
        for coord in linestring
          x = (coord[0]-@x_offset)*@scale
          y = @granularity - (coord[1]-@y_offset)*@scale
          #debug 'moveTo', x,y
          if index == 0
            @ctx.moveTo x,y
          else
            @ctx.lineTo x,y
          index++
        @ctx.stroke()

        if debugName=='roadtext'
          if item.name?
            @ctx.textBaseline="middle"
            @ctx.fillStyle = 'black'
            @ctx.strokeStyle= 'white'
            @ctx.font = '360px sans-serif'
            @drawText @ctx, '   '+item.name, @preprocessCoorinates(item.data.coordinates)

    if item.data.type == 'LineString'
      #if typeof item.name=='string'
      #  @ctx.fillStyle= "#000"
      #  @ctx.font = "2px Arial"
        #console.log item.name, item.data.coordinates[0][0], item.data.coordinates[0][1],@x_offset
      #  @ctx.fillText item.name, (item.data.coordinates[0][0]-@x_offset)*@scale, (item.data.coordinates[0][1]-@y_offset)*@scale
      @ctx.beginPath()

      for coord in item.data.coordinates
        x = (coord[0]-@x_offset)*@scale
        y = @granularity - (coord[1]-@y_offset)*@scale
        #debug 'moveTo', x,y
        if index == 0
          @ctx.moveTo x,y
        else
          @ctx.lineTo x,y
        index++
      @ctx.stroke()
      #console.log debugName
      if debugName=='roadtext'
        if item.name?
          #pt = new PathText @ctx
          @ctx.textBaseline="middle"
          @ctx.fillStyle = 'black'
          @ctx.strokeStyle= 'white'
          @ctx.font = '360px sans-serif'

          #pt.setPath @preprocessCoorinates(item.data.coordinates)
          #pt.setText item.name
          #pt.draw()

          @drawText @ctx, '   '+item.name, @preprocessCoorinates(item.data.coordinates)
  preprocessCoorinates: (coords) ->
    result = []
    for coord in coords
      x = (coord[0]-@x_offset)*@scale
      y = @granularity-((coord[1]-@y_offset)*@scale)
      result.push [x,y]
    result


  getSegments: (path) ->
    list = []
    lastpoint = path[0]
    for index in [1..path.length-1]
      point = path[index]
      l = Math.floor( @getLength(point[0],point[1],lastpoint[0],lastpoint[1]) )
      for p in [0..l]
        list.push index-1
      lastpoint = point
    list

  getAngles: (path) ->
    list = []
    lastpoint = path[0]
    for index in [1..path.length-1]
      point = path[index]
      list.push @getAngle(point[0],point[1],lastpoint[0],lastpoint[1])
      lastpoint = point
    list

  getAngle: (x1,y1,x2,y2) ->
    c = @getLength(x1,y1,x2,y2)
    r = 0
    if x1 > x2
      r = Math.asin( (y1-y2) /c) - Math.PI
    else
      r = Math.asin( (y2-y1) /c)
    r
  getLength: (x1,y1,x2,y2) ->
    a = x2-x1
    b = y2-y1
    c = Math.sqrt(a*a+b*b)

  drawText: (ctx,text,data) ->
    m=data.length
    ctx.textDrawingMode="glyph"
    textLength=text.length
    sequenceLength = []
    w = ctx.measureText(text).width
    l = 0
    pathSequence = 0
    for i in [0..m-1]
      if i>0
        currentX = @getLength data[i-1][0] , data[i-1][1] , data[i][0] , data[i][1]
        if currentX > w
          strategie = 1
          pathSequence = i-1
        sequenceLength.push w
        l += currentX
    currentX = 0
    if w > l
    else
      ctx.textBaseline='middle'

      if m >0
        if strategie == 1
          ctx.save()
          ctx.translate( data[pathSequence][0] , data[pathSequence][1]  )
          ctx.rotate(@getAngle( data[pathSequence][0] , data[pathSequence][1] ,data[pathSequence+1][0] , data[pathSequence+1][1]))

          ctx.strokeText(text,currentX,0,10000)
          ctx.fillText(text,currentX,0,10000)
          ctx.translate( data[pathSequence][0]*-1 ,data[pathSequence][1] *-1  )
          ctx.restore()

  setupCTX: (instruction,item) ->
    #console.log 'setupCTX',instruction.properties
    @setupProperties instruction.properties,instruction.variables,item.tags
    for name of instruction.instructions when @matches(item,name)
      #if item.bridge=='yes'
      #console.log '******',item,name, instruction.instructions[name].properties
      @setupProperties(instruction.instructions[name].properties,instruction.variables,item.tags)

  matches: (item,name) ->
    result = false

    names = name.split ','
    for name in names
      if name.charAt(0)=='[' and name.charAt(name.length-1)==']'
        name = name.substring(1,name.length-1)

        gt = name.indexOf('>=')
        lt = name.indexOf('<=')
        eq = name.indexOf('=')
        gr = name.indexOf('>')
        lo = name.indexOf('<')

        if gt>0
          key = name.substring 0, gt
          value = name.substring gt+1
          result = if item[key]>=value then true else false
        else if lt>0
          key = name.substring 0, lt
          value = name.substring lt+1
          result = if item[key]<=value then true else false
        else if eq>0
          key = name.substring 0, eq
          value = name.substring eq+1
          result = if item[key]+''==value+'' then true else false
        else if gr>0
          key = name.substring 0, gr
          value = name.substring gr+1
          result = if item[key]>value then true else false
        else if lo>0
          key = name.substring 0, lo
          value = name.substring lo+1
          result = if item[key]<value then true else false
        #debug 'matches res', item.natural+'#'+result
        if value='*'
          result =true
        if result
          return result
    result
  setupProperties: (properties,variables,tags) ->
    (@setProperty(prop,properties[prop],variables,tags) for prop of properties)
  setProperty: (prop,value,variables,tags) ->
    #debug 'setProperty',prop+'='+value

    matches = value.match /(@[a-zA-Z0-9]+)+/g
    if matches?
      #debug 'template', value
      #debug 'template', matches
      for str in matches
        if typeof variables[str.substring(1)]!='undefined'
          value = value.replace str, variables[str.substring(1)]
        if typeof tags[str.substring(1)] != 'undefined'
          value = value.replace str, tags[str.substring(1)]

      # debug 'template**', value
      #template = new Template value
      #template.ctx.def 'add',(a,b) ->
      #  debug 'add', a+' '+b
      #return a*1+b*1

      sctx = new Template.Shunt.Context()
      (sctx.def name,tags[name] for name of tags)
      sctx.def 'add',(a,b) ->
        return a*1+b*1
      sctx.def 'mult',(a,b) ->
        return a*1*b*1
      sctx.def 'rgb',(r,g,b) ->
        c = (g | (b << 8) | (r << 16)).toString(16)
        while c.length<6
          c='0'+c
        '#'+c

      sctx.def 'lighten',(col,amt) ->
        usePound = false
        if col[0] == "#"
          col = col.slice(1)
          usePound = true

        num = parseInt(col,16)
        r = (num >> 16) + amt
        if r > 255
          r = 255
        else if r < 0
          r = 0
        b = ((num >> 8) & 0x00FF) + amt
        if b > 255
          b = 255
        else if b < 0
          b = 0
        g = (num & 0x0000FF) + amt
        if g > 255
          g = 255
        else if g < 0
          g = 0

        c = (g | (b << 8) | (r << 16)).toString(16)
        while c.length<6
          c='0'+c
        #console.log 'lighten',col, (g | (b << 8) | (r << 16)).toString(16)
        return "#"+c

      try
        cols = value.match(/(#[a-f0-9]+)/g)
        if cols?
          for col in cols
            orig = col
            col = col.slice(1)
            if col.length == 3
              col = col[0]+col[0]+col[1]+col[1]+col[2]+col[2]

            amt = 0
            num = parseInt(col,16)
            r = (num >> 16) + amt
            if r > 255
              r = 255
            else if r < 0
              r = 0
            b = ((num >> 8) & 0x00FF) + amt
            if b > 255
              b = 255
            else if b < 0
              b = 0
            g = (num & 0x0000FF) + amt
            if g > 255
              g = 255
            else if g < 0
              g = 0
            rgb = 'rgb('+r+','+g+','+b+')'
            value = value.replace(new RegExp(orig,"g"),rgb)
        value = Shunt.parse(value, sctx)
      catch e
        #console.log e

      # value = template.render variables
      # debug 'template##', value


    #if value.charAt(0)=='@' and typeof variables[value.substring(1)]!='undefined'
    #  value = variables[value.substring(1)]


    #template = new Template value
    #template.ctx.def 'lighten', (value,percent) ->
    #  if typeof value=='string' and value.charAt(0)=='#'
    #    color = value.substring 1
    #
    #    if color.length == 3
    #
    #  else
    #
    #value = template.render {}

    debug 'setProperty*',prop+'#'+value
    if prop=='line-width'
      @ctx.lineWidth = value*@meterScale

    if prop=='line-color'
      @ctx.strokeStyle = value
    if prop=='fill-color'
      @ctx.fillStyle = value
    if prop=='background-color'
      @ctx.fillStyle = value
      #console.log 'background-color',value
    #if prop=='opacity'
    #  @ctx.globalAlpha = parseFloat value

  lonlat2meters: (lat1,lon1,lat2,lon2) ->
    R = 6371
    o1 = @toRad lat1
    o2 = @toRad lat2
    delta1 = @toRad lat2-lat1
    delta2 = @toRad lon2-lon1
    a = Math.sin(delta1/2) *
        Math.sin(delta1/2) + Math.cos(o1) *
        Math.cos(o2) *
        Math.sin(delta2/2) * Math.sin(delta2/2)
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    d = R * c
    d*1000
  toRad: (v) ->
    v * Math.PI / 180

  defaultProperties: () ->
    @ctx.globalAlpha = 1
    @ctx.lineWidth = 0.00001
    @ctx.fillStyle = "none"
    @ctx.strokeStyle = "none"
    @ctx.lineCap = "round"
    @ctx.lineJoin = "round"
    @ctx.shadowBlur = 0
    @ctx.shadowColor = 'transparent'
