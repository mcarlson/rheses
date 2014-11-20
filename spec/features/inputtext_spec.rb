require 'spec_helper'

describe 'inputtext', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/inputtext.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'can take user input and output the value' do
    expect(page).to have_content 'Enter your name'
    find("#nameinput").find('input').set('Lorien')
    find('#submitbtn').click
    expect(page).to have_content 'Welcome Lorien'
  end

  it 'sets the width and height of the inner input to that of the inputtext minus the border width' do
    expect(find("#nameinput").find('input').native.css_value('width')).to eq "#{page.evaluate_script('nameinput.width')-2}px"
    find('#widthbtn').click
    expect(find("#nameinput").find('input').native.css_value('width')).to eq "#{page.evaluate_script('nameinput.width')-2}px"

    expect(find("#nameinput").find('input').native.css_value('height')).to eq "#{page.evaluate_script('nameinput.height')-2}px"
    find('#heightbtn').click
    expect(find("#nameinput").find('input').native.css_value('height')).to eq "#{page.evaluate_script('nameinput.height')-2}px"
  end

  it 'can be clicked into' do
    find('#nameinput').click
    page.evaluate_script("$('#nameinput').find('input').attr('id', 'testid')")
    expect(page.evaluate_script("document.activeElement.id")).to eq "testid"
  end
end
