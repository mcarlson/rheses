/**
     * @class dr.ace
     * @extends dr.view
     * Ace editor component.
     */
/**
        * @cfg {string} [theme='ace/theme/chrome']
        * Specify the ace theme to use.
        */
/**
        * @cfg {string} [mode='ace/mode/lzx']
        * Specify the ace mode to use.
        */
/**
        * @cfg {String} [text=""]
        * Initial text for the ace editor.
        */
/**
        * @event ontext
        * Fired when the contents of the ace entry changes
        * @param {dr.ace} view The dr.ace that fired the event
        */
/**
        * @cfg {Number} [pausedelay=500]
        * Time (msec) after user entry stops to fire onpausedelay event.
        * 0 will disable this option.
        */
/**
        * @event onpausedelay
        * Fired when user entries stops for a period of time.
        * @param {dr.ace} view The dr.ace that fired the event
        */
/**
     * @class dr.bitmap
     * @extends dr.view
     * Loads an image from a URL.
     */
/**
        * @cfg {String} src
        * The bitmap URL to load
        */
/**
             * @event onload 
             * Fired when the bitmap is loaded
             * @param {Object} size An object containing the width and height
             */
/**
             * @event onerror 
             * Fired when there is an error loading the bitmap
             */
/**
     * @class dr.boundslayout
     * @extends dr.layout
     * Sets the parent view's size to match the bounds of its children.
     */
/**
        * @cfg {""/"width"/"height"} [ignoreattr=""]
        * Optionally skip bounds calculations for a specific axis.
        */
/**
     * @class dr.buttonbase
     * @extends dr.view
     * Base class for button components. Buttons share common elements, 
     * including their ability to be selected, a visual element to display
     * their state, and a default and selected color.
     * The visual element is a dr.view that shows the current state of the
     * button. For example, in a labelbutton the entire button is the visual
     * element. For a checkbutton, the visual element is a square dr.view
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
        * @param {dr.buttonbase} view The dr.buttonbase that fired the event
        */
/**
        * @cfg {String} [text=""]
        * Button text.
        */
/**
     * @class dr.checkbutton
     * @extends dr.buttonbase
     * Button class consisting of text and a visual element to show the
     * current state of the component. The state of the
     * button changes each time the button is clicked. The select property
     * holds the current state of the button. The onselected event
     * is generated when the button is the selected state.
     */
/**
     * @class dr.dataset
     * @extends dr.node
     * Datasets hold onto a set of JSON data, either inline or loaded from a URL.
     * They are used with lz.replicator for data binding.
     *
     * This example shows how to create a dataset with inline JSON data, and use a replicator to show values inside. Inline datasets are useful for prototyping, especially when your backend server isn't ready yet:
     *
     *     @example
     *     <dataset name="example">
     *      {
     *        "store": {
     *          "book": [
     *            {
     *              "category": "reference",
     *              "author": "Nigel Rees",
     *              "title": "Sayings of the Century",
     *              "price": 8.95
     *            },
     *            {
     *              "category": "fiction",
     *              "author": "Evelyn Waugh",
     *              "title": "Sword of Honour",
     *              "price": 12.99
     *            },
     *            {
     *              "category": "fiction",
     *              "author": "Herman Melville",
     *              "title": "Moby Dick",
     *              "isbn": "0-553-21311-3",
     *              "price": 8.99
     *            },
     *            {
     *              "category": "fiction",
     *              "author": "J. R. R. Tolkien",
     *              "title": "The Lord of the Rings",
     *              "isbn": "0-395-19395-8",
     *              "price": 22.99
     *            }
     *          ],
     *          "bicycle": {
     *            "color": "red",
     *            "price": 19.95
     *          }
     *        }
     *      }
     *     </dataset>
     *     <simplelayout></simplelayout>
     *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
     *
     * Data can be loaded from a URL when your backend server is ready, or reloaded to show changes over time:
     *
     *     @example
     *     <dataset name="example" url="/example.json"></dataset>
     *     <simplelayout></simplelayout>
     *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
     */
/**
        * @cfg {String} name (required)
        * The name of the dataset
        */
/**
        * @cfg {String} url
        * The url to load JSON data from.
        */
/**
     * @class dr.dragstate
     * @extends dr.state
     * Allows views to be dragged by the mouse.
     */
/**
        * @cfg {"x"/"y"/"both"} [dragaxis="both"]
        * The axes to drag on.
        */
/**
     * @class dr.dreem_iframe
     * @extends dr.view
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
     * @class dr.gyro
     * @extends dr.node
     * Receives gyroscope and compass data where available. See [https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation](https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation) and [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
     */
/**
        * @cfg {Number} [x=0] (readonly)
        * The accelerometer x value
        */
/**
        * @cfg {Number} [y=0] (readonly)
        * The accelerometer y value
        */
/**
        * @cfg {Number} [z=0] (readonly)
        * The accelerometer z value
        */
/**
        * @cfg {Number} [alpha=0] (readonly)
        * The gyro alpha value rotating around the z axis
        */
/**
        * @cfg {Number} [beta=0] (readonly)
        * The gyro beta value rotating around the x axis
        */
/**
        * @cfg {Number} [gamma=0] (readonly)
        * The gyro gamma value rotating around the y axis
        */
/**
        * @cfg {Number} [compass=0] (readonly)
        * The compass orientation, see [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
        */
/**
        * @cfg {Number} [compassaccuracy=0] (readonly)
        * The compass accuracy, see [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
        */
/**
     * @class dr.inputtext
     * @extends dr.view
     * Provides an editable input text field.
     */
/**
        * @cfg {Boolean} [multiline=false]
        * Set to true to show multi-line text.
        */
/**
        * @cfg {String} text
        * The text inside this input text field
        */
/**
     * @class dr.labelbutton
     * @extends dr.buttonbase
     * Button class consisting of text centered in a view. The onclick event
     * is generated when the button is clicked. The visual state of the 
     * button changes during onmousedown/onmouseup.
     */
/**
     * @class dr.labeltoggle
     * @extends dr.labelbutton
     * Button class consisting of text centered in a view. The state of the
     * button changes each time the button is clicked. The select property
     * holds the current state of the button. The onselected event
     * is generated when the button is the selected state.
     */
/**
     * @class dr.replicator
     * @extends dr.node
     * Handles replication and data binding.
     *
     * This example shows the replicator to creating four text instances, each corresponding to an item in the data attribute:
     *
     *     @example
     *     <simplelayout></simplelayout>
     *     <replicator classname="text" data="[1,2,3,4]"></replicator>
     *
     * Changing the data attribute to a new array causes the replicator to create a new text for each item:
     *
     *     @example
     *     <simplelayout></simplelayout>
     *     <text onclick="repl.setAttribute('data', [5,6,7,8]);">Click to change data</text>
     *     <replicator id="repl" classname="text" data="[1,2,3,4]"></replicator>
     *
     * This example uses a {@link #filterexpression filterexpression} to filter the data to only numbers. Clicking changes {@link #filterexpression filterexpression} to show only non-numbers in the data:
     *
     *     @example
     *     <simplelayout></simplelayout>
     *     <text onclick="repl.setAttribute('filterexpression', '[^\\d]');">Click to change filter</text>
     *     <replicator id="repl" classname="text" data="['a',1,'b',2,'c',3,4,5]" filterexpression="\d"></replicator>
     *
     * Replicators can be used to look up {@link #datapath datapath} expressions to values in JSON data in a dr.dataset. This example looks up the color of the bicycle in the dr.dataset named bikeshop:
     *
     *     @example
     *     <dataset name="bikeshop">
     *      {
     *        "bicycle": {
     *          "color": "red",
     *          "price": 19.95
     *        }
     *      }
     *     </dataset>
     *     <replicator classname="text" datapath="$bikeshop/bicycle/color"></replicator>
     *
     * Matching one or more items will cause the replicator to create multiple copies:
     *
     *     @example
     *     <dataset name="bikeshop">
     *      {
     *        "bicycle": [
     *          {
     *           "color": "red",
     *           "price": 19.95
     *          },
     *          {
     *           "color": "green",
     *           "price": 29.95
     *          },
     *          {
     *           "color": "blue",
     *           "price": 59.95
     *          }
     *        ]
     *      }
     *     </dataset>
     *     <simplelayout></simplelayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[*]/color"></replicator>
     *
     * It's possible to select a single item on from the array using an array index. This selects the second item:
     *
     *     @example
     *     <dataset name="bikeshop">
     *      {
     *        "bicycle": [
     *          {
     *           "color": "red",
     *           "price": 19.95
     *          },
     *          {
     *           "color": "green",
     *           "price": 29.95
     *          },
     *          {
     *           "color": "blue",
     *           "price": 59.95
     *          }
     *        ]
     *      }
     *     </dataset>
     *     <simplelayout></simplelayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[1]/color"></replicator>
     *
     * It's also possible to replicate a range of items in the array with the [start,end,stepsize] operator. This replicates every other item:
     *
     *     @example
     *     <dataset name="bikeshop">
     *      {
     *        "bicycle": [
     *          {
     *           "color": "red",
     *           "price": 19.95
     *          },
     *          {
     *           "color": "green",
     *           "price": 29.95
     *          },
     *          {
     *           "color": "blue",
     *           "price": 59.95
     *          }
     *        ]
     *      }
     *     </dataset>
     *     <simplelayout></simplelayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[0,3,2]/color"></replicator>
     */
/**
        * @cfg {Boolean} [pooling=false]
        * If true, reuse views when replicating.
        */
/**
        * @cfg {Array} [data=[]]
        * The list of items to replicate. If {@link #datapath datapath} is set, it is converted to an array and stored here.
        */
/**
        * @cfg {String} classname (required)
        * The name of the class to be replicated.
        */
/**
        * @cfg {String} datapath
        * The datapath expression to be replicated.
        * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for details.
        */
/**
        * @cfg {String} [sortfield=""]
        * The field in the data to use for sorting. Only sort then this 
        */
/**
        * @cfg {Boolean} [sortasc=true]
        * If true, sort ascending.
        */
/**
        * @cfg {String} [filterexpression=""]
        * If defined, data will be filtered against a [regular expression](https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions). 
        */
/**
     * @class dr.shim
     * @extends dr.node
     * Connects to the shared event bus. When data is sent with a given type, a corresponding event is sent. For example, send('blah', {}) sends data with the 'blah' type, other shims will receive the object via an 'onblah' event.
     */
/**
        * @cfg {Boolean} [connected=false] (readonly)
        * If true, we are connected to the server
        */
/**
        * @cfg {Number} [pingtime=1000]
        * The frequency used to reconnect to the server
        */
/**
        * @cfg {Boolean} [websockets=false]
        * If true, use websockets to connect to the server
        */
/**
        * @method send
        * Sends some data over the event bus.
        * @param {String} type The type of event to be sent.
        * @param {Object} data The data to be sent.
        */
/**
     * @class dr.simplelayout
     * @extends dr.layout
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
     * @class dr.slider
     * @extends dr.view
     * An input component whose state is changed when the mouse is dragged.
     *
     *     @example
     *
     *     <slider name="hslide" y="5" width="250" height="10" value="50" bgcolor="#808080"></slider>
     * Slider with a label:
     *
     *     @example
     *     
     *     <simplelayout axis="x" spacing="8"></simplelayout>
     *     <slider name="hslide" y="5" width="250" height="10" value="50" bgcolor="#808080"></slider>
     *     <text text="${Math.round(this.parent.hslide.value)}" y="${this.parent.hslide.y + (this.parent.hslide.height-this.height)/2}"></text>
     */
/**
        * @cfg {Number} [minvalue=0]
        * The minimum value of the slider
        */
/**
        * @cfg {Number} [maxvalue=100]
        * The maximum value of the slider
        */
/**
        * @cfg {"x"/"y"} [axis=x]
        * The axis to track on
        */
/**
        * @cfg {Boolean} [invert=false]
        * Set to true to invert the direction of the slider.
        */
/**
        * @cfg {Number} [value=0]
        * The current value of the slider.
        * Use changeValue() to range check the number and set the value.
        */
/**
        * @method changeValue
        * Given a new value for the slider position, constrain the value
        * between minvalue and maxvalue and then calls setAttribute.
        * @param {Number} v The new value of the component.
        */
/**
        * @cfg {String} [selectcolor="#a0a0a0"]
        * The selected color of the slider.
        */
/**
     * @class dr.text
     * @extends dr.view
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
        * @cfg {Boolean} [resize=true]
        * By default, the text component is sized to the size of the text.
        * By setting resize=false, the component size is not modified
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
/**
     * @class dr.touch
     * @extends dr.node
     * Receives touch and multitouch data where available.
     */
/**
        * @cfg {Number} [x=0] (readonly)
        * The touch x value for the first finger.
        */
/**
        * @cfg {Number} [y=0] (readonly)
        * The touch y value for the first finger.
        */
/**
        * @cfg {Object[]} touches (readonly)
        * An array of x/y coordinates for all fingers, where available. See [https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events) for more details
        */
