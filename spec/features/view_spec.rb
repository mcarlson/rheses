require 'spec_helper'

describe 'view', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/view.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'height and width include padding (box-sizing should be border-box)' do
    expect(find("#v1").native.css_value('box-sizing')).to eq 'border-box'
  end
end
