require 'spec_helper'

describe 'inputtext', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/inputtext.html'
  end

  it 'can take user input and output the value' do
    expect(page).to have_content 'Enter your name'
    find("#nameinput").find('input').set('Lorien')
    find('#submitbtn').click
    expect(page).to have_content 'Welcome Lorien'
  end

  it 'sets the width and height of the inner input to that of the inputtext' do
    expect(find("#nameinput").find('input').native.css_value('width')).to eq "#{page.evaluate_script('nameinput.width')}px"
    find('#widthbtn').click
    expect(find("#nameinput").find('input').native.css_value('width')).to eq "#{page.evaluate_script('nameinput.width')}px"

    expect(find("#nameinput").find('input').native.css_value('height')).to eq "#{page.evaluate_script('nameinput.height')}px"
    find('#heightbtn').click
    expect(find("#nameinput").find('input').native.css_value('height')).to eq "#{page.evaluate_script('nameinput.height')}px"
  end
end
