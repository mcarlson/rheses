require 'capybara'
require 'capybara/rspec'
require 'capybara/poltergeist'
# require 'capybara/webkit'

#https://github.com/jnicklas/capybara

#neither of these headless drivers work for different reasons. would be great to get them working.

#uses phantomJS:https://github.com/teampoltergeist/poltergeist
#Capybara.javascript_driver = :poltergeist

#headless webkit driver using qt https://github.com/thoughtbot/capybara-webkit
#Capybara.javascript_driver = :webkit

Capybara.app_host = 'http://127.0.0.1:8080'

#Capybara.default_wait_time = 10

#call with: "wait_for_javascript_event 'dreemInited'" if needed
def wait_for_javascript_event event_name
  selenium_bridge.setScriptTimeout(Capybara.default_wait_time * 1000)

  #puts "waiting for event #{event_name}"
  selenium_driver.execute_async_script(
      "var callback = arguments[arguments.length - 1];
    if (window.DREEM_INITED) setTimeout(callback, 10);
    else window.addEventListener('dreeminit', function (e) { setTimeout(callback, 10);  return true; }, false);"
  )
end

def selenium_driver
  page.driver.browser
end

def selenium_bridge
  selenium_driver.send(:bridge)
end
