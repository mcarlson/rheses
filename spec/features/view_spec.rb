require 'spec_helper'

describe 'view', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/view.html'
    expect(page).to have_selector('view.dreeminited')
  end

  it 'height and width include padding (box-sizing should be border-box)' do
    expect(page.evaluate_script("$('#v1').css('box-sizing')")).to eq 'border-box'
  end
  
  it 'responds to set attribute changes at runtime' do
    find("#v2").click
    expect(page.evaluate_script("v2.bgcolor")).to eq 'AntiqueWhite'
  end
end
