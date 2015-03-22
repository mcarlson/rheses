  # An ordered collection of points that can be transformed in various ways.
  class Path
    constructor: (vectors = []) ->
      @_boundingBox = null
      @vectors = vectors
    
    ###*
    # Convert radians to degrees.
    # @param {Number} deg The degrees to convert.
    # @return {Number} The radians
    ###
    degreesToRadians: (deg) ->
      deg * Math.PI / 180
    
    ###*
    # Convert degrees to radians.
    # @param {Number} rad The radians to convert.
    # @return {Number} The radians
    ###
    radiansToDegrees: (rad) ->
      rad * 180 / Math.PI
    
    ###*
    # Shift this path by the provided x and y amount.
    # @param {Number} dx The x amount to shift.
    # @param {Number} dy The y amount to shift.
    ###
    translate: (dx, dy) ->
      vecs = @vectors
      i = vecs.length
      while i
        vecs[--i] += dy
        vecs[--i] += dx
      @_boundingBox = null
      @
    
    ###*
    # Rotates this path around 0,0 by the provided angle in radians.
    # @param {Number} a The angle in degrees to rotate
    ###
    rotate: (a) ->
      a = @degreesToRadians(a)
      
      cosA = Math.cos(a)
      sinA = Math.sin(a)
      vecs = @vectors
      len = vecs.length
      i = 0
      while len > i
        xNew = vecs[i] * cosA - vecs[i + 1] * sinA
        yNew = vecs[i] * sinA + vecs[i + 1] * cosA
        
        vecs[i++] = xNew
        vecs[i++] = yNew
      @_boundingBox = null
      @

    ###*
    # Scales this path around the origin by the provided scale amount
    # @param {Number} sx The amount to scale along the x-axis.
    # @param {Number} sy The amount to scale along the y-axis.
    ###
    scale: (sx, sy) ->
      vecs = @vectors
      i = vecs.length
      while i
        vecs[--i] *= sy
        vecs[--i] *= sx
      @_boundingBox = null
      @

    ###*
    # Rotates and scales this path around the provided origin by the angle in
    # degrees, scalex and scaley.
    # @param {Number} scalex The amount to scale along the x axis.
    # @param {Number} scaley The amount to scale along the y axis.
    # @param {Number} angle The amount to scale.
    # @param {Number} xOrigin The amount to scale.
    # @param {Number} yOrign The amount to scale.
    ###
    transformAroundOrigin: (scalex, scaley, angle, xOrigin, yOrigin) ->
      @translate(-xOrigin, -yOrigin).rotate(angle).scale(scalex, scaley).translate(xOrigin, yOrigin)

    ###*
    # Gets the bounding box for this path.
    # @return {Object} with properties x, y, width and height or null
    # if no bounding box could be calculated.
    ###
    getBoundingBox: () ->
      return @_boundingBox if @_boundingBox
      
      vecs = @vectors
      i = vecs.length
      if i >= 2
        minY = maxY = vecs[--i]
        minX = maxX = vecs[--i]
        while i
          y = vecs[--i]
          x = vecs[--i]
          minY = Math.min(y, minY)
          maxY = Math.max(y, maxY)
          minX = Math.min(x, minX)
          maxX = Math.max(x, maxX)
        @_boundingBox = {x:minX, y:minY, width:maxX - minX, height:maxY - minY}
      else
        @_boundingBox = null