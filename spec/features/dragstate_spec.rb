require 'spec_helper'

describe 'dragstate', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/dragstate.html'
    wait_for_javascript_event 'dreemInited'
  end
  
  #this is pretty hacky, I just couldn't figure out how else to test this other than simulating events from dr.mouse, hence
  #the poking in the internals
  it 'should make a view draggable' do
    find('#v1').drag_to(find('#v2'))
    
    page.execute_script "dr.mouse.x = 100"
    page.execute_script "dr.mouse.y = 100"
    page.execute_script "$('#v1').trigger('mousedown')"
    expect(page.evaluate_script("v1.bgcolor")).to eq 'BurlyWood'
    
    page.execute_script "dr.mouse.x = 150"
    page.execute_script "dr.mouse.y = 450"
    page.execute_script "dr.mouse.sender()"
    page.execute_script "$('#v1').trigger('mouseup')"
    expect(page.evaluate_script("v1.bgcolor")).to eq 'red'
    
    expect(page.evaluate_script("v1.x")).to eq 150
    expect(page.evaluate_script("v1.y")).to eq 450
  end
end
