require 'capybara'
require 'capybara/rspec'
#require 'capybara/poltergeist'
# require 'capybara/webkit'

#https://github.com/jnicklas/capybara

#neither of these headless drivers work for different reasons. would be great to get them working.

#uses phantomJS:https://github.com/teampoltergeist/poltergeist
#Capybara.javascript_driver = :poltergeist

#headless webkit driver using qt https://github.com/thoughtbot/capybara-webkit
#Capybara.javascript_driver = :webkit

Capybara.app_host = 'http://127.0.0.1:8080'

if (ENV['SAUCE'])
  puts 'Running tests on Saucelabs...'
  require 'sauce_helper'
elsif (ENV['FIREFOX'])
  #nothing to do, this is the default
else
  Capybara.register_driver :selenium_chrome do |app|
    Capybara::Selenium::Driver.new(app, :browser => :chrome)
  end
  Capybara.javascript_driver = :selenium_chrome
end

#Capybara.default_wait_time = 10
