var _ = require("underscore")

var headerKey = 'Cache-Control'
var noCacheKey = 'no-cache'
var maxAgeKey = 'max-age'
var mustRevalidateKey = 'must-revalidate'

var units = {}
units.second = 1
units.minute = units.second * 60
units.hour = units.minute * 60
units.day = units.hour * 24
units.week = units.day * 7
units.month = units.day * 30
units.year = units.day * 365

// add plural units
Object.keys(units).forEach(function (unit) {
    units[unit + "s"] = units[unit]
})

var middleware = function (seconds) {
    return function (req, res, next) {
        if (seconds === 0) {
            res.header(headerKey, noCacheKey)
        }
        else {
            res.header(headerKey, maxAgeKey + "=" + seconds + ", " + mustRevalidateKey)
        }

        next()
    }
}

function CacheControl (options) {
    if (!options) options = {}

    this.override = options.override

    this.middleware = _.bind(this.middleware, this)
}

CacheControl.prototype = {
    calculate: function (unit, value) {
        if (unit === 0 || value === 0 || unit === false) return 0

        var unitValue = units[unit]
        if (!unitValue) throw new Error("CacheControl unknown unit " + unit)

        if (this.override !== undefined) {
            return this.override
        }

        if (!value) value = 1 // default to 1 (unless it is 0 which we already checked) so they can cache("day")

        return unitValue * value
    },

    middleware: function (unit, value) {
        return middleware(this.calculate(unit, value))
    }
}

module.exports = CacheControl
