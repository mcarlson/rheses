return {
  localStorage: do ->
    mod = 'dr'
    try
      localStorage.setItem(mod, mod)
      localStorage.removeItem(mod)
      return true
    catch e
      return false
  # detect touchhttp://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
  touch: 'ontouchstart' of window or 'onmsgesturechange' of window # deal with ie10
  camelcss: navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  raf: window.requestAnimationFrame       or
       window.webkitRequestAnimationFrame or
       window.mozRequestAnimationFrame    or
       window.oRequestAnimationFrame      or
       window.msRequestAnimationFrame
  prefix: (
    () ->
      styles = window.getComputedStyle(document.documentElement, '')
      pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) or (styles.OLink is '' and ['', 'o']))[1]
      dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1]
      {
        dom:dom
        lowercase:pre
        css:'-' + pre + '-'
        js:pre[0].toUpperCase() + pre.substr(1)
      }
    )()
}