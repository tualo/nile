
module.exports =
class Color
  constructor: (rgb,a) ->
    if Array.isArray(rgb)
      @rgb = rgb
    else if rgb.length == 6
      @rgb = rgb.match(/.{2}/g).map (c) ->
        arseInt(c, 16)
    else
      rgb = rgb.split('').map (c) ->
        parseInt(c + c, 16)

    @alpha = typeof a == 'number' ? a : 1
  toHSL: () ->
    r = @rgb[0] / 255
    g = @rgb[1] / 255
    b = @rgb[2] / 255
    a = @alpha

    max = Math.max r, g, b
    min = Math.min r, g, b


    l = (max + min) / 2
    d = max - min

    if (max == min)
      h = s = 0
    else
      s = if l > 0.5 then d / (2 - max - min) else d / (max + min)
      if max == r
        h = (g - b) / d + (g < b ? 6 : 0)
      else if max == g
        h = (b - r) / d + 2
      else if max == b
        (r - g) / d + 4
      h /= 6
    result =
      h: h * 360
      s: s
      l: l
      a: a
    result
