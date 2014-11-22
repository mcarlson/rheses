require 'spec_helper'

describe 'shrinktofit', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/shrinktofit.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'sets the height and width of the parent container to be as big the containing views' do
    expect(find('#container').native.css_value('width')).to eq '100px'
    expect(find('#container').native.css_value('height')).to eq '105px'
  end
end
