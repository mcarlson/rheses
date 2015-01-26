module.exports = function(grunt) {
  // Do grunt-related things in here

  grunt.loadNpmTasks('grunt-saucelabs');
  
  // Project configuration.
  grunt.initConfig({
    'saucelabs-custom': {
      all: {
        options: {
          "max-duration": 300,
          urls: [
            //'http://localhost:8080/saucerunner.html'
            'http://localhost:8080/saucerun'
            
            //'http://localhost:8080/smoke/bitmapbutton.html', //no asserts
            //'http://localhost:8080/smoke/misc.html', //no asserts
//            'http://localhost:8080/smoke/replicatorbug.html', //no asserts (assert doesn't run)
            
//            'http://localhost:8080/smoke/ace.html', //passing
//            'http://localhost:8080/smoke/animator.html', //passing
//            'http://localhost:8080/smoke/animator_js.html', //passing
//            'http://localhost:8080/smoke/animgroup.html', //passing
//            'http://localhost:8080/smoke/art.html', //passing
//            'http://localhost:8080/smoke/attributes.html', //passing
//            'http://localhost:8080/smoke/bitmap.html', //passing
//            'http://localhost:8080/smoke/button.html', //passing
//            'http://localhost:8080/smoke/circularevent.html', //passing
//            'http://localhost:8080/smoke/class.html', //passing
//            'http://localhost:8080/smoke/dre.html', //passing
//            'http://localhost:8080/smoke/events.html', //passing
//            'http://localhost:8080/smoke/handlers.html', //passing
//            'http://localhost:8080/smoke/idle.html', //passing
//            'http://localhost:8080/smoke/initialization.html', //passing
//            'http://localhost:8080/smoke/inputtext.html'//, //passing
//            'http://localhost:8080/smoke/labelbutton.html', //passing
//            'http://localhost:8080/smoke/layout_align.html', //passing
//            'http://localhost:8080/smoke/layout_constant.html', //passing
//            'http://localhost:8080/smoke/layout_resize.html', //passing
//            'http://localhost:8080/smoke/layout_spaced.html', //passing
//            'http://localhost:8080/smoke/layout_variable.html', //passing
//            'http://localhost:8080/smoke/layout_wrapping.html', //passing
//            'http://localhost:8080/smoke/node.html', //passing
//            'http://localhost:8080/smoke/replication.html', //passing
//            'http://localhost:8080/smoke/scrollable.html', //passing
//            'http://localhost:8080/smoke/setter.html', //passing
//            'http://localhost:8080/smoke/sizetodom.html', //passing
//            'http://localhost:8080/smoke/statebutton.html', //passing
//            'http://localhost:8080/smoke/states.html', //passing
//            'http://localhost:8080/smoke/super.html', //passing
//            'http://localhost:8080/smoke/text.html'//, //failing
//            'http://localhost:8080/smoke/twojs.html', //passing
//            'http://localhost:8080/smoke/video.html', //passing
//            'http://localhost:8080/smoke/view.html', //passing
//            'http://localhost:8080/smoke/view_border_padding.html', //passing
//            'http://localhost:8080/smoke/view_bounds_transforms.html', //passing
//            'http://localhost:8080/smoke/view_position.html', //passing
//            'http://localhost:8080/smoke/view_size.html', //passing
//            'http://localhost:8080/smoke/z.html' //passing
          ],
          testname: 'DREEM smoke test',
  
          browsers: [
            {
              platform: 'OS X 10.10',
              browserName: 'chrome',
              version: '39'
            },
            {
              platform: 'OS X 10.10',
              browserName: 'firefox',
              version: '34'
            },
            {
              platform: 'Windows 8.1',
              browserName: 'chrome',
              version: '39'
            },
            {
              platform: 'Windows 8.1',
              browserName: 'firefox',
              version: '34'
            },
            {
              platform: 'Linux',
              browserName: 'chrome',
              version: '39'
            },
            {
              platform: 'Linux',
              browserName: 'firefox',
              version: '34'
            },
            {
              browserName: 'android',
              version: '4.4',
              platform: 'Linux',
              deviceName: 'Android Emulator',
              'device-orientation': 'portrait'
            },
            {
              browserName: 'iphone',
              version: '8.1',
              platform: 'OS X 10.9',
              deviceName: 'iPhone Simulator',
              'device-orientation': 'portrait'
            }//,
//            {
//              browserName: 'iphone',
//              version: '6.1',
//              platform: 'OS X 10.9',
//              deviceName: 'iPhone Simulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'iphone',
//              version: '7.1',
//              platform: 'OS X 10.9',
//              deviceName: 'iPhone Simulator',
//              'device-orientation': 'portrait'
//            }//,
//            {
//              browserName: 'ipad',
//              version: '8.1',
//              platform: 'OS X 10.9',
//              deviceName: 'iPad Simulator',
//              'device-orientation': 'portrait'
//            }//,            
            
            
            
//            {
//              browserName: 'android',
//              version: '4.3',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.2',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.1',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.0',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.4',
//              platform: 'Linux',
//              deviceName: 'Google Nexus 7 HD Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.4',
//              platform: 'Linux',
//              deviceName: 'Google Nexus 7C Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.0',
//              platform: 'Linux',
//              deviceName: 'HTC Evo 3D Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.1',
//              platform: 'Linux',
//              deviceName: 'HTC One X Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.4',
//              platform: 'Linux',
//              deviceName: 'LG Nexus 4 Emulator',
//              'device-orientation': 'portrait'
//            }
          ]
          // optionally, he `browsers` param can be a flattened array:
          // [["XP", "firefox", 19], ["XP", "chrome", 31]]
        }
      }
    }
  });

  grunt.registerTask('default', ['saucelabs-custom']);

};
