###*
# @class TextSprite
# @private
# Abstracts the underlying visual primitives for a text component
###
class ArtSprite extends Sprite
  clearInline: () ->
    for cld in @el.childNodes
      if cld && cld.nodeType is 3 then @el.removeChild(cld)

return ArtSprite