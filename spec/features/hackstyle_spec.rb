require 'spec_helper'

describe 'hackstyle', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/hackstyle.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'is updated via jquery and setAttribute' do
    # Verify initial conditions
    expect(find("#foo").native.css_value('background-color')).to eq 'rgba(255, 0, 0, 1)'
    expect(page.evaluate_script("foo.bgcolor")).to eq '#ff0000'
    
    # Update via setAttribute
    page.execute_script("foo.setAttribute('bgcolor', '#ffffff')")
    
    expect(find("#foo").native.css_value('background-color')).to eq 'rgba(255, 255, 255, 1)'
    expect(page.evaluate_script("foo.bgcolor")).to eq '#ffffff'
    
    # Update via camel case style name from JQuery
    page.execute_script("$('#foo').css('backgroundColor', '#00ff00')")
    
    expect(find("#foo").native.css_value('background-color')).to eq 'rgba(0, 255, 0, 1)'
    expect(page.evaluate_script("foo.bgcolor")).to eq '#00ff00'
    
    # Update via setAttribute again
    page.execute_script("foo.setAttribute('bgcolor', '#0000ff')")
    
    expect(find("#foo").native.css_value('background-color')).to eq 'rgba(0, 0, 255, 1)'
    expect(page.evaluate_script("foo.bgcolor")).to eq '#0000ff'
    
    # Update via '-' based style name from JQuery
    page.execute_script("$('#foo').css('background-color', '#00ff00')")
    
    expect(find("#foo").native.css_value('background-color')).to eq 'rgba(0, 255, 0, 1)'
    expect(page.evaluate_script("foo.bgcolor")).to eq '#00ff00'
  end
end
