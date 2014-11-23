require 'spec_helper'

describe 'borderpadding', :type => :feature, :js => true do

  before :each do
    visit '/spec/features/borderpadding.html'
    wait_for_javascript_event 'dreemInited'
  end

  it 'is initially sized correctly' do
    expect(find("#container").native.css_value('width')).to eq '100px'
    expect(find("#container").native.css_value('height')).to eq '100px'
    expect(find("#container").native.css_value('border-width')).to eq '4px'
    expect(find("#container").native.css_value('padding')).to eq '8px'
    
    expect(find("#inner").native.css_value('margin-top')).to eq '0px'
    expect(find("#inner").native.css_value('margin-left')).to eq '0px'
    expect(find("#inner").native.css_value('width')).to eq '76px'
    expect(find("#inner").native.css_value('height')).to eq '76px'
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '38px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '38px'
    expect(find("#resizer").native.css_value('width')).to eq '38px'
    expect(find("#resizer").native.css_value('height')).to eq '38px'
    
    expect(find("#box4").native.css_value('margin-top')).to eq '9px'
    expect(find("#box4").native.css_value('margin-left')).to eq '9px'
    expect(find("#box4").native.css_value('width')).to eq '8px'
    expect(find("#box4").native.css_value('height')).to eq '8px'
  end
  
  it 'prevents negative border and padding' do
    expect(find("#inner").native.css_value('width')).to eq '76px'
    expect(find("#inner").native.css_value('height')).to eq '76px'
    
    page.execute_script("container.setAttribute('padding', 0)")
    
    expect(find("#inner").native.css_value('width')).to eq '92px'
    expect(find("#inner").native.css_value('height')).to eq '92px'
    
    page.execute_script("container.setAttribute('border', 0)")
    
    expect(find("#inner").native.css_value('width')).to eq '100px'
    expect(find("#inner").native.css_value('height')).to eq '100px'
    
    page.execute_script("container.setAttribute('padding', -1)")
    
    expect(find("#inner").native.css_value('width')).to eq '100px'
    expect(find("#inner").native.css_value('height')).to eq '100px'
    
    page.execute_script("container.setAttribute('border', -1)")
    
    expect(find("#inner").native.css_value('width')).to eq '100px'
    expect(find("#inner").native.css_value('height')).to eq '100px'
  end
  
  it 'resizes correctly for border and/or padding changes' do
    page.execute_script("container.setAttribute('border', 2)")
    
    expect(find("#inner").native.css_value('margin-top')).to eq '0px'
    expect(find("#inner").native.css_value('margin-left')).to eq '0px'
    expect(find("#inner").native.css_value('width')).to eq '80px'
    expect(find("#inner").native.css_value('height')).to eq '80px'
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("container.setAttribute('padding', 4)")
    
    expect(find("#inner").native.css_value('margin-top')).to eq '0px'
    expect(find("#inner").native.css_value('margin-left')).to eq '0px'
    expect(find("#inner").native.css_value('width')).to eq '88px'
    expect(find("#inner").native.css_value('height')).to eq '88px'
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '44px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '44px'
    expect(find("#resizer").native.css_value('width')).to eq '44px'
    expect(find("#resizer").native.css_value('height')).to eq '44px'
  end
  
  it 'resizes correctly when percentage widths are changed' do
    page.execute_script("resizer.setAttribute('width', '25%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '38px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '38px'
    expect(find("#resizer").native.css_value('width')).to eq '19px'
    expect(find("#resizer").native.css_value('height')).to eq '38px'
    
    page.execute_script("resizer.setAttribute('width', 30)")
    page.execute_script("container.setAttribute('border', 2)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '30px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("resizer.setAttribute('width', '50%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("container.setAttribute('border', 0)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '42px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '42px'
    expect(find("#resizer").native.css_value('width')).to eq '42px'
    expect(find("#resizer").native.css_value('height')).to eq '42px'
  end
  
  it 'resizes correctly when percentage heights are changed' do
    page.execute_script("resizer.setAttribute('height', '25%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '38px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '38px'
    expect(find("#resizer").native.css_value('width')).to eq '38px'
    expect(find("#resizer").native.css_value('height')).to eq '19px'
    
    page.execute_script("resizer.setAttribute('height', 30)")
    page.execute_script("container.setAttribute('border', 2)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '30px'
    
    page.execute_script("resizer.setAttribute('height', '50%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("container.setAttribute('border', 0)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '42px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '42px'
    expect(find("#resizer").native.css_value('width')).to eq '42px'
    expect(find("#resizer").native.css_value('height')).to eq '42px'
  end
  
  it 'repositions correctly when percentage x is changed' do
    page.execute_script("resizer.setAttribute('x', '25%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '38px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '19px'
    expect(find("#resizer").native.css_value('width')).to eq '38px'
    expect(find("#resizer").native.css_value('height')).to eq '38px'
    
    page.execute_script("resizer.setAttribute('x', 30)")
    page.execute_script("container.setAttribute('border', 2)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '30px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("resizer.setAttribute('x', '50%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("container.setAttribute('border', 0)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '42px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '42px'
    expect(find("#resizer").native.css_value('width')).to eq '42px'
    expect(find("#resizer").native.css_value('height')).to eq '42px'
  end
  
  
  it 'repositions correctly when percentage y is changed' do
    page.execute_script("resizer.setAttribute('y', '25%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '19px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '38px'
    expect(find("#resizer").native.css_value('width')).to eq '38px'
    expect(find("#resizer").native.css_value('height')).to eq '38px'
    
    page.execute_script("resizer.setAttribute('y', 30)")
    page.execute_script("container.setAttribute('border', 2)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '30px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("resizer.setAttribute('y', '50%')")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '40px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '40px'
    expect(find("#resizer").native.css_value('width')).to eq '40px'
    expect(find("#resizer").native.css_value('height')).to eq '40px'
    
    page.execute_script("container.setAttribute('border', 0)")
    
    expect(find("#resizer").native.css_value('margin-top')).to eq '42px'
    expect(find("#resizer").native.css_value('margin-left')).to eq '42px'
    expect(find("#resizer").native.css_value('width')).to eq '42px'
    expect(find("#resizer").native.css_value('height')).to eq '42px'
  end
end
