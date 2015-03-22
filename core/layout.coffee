###
# The MIT License (MIT)
#
# Copyright ( c ) 2015 Teem2 LLC
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
###

# Maps attribute names to CSS style names.
stylemap =
  bold: 'fontWeight'
  bordercolor: 'borderColor'
  borderstyle: 'borderStyle'
  bottomborder: 'borderBottomWidth'
  bottompadding: 'paddingBottom'
  boxshadow: 'boxShadow'
  bgcolor: 'backgroundColor'
  ellipsis: 'textOverflow'
  fontfamily: 'fontFamily'
  fontweight: 'fontWeight'
  fontsize: 'fontSize'
  italic: 'fontStyle'
  leftborder: 'borderLeftWidth'
  leftpadding: 'paddingLeft'
  rightborder: 'borderRightWidth'
  rightpadding: 'paddingRight'
  smallcaps: 'fontVariant'
  topborder: 'borderTopWidth'
  toppadding: 'paddingTop'
  visible: 'visibility'
  whitespace: 'whiteSpace'
  x: 'marginLeft'
  y: 'marginTop'
  z: 'z-index'

~["include","fragments/hackstyle.frag"]~

window.dr = do ->
  COMMENT_NODE = window.Node.COMMENT_NODE

  # Common noop function. Also used as a return value for setters to prevent
  # the default setAttribute behavior.
  noop = () ->

  # Common float comparison function
  closeTo = (a, b, epsilon) ->
    epsilon ||= 0.01 # Default is appropriate for many pixel related comparisons
    Math.abs(a - b) < epsilon

  # from http://coffeescriptcookbook.com/chapters/classes_and_objects/mixins
  mixOf = (base, mixins...) ->
    class Mixed extends base
    for mixin, i in mixins by -1
      for name, method of mixin::
        Mixed::[name] = method
    Mixed

  matchPercent = /%$/

~["include","fragments/Events.frag"]~
~["include","fragments/Module.frag"]~

  # Internal attributes ignored by class declarations and view styles
  ignoredAttributes = {
    parent: true
    id: true
    name: true
    extends: true
    type: true
    scriptincludes: true
  }

~["include","fragments/Eventable.frag"]~
~["include","fragments/capabilities.frag"]~

  querystring = window.location.search
  debug = querystring.indexOf('debug') > 0
  test = querystring.indexOf('test') > 0

~["include","fragments/compiler.frag"]~

  # a list of constraint scopes gathered at init time
  constraintScopes = []
  instantiating = false
  handlerq = []
  eventq = []

  _initConstraints = ->
    instantiating = false
    for scope in handlerq
      scope._bindHandlers()
    handlerq = []

    for ev in eventq
      {scope, name, value} = ev
      if name is 'init'
        # console.log ('init')
        scope.inited = true
      scope.sendEvent(name, value)
    eventq = []

    for scope in constraintScopes
      scope._bindConstraints()
    constraintScopes = []

  clone = (obj) ->
    newobj = {}
    for name, val of obj
      newobj[name] = val
    newobj

  _processAttrs = (sourceAttrs, targetAttrs) ->
    # Make sure "with" is processed before the rest of the attributes
    if sourceAttrs.with?
      # Process mixins from right to left since the rightmost mixin is more
      # "super" than the leftmost.
      mixins = sourceAttrs.with.split(',').reverse()
      for mixinName in mixins
        mixin = dr[mixinName.trim()]
        if mixin then _processAttrs(mixin.classattributes, targetAttrs)
    
    for key, value of sourceAttrs
      if key is 'with'
        # Don't process 'with' attribute
        continue
      else if (key is '$methods' or key is '$types') and key of targetAttrs
        targetAttrs[key] = clone(targetAttrs[key])
        # console.log('overwriting', key, targetAttrs[key], value)
        for propname, val of value
          if key is '$methods' and targetAttrs[key][propname]
            targetAttrs[key][propname] = targetAttrs[key][propname].concat(val)
            # console.log('method override found for', propname, targetAttrs[key][propname])
          else
            targetAttrs[key][propname] = val
          # console.log 'overwrote class attribute', key, targetAttrs[key], value
      else if key is '$handlers' and key of targetAttrs
        # console.log 'concat', targetAttrs[key], value
        targetAttrs[key] = targetAttrs[key].concat(value)
        # console.log 'after concat', targetAttrs[key]
      else
        targetAttrs[key] = value

~["include","fragments/Node.frag"]~
~["if","runtime","dali"]~~["include","fragments/dali/Sprite.frag"]~~["else"]~~["include","fragments/Sprite.frag"]~~["endif"]~
~["include","fragments/View.frag"]~

  warnings = []
  showWarnings = (data) ->
    warnings = warnings.concat(data)
    out = data.join('\n')
    pre = document.createElement('pre')
    pre.setAttribute('class', 'warnings')
    pre.textContent = out
    document.body.insertBefore(pre, document.body.firstChild)
    console.error out

  specialtags = ['handler', 'method', 'attribute', 'setter', 'include']

  matchEvent = /^on(.+)/

  tagPackageSeparator = '-'

~["include","fragments/dom.frag"]~
~["include","fragments/State.frag"]~
~["include","fragments/Class.frag"]~
~["include","fragments/Layout.frag"]~
~["include","fragments/AutoPropertyLayout.frag"]~
~["include","fragments/Path.frag"]~
~["include","fragments/StartEventable.frag"]~
~["include","fragments/idle.frag"]~

  # singleton that listens for mouse events. Holds data about the most recent left and top mouse coordinates
  mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup']

~["include","fragments/Mouse.frag"]~
~["include","fragments/Window.frag"]~
~["include","fragments/Keyboard.frag"]~

  window.onerror = (e) ->
    showWarnings(["#{e.toString()}. Try running in debug mode for more info. #{window.location.href}#{if querystring then '&' else '?'}debug"])

  ###*
  # @class dr {Core Dreem}
  # Holds builtin and user-created classes and public APIs.
  #
  # All classes listed here can be invoked with the declarative syntax, e.g. &lt;node>&lt;/node> or &lt;view>&lt;/view>
  ###
  exports =
    view: View
    class: Class
    node: Node
    mouse: new Mouse()
    keyboard: new Keyboard()
    window: new Window()
    layout: Layout
    idle: new Idle()
    state: State
    _noop: noop
    ###*
    # @method initElements
    # Initializes all top-level views found in the document. Called automatically when the page loads, but can be called manually as needed.
    ###
    initElements: dom.initAllElements
    ###*
    # @method writeCSS
    # Writes generic dreem-specific CSS to the document. Should only be called once.
    ###
    writeCSS: dom.writeCSS
    # public API to initialize constraints for a group of nodes, used by replicator
    initConstraints: _initConstraints

  # virtual classes declared for documentation purposes
  ###*
  # @class dr.method {Core Dreem}
  # Declares a member function in a node, view, class or other class instance. Methods can only be created with the &lt;method>&lt;/method> tag syntax.
  #
  # If a method overrides an existing method, any existing (super) method(s) will be called first automatically.
  #
  # Let's define a method called changeColor in a view that sets the background color to pink.
  #
  #     @example
  #
  #     <view id="square" width="100" height="100">
  #       <method name="changeColor">
  #         this.setAttribute('bgcolor', 'pink');
  #       </method>
  #     </view>
  #
  #     <handler event="oninit">
  #       square.changeColor();
  #     </handler>
  #
  # Here we define the changeColor method in a class called square. We create an instance of the class and call the method on the intance.
  #
  #     @example
  #     <class name="square" width="100" height="100">
  #       <method name="changeColor">
  #         this.setAttribute('bgcolor', 'pink');
  #       </method>
  #     </class>
  #
  #     <square id="square1"></square>
  #
  #     <handler event="oninit">
  #       square1.changeColor();
  #     </handler>
  #
  # Now we'll subclass the square class with a bluesquare class, and override the changeColor method to color the square blue. We also add an inner square who's color is set in the changeColor method of the square superclass. Notice that the color of this square is set when the method is called on the subclass.
  #
  #     @example
  #     <class name="square" width="100" height="100">
  #       <view name="inner" width="25" height="25"></view>
  #       <method name="changeColor">
  #         this.inner.setAttribute('bgcolor', 'green');
  #         this.setAttribute('bgcolor', 'pink');
  #       </method>
  #     </class>
  #
  #     <class name="bluesquare" extends="square">
  #       <method name="changeColor">
  #         this.setAttribute('bgcolor', 'blue');
  #       </method>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #
  #     <square id="square1"></square>
  #     <bluesquare id="square2"></bluesquare>
  #
  #     <handler event="oninit">
  #       square1.changeColor();
  #       square2.changeColor();
  #     </handler>
  #
  ###
  ###*
  # @attribute {String} name (required)
  # The name of the method.
  ###
  ###*
  # @attribute {String[]} args
  # A comma separated list of method arguments.
  ###
  ###*
  # @attribute {"js"/"coffee"} type
  # The compiler to use for this method. Inherits from the immediate class if unspecified.
  ###

  ###*
  # @class dr.setter
  # Declares a setter in a node, view, class or other class instance. Setters can only be created with the &lt;setter>&lt;/setter> tag syntax.
  #
  # Setters allow the default behavior of attribute changes to be changed.
  #
  # Like dr.method, if a setter overrides an existing setter any existing (super) setter(s) will be called first automatically.
  # @ignore
  ###
  ###*
  # @attribute {String} name (required)
  # The name of the method.
  ###
  ###*
  # @attribute {String[]} args
  # A comma separated list of method arguments.
  ###
  ###*
  # @attribute {"js"/"coffee"} type
  # The compiler to use for this method. Inherits from the immediate class if unspecified.
  ###

  ###*
  # @class dr.handler {Core Dreem, Events}
  # Declares a handler in a node, view, class or other class instance. Handlers can only be created with the `<handler></handler>` tag syntax.
  #
  # Handlers are called when an event fires with new value, if available.
  #
  # Here is a simple handler that listens for an onx event in the local scope. The handler runs when x changes:
  #
  #     <handler event="onx">
  #       // do something now that x has changed
  #     </handler>
  #
  # When a handler uses the args attribute, it can recieve the value that changed:
  #
  # Sometimes it's nice to use a single method to respond to multiple events:
  #
  #     <handler event="onx" method="handlePosition"></handler>
  #     <handler event="ony" method="handlePosition"></handler>
  #     <method name="handlePosition">
  #       // do something now that x or y have changed
  #     </method>
  #
  #
  # When a handler uses the args attribute, it can receive the value that changed:
  #
  #     @example
  #
  #     <handler event="onwidth" args="widthValue">
  #        exampleLabel.setAttribute("text", "Parent view received width value of " + widthValue)
  #     </handler>
  #
  #     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10px"></text>
  #     <text x="50" y="${exampleLabel.y + exampleLabel.height + 20}" text="no value yet" color="white" bgcolor="#DDAA00" padding="10px">
  #       <handler event="onwidth" args="wValue">
  #          this.setAttribute("text", "This label received width value of " + wValue)
  #       </handler>
  #     </text>
  #
  #
  # It's also possible to listen for events on another scope. This handler listens for onidle events on dr.idle instead of the local scope:
  #
  #     @example
  #
  #     <handler event="onidle" args="time" reference="dr.idle">
  #       exampleLabel.setAttribute('text', 'received time from dr.idle.onidle: ' + Math.round(time));
  #     </handler>
  #     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10px"></text>
  #
  #
  ###
  ###*
  # @attribute {String} event (required)
  # The name of the event to listen for, e.g. 'onwidth'.
  ###
  ###*
  # @attribute {String} reference
  # If set, the handler will listen for an event in another scope.
  ###
  ###*
  # @attribute {String} method
  # If set, the handler call a local method. Useful when multiple handlers need to do the same thing.
  ###
  ###*
  # @attribute {String[]} args
  # A comma separated list of method arguments.
  ###
  ###*
  # @attribute {"js"/"coffee"} type
  # The compiler to use for this method. Inherits from the immediate class if unspecified.
  ###

  ###*
  # @class dr.attribute {Core Dreem, Events}
  # Adds a variable to a node, view, class or other class instance. Attributes can only be created with the &lt;attribute>&lt;/attribute> tag syntax.
  #
  # Attributes allow classes to declare new variables with a specific type and default value.
  #
  # Attributes automatically send events when their value changes.
  #
  # Here we create a new class with a custom attribute representing a person's mood, along with two instances. One instance has the default mood of 'happy', the other sets the mood attribute to 'sad'. Note there's nothing visible in this example yet:
  #
  #     <class name="person">
  #       <attribute name="mood" type="string" value="happy"></attribute>
  #     </class>
  #
  #     <person></person>
  #     <person mood="sad"></person>
  #
  # Let's had a handler to make our color change with the mood. Whenever the mood attribute changes, the color changes with it:
  #
  #     @example
  #     <class name="person" width="100" height="100">
  #       <attribute name="mood" type="string" value="happy"></attribute>
  #       <handler event="onmood" args="mood">
  #         var color = 'orange';
  #         if (mood !== 'happy') {
  #           color = 'blue'
  #         }
  #         this.setAttribute('bgcolor', color);
  #       </handler>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #     <person></person>
  #     <person mood="sad"></person>
  #
  # You can add as many attributes as you like to a class. Here, we add a numeric attribute for size, which changes the height and width attributes via a constraint:
  #
  #     @example
  #     <class name="person" width="${this.size}" height="${this.size}">
  #       <attribute name="mood" type="string" value="happy"></attribute>
  #       <handler event="onmood" args="mood">
  #         var color = 'orange';
  #         if (mood !== 'happy') {
  #           color = 'blue'
  #         }
  #         this.setAttribute('bgcolor', color);
  #       </handler>
  #       <attribute name="size" type="number" value="20"></attribute>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #     <person></person>
  #     <person mood="sad" size="50"></person>
  ###
  ###*
  # @attribute {String} name (required)
  # The name of the attribute
  ###
  ###*
  # @attribute {"string"/"number"/"boolean"/"json"/"expression"} [type=string] (required)
  # The type of the attribute. Used to convert from a string to an appropriate representation of the type.
  ###
  ###*
  # @attribute {String} value (required)
  # The initial value for the attribute
  ###

dr.writeCSS()
$(window).on('load', ->
  dr.initElements()
  # listen for jQuery style changes
  hackstyle(true)
)
