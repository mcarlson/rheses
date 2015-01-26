require 'spec_helper'

describe 'handlers', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/handlers.html'
    expect(page).to have_selector('view.dreeminited')
  end
  
  describe 'by reference' do
    
    it 'a handler can be attached by reference to a node that is a sibling of its parent' do
      find("#v1").click
      expect(page.evaluate_script("window.v1clicked")) == true
      
      find("#v2").click
      expect(page.evaluate_script("window.v2clicked")) == true
    end
  end
end
