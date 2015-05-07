require 'spec_helper'

describe 'bitmap', :type => :feature, :js => true, :sauce => true do

  before :each do
    visit '/spec/features/bitmap.html'
    expect(page).to have_selector('view.dreeminited')
  end

  it 'sets the background-url to the src of the bitmap' do
    expect(find("#shasta").native.css_value('background-image').include?(page.evaluate_script('shasta.src'))).to be true
  end
end
