express-cache-control
=====================

Add caching to your requests in 4 easy steps!


1. Install: `npm install --save express-cache-control`

2. Require: `var CacheControl = require("express-cache-control")`

3. Instantiate: `var cache = new CacheControl().middleware`

4. Mixin it: `app.get("/routetocache", cache("hours", 3), routes.get)`


Other stuff:

- Override caching for development: var cache = new CacheControl({override: 0}).middleware

- The middleware method is bound to the CacheControl instance so you can treat it like a real function `var cache = new CacheControl({override: 0}).middleware`

- leave off the value to assume 1 `cache("hour")`

cache for:
seconds
minutes
hours
days
weeks
months
years




TODO:
Write some tests
