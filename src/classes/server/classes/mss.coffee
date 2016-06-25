

module.exports =
class MSS
  constructor: (css,variables,cmss) ->
    if typeof variables=='undefined'
      variables = {}

    @offset = 0
    @css = css.replace /\s/g,''
    @css = @css.replace /\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g,''

    @properties = {}
    @instructions = {}
    @variables = variables

    if typeof cmss!= 'undefined'
      @instructions = cmss.instructions
      @properties = cmss.properties
      ( (@variables[name]= cmss.variables[name]) for name of cmss.variables )


  parse: () ->
    @last = ''
    while @offset < @css.length
      @currentChar = @css.charAt(@offset)

      if @comment() and @block() and @semicolon()
        @last += @currentChar
      @offset++
    delete @offset
    delete @css
    delete @semicolon
    delete @block
    delete @findCloseBlock
    delete @comment
    delete @last
    delete @currentChar

  semicolon: () ->
    if @currentChar == ';'
      #debug 'semicolon', @last
      p = @last.indexOf(':')
      if p>0
        if @last.charAt(0)=='@'
          @variables[@last.substring(1,p)] = @last.substring(p+1)
        else
          @properties[@last.substring(0,p)] = @last.substring(p+1)
      else
        error 'semicolon error on', @last
      @last = ''
      false
    else
      true


  block: () ->
    if @currentChar == '{'
      closePos = @findCloseBlock()
      #debug 'closeblock', @last, @css.substring(@offset+1,closePos)
      @instructions[@last] = new MSS(@css.substring(@offset+1,closePos),@variables,@instructions[@last])
      @instructions[@last].parse()
      @last = ''
      @offset = closePos
      false
    else
      true

  findCloseBlock: () ->

    position = @offset+1
    intend = 0
    while position < @css.length
      char = @css.charAt(position)
      if char == '}' and intend==0
        break
      else if char == '{'
        intend++
      else if char == '}'
        intend--
      position++
    position

  comment: () ->

    if @css.substring(@offset,2) == '/*'
      stop = @css.indexOf('*/',@offset)
      if stop>@offset
        #debug 'MSS Comment',@css.substring(@offset+2,stop)
        @offset = stop + 1
        @last = ""
      else
        throw Error('missing closed comment')
      false
    else
      true
