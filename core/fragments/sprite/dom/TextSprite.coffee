###*
# @class TextSprite
# @private
# Abstracts the underlying visual primitives for a text component
###
class TextSprite extends Sprite
  constructor: (view, jqel, attributes) ->
    @css_baseclass ?= 'sprite sprite-text noselect'
    super
    attributes.text ||= @getText()

  setText: (txt) ->
    if txt?
      for cld in @el.childNodes
        if cld && cld.nodeType is 3 then @el.removeChild(cld)

      tnode = document.createTextNode(txt);
      @el.appendChild(tnode)

  getText: ->
    # Firefox doesn't support innerText and textContent gives us more than
    # we want. Instead, walk the dom children and concat all the text nodes.
    # The nodes get trimmed since line feeds and other junk whitespace will
    # show up as text nodes.
    child = @el.firstChild
    texts = []
    while child
      if child.nodeType is 3 then texts.push(child.data.trim())
      child = child.nextSibling;
    texts.join("")

return TextSprite