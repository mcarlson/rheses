###*
# @class Module
# @private
# Adds basic mixin support.
###
# Coffeescript mixins adapted from https://github.com/spine/spine/tree/dev/src
moduleKeywords = ['included', 'extended']
class Module
  ###*
  # Includes a mixin in the current scope
  # @param {Object} obj the object to be mixed in
  ###
  @include: (obj) ->
    throw new Error('include(obj) requires obj') unless obj
    for key, value of obj when key not in moduleKeywords
      # console.log key, obj, @::
      @::[key] = value
    obj.included?.call(@, obj)
    @

return Module