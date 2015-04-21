'use strict';

var Primus = require('primus.io');
var UAParser = require('ua-parser-js');

module.exports = {};
module.exports.startServer = function(httpServer) {
  
  var state;
  var defaultroom = 'broadcast';
  var devices = {};
  var primus = new Primus(httpServer, { transformer: 'SockJS' });
  var uaparser = new UAParser();
  
  var getDeviceID = function(req) {
    // console.log('getDeviceID', recentip + '~' + req.headers['user-agent'])
    return recentip + '~' + req.headers['user-agent']
  }
  
  var updateDevices = function () {
    var devicelist = [];
    var keys = Object.keys(devices).sort();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      devicelist.push(devices[key]);
    }
    primus.write({type: 'devices', data: devicelist});
  }
  
  // grab the remote IP before it disappears in the bowels of primus - key for unregistering
  // devices when they disconnect
  var recentip = null
  primus.before('name', function (req, res) {
    recentip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      (req.socket && req.socket.remoteAddress) ||
      (req.connection.socket && req.connection.socket.remoteAddress);
  });
  
  primus.on('connection', function (spark) {
    var obj = uaparser.setUA(spark.headers['user-agent']).getResult();
    // console.log(JSON.stringify(devices))
    obj.ip = recentip;
    obj.id = spark.id
    devices[getDeviceID(spark.request)] = obj
    // console.log('device connected', getDeviceID(spark.request))
    updateDevices();
  
//    this will store socket values between refreshes. Disabled for now, but really should be configurable
//    if (state) {
//      primus.write(state);
//    }
  
    // always join the default room
    spark.join(defaultroom);
  
    spark.on('data', function (data) {
      state = data
      if (process.env.DEBUG) {
        console.log('data', JSON.stringify(data));
      }
      spark.join(defaultroom, function () {
        // send message to all clients except this one
        spark.room(defaultroom).except(spark.id).write(data);
      });
    });
  })
  
  primus.on('disconnection', function (spark) {
    delete devices[getDeviceID(spark.request)]
    // console.log('device disconnected', getDeviceID(spark.request))
    updateDevices();
  });
}
