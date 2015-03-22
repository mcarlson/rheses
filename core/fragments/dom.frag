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
          loadInclude("/classes/skin.dre")

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
            loadInclude("/classes/" + name.split(tagPackageSeparator).join('/') + ".dre", el) if name
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
            oneurl = '/lib/one_base.js'
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
              loadScript('/lib/animator.js', callback, 'Missing /lib/animator.js')
              for el in jqel.find('[scriptincludes]')
                for url in el.attributes.scriptincludes.value.split(',')
                  loadScript(url.trim(), callback, el.attributes.scriptincludeserror?.value.toString())
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
        }).done((data) ->
          filereloader()
        )

      validator = ->
        $.ajax({
          url: '/validate/',
          data: {url: window.location.pathname},
          success: (data) ->
            # we have a teem server!
            showWarnings(data) if (data.length)
            filereloader()
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
        console.warn 'refusing to create a class that would overwrite the builtin tag', tagname unless tagname is 'input'
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
        "font-family:mission-gothic, 'Helvetica Neue', Helvetica, Arial, sans-serif"
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