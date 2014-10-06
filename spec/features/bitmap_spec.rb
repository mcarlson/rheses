require 'spec_helper'

describe 'bitmap', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/bitmap.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'sets the background-url to the src of the bitmap' do
    expect(find("#shasta").native.css_value('background-image').include?(page.evaluate_script('shasta.src'))).to be true
  end
end
