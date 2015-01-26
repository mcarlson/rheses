require 'spec_helper'

describe 'text', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/text.html'
    expect(page).to have_selector('view.dreeminited')
  end

  context 'resize is true'
    it 'changes width when the text value changes' do
      expect(page).to have_content 'initial'
      expect(page.evaluate_script("$('#resizeTrueText').width()")).to eq 32
      find('#resizeTrueText').click
      widthVal = page.evaluate_script("$('#resizeTrueText').width()")
      expect((widthVal == 88) || (widthVal == 90)).to eq true
    end

  context 'resize is false'
  it ' does not change width when the text value changes' do
    expect(page).to have_content 'initial'
    expect(page.evaluate_script("$('#resizeFalseText').width()")).to eq 100
    find('#resizeFalseText').click
    expect(page.evaluate_script("$('#resizeFalseText').width()")).to eq 100
  end
end
