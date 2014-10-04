require 'spec_helper'

describe 'inputtext', :type => :feature, :js => true do

  it 'can take user input and output the value' do
    visit '/spec/inputtext.html'
    expect(page).to have_content 'Enter your name'
    find("#nameinput").find('input').set('Lorien')
    find('labelbutton').click
    expect(page).to have_content 'Welcome Lorien'
  end
end
