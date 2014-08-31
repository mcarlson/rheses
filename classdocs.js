/**
     * @class lz.ace
     * @extends lz.view
     * Ace editor component.
     */
/**
        * @cfg {String} [text=""]
        * Initial text for the ace editor.
        */
/**
        * @event ontext
        * Fired when the contents of the ace entry changes
        * @param {lz.ace} view The lz.ace that fired the event
        */
/**
        * @cfg {Number} [pausedelay=500]
        * Time (msec) after user entry stops to fire onpausedelay event.
        * 0 will disable this option.
        */
/**
        * @event onpausedelay
        * Fired when user entries stops for a period of time.
        * @param {lz.ace} view The lz.ace that fired the event
        */
/**
     * @class lz.boundslayout
     * @extends lz.layout
     * Sets the parent view's size to match the bounds of its children.
     */
/**
        * @cfg {""/"width"/"height"} [ignoreattr=""]
        * Optionally skip bounds calculations for a specific axis.
        */
/**
     * @class lz.buttonbase
     * @extends lz.view
     * Base class for button components. Buttons share common elements, 
     * including their ability to be selected, a visual element to display
     * their state, and a default and selected color.
     * The visual element is a lz.view that shows the current state of the
     * button. For example, in a labelbutton the entire button is the visual
     * element. For a checkbutton, the visual element is a square lz.view
     * that is inside the button.
     */
/**
        * @cfg {Number} [padding=3]
        * Amount of padding pixels around the button.
        */
/**
        * @cfg {String} [defaultcolor="#808080"]
        * The default color of the visual button element when not selected.
        */
/**
        * @cfg {String} [selectcolor="#a0a0a0"]
        * The selected color of the visual button element when selected.
        */
/**
        * @cfg {Boolean} [selected=false]
        * The current state of the button.
        */
/**
        * @event onselected
        * Fired when the state of the button changes.
        * @param {lz.buttonbase} view The lz.buttonbase that fired the event
        */
/**
        * @cfg {String} [text=""]
        * Button text.
        */
/**
     * @class lz.checkbutton
     * @extends lz.buttonbase
     * Button class consisting of text and a visual element to show the
     * current state of the component. The state of the
     * button changes each time the button is clicked. The select property
     * holds the current state of the button. The onselected event
     * is generated when the button is the selected state.
     */
/**
     * @class lz.dragstate
     * @extends lz.state
     * Allows views to be dragged by the mouse.
     */
/**
        * @cfg {"x"/"y"/"both"} [dragaxis="both"]
        * The axes to drag on.
        */
/**
     * @class lz.dreem_iframe
     * @extends lz.view
     * iframe component for embedding dreem code or html in a dreem application.
     * The size of the iframe matches the width/height of the view when the
     * component is created.
     * The file '/iframe_stub.html' contains the html to load into the iframe,
     * including the required script elements to run dreem code.
     */
/**
        * @cfg {String} [contents=""]
        * string to write into the iframe body. This is dreem code, or html
        * that is written inside the iframe's body tag.
        */
/**
     * @class lz.labelbutton
     * @extends lz.buttonbase
     * Button class consisting of text centered in a view. The onclick event
     * is generated when the button is clicked. The visual state of the 
     * button changes during onmousedown/onmouseup.
     */
/**
     * @class lz.labeltoggle
     * @extends lz.labelbutton
     * Button class consisting of text centered in a view. The state of the
     * button changes each time the button is clicked. The select property
     * holds the current state of the button. The onselected event
     * is generated when the button is the selected state.
     */
/**
     * @class lz.simplelayout
     * @extends lz.layout
     * A layout that stacks views on the x or y axis.
     */
/**
        * @cfg {Number} [inset=0]
        * Amount to inset the layout
        */
/**
        * @cfg {Number} [spacing=15]
        * Amount of spacing between views
        */
/**
        * @cfg {"x"/"y"} [axis=x]
        * The axis to stack on
        */
/**
     * @class lz.text
     * @extends lz.view
     * Text component that supports single and multi-line text. The text
     * component can be fixed size, or sized to fit the size of the text.
     *
     *     @example
     *     <text text="Hello World!" bgcolor="red"></text>
     */
/**
        * @cfg {Boolean} [multiline=false]
        * Set to true to show multi-line text.
        */
/**
        * @cfg {Boolean} [measuresize=true]
        * By default, the text component is sized to the size of the text.
        * By setting measuresize=false, the component size is not modified
        * when the text changes.
        */
/**
        * @cfg {String} [text=""]
        * Component text.
        */
/**
        * @method format
        * Format the text to be displayed. The default behavior is to 
        * return the text intact. Override to change formatting.
        * @param {String} str The current value of the text component.
        * @return {String} The formated string to display in the component.
        */
