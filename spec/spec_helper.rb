require 'capybara'
require 'capybara/rspec'
require 'capybara/poltergeist'
require 'capybara/webkit'

#https://github.com/jnicklas/capybara

#neither of these headless drivers work for different reasons. would be great to get them working.

#uses phantomJS:https://github.com/teampoltergeist/poltergeist
#Capybara.javascript_driver = :poltergeist

#headless webkit driver using qt https://github.com/thoughtbot/capybara-webkit
#Capybara.javascript_driver = :webkit

Capybara.app_host = 'http://127.0.0.1:8080'

#the standard wait mechanism doesn't work with dreem - tries to run the spec before the DOM elements have been created
Capybara.default_wait_time = 10
