  ###*
  # @class dr.class {Core Dreem}
  # Allows new tags to be created. Classes only be created with the &lt;class>&lt;/class> tag syntax.
  #
  # Classes can extend any other class, and they extend dr.view by default.
  #
  # Once declared, classes invoked with the declarative syntax, e.g. &lt;classname>&lt;/classname>.
  #
  # If a class can't be found in the document, dreem will automatically attempt to load it from the classes/* directory.
  #
  # Like views and nodes, classes can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
  #
  # Here is a class called 'tile' that extends dr.view. It sets the bgcolor, width, and height attributes. An instance of tile is created using declarative syntax.
  #
  #     @example
  #     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
  #
  #     <tile></tile>
  #
  # Now we'll extend the tile class with a class called 'labeltile', which contains a label inside of the box. We'll declare one each of tile and labeltile, and position them with a spacedlayout.
  #
  #     @example
  #     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
  #
  #     <class name="labeltile" extends="tile">
  #       <text text="Tile"></text>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #     <tile></tile>
  #     <labeltile></labeltile>
  #
  # Attributes that are declared inside of a class definition can be set when the instance is declared. Here we bind the label text to the value of an attribute called label.
  #
  #     @example
  #     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
  #
  #     <class name="labeltile" extends="tile">
  #       <attribute name="label" type="string" value=""></attribute>
  #       <text text="${this.parent.label}"></text>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #     <tile></tile>
  #     <labeltile label="The Tile"></labeltile>
  #
  ###
  class Class
    ###*
    # @attribute {String} name (required)
    # The name of the new tag.
    ###
    ###*
    # @attribute {String} [extends=view]
    # The name of a class that should be extended.
    ###
    ###*
    # @attribute {"js"/"coffee"} [type=js]
    # The default compiler to use for methods, setters and handlers. Either 'js' or 'coffee'
    ###
    ###*
    # @attribute {Boolean} [initchildren=true]
    # If false, class instances won't initialize their children.
    ###
    constructor: (el, classattributes = {}) ->
      name = (if classattributes.name then classattributes.name.toLowerCase() else classattributes.name)
      extend = classattributes.extends ?= 'view'
      compilertype = classattributes.type
      skipinitchildren = classattributes.initchildren is 'false'
      delete classattributes.initchildren

      # only class instances should specify these
      for ignored of ignoredAttributes
        delete classattributes[ignored]

      # Strip comments out of class definition to reduce bloat when 
      # instances are created since all child nodes get copied to instances.
      for child in el.childNodes
        if child? and child.nodeType is COMMENT_NODE then child.parentNode.removeChild(child)

      # collapse children into attributes
      processedChildren = dom.processSpecialTags(el, classattributes, compilertype)

      # console.log('compiled class', name, extend, classattributes)

      # cache the old contents to preserve appearance
      oldbody = el.innerHTML.trim()

      for child in processedChildren
        child.parentNode.removeChild(child)
      haschildren = dom.getChildElements(el).length > 0

      # serialize the tag's contents for recreation with processedChildren removed
      instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      # console.log('new class', name, classattributes)
      console.warn 'overwriting class', name if name of dr

      # class instance constructor
      dr[name] = klass = (instanceel, instanceattributes, internal, skipchildren) ->
        # override class attributes with instance attributes
        attributes = clone(classattributes)
        _processAttrs(instanceattributes, attributes)
        attributes.$instanceattributes ?= instanceattributes

        if not (extend of dr)
          console.warn 'could not find class for tag', extend
          return

        # tagname would be 'class' in this case, replace with the right one!
        # also, don't overwrite if it's already set, since we are invoking dr[extend]
        if attributes.$tagname is 'class' or not attributes.$tagname
          attributes.$tagname = name

        # skip Node.oninit event
        attributes.$skiponinit = true
        # defer bindings until after children are created
        attributes.$deferbindings = haschildren

        # console.log 'creating class instance', name, attributes.$tagname, instanceel, extend, attributes
        # call with the fourth argument as true to prevent creating children for the class we are extending
        parent = new dr[extend](instanceel, attributes, true, true)
        # console.log 'created class instance', name, extend, parent

        viewel = parent.sprite?.el

        if instanceel
          # hide contents of invisible nodes
          instanceel.setAttribute('class', 'hidden') unless viewel

        # unpack instance children
        if viewel
          if instancebody
            viewhtml = viewel.innerHTML.trim()
            if viewhtml
              # Append class children on instances instead of replacing them
              viewel.innerHTML = instancebody + viewhtml
              # console.log 'instancebody', instancebody, viewel.innerHTML, viewel
            else
              # console.log 'normal'
              viewel.innerHTML = instancebody

          unless skipchildren
            children = (child for child in dom.getChildElements(viewel) when child.localName not in specialtags)
            unless skipinitchildren
              for child in children
                # console.log 'creating class child in parent', child, parent, attributes
                dom.initElement(child, parent)

        unless skipchildren
          sendInit = () ->
            # console.log('sendInit', parent.inited, parent)
            return if parent.inited
            parent._bindHandlers(true)
            parent.initialize()

          if internal
            callOnIdle(sendInit)
          else
            # the user called dr[foo]() directly, init immediately
            sendInit()
        return parent

      if name
        # Store a secondary reference under an object if tagPackageSeparator 
        # syntax is used for the class name. This creates rudimentary namespacing.
        parts = name.split(tagPackageSeparator)
        len = parts.length
        if len > 1
          context = dr
          for part, idx in parts
            if idx is len - 1
              context[part] = klass
            else
              newContext = context[part]
              context[part] = newContext = {} unless newContext
              context = newContext
      
      # remember this for later when we're instantiating instances
      klass.skipinitchildren = skipinitchildren
      klass.classattributes = classattributes