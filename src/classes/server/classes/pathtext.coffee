
module.exports =
class PathText
  constructor: (ctx) ->
    @ctx = ctx
  setPath: (path) ->
    @path = path
  setText: (text) ->
    @text = text
  draw: () ->
    @ctx.textDrawingMode="glyph"
    #@ctx.textDrawingMode="path"
    @pathSegment = 0
    @wordPathOffset = 0
    @totalWordOffset = 0
    @totalPathOffset = 0
    @charSpacing = 1

    # finding the best strategy
    pathParts = @pathLength(@path)
    textParts = @split(@text)
    textPartLength = []
    for p in textParts
      textPartLength.push( @ctx.measureText(p).width )

    holeTextLength = @ctx.measureText(@text).width
    strategy = 'strategie_1'
    best_index = 0
    index = 0
    sum = 0
    for l in pathParts
      sum += l
      if l > holeTextLength
        strategy = 'strategie_3'
        console.log 'found one A* place for text',index
        best_index = index

      if textPartLength.length > 0
        if l > textPartLength[0]
          textPartLength.shift()
      index++

    if textPartLength.length==0 and strategy != 'strategie_3'
      strategy = 'strategie_2'

    if sum<holeTextLength + @charSpacing*@text.length
      strategy = 'strategie_0'

    console.log 'using ',strategy
    console.log 'path ',@path
    console.log 'holePathLength ',sum
    console.log 'holeTextLength ',holeTextLength * @charSpacing*@text.length
    console.log 'pathParts ',pathParts

    @[strategy](best_index)

  split: (text) ->
    result = []
    parts=text.split(/-/)
    for index in [0..parts.length-1]
      if index != parts.length-1
        parts[index] += '-'
      result = result.concat(parts[index].split(/\s/))
    result

  pathLength: (path)->
    result = []
    for seg in [0..path.length-2]
      result.push(  @getLength(path[seg][0], path[seg][1], path[seg+1][0], path[seg+1][1]) )
    result

  strategie_3: (index) ->
    @pathSegment = index
    angle = @getAngle @path[@pathSegment][0],@path[@pathSegment][1],@path[@pathSegment+1][0],@path[@pathSegment+1][1]

    @ctx.save()
    @ctx.translate(@path[@pathSegment][0],@path[@pathSegment][1])
    @ctx.rotate(angle)
    #@ctx.lineWidth=30
    #@ctx.lineWidth= 10
    @ctx.strokeText @text, 0,0
    @ctx.fillText @text, 0,0
    @ctx.restore()




  strategie_2: () ->
    pathParts = @pathLength(@path)
    textParts = @split(@text)
    textPartLength = []
    for p in textParts
      textPartLength.push( @ctx.measureText(p).width )
    index = 0
    for l in pathParts
      if textPartLength.length > 0
        if l > textPartLength[0]
          textPartLength.shift()
          text = textParts.shift()
          @pathSegment = index
          angle = @getAngle @path[@pathSegment][0],@path[@pathSegment][1],@path[@pathSegment+1][0],@path[@pathSegment+1][1]
          @ctx.save()
          @ctx.translate(@path[@pathSegment][0],@path[@pathSegment][1])
          @ctx.rotate(angle)
          @ctx.strokeText @text, 0,0
          @ctx.fillText @text, 0,0

          @ctx.restore()
      index++


  strategie_1: () ->
    try
      for index in [0..@text.length-1]
        char = @text.charAt(index)
        charBBox = @ctx.measureText(char)

        angle = 0.5
        angle = @getAngle @path[@pathSegment][0],@path[@pathSegment][1],@path[@pathSegment+1][0],@path[@pathSegment+1][1]
        debug 'angle', angle
        pointXOnPath = 0
        pointYOnPath = 0
        currentPathLength = @getLength(@path[@pathSegment][0],@path[@pathSegment][1],@path[@pathSegment+1][0],@path[@pathSegment+1][1])
        if @wordPathOffset + charBBox.width < currentPathLength
          # same segment
          letterCenter = charBBox.width/2
          lengthOfPath = @wordPathOffset
          aPart = 0
          bPart = 0
          if currentPathLength!=0
            aPart = (@path[@pathSegment+1][0] - @path[@pathSegment][0]) * lengthOfPath/currentPathLength
            bPart = (@path[@pathSegment+1][1] - @path[@pathSegment][1]) * lengthOfPath/currentPathLength
          pointXOnPath = @path[@pathSegment+0][0] + aPart
          pointYOnPath = @path[@pathSegment+0][1] + bPart
          @wordPathOffset+=charBBox.width
          @wordPathOffset+=@charSpacing

        else
          @totalPathOffset+=currentPathLength
          @pathSegment++
          @wordPathOffset = 0

          letterCenter = charBBox.width/2
          lengthOfPath = @wordPathOffset
          aPart = 0
          bPart = 0
          if currentPathLength!=0
            aPart = (@path[@pathSegment+1][0] - @path[@pathSegment][0]) * lengthOfPath/currentPathLength
            bPart = (@path[@pathSegment+1][1] - @path[@pathSegment][1]) * lengthOfPath/currentPathLength
          pointXOnPath = @path[@pathSegment+0][0] + aPart
          pointYOnPath = @path[@pathSegment+0][1] + bPart
          @wordPathOffset+=charBBox.width
          @wordPathOffset+=@charSpacing


        @totalWordOffset+=charBBox.width
        @totalWordOffset+=@charSpacing

        @ctx.save()
        @ctx.translate(pointXOnPath,pointYOnPath)
        @ctx.rotate(angle)
        @ctx.strokeText @text, 0,0
        @ctx.fillText @text, 0,0
        @ctx.restore()
    catch error



  strategie_0: () ->
    #console.log 'nothing'

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
