# Dynamically Constraining Attributes with JavaScript Expressions

[//]: # This introduction to attribute constraints and explains how to get started using them in Dreem.

The attributes of {@link dr.node} tags (and any subclass of {@link dr.node}, such as {@link dr.view}) don't have to be declared at runtime.  Instead, they can be generated dynamically in a number of ways with with JavaScript expressions.

It is often convenient to constrain the size of {@link dr.view subviews} to fit within the bounds of their parent, so that you don't have to calculate exact sizes by hand.  This is very easy to accomplish using the `${inline javascript}` syntax  For example, if you needed to create two columns and ensure that they fit within a parent view, regardless of it's size, you could accomplish this by ensuring the width of each column is proportional to the number of columns that are being added (i.e. `parent.width / parent.subviews.length`):  

    @example
    <view width="200" height="100" bgcolor="lightpink">

      <view width="${this.parent.width / this.parent.subviews.length}" 
            height="${this.parent.height}" 
            x="0" 
            y="0" 
            bgcolor="lightblue">
      </view>
    
      <view width="${this.parent.width / this.parent.subviews.length}" 
            height="${this.parent.height}" 
            x="${this.parent.width / this.parent.subviews.length}" 
            y="0" 
            bgcolor="lightgreen">
      </view>
      
    </view>

This works well, but would be a bit cumbersome to continue to use as more columns are added.  To DRY up your code, you can define methods in the views themselves, and then use those new methods to constrain other attributes.

    @example
    <view width="200" height="100" y="110" bgcolor="lightpink">

        <method name="columnWidth">
            return this.width / this.subviews.length;
        </method>

        <method name="columnX" args="column">
            return this.columnWidth() * this.subviews.indexOf(column);
        </method>

        <view width="${this.parent.columnWidth()}"
              height="${this.parent.height}"
              x="${this.parent.columnX(this)}"
              y="0"
              bgcolor="lightblue">
        </view>

        <view width="${this.parent.columnWidth()}"
              height="${this.parent.height}"
              x="${this.parent.columnX(this)}"
              y="0"
              bgcolor="lightgreen">
        </view>

        <view width="${this.parent.columnWidth()}"
              height="${this.parent.height}"
              x="${this.parent.columnX(this)}"
              y="0"
              bgcolor="lightyellow">
        </view>

    </view>

Dynamic attributes are not limited to geometery, any attribute that can be set via javascript is settable in this way.  For example, You might want to set the value of a text element based on the value of other attributes. Here we set the value by concatenating three attributes together.

    @example
    <attribute name="firstName" type="string" value="Lumpy"></attribute>
    <attribute name="middleName" type="string" value="Space"></attribute>
    <attribute name="lastName" type="string" value="Princess"></attribute>
    
    <text text="${this.parent.firstName + ' ' + this.parent.middleName + ' ' + this.parent.lastName}" 
          color="hotpink">
    </text>
        
Of course arbitrarily complex Javascript is available:
     
    @example    
    <text text="${this.parent.firstName.charAt(0) + ' ' + ' ' + this.parent.lastName.charAt(0)}" 
          color="hotpink">
    </text>
     
And methods can be used to set attributes in any {@link dr.node} tag, not just views:
     
    @example
    <method name="initials">
        return this.firstName.charAt(0) + ' ' + this.middleName.charAt(0) + ' ' + this.lastName.charAt(0);
    </method>
    
    <text text="${this.parent.initials()}" color="hotpink"></text>

