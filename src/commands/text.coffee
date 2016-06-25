{Command} = require 'tualo-commander'
fs = require 'fs'
path = require 'path'
Canvas = require 'canvas'
#fabric = require('fabric').fabric
gm = require 'gm'
PathText = require '../classes/server/classes/pathtext'


module.exports =
class Start extends Command
  @commandName: 'text'
  @commandArgs: ['text']
  @commandShortDescription: 'test path on text'
  @options: [
    {parameter: "-d, --debug [debug]", description: "enable the debug mode"}
  ]


  @help: () ->
    """
    test path on text.
    """

  action: (options,args) ->
    if args.text

      @tileSize = 512

      #@image = gm(@tileSize,@tileSize,'#ddff99f3')
      #@image.drawText(10, 50, "from scratch")
      #@image.write 'path.png', (err) ->
      #  console.log 'done',err

      @canvas = new Canvas @tileSize,@tileSize
      #@canvas = fabric.createCanvasForNode(@tileSize, @tileSize)
      #fontPath = path.join __dirname,'..','..','fonts','open-sans','OpenSans-Regular.ttf'
      #font = new @canvas.Font('OpenSans', fontPath)
      #font.addFace(fontPath, 'normal')

      console.log @canvas.Path
      @ctx = @canvas.getContext '2d'

      pt = new PathText @ctx
      p = []
      p.push [10,10]
      p.push [50,100]
      p.push [50,150]
      p.push [210,210]
      pt.setPath p
      pt.setText args.text
      @ctx.textBaseline="middle"
      #@ctx.addFont(font)
      @ctx.font = '12px OpenSans'
      @ctx.font = '22px Arial'
      @ctx.lineWidth = 50
      @ctx.strokeWidth = 50
      @ctx.strokeStyle='#00f'
      @ctx.fillStyle='#fff'
      pt.draw()

      #@ctx.font = '10px Impact'
      #@ctx.rotate(.1)
      #@ctx.fillText("Awesome!", 50, 100)
      console.log @ctx.textDrawingMode

      @ctx.beginPath()
      @ctx.lineWidth=2
      @ctx.strokeStyle='#00f'
      index = 0
      for coord in p
        x = coord[0]
        y = coord[1]
        if index == 0
          @ctx.moveTo x,y
        else
          @ctx.lineTo x,y
        index++
      @ctx.stroke()

      filename = 'path.png'
      @canvas.toBuffer (err, buf) ->
        fs.writeFile filename, buf , (err) ->
          process.nextTick () ->
            console.log 'done'
