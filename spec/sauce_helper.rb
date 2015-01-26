# Use Capybara integration
require "sauce"
require "sauce/capybara"

Capybara.default_driver = :sauce

# Set up configuration
Sauce.config do |c|
  c[:browsers] = [
      #["Windows 7", "Firefox", "31"],
      #["Windows 7", "Chrome", nil],
      #["OS X 10.9", "Firefox", nil],
      #["OS X 10.9", "Chrome", nil],
      #["Linux", "Chrome", nil],
      ['OS X 10.9', 'iPhone', '7.1'],
      ['Linux', 'Android', '4.3']
  ]
end
