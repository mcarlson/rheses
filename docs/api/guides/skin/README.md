# Skinning Dreem

[//]: # This introduction to building custom &lt;skin&gt; objects

## Designing a skin

Skins in Dreem are a collection of attribute configuration templates that are applied on top of Dreem objects.

Building a skin begins with a &lt;skin&gt; tag, inside which should be defined attributes exactly as one would
when styling individual Dreem components. The attributes become a template with which will be applied to objects
where `skin='skinname'` is set. Each top-level tag inside a &lt;skin&gt; tag must be a unique class tag,
and any subtags under those are used to style the internal structure of the particular class it's under
(each of these subviews must contain a `name='subviewname'` attribute to be matched properly).

    @example
    <skin name="redfont">
      <text color="red"></text>
    </skin>

    <text skin="redfont" text="This font will skinned with the 'redfont' skin"></text>

Multiple skins can be applied on top of one another by listing the skins to be applied as a comma and/or space delimited list:

    @example
    <skin name="redfont">
      <text color="red"></text>
    </skin>

    <skin name="bluebackground">
      <text bgcolor="blue"></text>
    </skin>

    <text skin="bluebackground, redfont" text="This font will skinned with the 'redfont' skin on top of the 'bluebackground'"></text>

Setting a skin on a top level object will automatically cascade down to child objects (though will stop at children
where a different skin has been set).  The order that attributes get applied is:

1. Default class attributes set
2. Skin attributes are applied
3. Instance-specific attributes are applied

As new views are added, they will be automatically skinned with the skin belonging to the closest skinned ancestor.

    @example wide
    <skin name="base">
      <text fontsize="16" multiline="true" width="200"></text>
    </skin>

    <skin name="red">
      <view bgcolor="pink"></view>
      <text color="red"></text>
    </skin>

    <skin name="blue">
      <view bgcolor="lightblue"></view>
      <text color="blue"></text>
    </skin>

    <view skin="base red" name="top" width="600" height="100%">
        <view name="left" width="200" height="100">
          <text text="This text's red color is inherited from the view named 'top' (it's grandparent)"></text>
        </view>
        <view skin="base blue" name="middle" width="${this.parent.left.width}" height="100%" x="${this.width}">
          <text text="This text's blue color is inherited from the view named 'middle' (it's parent)"></text>
        </view>
        <view skin="base blue" name="right" width="${this.parent.left.width}" height="100%" x="${this.width  * 2}">
          <text color="green" bgcolor="lightgreen" text="This text's green color is not inherited, but is instance specific"></text>
        </view>
    </view>

This is the default Dreem skin ([see example](http://localhost:8080/examples/style.html)):

    <skin name="default">
      <text fontweight="200" clip="true" color="white" fontsize="20" fontfamily="'mission-gothic', 'Helvetica Neue', Helvetica, Arial, sans-serif"></text>

      <inputtext color="white" fontweight="300" fontsize="20" leftpadding="10" leftborder="2" bottomborder="2" bordercolor="white" fontfamily="'mission-gothic', 'Helvetica Neue', Helvetica, Arial, sans-serif">
        <art name="indicator" fill="white" x="-5"></art>
      </inputtext>

      <labelbutton border="2" padding="3" textcolor="rgb(207,207,207)" defaultcolor="rgb(63,63,63)">
        <art name="indicator" fill="white"></art>
        <text color="rgb(207,207,207)" name="label" fontweight="200" text-transform="uppercase" fontsize="20" fontfamily="'mission-gothic', 'Helvetica Neue', Helvetica, Arial, sans-serif"></text>
      </labelbutton>

      <rangeslider bottomborder="2" bordercolor="white" lowselectcolor="#a0a0a0" highselectcolor="#a0a0a0">
        <view name="highvalueview" bottomborder="2" bordercolor="white"></view>
        <art name="highindicator" fill="white"></art>
        <view name="lowvalueview" bottomborder="2" bordercolor="white"></view>
        <art name="lowindicator" fill="white"></art>
      </rangeslider>

      <slider bottomborder="2" selectcolor="white">
        <art name="indicator" fill="white"></art>
      </slider>

      <checkbutton border="2" padding="3" textcolor="rgb(140,140,140)" innerspacing="3">
        <text color="rgb(140,140,140)" name="label" text-transform="uppercase" fontweight="200" fontsize="20" fontfamily="'mission-gothic', 'Helvetica Neue', Helvetica, Arial, sans-serif"></text>
      </checkbutton>

      <labeltoggle border="2" padding="3" textcolor="rgb(207,207,207)" defaultcolor="rgb(63,63,63)">
        <art name="indicator" fill="white"></art>
        <text color="rgb(207,207,207)" name="label" text-transform="uppercase" fontweight="200" fontsize="20" fontfamily="'mission-gothic', 'Helvetica Neue', Helvetica, Arial, sans-serif"></text>
      </labeltoggle>
    </skin>

