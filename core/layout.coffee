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
  texttransform: 'textTransform'
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

hackstyle = `~["include","fragments/hackstyle.coffee"]~`

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

  Events = `~["include","fragments/Events.coffee"]~`
  Module = `~["include","fragments/Module.coffee"]~`

  # Internal attributes ignored by class declarations and view styles
  ignoredAttributes = {
    parent: true
    id: true
    name: true
    extends: true
    type: true
    scriptincludes: true
  }

  Eventable = `~["include","fragments/Eventable.coffee"]~`
  capabilities = `~["include","fragments/capabilities.coffee"]~`

  querystring = window.location.search
  debug = querystring.indexOf('debug') > 0
  test = querystring.indexOf('test') > 0

  compiler = `~["include","fragments/compiler.coffee"]~`

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

  Node = `~["include","fragments/Node.coffee"]~`
~["if","runtime","dali"]~
  Sprite = `~["include","fragments/sprite/dali/Sprite.coffee"]~`
~["else"]~
  Sprite = `~["include","fragments/sprite/dom/Sprite.coffee"]~`
  TextSprite = `~["include","fragments/sprite/dom/TextSprite.coffee"]~`
  InputTextSprite = `~["include","fragments/sprite/dom/InputTextSprite.coffee"]~`
  ArtSprite = `~["include","fragments/sprite/dom/ArtSprite.coffee"]~`
  BitmapSprite = `~["include","fragments/sprite/dom/BitmapSprite.coffee"]~`
~["endif"]~
  View = `~["include","fragments/View.coffee"]~`

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

  dom = do ->
    # flatten element.attributes to a hash
    flattenattributes = (namednodemap)  ->
      attributes = {}
      for i in namednodemap
        attributes[i.name] = i.value
      attributes

    sendInit = (el) ->
      # Create the event.
      event = document.createEvent('Event')
      event.initEvent('dreeminit', true, true)
      window.dispatchEvent(event)
      $(el).addClass('dreeminited')
      
      
    # initialize a top-level view element
    initFromElement = (el) ->
      instantiating = true
      el.style.visibility = 'hidden'
      findAutoIncludes(el, () ->
        el.style.visibility = null
        initElement(el)
        # register constraints last
        _initConstraints()
        sendInit(el)
      )

    getChildElements = (el) ->
      child for child in el.childNodes when child.nodeType is 1

    findAutoIncludes = (parentel, finalcallback) ->
      jqel = $(parentel)

      includedScripts = {}
      loadqueue = []
      scriptloading = false
      dependencies = []
      loadScript = (url, cb, error) ->
        return if url of includedScripts
        includedScripts[url] = true
        dependencies.push(url)

        if (scriptloading)
          loadqueue.push(url, error)
          return url

        appendScript = (url, cb, error='failed to load scriptinclude ' + url) ->
          # console.log('loading script', url)
          scriptloading = url
          script = document.createElement('script')
          script.type = 'text/javascript'
          $('head').append(script)
          script.onload = cb
          script.onerror = (err) ->
            console.error(error, err)
            cb()
          script.src = url

        appendcallback = () ->
          # console.log('loaded script', scriptloading, loadqueue.length, includedScripts[url])
          scriptloading = false
          if loadqueue.length is 0
            # console.log('done, calling callback', cb)
            cb()
          else
            appendScript(loadqueue.shift(), appendcallback, loadqueue.shift())

        appendScript(url, appendcallback, error)

      # classes declared inline with the class tag
      inlineclasses = {}
      # current list of jquery promises for outstanding requests
      filerequests = []
      # hash of files and classes loaded already
      fileloaded = {}

      loadInclude = (url, el) ->
        return if url of fileloaded
        fileloaded[url] = el
        dependencies.push(url)
        prom = $.get(url)
        prom.url = url
        prom.el = el
        filerequests.push(prom)

      loadMixins = (el, names={}) ->
        if el.attributes.with and el.attributes.with.value?
          # load instance mixins with
          for mixin in el.attributes.with.value.split(',')
            names[mixin.trim()] = el

      findMissingClasses = (names={}) ->
        # look for class declarations and unloaded classes for tags
        for el in jqel.find('*')
          name = el.localName
          if name is 'class'
            if el.attributes.extends
              # load load class extends
              names[el.attributes.extends.value] = el
            # track inline class declaration so we don't attempt to load it later
            loadMixins(el, names)
            inlineclasses[el.attributes.name?.value] = true
          else if name is 'replicator'
            # load class instance for tag
            names[name] = el
            # load classname instance as well
            names[el.attributes.classname.value] = el
            loadMixins(el, names)
          else
            # don't autoload elements found inside specialtags, e.g. setter
            unless el.parentNode.localName in specialtags
              # load class instance for tag
              names[name] = el
              loadMixins(el, names)

        # filter out classnames that may have already been loaded or should otherwise be ignored
        out = {}
        for name, el of names
          unless name of dr or name of fileloaded or name in specialtags or name of inlineclasses or builtinTags[name]
            out[name] = el
        out

      findIncludeURLs = (urls={}) ->
        for el in jqel.find('include')
          url = el.attributes.href.value
          el.parentNode.removeChild(el)
          urls[url] = el
          # console.log('found include', url)
        urls

      loadIncludes = (callback) ->

        #preload skin
        unless fileloaded['skin']
          fileloaded['skin'] = true
          loadInclude(DREEM_ROOT + "classes/skin.dre")

      # load includes
        for url, el of findIncludeURLs()
          # console.log 'include url', url
          loadInclude(url, el)

        # wait for all includes to load
        $.when.apply($, filerequests).done((args...) ->
          # append includes
          args = [args] if (filerequests.length is 1)
          filerequests = []
          # console.log('loaded includes', args)

          includeRE = /<[\/]*library>/gi
          for xhr in args
            # remove any library tags found
            html = xhr[0].replace(includeRE, '')
            # console.log 'inserting include', html
            jqel.prepend(html)

          # load missing classes
          for name, el of findMissingClasses()
            fileloaded[name] = true
            loadInclude(DREEM_ROOT + "classes/" + name.split(tagPackageSeparator).join('/') + ".dre", el) if name
            # console.log 'loading dre', name, url, el

          # console.log(filerequests, fileloaded, inlineclasses)
          # wait for all dre files to finish loading
          $.when.apply($, filerequests).done((args...) ->
            args = [args] if (filerequests.length is 1)
            filerequests = []

            for xhr in args
              # console.log 'inserting html', args, xhr[0]
              jqel.prepend(xhr[0])
              
              # Remove top level comment nodes from included files
              jqel.contents().each(() ->
                if @nodeType is COMMENT_NODE then $(this).remove()
              )

            includes = findMissingClasses(findIncludeURLs())
            if Object.keys(includes).length > 0
              # console.warn("missing includes", includes)
              loadIncludes(callback)
              return

            # find class script includes and load them in lexical order

            # initialize ONE integration
            oneurl = DREEM_ROOT + 'lib/one_base.js'
            $.ajax({
              dataType: "script",
              cache: true,
              url: oneurl
            }).done(() ->
              # init one_base
              ONE.base_.call(Eventable::)
              # hide builtin keys from learn()
              Eventable::enumfalse(Eventable::keys())
              Node::enumfalse(Node::keys())
              View::enumfalse(View::keys())
              Layout::enumfalse(Layout::keys())
              State::enumfalse(State::keys())

              # load scriptincludes
              loadScript(DREEM_ROOT + 'lib/animator.js', callback, 'Missing /lib/animator.js')
              for el in jqel.find('[scriptincludes]')
                for url in el.attributes.scriptincludes.value.split(',')
                  trimmedUrl = url.trim()
                  trimmedUrl = DREEM_ROOT + trimmedUrl unless trimmedUrl.match(/^\w+:\/\//) || trimmedUrl.match(/^\//)
                  loadScript(trimmedUrl, callback, el.attributes.scriptincludeserror?.value.toString())
            ).fail(() ->
              console.warn("failed to load #{oneurl}")
            )
          ).fail((args...) ->
            args = [args] if (args.length is 1)
            for xhr in args
              showWarnings(["failed to load #{xhr.url} for element #{xhr.el.outerHTML}"])
            return
          )
          # now that we're done, avoid holding references to the elements
          for file of fileloaded
            fileloaded[file] = true
        ).fail((args...) ->
          args = [args] if (args.length is 1)
          for xhr in args
            showWarnings(["failed to load #{xhr.url} for element #{xhr.el.outerHTML}"])
          return
        )

      blacklist = ['/primus/primus.io.js']
      filereloader = ->
        dependencies.push(window.location.pathname)
        dependencies.push('/core/layout.coffee')
        paths = dependencies.filter((path) ->
          return true unless path in blacklist
        )
        # console.log('listen for changes watching', dependencies)
        $.ajax({
          url: '/watchfile/',
          datatype: 'text',
          data: {url: paths},
          success: (url) ->
            if url in paths
              # alert('reload')
              window.location.reload()
          error: (jqXHR, textStatus, errorThrown) ->
            if jqXHR.status == 0
              console.log('Connecting to watcher error, reloading:', textStatus)
              setTimeout(filereloader, 3000)
            else
              console.log('Watchfile AJAX request failed', jqXHR.status, textStatus, errorThrown);
        }).done((data) ->
          console.log('File changed on server', data, 'reloading page')
          setTimeout(filereloader, 1000)
        ).fail((jqXHR, textStatus, errorThrown) ->
          if jqXHR.status == 0
            console.log('Connecting to watcher timed-out, reloading:', textStatus)
            setTimeout(filereloader, 3000)
          else
            console.log('Watchfile AJAX request failed', jqXHR.status, textStatus, errorThrown);
        )

      validator = ->
        $.ajax({
          url: '/validate/',
          data: {url: window.location.pathname},
          success: (data) ->
            # we have a teem server!
            showWarnings(data) if (data.length)
            setTimeout(filereloader, 1000)
          error: (err) ->
            console.warn('Validation requires the Teem server')
        }).always(finalcallback)

      # call the validator after everything loads
      loadIncludes(if test then finalcallback else validator)

    # tags built into the browser that should be ignored, from http://www.w3.org/TR/html-markup/elements.html
    builtinTags = {'a': true, 'abbr': true, 'address': true, 'area': true, 'article': true, 'aside': true, 'audio': true, 'b': true, 'base': true, 'bdi': true, 'bdo': true, 'blockquote': true, 'body': true, 'br': true, 'button': true, 'canvas': true, 'caption': true, 'cite': true, 'code': true, 'col': true, 'colgroup': true, 'command': true, 'datalist': true, 'dd': true, 'del': true, 'details': true, 'dfn': true, 'div': true, 'dl': true, 'dt': true, 'em': true, 'embed': true, 'fieldset': true, 'figcaption': true, 'figure': true, 'footer': true, 'form': true, 'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true, 'head': true, 'header': true, 'hgroup': true, 'hr': true, 'html': true, 'i': true, 'iframe': true, 'img': true, 'image': true, 'input': true, 'ins': true, 'kbd': true, 'keygen': true, 'label': true, 'legend': true, 'li': true, 'link': true, 'map': true, 'mark': true, 'menu': true, 'meta': true, 'meter': true, 'nav': true, 'noscript': true, 'object': true, 'ol': true, 'optgroup': true, 'option': true, 'output': true, 'p': true, 'param': true, 'pre': true, 'progress': true, 'q': true, 'rp': true, 'rt': true, 'ruby': true, 's': true, 'samp': true, 'script': true, 'section': true, 'select': true, 'small': true, 'source': true, 'span': true, 'strong': true, 'style': true, 'sub': true, 'summary': true, 'sup': true, 'table': true, 'tbody': true, 'td': true, 'textarea': true, 'tfoot': true, 'th': true, 'thead': true, 'time': true, 'title': true, 'tr': true, 'track': true, 'u': true, 'ul': true, 'var': true, 'video': true, 'wbr': true}
    # found by running './bin/builddocs' followed by 'node ./bin/findrequired.js'
    requiredAttributes = {"class":{"name":1},"method":{"name":1},"setter":{"name":1},"handler":{"event":1},"attribute":{"name":1,"type":1,"value":1},"dataset":{"name":1},"replicator":{"classname":1}}

    checkRequiredAttributes = (tagname, attributes, tag, parenttag) ->
      if tagname of requiredAttributes
        # console.log('requiredAttributes', tagname)
        for attrname of requiredAttributes[tagname]
          # console.log('checking attribute', tagname, attrname)
          unless attrname of attributes
            error = "#{tagname}.#{attrname} must be defined on #{tag.outerHTML}"
            error = error + " inside #{parenttag.outerHTML}" if parenttag
            showWarnings([error])
            # throw new Error(error)
      error

    # recursively init classes based on an existing element
    initElement = (el, parent) ->
      # don't init the same element twice
      return if el.$init
      el.$init = true

      tagname = el.localName

      if not tagname of dr
        console.warn 'could not find class for tag', tagname, el unless builtinTags[tagname]
        return
      else if builtinTags[tagname]
        console.warn 'refusing to create a class that would overwrite the builtin tag', tagname unless (tagname is 'input' or tagname is 'textarea')
        return

      attributes = flattenattributes(el.attributes)

      checkRequiredAttributes(tagname, attributes, el)

      attributes.$tagname = tagname

      # swallow builtin mouse attributes to allow event delegation, set clickable if an event is found
      for event in mouseEvents
        eventname = 'on' + event
        if eventname of attributes
          attributes.clickable = true unless attributes.clickable is false
          el.removeAttribute(eventname)

      # swallow event handler attributes to allow event delegation, e.g. <inputtext onchange="..."></inputtext>
      for attr of attributes
        if matchEvent.test(attr)
          el.removeAttribute(attr)

      parent ?= el.parentNode
      attributes.parent = parent if parent?
      # console.log 'parent for tag', tagname, attributes, parent

      li = tagname.lastIndexOf('state')
      isState = li > -1 and li is tagname.length - 5
      isClass = tagname is 'class'

      unless isClass or isState
        dom.processSpecialTags(el, attributes, attributes.type)

      # Defer oninit if we have children
      children = dom.getChildElements(el)
      attributes.$skiponinit = skiponinit = children.length > 0

      if typeof dr[tagname] is 'function'
        parent = new dr[tagname](el, attributes, true)
      else
        showWarnings(["Unrecognized class #{tagname} #{el.outerHTML}"])
        return

      return unless children.length > 0

      unless isClass or isState
        # create children now, unless the class told us not to
        unless dr[tagname].skipinitchildren
          # grab children again in case any were added when the parent was instantiated
          children = (child for child in dom.getChildElements(el) when child.localName not in specialtags)
          for child in children
            # console.log 'initting class child', child.localName
            initElement(child, parent)

        unless parent.inited
          # console.log('skiponinit', parent, parent.subnodes.length)
          checkChildren = ->
            return if parent.inited
            # console.log('doinit', parent)
            parent._bindHandlers(true)
            parent.initialize()
            return
          callOnIdle(checkChildren)
      return


    # write default CSS to the DOM
    writeCSS = ->
      style = document.createElement('style')
      style.type = 'text/css'
      spriteStyle = [
        "position:absolute"
        "pointer-events:none"
        "padding:0"
        "margin:0"
        "box-sizing:border-box"
        "border-color:transparent"
        "border-style:solid"
        "border-width:0"
      ]
      spriteTextStyle = [
        "white-space:nowrap"
        "padding:0"
        "margin:0"
        "text-decoration:none"
        "font-family:inherit"
        "font-size:20px"
      ]
      spriteInputTextStyle = [
        "border:none"
        "outline:none"
        "background-color:transparent"
        "resize:none"
      ]
      noSelectStyle = [
        "-webkit-touch-callout:none"
        "-webkit-user-select:none"
        "-khtml-user-select:none"
        "-moz-user-select:none"
        "-ms-user-select:none"
        "user-select:none"
      ]
      warningsStyle = [
        "font-size:14px"
        "background-color:pink"
        "margin:0"
      ]
      style.innerHTML = 
        '.sprite{' + spriteStyle.join(';') + '}' +
        '.sprite-text{' + spriteTextStyle.join(';') + '}' +
        '.sprite-inputtext{' + spriteInputTextStyle.join(';') + '}' +
        '.noselect{' + noSelectStyle.join(';') + '}' +
        '.warnings{' + warningsStyle.join(';') + '}' +
        '.noscrollbar::-webkit-scrollbar{display:none;}' +
        '.hidden{display:none}' +
        'method,handler,setter,class,node,dataset{display:none}'
      document.getElementsByTagName('head')[0].appendChild(style)

    # init top-level views in the DOM recursively
    initAllElements = (selector = $('view').not('view view')) ->
      for el in selector
        initFromElement(el)
      return

    # http://stackoverflow.com/questions/1248849/converting-sanitised-html-back-to-displayable-html
    htmlDecode = (input) ->
      # return if not input
      e = document.createElement('div')
      e.innerHTML = input
      out = ''
      for child in e.childNodes
        if child.nodeValue? and (child.nodeType is 3 or child.nodeType is 8)
          out += child.nodeValue
          # console.log('child', child.nodeType, child)
          # console.log('out', out)
        else
          # console.log('invalid child', child, child.nodeType, child.nodeValue)
          return
      out

    # process handlers, methods, setters and attributes
    processSpecialTags = (el, classattributes, defaulttype) ->
      classattributes.$types ?= {}
      classattributes.$methods ?= {}
      classattributes.$handlers ?= []
      children = (child for child in dom.getChildElements(el) when child.localName in specialtags)
      for child in children
        attributes = flattenattributes(child.attributes)
        # console.log child, attributes, classattributes
        tagname = child.localName
        args = (attributes.args ? '').split()
        script = htmlDecode(child.innerHTML)
        unless script?
          console.warn 'Invalid tag', name, child

        type = attributes.type ? defaulttype
        name = attributes.name

        checkRequiredAttributes(tagname, attributes, child, el)

        switch tagname
          when 'handler'
            # console.log 'adding handler', name, script, child.innerHTML, attributes
            handler =
              name: name
              ev: attributes.event
              script: compiler.transform(script, type)
              args: args
              reference: attributes.reference
              method: attributes.method

            classattributes.$handlers.push(handler)
            # console.log 'added handler', name, script, attributes
          when 'method','setter'
            if tagname is 'setter' then name = "set_#{name.toLowerCase()}"
            classattributes.$methods[name] ?= []
            classattributes.$methods[name].push({method: compiler.transform(script, type), args: args, allocation: attributes.allocation})
            # console.log 'added ' + tagname, 'set_' + name, args, classattributes.$methods
          when 'attribute'
            name = name.toLowerCase()
            classattributes[name] = attributes.value
            classattributes.$types[name] = attributes.type

      # console.log('processSpecialTags', classattributes)
      return children

    exports =
      initAllElements: initAllElements
      initElement: initElement
      processSpecialTags: processSpecialTags
      writeCSS: writeCSS
      getChildElements: getChildElements

  State = `~["include","fragments/State.coffee"]~`
  Class = `~["include","fragments/Class.coffee"]~`
  Layout = `~["include","fragments/Layout.coffee"]~`
  AutoPropertyLayout = `~["include","fragments/AutoPropertyLayout.coffee"]~`
  Path = `~["include","fragments/Path.coffee"]~`
  StartEventable = `~["include","fragments/StartEventable.coffee"]~`

  starttime = Date.now()
  idle = do ->
    requestAnimationFrame = capabilities.raf
    unless requestAnimationFrame
      # for phantom and really old browsers
      requestAnimationFrame = do ->
        (callback, element) ->
          callbackwrapper = () ->
            callback(Date.now() - starttime)
          window.setTimeout(callbackwrapper, 1000 / 60)

    ticking = false
    tickEvents = []

    doTick = (time) ->
      for key of tickEvents
        if tickEvents[key]
          # console.log('tick', key, tickEvents[key])
          tickEvents[key](time)
          tickEvents[key] = null
      ticking = false

    (key, callback) ->
      # console.log('idle', key, callback)
      # console.log('hit', key) if (tickEvents[key] isnt null)
      unless ticking
        requestAnimationFrame(doTick)
        ticking = true
      tickEvents[key] = callback

  callOnIdle = do ->
    queue = []

    callback = (time) ->
      # console.log('callback', time, queue.length)
      # snapshot the current queue to prevent recursion
      localqueue = queue
      queue = []
      for cb in localqueue
        # console.log('callback', cb)
        cb(time)
      if queue.length
        # if we have new items, call back later
        # console.log('new items', queue.length)
        setTimeout(() ->
          idle(2, callback)
        ,0)
      return

    if capabilities.raf
      (cb) ->
        queue.push(cb)
        # console.log('callOnIdle', queue)
        idle(2, callback)
        return
    else
      (cb) ->
        setTimeout(() ->
          cb(Date.now() - starttime)
        , 0)
        return

  Idle = `~["include","fragments/Idle.coffee"]~`

  # singleton that listens for mouse events. Holds data about the most recent left and top mouse coordinates
  mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup']

  Mouse = `~["include","fragments/Mouse.coffee"]~`
  Window = `~["include","fragments/Window.coffee"]~`
  Keyboard = `~["include","fragments/Keyboard.coffee"]~`

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
    _sprite:Sprite
    _textSprite:TextSprite
    _inputTextSprite:InputTextSprite
    _artSprite:ArtSprite
    _bitmapSprite:BitmapSprite
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
  #     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10"></text>
  #     <text x="50" y="${exampleLabel.y + exampleLabel.height + 20}" text="no value yet" color="white" bgcolor="#DDAA00" padding="10">
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
  # @aside guide constraints
  #
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
