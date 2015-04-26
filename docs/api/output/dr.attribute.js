Ext.data.JsonP.dr_attribute({"tagname":"class","name":"dr.attribute","autodetected":{},"files":[{"filename":"layout.js","href":"layout.html#dr-attribute"}],"aside":[{"tagname":"aside","type":"guide","name":"constraints"}],"members":[{"name":"name","tagname":"attribute","owner":"dr.attribute","id":"attribute-name","meta":{"required":true}},{"name":"type","tagname":"attribute","owner":"dr.attribute","id":"attribute-type","meta":{"required":true}},{"name":"value","tagname":"attribute","owner":"dr.attribute","id":"attribute-value","meta":{"required":true}}],"alternateClassNames":[],"aliases":{},"id":"class-dr.attribute","short_doc":"#\nAdds a variable to a node, view, class or other class instance. ...","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/layout.html#dr-attribute' target='_blank'>layout.js</a></div></pre><div class='doc-contents'>            <div class='aside guide'>\n              <h4>Guide</h4>\n              <p><a href='#!/guide/constraints'><img src='guides/constraints/icon.png' alt=''> Dynamically Constraining Attributes with JavaScript Expressions</a></p>\n            </div>\n<p>#\nAdds a variable to a node, view, class or other class instance. Attributes can only be created with the &lt;attribute>&lt;/attribute> tag syntax.\n    #\nAttributes allow classes to declare new variables with a specific type and default value.\n    #\nAttributes automatically send events when their value changes.\n    #\nHere we create a new class with a custom attribute representing a person's mood, along with two instances. One instance has the default mood of 'happy', the other sets the mood attribute to 'sad'. Note there's nothing visible in this example yet:\n    #\n    <class name=\"person\">\n      <attribute name=\"mood\" type=\"string\" value=\"happy\"></attribute>\n    </class>\n    #\n    <person></person>\n    <person mood=\"sad\"></person>\n    #\nLet's had a handler to make our color change with the mood. Whenever the mood attribute changes, the color changes with it:\n    #\n    @example\n    <class name=\"person\" width=\"100\" height=\"100\">\n      <attribute name=\"mood\" type=\"string\" value=\"happy\"></attribute>\n      <handler event=\"onmood\" args=\"mood\">\n        var color = 'orange';\n        if (mood !== 'happy') {\n          color = 'blue'\n        }\n        this.setAttribute('bgcolor', color);\n      </handler>\n    </class>\n    #\n    <spacedlayout></spacedlayout>\n    <person></person>\n    <person mood=\"sad\"></person>\n    #\nYou can add as many attributes as you like to a class. Here, we add a numeric attribute for size, which changes the height and width attributes via a constraint:\n    #\n    @example\n    <class name=\"person\" width=\"${this.size}\" height=\"${this.size}\">\n      <attribute name=\"mood\" type=\"string\" value=\"happy\"></attribute>\n      <handler event=\"onmood\" args=\"mood\">\n        var color = 'orange';\n        if (mood !== 'happy') {\n          color = 'blue'\n        }\n        this.setAttribute('bgcolor', color);\n      </handler>\n      <attribute name=\"size\" type=\"number\" value=\"20\"></attribute>\n    </class>\n    #\n    <spacedlayout></spacedlayout>\n    <person></person>\n    <person mood=\"sad\" size=\"50\"></person></p>\n</div><div class='members'><div class='members-section'><h3 class='members-title icon-attribute'>Attributes</h3><div class='subsection'><div class='definedBy'>Defined By</div><h4 class='members-subtitle'>Required attributes</h3><div id='attribute-name' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='dr.attribute'>dr.attribute</span><br/><a href='source/layout.html#dr-attribute-attribute-name' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.attribute-attribute-name' class='name expandable'>name</a> : String<span class=\"signature\"><span class='required' >required</span></span></div><div class='description'><div class='short'><p>The name of the attribute</p>\n</div><div class='long'><p>The name of the attribute</p>\n</div></div></div><div id='attribute-type' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='dr.attribute'>dr.attribute</span><br/><a href='source/layout.html#dr-attribute-attribute-type' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.attribute-attribute-type' class='name expandable'>type</a> : \"string\"/\"number\"/\"boolean\"/\"json\"/\"expression\"<span class=\"signature\"><span class='required' >required</span></span></div><div class='description'><div class='short'>The type of the attribute. ...</div><div class='long'><p>The type of the attribute. Used to convert from a string to an appropriate representation of the type.</p>\n<p>Defaults to: <code>string</code></p></div></div></div><div id='attribute-value' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='dr.attribute'>dr.attribute</span><br/><a href='source/layout.html#dr-attribute-attribute-value' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.attribute-attribute-value' class='name expandable'>value</a> : String<span class=\"signature\"><span class='required' >required</span></span></div><div class='description'><div class='short'><p>The initial value for the attribute</p>\n</div><div class='long'><p>The initial value for the attribute</p>\n</div></div></div></div></div></div></div>","meta":{}});