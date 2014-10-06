require 'spec_helper'

describe 'checkbutton', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/checkbutton.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'box color and selected value change when clicked' do
    expect(page.evaluate_script('pinkbtn.selected')).to be false
    find("#pinkbtn").click
    expect(find("#pinkbtn").find('view').native.css_value('background-color')).to eq 'rgba(255, 192, 203, 1)'
    expect(page.evaluate_script('pinkbtn.selected')).to be true
  end
end
