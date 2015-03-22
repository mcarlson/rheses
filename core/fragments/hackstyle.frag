hackstyle = do ->
  # hack jQuery to send a style event when CSS changes
  monitoredJQueryStyleProps = {}
  for prop, value of stylemap
    monitoredJQueryStyleProps[value] = prop

  origstyle = $.style
  styletap = (elem, name, value) ->
    attrName = monitoredJQueryStyleProps[name]
    unless attrName?
      # Normalize style names to camel case names by removing '-' and upper
      # casing the subsequent character.
      attrName = monitoredJQueryStyleProps[name.replace(/-([a-z])/i, (m) -> m[1].toUpperCase())]
      attrName = monitoredJQueryStyleProps[name] = if attrName then attrName else name

    if attrName
      view = elem.$view
      if view[attrName] isnt value
        # console.log('sending style', name, elem.$view._locked) if sendstyle
        view.setAttribute(attrName, value)

    origstyle.apply(@, arguments)

  return (active) ->
    if active
      $.style = styletap
    else
      $.style = origstyle