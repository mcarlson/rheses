Ext.data.JsonP.dr_dragstate({"tagname":"class","name":"dr.dragstate","autodetected":{},"files":[{"filename":"classdocs.js","href":"classdocs.html#dr-dragstate"}],"extends":"dr.state","members":[{"name":"applied","tagname":"attribute","owner":"dr.state","id":"attribute-applied","meta":{}},{"name":"dragaxis","tagname":"attribute","owner":"dr.dragstate","id":"attribute-dragaxis","meta":{}},{"name":"id","tagname":"attribute","owner":"dr.node","id":"attribute-id","meta":{}},{"name":"name","tagname":"attribute","owner":"dr.node","id":"attribute-name","meta":{}},{"name":"scriptincludes","tagname":"attribute","owner":"dr.node","id":"attribute-scriptincludes","meta":{}},{"name":"scriptincludeserror","tagname":"attribute","owner":"dr.node","id":"attribute-scriptincludeserror","meta":{}},{"name":"inited","tagname":"property","owner":"dr.node","id":"property-inited","meta":{"readonly":true}},{"name":"subnodes","tagname":"property","owner":"dr.node","id":"property-subnodes","meta":{"readonly":true}},{"name":"destroy","tagname":"method","owner":"dr.node","id":"method-destroy","meta":{}},{"name":"doSubnodeAdded","tagname":"method","owner":"dr.node","id":"method-doSubnodeAdded","meta":{}},{"name":"doSubnodeRemoved","tagname":"method","owner":"dr.node","id":"method-doSubnodeRemoved","meta":{}},{"name":"sendEvent","tagname":"method","owner":"Eventable","id":"method-sendEvent","meta":{"chainable":true}},{"name":"setAttribute","tagname":"method","owner":"Eventable","id":"method-setAttribute","meta":{"chainable":true}},{"name":"setAttributes","tagname":"method","owner":"Eventable","id":"method-setAttributes","meta":{"chainable":true}},{"name":"onapplied","tagname":"event","owner":"dr.state","id":"event-onapplied","meta":{}},{"name":"ondestroy","tagname":"event","owner":"dr.node","id":"event-ondestroy","meta":{}},{"name":"oninit","tagname":"event","owner":"dr.node","id":"event-oninit","meta":{}},{"name":"onsubnodes","tagname":"event","owner":"dr.node","id":"event-onsubnodes","meta":{}},{"name":"subnodeAdded","tagname":"event","owner":"dr.node","id":"event-subnodeAdded","meta":{}},{"name":"subnodeRemoved","tagname":"event","owner":"dr.node","id":"event-subnodeRemoved","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-dr.dragstate","short_doc":"Allows views to be dragged by the mouse. ...","component":false,"superclasses":["Module","Eventable","dr.node","dr.state"],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'><a href='#!/api/Module' rel='Module' class='docClass'>Module</a><div class='subclass '><a href='#!/api/Eventable' rel='Eventable' class='docClass'>Eventable</a><div class='subclass '><a href='#!/api/dr.node' rel='dr.node' class='docClass'>dr.node</a><div class='subclass '><a href='#!/api/dr.state' rel='dr.state' class='docClass'>dr.state</a><div class='subclass '><strong>dr.dragstate</strong></div></div></div></div></div><h4>Files</h4><div class='dependency'><a href='source/classdocs.html#dr-dragstate' target='_blank'>classdocs.js</a></div></pre><div class='doc-contents'><p>Allows views to be dragged by the mouse.</p>\n\n<p>Here is a view that contains a dragstate. The dragstate is applied when the mouse is down in the view, and then removed when the mouse is up. You can modify the attributes of the draggable view by setting them inside the dragstate, like we do here with bgcolor.</p>\n\n<pre class='inline-example '><code>&lt;view width=\"100\" height=\"100\" bgcolor=\"plum\"&gt;\n  &lt;attribute name=\"mouseIsDown\" type=\"boolean\" value=\"false\"&gt;&lt;/attribute&gt;\n  &lt;handler event=\"onmousedown\"&gt;\n    this.setAttribute('mouseIsDown', true);\n  &lt;/handler&gt;\n  &lt;handler event=\"onmouseup\"&gt;\n    this.setAttribute('mouseIsDown', false);\n  &lt;/handler&gt;\n  &lt;dragstate applied=\"${this.parent.mouseIsDown}\"&gt;\n    &lt;attribute name=\"bgcolor\" type=\"string\" value=\"purple\"&gt;&lt;/attribute&gt;\n  &lt;/dragstate&gt;\n&lt;/view&gt;\n</code></pre>\n\n<p>To constrain the motion of the element to either the x or y axis set the dragaxis property. Here the same purple square can only move horizontally.</p>\n\n<pre class='inline-example '><code>&lt;view width=\"100\" height=\"100\" bgcolor=\"plum\"&gt;\n  &lt;attribute name=\"mouseIsDown\" type=\"boolean\" value=\"false\"&gt;&lt;/attribute&gt;\n  &lt;handler event=\"onmousedown\"&gt;\n    this.setAttribute('mouseIsDown', true);\n  &lt;/handler&gt;\n  &lt;handler event=\"onmouseup\"&gt;\n    this.setAttribute('mouseIsDown', false);\n  &lt;/handler&gt;\n  &lt;dragstate applied=\"${this.parent.mouseIsDown}\" dragaxis=\"x\"&gt;\n    &lt;attribute name=\"bgcolor\" type=\"string\" value=\"purple\"&gt;&lt;/attribute&gt;\n  &lt;/dragstate&gt;\n&lt;/view&gt;\n</code></pre>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-attribute'>Attributes</h3><div class='subsection'><div id='attribute-applied' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.state' rel='dr.state' class='defined-in docClass'>dr.state</a><br/><a href='source/layout.html#dr-state-attribute-applied' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.state-attribute-applied' class='name expandable'>applied</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>If true, the state is applied. ...</div><div class='long'><p>If true, the state is applied.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='attribute-dragaxis' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='dr.dragstate'>dr.dragstate</span><br/><a href='source/classdocs.html#dr-dragstate-attribute-dragaxis' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.dragstate-attribute-dragaxis' class='name expandable'>dragaxis</a> : \"x\"/\"y\"/\"both\"<span class=\"signature\"></span></div><div class='description'><div class='short'>The axes to drag on. ...</div><div class='long'><p>The axes to drag on.</p>\n<p>Defaults to: <code>&quot;both&quot;</code></p></div></div></div><div id='attribute-id' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-attribute-id' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-attribute-id' class='name expandable'>id</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Gives this node a global ID, which can be looked up in the global window object. ...</div><div class='long'><p>Gives this node a global ID, which can be looked up in the global window object.\nTake care to not override builtin globals, or override your own instances!</p>\n</div></div></div><div id='attribute-name' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-attribute-name' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-attribute-name' class='name expandable'>name</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'><p>Names this node in its parent scope so it can be referred to later.</p>\n</div><div class='long'><p>Names this node in its parent scope so it can be referred to later.</p>\n</div></div></div><div id='attribute-scriptincludes' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-attribute-scriptincludes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-attribute-scriptincludes' class='name expandable'>scriptincludes</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>A comma separated list of URLs to javascript includes required as dependencies. ...</div><div class='long'><p>A comma separated list of URLs to javascript includes required as dependencies. Useful if you need to ensure a third party library is available.</p>\n</div></div></div><div id='attribute-scriptincludeserror' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-attribute-scriptincludeserror' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-attribute-scriptincludeserror' class='name expandable'>scriptincludeserror</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'><p>An error to show if scriptincludes fail to load</p>\n</div><div class='long'><p>An error to show if scriptincludes fail to load</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-inited' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-property-inited' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-property-inited' class='name expandable'>inited</a> : Boolean<span class=\"signature\"><span class='readonly' >readonly</span></span></div><div class='description'><div class='short'><p>True when this node and all its children are completely initialized</p>\n</div><div class='long'><p>True when this node and all its children are completely initialized</p>\n</div></div></div><div id='property-subnodes' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-property-subnodes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-property-subnodes' class='name expandable'>subnodes</a> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a>[]<span class=\"signature\"><span class='readonly' >readonly</span></span></div><div class='description'><div class='short'>An array of this node's child nodes ...</div><div class='long'><p>An array of this node's child nodes</p>\n<p>Defaults to: <code>[]</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-destroy' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-method-destroy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-method-destroy' class='name expandable'>destroy</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Destroys this node ...</div><div class='long'><p>Destroys this node</p>\n</div></div></div><div id='method-doSubnodeAdded' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-method-doSubnodeAdded' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-method-doSubnodeAdded' class='name expandable'>doSubnodeAdded</a>( <span class='pre'>node</span> ) : void<span class=\"signature\"></span></div><div class='description'><div class='short'>Called when a subnode is added to this node. ...</div><div class='long'><p>Called when a subnode is added to this node. Provides a hook for\nsubclasses. No need for subclasses to call super. Do not call this\nmethod to add a subnode. Instead call setParent.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The subnode that was added.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>void</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-doSubnodeRemoved' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-method-doSubnodeRemoved' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-method-doSubnodeRemoved' class='name expandable'>doSubnodeRemoved</a>( <span class='pre'>node</span> ) : void<span class=\"signature\"></span></div><div class='description'><div class='short'>Called when a subnode is removed from this node. ...</div><div class='long'><p>Called when a subnode is removed from this node. Provides a hook for\nsubclasses. No need for subclasses to call super. Do not call this\nmethod to remove a subnode. Instead call _removeFromParent.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The subnode that was removed.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>void</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-sendEvent' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Eventable' rel='Eventable' class='defined-in docClass'>Eventable</a><br/><a href='source/layout.html#Eventable-method-sendEvent' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Eventable-method-sendEvent' class='name expandable'>sendEvent</a>( <span class='pre'>name, value</span> ) : <a href=\"#!/api/Eventable\" rel=\"Eventable\" class=\"docClass\">Eventable</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Sends an event ...</div><div class='long'><p>Sends an event</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>name</span> : String<div class='sub-desc'><p>the name of the event to send</p>\n</div></li><li><span class='pre'>value</span> : Object<div class='sub-desc'><p>the value to send with the event</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Eventable\" rel=\"Eventable\" class=\"docClass\">Eventable</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-setAttribute' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Eventable' rel='Eventable' class='defined-in docClass'>Eventable</a><br/><a href='source/layout.html#Eventable-method-setAttribute' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Eventable-method-setAttribute' class='name expandable'>setAttribute</a>( <span class='pre'>name, value</span> ) : <a href=\"#!/api/Eventable\" rel=\"Eventable\" class=\"docClass\">Eventable</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Sets an attribute, calls a setter if there is one, then sends an event with the new value ...</div><div class='long'><p>Sets an attribute, calls a setter if there is one, then sends an event with the new value</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>name</span> : String<div class='sub-desc'><p>the name of the attribute to set</p>\n</div></li><li><span class='pre'>value</span> : Object<div class='sub-desc'><p>the value to set to</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Eventable\" rel=\"Eventable\" class=\"docClass\">Eventable</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-setAttributes' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Eventable' rel='Eventable' class='defined-in docClass'>Eventable</a><br/><a href='source/layout.html#Eventable-method-setAttributes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Eventable-method-setAttributes' class='name expandable'>setAttributes</a>( <span class='pre'>attributes</span> ) : <a href=\"#!/api/Eventable\" rel=\"Eventable\" class=\"docClass\">Eventable</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Calls setAttribute for each name/value pair in the attributes object ...</div><div class='long'><p>Calls setAttribute for each name/value pair in the attributes object</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>attributes</span> : Object<div class='sub-desc'><p>An object of name/value pairs to be set</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Eventable\" rel=\"Eventable\" class=\"docClass\">Eventable</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-event'>Events</h3><div class='subsection'><div id='event-onapplied' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.state' rel='dr.state' class='defined-in docClass'>dr.state</a><br/><a href='source/layout.html#dr-state-event-onapplied' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.state-event-onapplied' class='name expandable'>onapplied</a>( <span class='pre'>applied</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Fired when the state has been applied or unapplied. ...</div><div class='long'><p>Fired when the state has been applied or unapplied. Onapplied handlers run in the scope of the state itself, see dragstate for an example.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>applied</span> : Boolean<div class='sub-desc'><p>If true, the state was applied.</p>\n</div></li></ul></div></div></div><div id='event-ondestroy' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-event-ondestroy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-event-ondestroy' class='name expandable'>ondestroy</a>( <span class='pre'>node</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Fired when this node and all its children are about to be destroyed ...</div><div class='long'><p>Fired when this node and all its children are about to be destroyed</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a> that fired the event</p>\n</div></li></ul></div></div></div><div id='event-oninit' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-event-oninit' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-event-oninit' class='name expandable'>oninit</a>( <span class='pre'>node</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Fired when this node and all its children are completely initialized ...</div><div class='long'><p>Fired when this node and all its children are completely initialized</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a> that fired the event</p>\n</div></li></ul></div></div></div><div id='event-onsubnodes' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-event-onsubnodes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-event-onsubnodes' class='name expandable'>onsubnodes</a>( <span class='pre'>node</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Fired when this node's subnodes array has changed ...</div><div class='long'><p>Fired when this node's subnodes array has changed</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a> that fired the event</p>\n</div></li></ul></div></div></div><div id='event-subnodeAdded' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-event-subnodeAdded' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-event-subnodeAdded' class='name expandable'>subnodeAdded</a>( <span class='pre'>node</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Fired when a subnode is added to this node. ...</div><div class='long'><p>Fired when a subnode is added to this node.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a> that was added</p>\n</div></li></ul></div></div></div><div id='event-subnodeRemoved' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/dr.node' rel='dr.node' class='defined-in docClass'>dr.node</a><br/><a href='source/layout.html#dr-node-event-subnodeRemoved' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.node-event-subnodeRemoved' class='name expandable'>subnodeRemoved</a>( <span class='pre'>node</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Fired when a subnode is removed from this node. ...</div><div class='long'><p>Fired when a subnode is removed from this node.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>node</span> : <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a><div class='sub-desc'><p>The <a href=\"#!/api/dr.node\" rel=\"dr.node\" class=\"docClass\">dr.node</a> that was removed</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});