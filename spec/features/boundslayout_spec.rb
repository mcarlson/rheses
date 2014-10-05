require 'spec_helper'

describe 'boundslayout', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/boundslayout.html'
  end

  it 'sets the height and width of the parent container to be as big the containing views' do
    expect(find('#container').native.css_value('width')).to eq '100px'
    expect(find('#container').native.css_value('height')).to eq '105px'
  end
end
