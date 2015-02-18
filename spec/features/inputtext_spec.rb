require 'spec_helper'

describe 'inputtext', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/inputtext.html'
    expect(page).to have_selector('view.dreeminited')
  end

  it 'can take user input and output the value' do
    expect(page).to have_content 'Enter your name'
    find("#nameinput").find('input').set('Lorien')
    find('#submitbtn').click
    expect(page).to have_content 'Welcome Lorien'
  end

  it 'can be clicked into' do
    find('#nameinput').click
    page.evaluate_script("$('#nameinput').find('input').attr('id', 'testid')")
    expect(page.evaluate_script("document.activeElement.id")).to eq "testid"
  end
end
