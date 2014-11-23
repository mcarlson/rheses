/**
     * @class dr.ace {UI Components}
     * @extends dr.view
     * Ace editor component.
     *
     *     @example
     *     <ace id="editor" width="500" text='Hello World'></ace>
     *
     * The initial text can also be included inline, and include dreem code.
     *
     *     @example wide
     *     <ace id="editor" width="500"><view width="100%" height="100%" bgcolor="thistle"></view></ace>
     *
     */
/**
        * @attribute {string} [theme='ace/theme/chrome']
        * Specify the ace theme to use.
        */
/**
        * @attribute {string} [mode='ace/mode/dr']
        * Specify the ace mode to use.
        */
/**
        * @attribute {String} [text=""]
        * Initial text for the ace editor.
        */
/**
        * @event ontext
        * Fired when the contents of the ace entry changes
        * @param {dr.ace} view The dr.ace that fired the event
        */
/**
        * @attribute {Number} [pausedelay=500]
        * Time (msec) after user entry stops to fire onpausedelay event.
        * 0 will disable this option.
        */
/**
        * @event onpausedelay
        * Fired when user entries stops for a period of time.
        * @param {dr.ace} view The dr.ace that fired the event
        */
/**
      * @class dr.alignlayout {Layout}
      * @extends dr.variablelayout
      * A variablelayout that aligns each view vertically or horizontally
      * relative to all the other views.
      *
      *     @example
      *     <alignlayout align="middle" collapseparent="true">
      *     </alignlayout>
      *
      *     <view width="100" height="35" bgcolor="plum"></view>
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {String} [align='middle']
    * Determines which way the views are aligned. Supported values are 
    * 'left', 'center', 'right' and 'top', 'middle' and 'bottom'.
    */
/**
    * @method doBeforeUpdate
    * Determine the maximum subview width/height according to the alignment.
    */
/**
     * @class dr.art {UI Components}
     * @extends dr.view
     * Vector graphics support using svg.
     *
     * This example shows how to load an existing svg
     *
     *     @example
     *     <art width="100" height="100" src="/images/siemens-clock.svg"></art>
     *
     * Paths within an svg can be selected using the path attribute
     *
     *     @example
     *     <art width="100" height="100" src="/images/cursorshapes.svg" path="0"></art>
     *
     * Attributes are automatically passed through to the SVG. Here, the fill color is changed
     *
     *     @example
     *     <art width="100" height="100" src="/images/cursorshapes.svg" path="0" fill="coral"></art>
     *
     * Setting the path attribute animates between paths. This example animates when the mouse is clicked
     *
     *     @example
     *     <art width="100" height="100" src="/images/cursorshapes.svg" path="0" fill="coral">
     *       <handler event="onclick">
     *         this.setAttribute('path', this.path ^ 1);
     *       </handler>
     *     </art>
     *
     * By default, the SVG's aspect ratio is preserved. Set the stretches attribute to true to change this behavior.
     *
     *     @example
     *     <art width="200" height="100" src="/images/cursorshapes.svg" path="0" fill="coral" stretches="true">
     *       <handler event="onclick">
     *         this.setAttribute('path', this.path ^ 1);
     *         this.animate({width: (this.width == 200 ? 100 : 200)});
     *       </handler>
     *     </art>
     *
     */
/**
        * @attribute {Boolean} [inline=false]
        * Set to true if the svg contents is found inline, as a comment
        */
/**
        * @attribute {Boolean} stretches [stretches=false]
        * Set to true to stretch the svg to fill the view.
        */
/**
        * @attribute {String} src
        * The svg contents to load
        */
/**
        * @attribute {String|Number} path
        * The svg path element to display. Can either be the name of the &lt;g&gt; element containing the path or a 0-based index.
        */
/**
        * @attribute {Number} [animationspeed=400]
        * The number of milliseconds to use when animating between paths
        */
/**
        * @attribute {"linear"/"easeout"/"easein"/"easeinout"/"backin"/"backout"/"elastic"/"bounce"} [animationcurve="linear"]
        * The name of the curve to use when animating between paths
        */
/**
        * @event onready
        * Fired when the art is loaded and ready
        */
/**
        * @event ontween
        * Fired when the art has animated its path to the next position
        */
/**
     * @class dr.audioplayer {UI Components}
     * @extends dr.node
     * audioplayer wraps the web audio APIs to provide a declarative interface to play audio.
     *
     * This example shows how to load and play an mp3 audio file from the server:
     *
     *     @example
     *     <audioplayer url="/music/YACHT_-_09_-_Im_In_Love_With_A_Ripper_Party_Mix_Instrumental.mp3" playing="true"></audioplayer>
     */
/**
        * @attribute {String} url
        * The URL to an audio file to play
        */
/**
        * @attribute {Number} loadprogress
        * @readonly
        * A Number between 0 and 1 representing load progress
        */
/**
        * @attribute {Boolean} loaded
        * @readonly
        * If true, the audio is done loading
        */
/**
        * @attribute {Boolean} playing
        * If true, the audio is playing.
        */
/**
        * @attribute {Boolean} paused
        * If true, the audio is paused.
        */
/**
        * @attribute {Boolean} loop
        * If true, the audio will play continuously.
        */
/**
        * @attribute {Number} time
        * @readonly
        * The number of seconds the file has played, with 0 being the start.
        */
/**
        * @attribute {Number} duration
        * @readonly
        * The duration in seconds.
        */
/**
        * @attribute {Number} fftsize
        * The number of fft frames to use when setting {@link #fft fft}. Must be a non-zero power of two in the range 32 to 2048.
        */
/**
        * @attribute {Number} [fftsmoothing=0.8]
        * The amount of smoothing to apply to the FFT analysis. A value from 0 -> 1 where 0 represents no time averaging with the last FFT analysis frame.
        */
/**
        * @attribute {Number[]} fft
        * @readonly
        * An array of numbers representing the FFT analysis of the audio as it's playing.
        */
/**
     * @class dr.bitmap {UI Components}
     * @extends dr.view
     * Loads an image from a URL.
     *
     *     @example
     *     <bitmap src="../api-examples-resources/shasta.jpg" width="230" height="161"></bitmap>
     */
/**
        * @attribute {String} src
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
     * @class dr.buttonbase {UI Components}
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
        * @attribute {Number} [padding=3]
        * Amount of padding pixels around the button.
        */
/**
        * @attribute {String} [defaultcolor="#808080"]
        * The default color of the visual button element when not selected.
        */
/**
        * @attribute {String} [selectcolor="#a0a0a0"]
        * The selected color of the visual button element when selected.
        */
/**
        * @attribute {Boolean} [selected=false]
        * The current state of the button.
        */
/**
        * @event onselected
        * Fired when the state of the button changes.
        * @param {dr.buttonbase} view The dr.buttonbase that fired the event
        */
/**
        * @attribute {String} [text=""]
        * Button text.
        */
/**
     * @class dr.checkbutton {UI Components}
     * @extends dr.buttonbase
     * Button class consisting of text and a visual element to show the
     * current state of the component. The state of the
     * button changes each time the button is clicked. The select property
     * holds the current state of the button. The onselected event
     * is generated when the button is the selected state.
     *
     *     @example
     *     <spacedlayout axis="y"></spacedlayout>
     *
     *     <checkbutton text="pink" selectcolor="pink" defaultcolor="lightgrey" bgcolor="white"></checkbutton>
     *     <checkbutton text="blue" selectcolor="lightblue" defaultcolor="lightgrey" bgcolor="white"></checkbutton>
     *     <checkbutton text="green" selectcolor="lightgreen" defaultcolor="lightgrey" bgcolor="white"></checkbutton>
     *
     * Here we listen for the onselected event on a checkbox and print the value that is passed to the handler.
     *
     *     @example
     *     <spacedlayout axis="y"></spacedlayout>
     *
     *     <checkbutton text="green" selectcolor="lightgreen" defaultcolor="lightgrey" bgcolor="white">
     *       <handler event="onselected" args="value">
     *         displayselected.setAttribute('text', value);
     *       </handler>
     *     </checkbutton>
     *
     *     <view>
     *       <spacedlayout></spacedlayout>
     *       <text text="Selected:"></text>
     *       <text id="displayselected"></text>
     *     </view>
     *
     */
/**
      * @class dr.constantlayout {Layout}
      * @extends dr.layout
      * A layout that sets the target attribute name to the target value for 
      * each subview.
      *
      *     @example
      *     <constantlayout attribute="y" value="10"></constantlayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="25" bgcolor="plum"></view>
      *     <view width="100" height="25" bgcolor="lightblue"></view>
      */
/**
    * @attribute {String} [attribute=x]
    * The name of the attribute to update on each subview.
    */
/**
    * @attribute {*} [value=0]
    * The value to set the attribute to.
    */
/**
     * @class dr.dataset {Data}
     * @extends dr.node
     * Datasets hold onto a set of JSON data, either inline or loaded from a URL.
     * They are used with lz.replicator for data binding.
     *
     * This example shows how to create a dataset with inline JSON data, and use a replicator to show values inside. Inline datasets are useful for prototyping, especially when your backend server isn't ready yet:
     *
     *     @example wide
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
     *     <spacedlayout></spacedlayout>
     *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
     *
     * Data can be loaded from a URL when your backend server is ready, or reloaded to show changes over time:
     *
     *     @example wide
     *     <dataset name="example" url="/example.json"></dataset>
     *     <spacedlayout></spacedlayout>
     *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
     */
/**
        * @attribute {String} name (required)
        * The name of the dataset
        */
/**
        * @property {Object} data
        * The data inside the dataset
        */
/**
        * @attribute {String} url
        * The url to load JSON data from.
        */
/**
     * @class dr.dragstate {UI Components}
     * @extends dr.state
     * Allows views to be dragged by the mouse.
     *
     * Here is a view that contains a dragstate. The dragstate is applied when the mouse is down in the view, and then removed when the mouse is up. You can modify the attributes of the draggable view by setting them inside the dragstate, like we do here with bgcolor.
     *
     *     @example
     *     <view width="100" height="100" bgcolor="plum">
     *       <attribute name="mouseIsDown" type="boolean" value="false"></attribute>
     *       <handler event="onmousedown">
     *         this.setAttribute('mouseIsDown', true);
     *       </handler>
     *       <handler event="onmouseup">
     *         this.setAttribute('mouseIsDown', false);
     *       </handler>
     *       <dragstate applied="${this.parent.mouseIsDown}">
     *         <attribute name="bgcolor" type="string" value="purple"></attribute>
     *       </dragstate>
     *     </view>
     *
     * To constrain the motion of the element to either the x or y axis set the dragaxis property. Here the same purple square can only move horizontally.
     *
     *     @example
     *     <view width="100" height="100" bgcolor="plum">
     *       <attribute name="mouseIsDown" type="boolean" value="false"></attribute>
     *       <handler event="onmousedown">
     *         this.setAttribute('mouseIsDown', true);
     *       </handler>
     *       <handler event="onmouseup">
     *         this.setAttribute('mouseIsDown', false);
     *       </handler>
     *       <dragstate applied="${this.parent.mouseIsDown}" dragaxis="x">
     *         <attribute name="bgcolor" type="string" value="purple"></attribute>
     *       </dragstate>
     *     </view>
     */
/**
        * @attribute {"x"/"y"/"both"} [dragaxis="both"]
        * The axes to drag on.
        */
/**
     * @class dr.gyro {Input}
     * @extends dr.node
     * Receives gyroscope and compass data where available. See [https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation](https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation) and [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
     */
/**
        * @attribute {Number} [x=0] (readonly)
        * The accelerometer x value
        */
/**
        * @attribute {Number} [y=0] (readonly)
        * The accelerometer y value
        */
/**
        * @attribute {Number} [z=0] (readonly)
        * The accelerometer z value
        */
/**
        * @attribute {Number} [alpha=0] (readonly)
        * The gyro alpha value rotating around the z axis
        */
/**
        * @attribute {Number} [beta=0] (readonly)
        * The gyro beta value rotating around the x axis
        */
/**
        * @attribute {Number} [gamma=0] (readonly)
        * The gyro gamma value rotating around the y axis
        */
/**
        * @attribute {Number} [compass=0] (readonly)
        * The compass orientation, see [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
        */
/**
        * @attribute {Number} [compassaccuracy=0] (readonly)
        * The compass accuracy, see [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
        */
/**
     * @class dr.labelbutton {UI Components}
     * @extends dr.buttonbase
     * Button class consisting of text centered in a view. The onclick event
     * is generated when the button is clicked. The visual state of the 
     * button changes during onmousedown/onmouseup.
     *
     *     @example
     *     <spacedlayout axis="y"></spacedlayout>
     *
     *     <labelbutton text="click me" defaultcolor="plum" selectcolor="orchid">
     *       <handler event="onclick">
     *         hello.setAttribute('text', 'Hello Universe!');
     *       </handler>
     *     </labelbutton>
     *
     *     <text id="hello"></text>
     */
/**
     * @class dr.labeltoggle {UI Components}
     * @extends dr.labelbutton
     * Button class consisting of text centered in a view. The state of the
     * button changes each time the button is clicked. The select property
     * holds the current state of the button. The onselected event
     * is generated when the button is the selected state.
     *
     *     @example
     *     <spacedlayout axis="y"></spacedlayout>
     *
     *     <labeltoggle id="toggle" text="Click me to toggle" defaultcolor="plum" selectcolor="orchid"></labeltoggle>
     *
     *     <text text="${toggle.selected ? 'selected' : 'not selected'}"></text>
     */
/**
     * @class dr.logger {Util}
     * @extends dr.node
     * Logs all attribute setting behavior
     *
     * This example shows how to log all setAttribute() calls for a replicator to console.log():
     *
     *     @example
     *     <dataset name="topmovies" url="/top_movies.json"></dataset>
     *     <replicator datapath="$topmovies/searchResponse/results[*]/movie[take(/releaseYear,/duration,/rating)]" classname="logger"></replicator>
     */
/**
   * @class dr.rangeslider {UI Components}
   * @extends dr.view
   * An input component whose upper and lower bounds are changed via mouse clicks or drags.
   *
   *     @example
   *
   *     <rangeslider name="range" width="300" height="40" x="10" y="30" lowselectcolor="#00CCFF" highselectcolor="#FFCCFF" outline="2px dashed #00CCFF"
   *                  lowvalue="30"
   *                  highvalue="70">
   *     </rangeslider>
   *
   *     <text name="rangeLabel" color="white" height="40"
   *           y="${this.parent.range.y + (this.parent.range.height / 2) - (this.height / 2)}"
   *           x="${(this.parent.range.lowvalue * 3) + (((this.parent.range.highvalue * 3) - (this.parent.range.lowvalue * 3)) / 2) - (this.width / 2)}"
   *           text="${Math.round(this.parent.range.lowvalue) + ' ~ ' + Math.round(this.parent.range.highvalue)}"></text>
   *
   *
   * A range slider highlights the inclusive values by default, however this behavior can be reversed with `exclusive="true"`.
   * The following example demonstrates an exclusive-valued, inverted (range goes from high to low) horizontal slider.
   *
   *     @example
   *
   *     <rangeslider name="range" width="400" x="10" y="30" lowselectcolor="#AACCFF" highselectcolor="#FFAACC""
   *                  height="30"
   *                  lowvalue="45"
   *                  highvalue="55"
   *                  invert="true"
   *                  exclusive="true">
   *     </rangeslider>
   *
   *     <text name="highRangeLabel" color="#666" height="20"
   *           y="${this.parent.range.y + (this.parent.range.height / 2) - (this.height / 2)}"
   *           x="${(((this.parent.range.maxvalue * 4) - (this.parent.range.highvalue * 4)) / 2) - (this.width / 2)}"
   *           text="${this.parent.range.maxvalue + ' ~ ' + Math.round(this.parent.range.highvalue)}"></text>
   *
   *     <text name="lowRangeLabel" color="#666" height="20"
   *           y="${this.parent.range.y + (this.parent.range.height / 2) - (this.height / 2)}"
   *           x="${(this.parent.range.width - (this.parent.range.lowvalue * 4)) + (((this.parent.range.lowvalue * 4) - (this.parent.range.minvalue * 4)) / 2) - (this.width / 2)}"
   *           text="${Math.round(this.parent.range.lowvalue) + ' ~ ' + this.parent.range.minvalue}"></text>
   *
   */
/**
      * @attribute {Number} [minvalue=0]
      * The minimum value of the slider
      */
/**
    * @attribute {Number} [minhighvalue=0]
    * The minimum value of the right slider
    */
/**
      * @attribute {Number} [maxvalue=100]
      * The maximum value of the slider
      */
/**
      * @attribute {Number} [maxlowvalue=100]
      * The maximum value of the lower bound slider
      */
/**
      * @attribute {"x"/"y"} [axis=x]
      * The axis to track on
      */
/**
      * @attribute {Boolean} [invert=false]
      * Set to false to have the scale run lower to higher, true to run higher to lower.
      */
/**
      * @attribute {Boolean} [exclusive=false]
      * Set to true to highlight the outer (exclusive) values of the range, false to select the inner (inclusive) values.
      */
/**
      * @attribute {Number} [lowvalue=50]
      * The current value of the left slider.
      * Use changeLowValue() to range check the number and set the value.
      */
/**
      * @attribute {Number} [highvalue=50]
      * The current value of the right slider.
      * Use changeHighValue() to range check the number and set the value.
      */
/**
      * @method changeLowValue
      * Given a new value for the slider position, constrain the value
      * between minvalue and maxvalue or maxlowvalue (whichever is lower) and then calls setAttribute.
      * @param {Number} v The new value of the component.
      */
/**
      * @method changeHighValue
      * Given a new value for the slider position, constrain the value
      * between minvalue or minhighvalue (whichever is higher) and maxvalue and then calls setAttribute.
      * @param {Number} v The new value of the component.
      */
/**
      * @attribute {String} [lowselectcolor="#a0a0a0"]
      * The selected color of the lower bound slider.
      */
/**
      * @attribute {String} [highselectcolor="#a0a0a0"]
      * The selected color of the upper bound slider.
      */
/**
     * @class dr.replicator {Data}
     * @extends dr.node
     * Handles replication and data binding.
     *
     * This example shows the replicator to creating four text instances, each corresponding to an item in the data attribute:
     *
     *     @example
     *     <spacedlayout></spacedlayout>
     *     <replicator classname="text" data="[1,2,3,4]"></replicator>
     *
     * Changing the data attribute to a new array causes the replicator to create a new text for each item:
     *
     *     @example
     *     <spacedlayout></spacedlayout>
     *     <text onclick="repl.setAttribute('data', [5,6,7,8]);">Click to change data</text>
     *     <replicator id="repl" classname="text" data="[1,2,3,4]"></replicator>
     *
     * This example uses a {@link #filterexpression filterexpression} to filter the data to only numbers. Clicking changes {@link #filterexpression filterexpression} to show only non-numbers in the data:
     *
     *     @example
     *     <spacedlayout></spacedlayout>
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
     *     <spacedlayout></spacedlayout>
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
     *     <spacedlayout></spacedlayout>
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
     *     <spacedlayout></spacedlayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[0,3,2]/color"></replicator>
     *
     * Sometimes it's necessary to have complete control and flexibility over filtering and transforming results. Adding a [@] operator to the end of your datapath causes {@link #filterfunction filterfunction} to be called for each result. This example shows bike colors for bikes with a price greater than 20, in reverse order:
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
     *     <spacedlayout></spacedlayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[*][@]">
     *       <method name="filterfunction" args="obj, accum">
     *         // add the color to the beginning of the results if the price is greater than 20
     *         if (obj.price > 20)
     *           accum.unshift(obj.color);
     *         return accum
     *       </method>
     *     </replicator>
     *
     * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for more details.
     */
/**
        * @attribute {Boolean} [pooling=false]
        * If true, reuse views when replicating.
        */
/**
        * @attribute {Array} [data=[]]
        * The list of items to replicate. If {@link #datapath datapath} is set, it is converted to an array and stored here.
        */
/**
        * @attribute {String} classname (required)
        * The name of the class to be replicated.
        */
/**
        * @attribute {String} datapath
        * The datapath expression to be replicated.
        * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for details.
        */
/**
        * @attribute {String} [sortfield=""]
        * The field in the data to use for sorting. Only sort then this 
        */
/**
        * @attribute {Boolean} [sortasc=true]
        * If true, sort ascending.
        */
/**
        * @attribute {String} [filterexpression=""]
        * If defined, data will be filtered against a [regular expression](https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions). 
        */
/**
        * @method refresh
        * Refreshes the dataset manually
        */
/**
        * @method filterfunction
        * @abstract
        * Called to filter data.
        * @param obj An individual item to be processed.
        * @param {Object[]} accum The array of items that have been accumulated. To keep a processed item, it must be added to the accum array.
        * @returns {Object[]} The accum array. Must be returned otherwise results will be lost.
        */
/**
      * @class dr.resizelayout {Layout}
      * @extends dr.spacedlayout
      * Resizes one or more views to fill in any remaining space.
      *
      *     @example
      *     <resizelayout spacing="2" inset="5" outset="5">
      *     </resizelayout>
      *
      *     <view height="25" bgcolor="lightpink"></view>
      *     <view height="35" bgcolor="plum" layouthint="1"></view>
      *     <view height="15" bgcolor="lightblue"></view>
      */
/**
     * @class dr.shim {Util}
     * @extends dr.node
     * Connects to the shared event bus. When data is sent with a given type, a corresponding event is sent. For example, send('blah', {}) sends data with the 'blah' type, other shims will receive the object via an 'onblah' event.
     */
/**
        * @attribute {Boolean} [connected=false] (readonly)
        * If true, we are connected to the server
        */
/**
        * @attribute {Number} [pingtime=1000]
        * The frequency used to reconnect to the server
        */
/**
        * @attribute {Boolean} [websockets=false]
        * If true, use websockets to connect to the server
        */
/**
        * @method send
        * Sends some data over the event bus.
        * @param {String} type The type of event to be sent.
        * @param {Object} data The data to be sent.
        */
/**
      * @class dr.shrinktofit {Layout}
      * @extends dr.layout
      * A special "layout" that resizes the parent to fit the children 
      * rather than laying out the children.
      *
      *
      * Here is a view that contains three sub views that are positioned with a spacedlayout. The parent view has a grey background color. Notice that the subviews are visible because they overflow the parent view, but the parent view itself takes up no space.
      *
      *     @example
      *     <view bgcolor="darkgrey">
      *       <spacedlayout axis="y"></spacedlayout>
      *
      *       <view width="100" height="25" bgcolor="lightpink" opacity=".3"></view>
      *       <view width="100" height="25" bgcolor="plum" opacity=".3"></view>
      *       <view width="100" height="25" bgcolor="lightblue" opacity=".3"></view>
      *     </view>
      *
      * Now we'll add a shrinktofit to the parent view. Notice that now the parent view does take up space, and you can see it through the semi-transparent subviews.
      *
      *     @example
      *     <view bgcolor="darkgrey">
      *       <shrinktofit axis="both" xpad="5" ypad="10"></shrinktofit>
      *
      *       <spacedlayout axis="y"></spacedlayout>
      *
      *       <view width="100" height="25" bgcolor="lightpink" opacity=".3"></view>
      *       <view width="100" height="25" bgcolor="plum" opacity=".3"></view>
      *       <view width="100" height="25" bgcolor="lightblue" opacity=".3"></view>
      *     </view>
      */
/**
    * @attribute {String} [axis=x]
    * The axis along which to resize this view to fit its children. 
    * Supported values are 'x', 'y' and 'both'.
    */
/**
    * @attribute {Number} [xpad=0]
    * Additional space added on the child extent along the x-axis.
    */
/**
    * @attribute {Number} [ypad=0]
    * Additional space added on the child extent along the y-axis.
    */
/**
    * @method __updateMonitoringSubview 
    * Wrapped by startMonitoringSubview and stopMonitoringSubview.
    * @param {dr.view} view
    * @param {Function} func
    * @return {void}
    * @private
    */
/**
     * @class dr.slider {UI Components}
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
     *     <spacedlayout spacing="8"></spacedlayout>
     *     <slider name="hslide" y="5" width="250" height="10" value="50" bgcolor="#808080"></slider>
     *     <text text="${Math.round(this.parent.hslide.value)}" y="${this.parent.hslide.y + (this.parent.hslide.height-this.height)/2}"></text>
     */
/**
        * @attribute {Number} [minvalue=0]
        * The minimum value of the slider
        */
/**
        * @attribute {Number} [maxvalue=100]
        * The maximum value of the slider
        */
/**
        * @attribute {"x"/"y"} [axis=x]
        * The axis to track on
        */
/**
        * @attribute {Boolean} [invert=false]
        * Set to true to invert the direction of the slider.
        */
/**
        * @attribute {Number} [value=0]
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
        * @attribute {String} [selectcolor="#a0a0a0"]
        * The selected color of the slider.
        */
/**
      * @class dr.spacedlayout {Layout}
      * @extends dr.variablelayout
      * A variableLayout that positions views along an axis using an inset, 
      * outset and spacing value.
      *
      *     @example
      *     <spacedlayout axis="y" spacing="2" inset="5" outset="5">
      *     </spacedlayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="35" bgcolor="plum"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {Number} [spacing=0]
    * The spacing between views.
    */
/**
    * @attribute {Number} [outset=0]
    * Space after the last view. Only used when collapseparent is true.
    */
/**
    * @attribute {Number} [inset=0]
    * Space before the first view.
    */
/**
    * @attribute {String} [axis='x']
    * The orientation of the layout. Supported values are 'x' and 'y'.
    * A value of 'x' will orient the views horizontally and a value of 'y'
    * will orient them vertically.
    */
/**
     * @class dr.stats {Util}
     * @extends dr.view
     * wraps the three.js stats control which shows framerate over time
     *
     * This example shows how use the stats control to monitor framerate:
     *
     *     @example
     *     <stats></stats>
     */
/**
     * @class dr.touch {Input}
     * @extends dr.node
     * Receives touch and multitouch data where available.
     */
/**
        * @attribute {Number} [x=0] (readonly)
        * The touch x value for the first finger.
        */
/**
        * @attribute {Number} [y=0] (readonly)
        * The touch y value for the first finger.
        */
/**
        * @attribute {Object[]} touches (readonly)
        * An array of x/y coordinates for all fingers, where available. See [https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events) for more details
        */
/**
      * @class dr.variablelayout {Layout}
      * @extends dr.constantlayout
      * Allows for variation based on the index and subview. An updateSubview 
      * method is provided that can be overriden to provide variable behavior.
      *
      *     @example
      *     <variablelayout attribute="x" value="10">
      *     </variablelayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="25" bgcolor="plum"></view>
      *     <view width="100" height="25" bgcolor="lightblue"></view>
      */
/**
    * @attribute {boolean} [collapseparent=false]
    * If true the updateParent method will be called. The updateParent method 
    * will typically resize the parent to fit the newly layed out child views.
    */
/**
    * @attribute {boolean} [reverse=false]
    * If true the layout will position the items in the opposite order. For 
    * example, right to left instead of left to right.
    */
/**
    * @method doBeforeUpdate
    * Called by update before any processing is done. Gives subviews a
    * chance to do any special setup before update is processed.
    * @return {void}
    */
/**
    * @method doAfterUpdate
    * Called by update after any processing is done but before the optional
    * collapsing of parent is done. Gives subviews a chance to do any 
    * special teardown after update is processed.
    * @return {void}
    */
/**
    * @method startMonitoringSubview
    * Provides a default implementation that calls update when the
    * visibility of a subview changes.
    * @param {dr.view} view
    */
/**
    * @method stopMonitoringSubview
    * Provides a default implementation that calls update when the
    * visibility of a subview changes.
    * @param {dr.view} view
    */
/**
    * @method updateSubview
    * Called for each subview in the layout.
    * @param {Number} count The number of subviews that have been layed out
    *   including the current one. i.e. count will be 1 for the first
    *   subview layed out.
    * @param {dr.view} view The subview being layed out.
    * @param {String} attribute The name of the attribute to update.
    * @param {*} value The value to set on the subview.
    * @return {*} The value to use for the next subview.
    */
/**
    * @method skipSubview
    * Called for each subview in the layout to determine if the view should
    * be updated or not. The default implementation returns true if the 
    * subview is not visible.
    * @param {dr.view} view The subview to check.
    * @return {Boolean} True if the subview should be skipped during 
    *   layout updates.
    */
/**
    * @method updateParent
    * Called if the collapseparent attribute is true. Subclasses should 
    * implement this if they want to modify the parent view.
    * @param {String} attribute The name of the attribute to update.
    * @param {*} value The value to set on the parent.
    * @return {void}
    */
/**
     * @class dr.webpage {UI Components}
     * @extends dr.view
     * iframe component for embedding dreem code or html in a dreem application.
     * The size of the iframe matches the width/height of the view when the
     * component is created. The iframe component can show a web page by
     * using the src attribute, or to show dynamic content using the
     * contents attribute.
     *
     * This example shows how to display a web page in an iframe. The 
     * contents of the iframe are not editable:
     *
     *     @example
     *     <webpage src="http://en.wikipedia.org/wiki/San_Francisco" width="300" height="140"></webpage>
     *
     * To make the web page clickable, and to add scrolling:
     *
     *     @example
     *     <webpage src="http://en.wikipedia.org/wiki/San_Francisco" width="300" height="140" scrolling="true" clickable="true"></webpage>
     *
     * The content of the iframe can also be dynamically generated, including
     * adding Dreem code:
     *
     *     @example
     *     <webpage width="300" height="140" contents="Hello"></webpage>
     *
     */
/**
        * @attribute {String} [src="/iframe_stub.html"]
        * url to load inside the iframe. By default, a file is loaded that has
        * an empty body but includes the libraries needed to support Dreem code.
        */
/**
        * @attribute {Boolean} [scrolling="false"]
        * Controls scrollbar display in the iframe.
        */
/**
        * @attribute {String} [contents=""]
        * string to write into the iframe body. This is dreem/html code
        * that is written inside the iframe's body tag. If you want to display
        * static web pages, specify the src attribute, but do not use contents.
        */
/**
      * @class dr.wrappinglayout {Layout}
      * @extends dr.variablelayout
      * An extension of VariableLayout that positions views along an axis using
      * an inset, outset and spacing value. Views will be wrapped when they
      * overflow the available space.
      *
      * Supported Layout Hints:
      *   break:string Will force the subview to start a new line/column.
      *
      *     @example
      *     <wrappinglayout axis="y" spacing="2" inset="5" outset="5" lineinset="10" linespacing="5" lineoutset="10">
      *     </wrappinglayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="35" bgcolor="plum"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {Number} [spacing=0]
    * The spacing between views.
    */
/**
    * @attribute {Number} [outset=0]
    * Space after the last view.
    */
/**
    * @attribute {Number} [inset=0]
    * Space before the first view.
    */
/**
    * @attribute {Number} [linespacing=0]
    * The spacing between each line of views.
    */
/**
    * @attribute {Number} [lineoutset=0]
    * Space after the last line of views. Only used when collapseparent is true.
    */
/**
    * @attribute {Number} [lineinset=0]
    * Space before the first line of views.
    */
/**
    * @attribute {String} [axis='x']
    * The orientation of the layout. Supported values are 'x' and 'y'.
    * A value of 'x' will orient the views horizontally and a value of 'y'
    * will orient them vertically.
    */
