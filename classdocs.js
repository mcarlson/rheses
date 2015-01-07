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
      * If updateparent is true the parent will be sized to fit the
      * aligned views such that the view with the greatest extent will have
      * a position of 0. If instead updateparent is false the views will
      * be aligned within the inner extent of the parent view.
      *
      *     @example
      *     <alignlayout align="middle" updateparent="true"></alignlayout>
      *
      *     <view x="0" width="50" height="35" bgcolor="plum"></view>
      *     <view x="55" width="50" height="25" bgcolor="lightpink"></view>
      *     <view x="110" width="50" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {String} [align='middle']
    * Determines which way the views are aligned. Supported values are 
    * 'left', 'center', 'right' for horizontal alignment and 'top', 'middle' 
    * and 'bottom' for vertical alignment.
    */
/**
    * @attribute {boolean} [inset=0]
    * Determines if the parent will be sized to fit the aligned views such 
    * that the view with the greatest extent will have a position of 0. If 
    * instead updateparent is false the views will be aligned within the 
    * inner extent of the parent view.
    */
/**
    * @method doBeforeUpdate
    * Determine the maximum subview width/height according to the alignment.
    * This is only necessary if updateparent is true since we will need to
    * know what size to make the parent as well as what size to align the
    * subviews within.
    */
/**
    * @class dr.animator {Animation}
    * @extends dr.node
    * Animator class that can animate keys on other objects
    *
    *     @example nested
    *     <view bgcolor="red" x="0" y="0" width="100" height="100">
    *       <animator attribute="x" to="200" duration="1000">
    *         <handler event="onend">
    *           console.log('the animation ended')
    *         </handler>
    *       </animator>
    *     </view>
    */
/**
      * @attribute {Number} delay=0
      * The amount of time to delay the start of the animation
      */
/**
      * @attribute {String} from
      * The value to start the animation from, if not specified is read from the target attribute
      */
/**
      * @attribute {String} to=0
      * The value to animate to. Is identical to specifying a <keyframe at='{duration}'>{to}</keyframe>
      */
/**
      * @attribute {Number} duration=1000
      * The duration of the animation. Is identical to specifying a <keyframe at='{duration}'>{to}</keyframe>
      */
/**
      * @attribute {String} attribute
      * The name of the attribute this animator is animating
      */
/**
      * @attribute {String} target
      * Name of the target object id, not needed if animator is used as a child tag in the target node
      */
/**
      * @attribute {Boolean} paused=false
      * wether or not the animator is paused
      */
/** 
      * @attribute {String} motion=bret
      * name of the motion the animation is following
      * valid values are:
      * 'bezier' use a cubic bezier motion function
      *   use control points in control='x1,y1,x2,y2' 
      *   for example control='0,0,1,1'
      *   bezier control points work the same as the CSS3 cubic-bezier easing
      * 'bret' uses brets animation function, has 2 control points
      *   control='start,end' value near 0 (0.01) will produce a curved line
      *   where values near 1.0 will produce a straight line
      *   this way you can control the 'easing' from 'smooth' (0.01) to 'hard' (1.0)
      *   on each side start / end of the animation
      *   for example control='0.01,1.00' produces an animation with a smooth start and a hard end 
      * 'linear' simple linear motion
      * the following curves can be seen here http://api.jqueryui.com/easings/
      * 'inQuad' use a t^2 curve
      * 'outQuad' t^2 curve on out
      * 'inOutQuad' mix of inQuad and outQuad
      * 'inCubic' use a t^3 curve
      * 'outCubic' t^3 curve on out
      * 'inOutCubic' mix of inCubic and outCubic
      * 'inQuart' t^4 curve
      * 'outQuart' t^4 curve on out
      * 'inOutQuart' mix of inQuart and outQuart
      * 'inQuint' t^5 curve
      * 'outQuint' t^5 curve on out
      * 'inOutQuint' mix of inQuint and outQuint
      * 'inSine' sin(t) curve
      * 'outSine' sin(t) on out
      * 'inOutSine' mix of inSine and outSine
      * 'inExpo' e^t curve
      * 'outExpo' e^t curve on end
      * 'inOutExpo' mix of inExpo and outExpo
      * 'inElastic' elastic (like bounce, but overshoots) curve
      * 'outElastic' elastic on end
      * 'inOutElastic' mix of inElastic and outElastic
      * 'inBack' overshooting curve
      * 'outBack' overshooting on end
      * 'inOutBack' mix of inBack and outBack
      * 'inBounce' Bouncing curve
      * 'outBounce' Bouncing curve on end
      * 'inOutBounce' mix of inBounce and outBounce
      */
/**
      * @attribute {String} control=0.01
      * control points for the bret and bezier motions
      */
/**
      * @attribute {Number} repeat=1
      * how many times to repeat the loop (repeat 2 runs something twice)
      */
/**
      * @attribute {Boolean} bounce=false
      * turn on bounce looping
      */
/**
      * @attribute {Boolean} relative=false
      * animation is relative to original value
      */
/**
      * @event onstart
      * Fired when animation starts
      */
/**
      * @event onend
      * Fired when animation ends
      */
/**
      * @event ontick
      * Fired every step of the animation
      */
/**
    * @class dr.animgroup {Animation}
    * @extends dr.node
    * Animator class that can animate keys on other objects
    *
    *     @example nestedr="red" x="0" y="0" width="100" height="100"/>
    *     <view id='obj1' bgcolor="green" x="0" y="0" width="100" height="100">
    *       <animgroup duration='1000'>
    *         <animator attribute="x" to="100" motion="outBounce" repeat="2"/>
    *         <animator delay="100" attribute="y" to="50" motion="outBounce" repeat="2"/>
    *         <animator attribute="bgcolor" to="red"/>
    *       </animgroup>
    *     </view>
    */
/**
      * @attribute {Boolean} sequential=false
      * If true, animations run in sequence
      */
/**
      * @attribute {String} delay=0
      * The delay time of the animation
      */
/**
      * @attribute {Boolean} paused=false
      * wether or not the animgroup is paused
      */
/** 
      * @attribute {String} motion=bret
      * name of the motion the animation is following
      * valid values are:
      * 'bezier' use a cubic bezier motion function
      *   use control points in control='x1,y1,x2,y2' 
      *   for example control='0,0,1,1'
      *   bezier control points work the same as the CSS3 cubic-bezier easing
      * 'bret' uses brets animation function, has 2 control points
      *   control='start,end' value near 0 (0.01) will produce a curved line
      *   where values near 1.0 will produce a straight line
      *   this way you can control the 'easing' from 'smooth' (0.01) to 'hard' (1.0)
      *   on each side start / end of the animation
      *   for example control='0.01,1.00' produces an animation with a smooth start and a hard end 
      * 'linear' simple linear motion
      * the following curves can be seen here http://api.jqueryui.com/easings/
      * 'inQuad' use a t^2 curve
      * 'outQuad' t^2 curve on out
      * 'inOutQuad' mix of inQuad and outQuad
      * 'inCubic' use a t^3 curve
      * 'outCubic' t^3 curve on out
      * 'inOutCubic' mix of inCubic and outCubic
      * 'inQuart' t^4 curve
      * 'outQuart' t^4 curve on out
      * 'inOutQuart' mix of inQuart and outQuart
      * 'inQuint' t^5 curve
      * 'outQuint' t^5 curve on out
      * 'inOutQuint' mix of inQuint and outQuint
      * 'inSine' sin(t) curve
      * 'outSine' sin(t) on out
      * 'inOutSine' mix of inSine and outSine
      * 'inExpo' e^t curve
      * 'outExpo' e^t curve on end
      * 'inOutExpo' mix of inExpo and outExpo
      * 'inElastic' elastic (like bounce, but overshoots) curve
      * 'outElastic' elastic on end
      * 'inOutElastic' mix of inElastic and outElastic
      * 'inBack' overshooting curve
      * 'outBack' overshooting on end
      * 'inOutBack' mix of inBack and outBack
      * 'inBounce' Bouncing curve
      * 'outBounce' Bouncing curve on end
      * 'inOutBounce' mix of inBounce and outBounce
      */
/**
      * @attribute {String} control=0.01
      * control points for the bret and bezier motions
      */
/**
      * @attribute {Number} times=1
      * how many times to times the loop (times 2 runs something twice)
      */
/**
      * @attribute {Boolean} bounce=false
      * turn on bounce looping
      */
/**
      * @event onstart
      * Fired when animation starts
      */
/**
      * @event onend
      * Fired when animation ends
      */
/**
      * @event ontick
      * Fired every step of the animation
      */
/**
     * @class dr.art {UI Components}
     * @extends dr.view
     * Vector graphics support using svg.
     *
     * This example shows how to load an existing svg
     *
     *     @example
     *     <art width="100" height="100" src="/examples/img/siemens-clock.svg"></art>
     *
     * Paths within an svg can be selected using the path attribute
     *
     *     @example
     *     <art width="100" height="100" src="/examples/img/cursorshapes.svg" path="0"></art>
     *
     * Attributes are automatically passed through to the SVG. Here, the fill color is changed
     *
     *     @example
     *     <art width="100" height="100" src="/examples/img/cursorshapes.svg" path="0" fill="coral"></art>
     *
     * Setting the path attribute animates between paths. This example animates when the mouse is clicked
     *
     *     @example
     *     <art width="100" height="100" src="/examples/img/cursorshapes.svg" path="0" fill="coral">
     *       <handler event="onclick">
     *         this.setAttribute('path', this.path ^ 1);
     *       </handler>
     *     </art>
     *
     * The animationframe attribute controls which frame is displayed. The
     * value is a floating point number to display a frame between two
     * keyframes. For example, 1.4 will display the frame 40% between
     * paths 1 and 2. This example will animate between keyframes 0, 1, 2.
     *
     *     @example
     *     <art id="art_3" width="100" height="100" src="/examples/img/cursorshapes.svg" path="0" fill="coral" animationspeed="1000" animationcurve="linear">
     *       <handler event="onclick">
     *         this.setAttribute('animationframe', 0);
     *         this.animate({animationframe: 2}, 1000);
     *       </handler>
     *     </art>
     *
     * By default, the SVG's aspect ratio is preserved. Set the stretches attribute to true to change this behavior.
     *
     *     @example
     *     <art width="200" height="100" src="/examples/img/cursorshapes.svg" path="0" fill="coral" stretches="true">
     *       <handler event="onclick">
     *         this.setAttribute('path', this.path ^ 1);
     *         this.animate({width: (this.width == 200 ? 100 : 200)});
     *       </handler>
     *     </art>
     *
     * The art component can work with the animator component to control which
     * frame is displayed. For example, this will animate the graphic between
     * frames 0, 1, 2, 3, and display the frame inside the component.
     *
     *     @example
     *     <class name="centertext2" extends="text" color="white" height="40" x="${this.parent.width/2-this.width/2}" y="${this.parent.height/2-this.height/2}">
     *       <method name="format" args="value">
     *         if (value < 0.0) return '';
     *         return value.toFixed(2);
     *       </method>
     *     </class>
     *     <art id="art_1" width="100" height="100" src="/examples/img/cursorshapes.svg" path="0" stroke="coral" fill="coral" stretches="true">
     *       <centertext2 text="${this.parent.animationframe}"></centertext2>
     *       <animator start="0" from="0" to="3" attribute="animationframe" duration="4000" motion = "outBounce" repeat="1">
     *       </animator>
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
        * @attribute {Boolean} [resize=false]
        * By default, the art component size is fixed to the specified size.
        * By setting resize=true, the art component is sized to the size 
        * embedded in the svg.
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
        * @attribute {Number} [animationframe=0]
        * The current animation frame
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
     *
     * Stretch an image to fill the entire view.
     *     @example
     *     <bitmap src="../api-examples-resources/shasta.jpg" width="300" height="150" stretches="true"></bitmap>
     *
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
        * @attribute {String} [stretches=false]
        * How the image is scaled to the size of the view.
        * Supported values are 'true', 'false', 'scale'.
        * false will scale the image to completely fill the view, but may obscure parts of the image.
        * true will stretch the image to fit the view.
        * scale will scale the image so it visible within the view, but the image may not fill the entire view.
        */
/**
      * @class dr.bitmapbutton {Deprecated}
      * @extends dr.statebutton
      * bitmapbutton has been deprecated, use dr.statebutton instead
      */
/**
      * @class dr.boundedview {Deprecated}
      * @extends dr.view
      * boundedview has been deprecated, use dr.view with a width and 
      * height of auto instead.
      */
/**
      * @class dr.boundslayout {Deprecated}
      * @extends dr.layout
      * boundslayout has been deprecated, use dr.shrinktofit instead
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
      * each sibling view of the layout.
      *
      * This layout is useful if you want to ensure that an attribute value is 
      * shared in common by most or all children of a view. It also makes
      * updating that value easy since you can change the value on the
      * constant layout and it will be applied to all the managed sibling views.
      *
      * This constant layout will set the y attribute to 10 for every sibling
      * view. Furthermore, since it's a layout, any new sibling view added
      * will also have its y attribute set to 10. Also, notice that the sibling
      * view with the black bgcolor has ignorelayout set to true. This means
      * that view will be ignored by the layout and will thus not have its
      * y attribute set to 10. You can change ignorelayout at runtime and the
      * view will be added to, or removed from the layout. If you do remove a 
      * view at runtime from the layout the y attribute for that view will not 
      * be changed, but subsequent changes to the layout will no longer effect
      * the view.
      *
      *     @example
      *     <constantlayout attribute="y" value="10"></constantlayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="25" bgcolor="plum"></view>
      *     <view ignorelayout="true" width="100" height="25" bgcolor="black"></view>
      *     <view width="100" height="25" bgcolor="lightblue"></view>
      */
/**
    * @attribute {String} [attribute=x]
    * The name of the attribute to update on each subview.
    */
/**
    * @attribute {*} [value=0]
    * The value to set the attribute to on each subview.
    */
/**
    * @method update
    * Set the attribute to the value on every subview managed by this layout.
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
     *     <dataset name="example" url="/examples/data/example.json"></dataset>
     *     <spacedlayout></spacedlayout>
     *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
     */
/**
        * @attribute {String} name (required)
        * The name of the dataset
        */
/**
        * @attribute {Object} data
        * @readonly
        * The data inside the dataset
        */
/**
        * @attribute {String} url
        * The url to load JSON data from.
        */
/**
        * @attribute {Boolean} [async=false]
        * If true, parse json in a worker thread
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
     * @class dr.dreem_iframe {Deprecated}
     * @extends dr.view
     * dreem_iframe has been deprecated, use dr.webpage instead
     */
/**
     * @class dr.gyro {Input}
     * @extends dr.node
     * Receives gyroscope and compass data where available. See [https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation](https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation) and [https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html) for details.
     */
/**
        * @attribute {Boolean} [active=false] (readonly)
        * True if gyro is supported
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
     * @class dr.inputtext {UI Components, Input}
     * @extends dr.view
     * Provides an editable input text field.
     *
     *     @example
     *     <spacedlayout axis="y"></spacedlayout>
     *
     *     <text text="Enter your name"></text>
     *
     *     <inputtext id="nameinput" bgcolor="white" border="1px solid lightgrey" width="200"></inputtext>
     *
     *     <labelbutton text="submit">
     *       <handler event="onclick">
     *         welcome.setAttribute('text', 'Welcome ' + nameinput.text);
     *       </handler>
     *     </labelbutton>
     *
     *     <text id="welcome"></text>
     *
     * It's possible to listen for an onchange event to find out when the user changed the inputtext value:
     *
     *     @example
     *     <inputtext id="nameinput" bgcolor="white" border="1px solid lightgrey" width="200" onchange="console.log('onchange', this.text)"></inputtext>
     *
     */
/**
       * @event onselect
       * Fired when an inputtext is selected
       * @param {dr.view} view The view that fired the event
       */
/**
       * @event onchange
       * Fired when an inputtext has changed
       * @param {dr.view} view The view that fired the event
       */
/**
       * @event onfocus
       * Fired when an inputtext is focused
       * @param {dr.view} view The view that fired the event
       */
/**
       * @event onblur
       * Fired when an inputtext is blurred or loses focus
       * @param {dr.view} view The view that fired the event
       */
/**
       * @event onkeydown
       * Fired when a key goes down
       * @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
       */
/**
       * @event onkeyup
       * Fired when a key goes up
       * @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
       */
/**
       * @attribute {Boolean} [multiline=false]
       * Set to true for a multi-line input text field
       */
/**
       * @attribute {String} [text=""]
       * The contents of this input text field
       */
/**
    * @method format
    * Format the text to be displayed. The default behavior is to
    * return the text intact. Override to change formatting.
    * @param {String} str The current value of the text component.
    * @return {String} The formated string to display in the component.
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
        * @attribute {String} [bgcolor]
        * Sets this view's background color, same as setting defaultcolor.
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
      * @class dr.markup {UI Components}
      * @extends dr.view
      * A view that uses the sizetodom mixin. You can also put HTML inside
      * the element and it will show up in the page.
      * 
      * This example creates a view that contains some HTML text. The view
      * will be sized to fit the text.
      * 
      *     @example
      *     <markup>
      *         <b>Here is some text</b> that is really just HTML.
      *     </markup>
      * 
      * This example creates a view that contains some HTML text. The view
      * will flow the text at a width of 50 pixels and have its height
      * automatically sized to fit the flowed text. If you later want to
      * let the view size its width to the dom just call 
      * setAttribute('width', 'auto').
      * 
      *     @example
      *     <markup width="50">
      *         <b>Here is some text</b> that is really just HTML.
      *     </markup>
      */
/**
      * @class dr.mixin
      * @extends dr.state
      * Mixins allow methods, handlers, attributes and instances to be mixed 
      * into their parent.
      */
/**
    * @attribute {Boolean} [applied=true]
    * The spacing between views.
    * @private
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
        * @attribute {Boolean} [async=true]
        * If true, create views asynchronously
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
        * @event onreplicated
        * Fired when the replicator is done
        * @param {dr.replicator} replicator The dr.replicator that fired the event
        */
/**
      * @class dr.resizelayout {Layout}
      * @extends dr.spacedlayout
      * An extension of spaced layout that allows one or more "stretchy" views 
      * to fill in any remaining space.
      *
      * A view can be made stretchy by giving it a layouthint with a numerical
      * value, typically 1. Extra space is divided proportionally between all
      * sretchy views based on that views percentage of the sum of the
      * "stretchiness" of all stretchy views. For example, a view with a
      * layouthint of 2 will get twice as much space as another view with
      * a layouthint of 1.
      *
      * Since resizelayouts rely on the presence of extra space, the
      * updateparent and updateparent attributes are not applicable to a 
      * resizelayout. Similarly, using auto sizing on the parent view along 
      * the same axis as the resizelayout will result in unexpected behavior 
      * and should therefore be avoided.
      *
      *     @example
      *     <resizelayout spacing="2" inset="5" outset="5">
      *     </resizelayout>
      *
      *     <view height="25" bgcolor="lightpink"></view>
      *     <view height="35" bgcolor="plum" layouthint='{"weight":1}'></view>
      *     <view height="15" bgcolor="lightblue"></view>
      */
/**
      * @class dr.shim {Deprecated}
      * @extends dr.node
      * shim has been deprecated, use dr.teem instead
      */
/**
      * @class dr.shrinktofit {Deprecated}
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
      * @class dr.simplelayout {Deprecated}
      * @extends dr.layout
      * simplelayout has been deprecated, use dr.spacedlayout instead
      */
/**
      * @class dr.sizetodom {UI Components}
      * @extends dr.state
      * Enables a view to size itself to the dom elements it contains. This
      * is a reversal of the standard relationship where the "model" pushes
      * changes into the DOM.
      * 
      * You can configure the markup either via the 'markup' attribute, or
      * you can put HTML inside the element and it will be used during
      * initialization. Once a component has been created you should only
      * update via the markup attribute.
      * 
      * If you set an explicit width or height sizing to dom will be suspended
      * for that axis. If later you want to restore the size to dom behavior
      * set the width or height to a value of 'auto'.
      *
      * If you make a modification to the DOM through a means other than
      * setting the markup attribute and that modification results in a change
      * in the size of the DOM you will need to call the sizeToDom method
      * to trigger an update of the width and height of the view.
      * 
      */
/**
    * @attribute {String} [markup='']
    * Sets the inner HTML of this view. Since the < and > characters are
    * not typically supported in the places you'll be configuring this
    * attributes, you can use [ and ] and they will be transformed into < and >.
    * If you need to insert a literal [ character use &amp;#91;. If you need
    * to insert a literal ] character use &amp;#93;.
    */
/**
    * We need to sizeToDom once after initialization since we may have started
    * with HTML inside the element.
    * @private
    */
/**
    * Look for special value of 'auto' for width and height and handle them
    * here rather than letting them bubble up to view.
    * @private
    */
/**
    * @method sizeToDom
    * Sizes this view to the current size of the DOM elements within it.
    * @returns {void}
    */
/**
    * @method unescape
    * Used to support an alternate syntax for markup since the < and >
    * characters are restricted in most places you will want assign the
    * markup to this view. The alternte syntax uses the [ and ] characters to
    * represent < and > respectively. If you need to insert a literal [ or ]
    * character use &amp;#91; or &amp;#93; respectively.
    * @param str The string to unescape.
    * @returns {String} The unescaped string.
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
      * An extension of variableLayout that positions views horizontally or
      * vertically using an initial inset and spacing between each view. If
      * updateparent is true an outset is also used to leave space after
      * the last subview.
      *
      * Each view managed by a spaced layout supports two layout hints.
      *     spacingbefore {Number} Indicates custom spacing to use before the
      *         view. This value overrides spacing for the view it is defined
      *         on. If spacingafter was used on the previous view this will
      *         override that. Ignored for the first view layed out.
      *     spacingafter {Number} Indicates custom spacing to use after the
      *         view. This value overrides spacing for the view it is defined
      *         on. Ignord on the last view layed out.
      *
      * This spacedlayout will position the first view at a y of 5 and each
      * subsequent view will be 2 pixels below the bottom of the preceding one.
      * Since updateparent is true and an outset is defined the parent view
      * will be sized to 5 pixels more than the bottom of the last view. A
      * layout hint has been used on the fourth view so that it will have
      * 10 pixels of space before it and 5 pixels of space after it instead
      * of the spacing of 2 defined on the layout.
      *
      *     @example
      *     <spacedlayout axis="y" spacing="2" inset="5" outset="5" updateparent="true">
      *     </spacedlayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="35" bgcolor="plum"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      *     <view width="100" height="35" bgcolor="plum" layouthint='{"spacingbefore":10, "spacingafter":5}'></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {Number} [spacing=0]
    * The spacing between views.
    */
/**
    * @attribute {Number} [outset=0]
    * Space after the last view. Only used when updateparent is true.
    */
/**
    * @attribute {Number} [inset=0]
    * Space before the first view. This is an alias for the "value" attribute.
    * attribute.
    */
/**
    * @attribute {String} [axis='x']
    * The orientation of the layout. Supported values are 'x' and 'y'.
    * A value of 'x' will orient the views horizontally and a value of 'y'
    * will orient them vertically. This is an alias for the "attribute" 
    * attribute.
    */
/**
    * @attribute attribute
    * @private
    * The axis attribute is an alias for this attribute.
    */
/**
 * @class dr.statebutton {UI Components}
 * @extends dr.view
 * A button that may be configured with views associated with named states. Change which view is active by setting the state attribute. If the state names 'default', 'over', and 'down' are used then state changes based on mouse interactions will automatically be configured by default. If those states are not present then mouse interactions will not be automatically configured, and will be left to the developer to implement.
 *
 * Here is a statebutton configured with three bitmaps associated with the states default, over, and down. Notice the mouse interaction is set up by default.
 *
 *     @example
 *     <statebutton width="100" height="100">
 *       <bitmap name="defaultv" width="100%" height="100%" src="../api-examples-resources/default.png">
 *         <attribute name="state" type="string" value="default"></attribute>
 *       </bitmap>
 *
 *       <bitmap name="overv" width="100%" height="100%" src="../api-examples-resources/over.png">
 *         <attribute name="state" type="string" value="over"></attribute>
 *       </bitmap>
 *
 *       <bitmap name="downv" width="100%" height="100%" src="../api-examples-resources/down.png">
 *         <attribute name="state" type="string" value="down"></attribute>
 *       </bitmap>
 *     </statebutton>
 *
 * Setting the interactive attribute to false disables the default hover and down state changes.
 *
 *     @example
 *     <statebutton interactive="false" width="100" height="100">
 *       <bitmap name="defaultv" width="100%" height="100%" src="../api-examples-resources/default.png">
 *         <attribute name="state" type="string" value="default"></attribute>
 *       </bitmap>
 *
 *       <bitmap name="overv" width="100%" height="100%" src="../api-examples-resources/over.png">
 *         <attribute name="state" type="string" value="over"></attribute>
 *       </bitmap>
 *
 *       <bitmap name="downv" width="100%" height="100%" src="../api-examples-resources/down.png">
 *         <attribute name="state" type="string" value="down"></attribute>
 *       </bitmap>
 *     </statebutton>
 *
 * Configuring custom states will also set the interactive flag to false, and then you can add your own custom state changes
 *
 *     @example
 *     <statebutton width="100" height="100">
 *       <attribute name="statetracker" type="number" value="0"></attribute>
 *       <handler event="onclick">
 *         var newStateIndex = this.statetracker + 1;
 *         if (newStateIndex == 3) newStateIndex = 0;
 *         this.setAttribute('statetracker', newStateIndex)
 *         this.setAttribute('state', this.states[newStateIndex])
 *       </handler>
 *  
 *       <bitmap name="onev" width="100%" height="100%" src="../api-examples-resources/default.png">
 *         <attribute name="state" type="string" value="one"></attribute>
 *       </bitmap>
 *
 *       <bitmap name="twov" width="100%" height="100%" src="../api-examples-resources/over.png">
 *         <attribute name="state" type="string" value="two"></attribute>
 *       </bitmap>
 *
 *       <bitmap name="threev" width="100%" height="100%" src="../api-examples-resources/down.png">
 *         <attribute name="state" type="string" value="three"></attribute>
 *       </bitmap>
 *     </statebutton>
 */
/**
    * @attribute {String} [state="default"]
    * The currently active state.
    */
/**
    * @attribute {Boolean} [interactive="true"]
    * When true default, over, and down states are applied automatically based on mouse/touch interactions. Set to false to disable the default behavior.
    */
/**
    * @attribute {String[]} states
    * @readonly
    * An array of the states
  */
/**
    * @attribute {dr.view} activeview
    * @readonly
    * The currently active view
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
     * @class dr.teem {Util, Events}
     * @extends dr.node
     * Connects to the shared event bus. When data is sent with a given type, a corresponding event is sent. For example, send('blah', {}) sends data with the 'blah' type, other shims will receive the object via an 'onblah' event.
     */
/**
        * @attribute {Number} [pingtime=5000]
        * The frequency used to ping to the server
        */
/**
        * @method send
        * Sends some data over the event bus.
        * @param {String} type The type of event to be sent.
        * @param {Object} data The data to be sent.
        */
/**
      * @class dr.text {UI Components}
      * @extends dr.view
      * Text component that supports single and multi-line text.
      * 
      *  The text component can be fixed size, or sized to fit the size of the text.
      * 
      *      @example
      *      <text text="Hello World!" bgcolor="red"></text>
      * 
      *  Here is a multiline text
      * 
      *      @example
      *      <text multiline="true" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit"></text>
      * 
      *  You might want to set the value of a text element based on the value of other attributes via a constraint. Here we set the value by concatenating three attributes together.
      * 
      *      @example
      *      <attribute name="firstName" type="string" value="Lumpy"></attribute>
      *      <attribute name="middleName" type="string" value="Space"></attribute>
      *      <attribute name="lastName" type="string" value="Princess"></attribute>
      * 
      *      <text text="${this.parent.firstName + ' ' + this.parent.middleName + ' ' + this.parent.lastName}" color="hotpink"></text>
      * 
      *  Constraints can contain more complex JavaScript code
      * 
      *      @example
      *      <attribute name="firstName" type="string" value="Lumpy"></attribute>
      *      <attribute name="middleName" type="string" value="Space"></attribute>
      *      <attribute name="lastName" type="string" value="Princess"></attribute>
      * 
      *      <text text="${this.parent.firstName.charAt(0) + ' ' + this.parent.middleName.charAt(0) + ' ' + this.parent.lastName.charAt(0)}" color="hotpink"></text>
      * 
      *  We can simplify this by using a method to return the concatenation and constraining the text value to the return value of the method
      * 
      *      @example
      *      <attribute name="firstName" type="string" value="Lumpy"></attribute>
      *      <attribute name="middleName" type="string" value="Space"></attribute>
      *      <attribute name="lastName" type="string" value="Princess"></attribute>
      * 
      *      <method name="initials">
      *        return this.firstName.charAt(0) + ' ' + this.middleName.charAt(0) + ' ' + this.lastName.charAt(0);
      *      </method>
      * 
      *      <text text="${this.parent.initials()}" color="hotpink"></text>
      * 
      *  You can override the format method to provide custom formatting for text elements. Here is a subclass of text, timetext, with the format method overridden to convert the text given in seconds into a formatted string.
      * 
      *      @example
      *      <class name="timetext" extends="text">
      *        <method name="format" args="seconds">
      *          var minutes = Math.floor(seconds / 60);
      *          var seconds = Math.floor(seconds) - minutes * 60;
      *          if (seconds < 10) {
      *            seconds = '0' + seconds;
      *          }
      *          return minutes + ':' + seconds;
      *        </method>
      *      </class>
      * 
      *      <timetext text="240"></timetext>
      * 
      */
/**
  *
  * @attribute {Number} [fontsize=0]
  * The size of the font to use.
  *
  */
/**
  *
  * @attribute {Number} [font=""]
  * The name of the font family to use, e.g. "Helvetica"  Include multiple fonts on a line, separated by commas.
  *
  */
/**
  *
  * @attribute {Boolean} [bold=false]
  * Use bold text.
  *
  */
/**
  *
  * @attribute {Boolean} [italic=false]
  * Use italic text.
  *
  */
/**
  *
  * @attribute {Boolean} [smallcaps=false]
  * Use small caps style.
  *
  */
/**
  *
  * @attribute {Boolean} [underline=false]
  * Draw and underline under text (note, is incompatible with dr.text#strike)
  *
  */
/**
  *
  * @attribute {Boolean} [strike=false]
  * Draw and strike-through the text (note, is incompatible with dr.text#underline)
  *
  */
/**
    * 
    * @attribute {Boolean} [multiline=false]
    * Set to true to show multi-line text.
    * 
    */
/**
    * 
    * @attribute {Boolean} [resize=true]
    * By default, the text component is sized to the size of the text.
    * By setting resize=false, the component size is not modified
    * when the text changes.
    * 
    */
/**
    * 
    * @attribute {String} [text=""]
    * The contents of this input text field
    * 
    */
/**
    * @method format
    * Format the text to be displayed. The default behavior is to
    * return the text intact. Override to change formatting.
    * @param {String} str The current value of the text component.
    * @return {String} The formated string to display in the component.
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
   * @class dr.twojs {UI Components}
   * @extends dr.view
   * View that is enabled with two dimensional drawing capabilities by making use of the twojs library.
   *
   *     @example
   *     <twojs bgcolor="MistyRose" width="285" height="200">
   *       <handler event="oninit">
   *         var circle = this.two.makeCircle(72, 72, 50);
   *         circle.fill = '#FF8000';
   *         circle.stroke = 'orangered';
   *         circle.linewidth = 5;
   *         this.two.update();
   *       </handler>
   *     </twojs>
   *
   * In addition to having access to the "two" instance, you also have access to the Two namespace, which provides methods and types you may need. Here we create Two.Anchor instances to create a bezier curve. 
   *
   *     @example
   *     <twojs bgcolor="pink" width="100" height="100">
   *       <handler event="oninit">
   *         var a1 = new Two.Anchor(0, 100, 0, 0, 60, -10, Two.Commands.curve);
   *         var a2 = new Two.Anchor(100, 0, -90, 30, 0, 0, Two.Commands.curve);
   *         var poly = this.two.makeCurve([a1,a2], true);
   *         poly.fill = "pink";
   *         this.two.update();
   *       </handler>
   *     </twojs>
   */
/**
    * @attribute {Object} two
    * Reference to the twojs context that provides API's for two dimensional drawing.
    */
/**
      * @class dr.variablelayout {Layout}
      * @extends dr.constantlayout
      * This layout extends constantlayout adding the capability to control
      * what value is set on each managed view. The to set on each vies is
      * controlled by implementing the updateSubview method of this layout.
      *
      * The updateSubview method has four arguments: 'count', 'view', 
      * 'attribute' and 'value'.
      *     Count: The 1 based index of the view being updated, i.e. the 
      *         first view updated will have a count of 1, the second, a count 
      *         of 2, etc.
      *     View: The view being updated. Your updateSubview method will
      *         most likely modify this view in some way.
      *     Attribute: The name of the attribute this layout is supposedly
      *         updating. This will be set to the value of 
      *         the 'attribute' attribute of the variablelayout. You can use 
      *         this value if you wish or ignore it if you want to.
      *     Value: The suggested value to set on the view. You can use it as
      *         is or ignore it if you want. The value provided for the first 
      *         view will be the value of the 'value' attribute of the
      *         variablelayout. Subsequent values will be the return value of
      *         the updateSubview method for the previous view. This allows
      *         you to feed values forward as each view is updated.
      *
      * This variable layout will position the first view at a y value of 10
      * and each subsequent view will be positioned with a y value 1 pixel
      * below the bottom of the previous view. In addition, all views with
      * an even count will be positioned at an x of 5 and odd views at an
      * x of 10. Also, updateparent has been set to true so the
      * updateParent method will be called with the attribute and last value
      * returned from updateSubview. In this case updateParent will resize
      * the parent view to a height that fits all the subviews plus an
      * additional 10 pixels.
      *
      *     @example
      *     <variablelayout attribute="y" value="10" updateparent="true">
      *         <method name="updateSubview" args="count, view, attribute, value">
      *             view.setAttribute(attribute, value);
      *             view.setAttribute('x', count % 2 === 0 ? 5 : 10);
      *             return value + view.height + 1;
      *         </method>
      *         <method name="updateParent" args="attribute, value">
      *             this.parent.setAttribute('height', value + 10);
      *         </method>
      *     </variablelayout>
      *
      *     <view width="50" height="25" bgcolor="lightpink"></view>
      *     <view width="50" height="25" bgcolor="plum"></view>
      *     <view width="50" height="25" bgcolor="lightblue"></view>
      *
      * This variable layout works similar to the one above except it will
      * skip any view that has an opacity less that 0.5. To accomplish this
      * the skipSubview method has been implemented. Also, the 
      * startMonitoringSubview and stopMonitoringSubview methods have been
      * implemented so that if the opacity of a view changes the layout will
      * be updated.
      *
      *     @example
      *     <variablelayout attribute="y" value="10" updateparent="true">
      *         <method name="updateSubview" args="count, view, attribute, value">
      *             view.setAttribute(attribute, value);
      *             view.setAttribute('x', count % 2 === 0 ? 5 : 10);
      *             return value + view.height + 1;
      *         </method>
      *         <method name="updateParent" args="attribute, value">
      *             this.parent.setAttribute('height', value + 10);
      *         </method>
      *         <method name="startMonitoringSubview" args="view">
      *             this.super();
      *             this.listenTo(view, 'opacity', this.update)
      *         </method>
      *         <method name="stopMonitoringSubview" args="view">
      *             this.super();
      *             this.stopListening(view, 'opacity', this.update)
      *         </method>
      *         <method name="skipSubview" args="view">
      *             if (0.5 >= view.opacity) return true;
      *             return this.super();
      *         </method>
      *     </variablelayout>
      *
      *     <view width="50" height="25" bgcolor="lightpink"></view>
      *     <view width="50" height="25" bgcolor="plum"></view>
      *     <view width="50" height="25" bgcolor="black" opacity="0.25"></view>
      *     <view width="50" height="25" bgcolor="lightblue"></view>
      */
/**
    * @attribute {boolean} [updateparent=false]
    * If true the updateParent method of the variablelayout will be called. 
    * The updateParent method provides an opportunity for the layout to
    * modify the parent view in some way each time update completes. A typical
    * implementation is to resize the parent to fit the newly layed out child 
    * views.
    */
/**
    * @attribute {boolean} [reverse=false]
    * If true the layout will run through the views in the opposite order when
    * calling updateSubview. For subclasses of variablelayout this will
    * typically result in views being layed out in the opposite direction,
    * right to left instead of left to right, bottom to top instead of top to
    * bottom, etc.
    */
/**
    * @method doBeforeUpdate
    * Called by the update method before any processing is done. This method 
    * gives the variablelayout a chance to do any special setup before update is 
    * processed for each view. This is a good place to calculate any values
    * that will be needed during the calls to updateSubview.
    * @return {void}
    */
/**
    * @method doAfterUpdate
    * Called by the update method after any processing is done but before the
    * optional updateParent method is called. This method gives the variablelayout
    * a chance to do any special teardown after updateSubview has been called
    * for each managed view.
    * @param {*} value The last value calculated by the updateSubview calls.
    * @return {void}
    */
/**
    * @method startMonitoringSubview
    * Provides a default implementation that calls update when the
    * visibility of a subview changes. Monitoring the visible attribute of
    * a view is useful since most layouts will want to "reflow" as views
    * become visible or hidden.
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
    * subview is not visible since views that can't be seen don't typically 
    * need to be positioned. You could implement your own skipSubview method
    * to use other attributes of a view to determine if a view should be
    * updated or not. An important point is that skipped views are still
    * monitored by the layout. Therefore, if you use a different attribute to
    * determine wether to skip a view or not you should probably also provide
    * custom implementations of startMonitoringSubview and stopMonitoringSubview
    * so that when the attribute changes to/from a value that would result in
    * the view being skipped the layout will update.
    * @param {dr.view} view The subview to check.
    * @return {Boolean} True if the subview should be skipped during
    *   layout updates.
    */
/**
    * @method updateParent
    * Called if the updateparent attribute is true. Subclasses should
    * implement this if they want to modify the parent view.
    * @param {String} attribute The name of the attribute to update.
    * @param {*} value The value to set on the parent.
    * @return {void}
    */
/**
     * @class dr.videoplayer {UI Components, Media Components}
     * @extends dr.view
     * A media component that displays videos.
     *
     *     @example wide
     *
     *     <spacedlayout axis="x" spacing="5"></spacedlayout>
     *     <videoplayer id="hplayer" width="200" height="150"
     *                  src="{'video/mp4' : 'http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4',
     *                        'video/webm' : 'http://www.quirksmode.org/html5/videos/big_buck_bunny.webm',
     *                        'video/ogv' : 'http://www.quirksmode.org/html5/videos/big_buck_bunny.ogv'}">
     *     </videoplayer>
     *
     *     <videoplayer id="aplayer" width="200" height="150" controls="false"
     *                  src="['http://techslides.com/demos/sample-videos/small.mp4',
     *                        'http://techslides.com/demos/sample-videos/small.webm',
     *                        'http://techslides.com/demos/sample-videos/small.ogv',
     *                        'http://techslides.com/demos/sample-videos/small.3gp']">
     *     </videoplayer>
     *
     */
/**
  *
  * @attribute {Object} [video]
  * @readonly
  * The underlying native video element.
  *
  */
/**
  *
  * @attribute {Boolean} [controls=true]
  * Set to false to hide the video controls.
  *
  */
/**
      *
      * @attribute {Boolean} [preload=true]
      * Set to false to refrain from preloading video content when the tag loads.
      *
      */
/**
      *
      * @attribute {Boolean} [loop=false]
      * Should be video loop when reaching the end of the video.
      *
      */
/**
      *
      * @attribute {Number} [volume=0.5]
      *
      *
      */
/**
      *
      * @attribute {Number} [duration=0]
      * @readonly
      * The length of the video, is automatically set after the video begins to load.
      *
      */
/**
      *
      * @attribute {Boolean} [playing=false]
      * Indicates if the video is currently playing, set to true to begin playback.
      *
      */
/**
      *
      * @attribute {Number} [currenttime=0]
      * The current playback index, in seconds.  Set to value to seek in the video.
      *
      */
/**
      *
      * @attribute {String} [poster]
      * An image that appears before playing, when no video frame is available yet.
      *
      */
/**
      *
      * @attribute {Object} [src]
      * The video source, which is either an array of urls with the correct filetype extensions:
      *
      *     @example
      *     <videoplayer id="player" width="300" height="150"
      *                  src='["http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4",
      *                        "http://www.quirksmode.org/html5/videos/big_buck_bunny.webm",
      *                        "http://www.quirksmode.org/html5/videos/big_buck_bunny.ogv"]'>
      *     </videoplayer>
      *
      * Alternatively, a hash of `{mime-type: url}` pairs.
      *
      *     @example
      *
      *     <videoplayer id="player" width="300" height="150"
      *                  src='{"video/mp4" : "http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4",
      *                        "video/webm" : "http://www.quirksmode.org/html5/videos/big_buck_bunny.webm",
      *                        "video/ogg" : "http://www.quirksmode.org/html5/videos/big_buck_bunny.ogv"}'>
      *     </videoplayer>
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
      * An extension of variableLayout similar to spaced layout but with the
      * added functionality of wrapping the views onto a new line (or column
      * if the axis is "y") whenever they would overflow the available space. 
      * This layout positions views horizontally or vertically using an initial
      * inset and spacing between each view. The outset is used in the 
      * calculation of available space so that the last view in each line will 
      * have at least "outset" space after it.
      *
      * Lines/Columns are positioned in a similar fashion to the individual views
      * using lineinset, linespacing and lineoutset. If updateparent is true
      * the lineoutset is used to leave space after the last line.
      *
      * A line break can be forced by using a "break" layouthint on a managed
      * view. The layout hint "break" will force the subview to start a new
      * line/column with that subview as the first view in the line/column.
      *
      * Since wrappinglayouts rely on the innerwidth/height of the parent view
      * to determine when to wrap auto sizing on the parent view along the same
      * axis as the wrappinglayout will result in unexpected behavior and 
      * should therefore be avoided.
      * 
      *     @example
      *     <wrappinglayout axis="y" spacing="2" inset="5" outset="5" lineinset="10" linespacing="5" lineoutset="10">
      *     </wrappinglayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="35" bgcolor="plum" layouthint='{"break":true}'></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
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
    * Space before the first view. This is an alias for the "value" attribute.
    */
/**
    * @attribute {Number} [linespacing=0]
    * The spacing between each line of views.
    */
/**
    * @attribute {Number} [lineoutset=0]
    * Space after the last line of views. Only used when updateparent is true.
    */
/**
    * @attribute {Number} [lineinset=0]
    * Space before the first line of views.
    */
/**
    * @attribute {boolean} [justify=false]
    * Justifies lines/columns
    */
/**
    * @attribute {String} [align='left']
    * Aligns lines/columns left/top, right/bottom or center/middle. If
    * justification is true this has no effect except on a line or column that
    * has only one item.
    */
/**
    * @attribute {String} [linealign='none']
    * Aligns the items in a line relative to each other. Supported values are
    * top/left, bottom/right and middle/center and none. If the value is
    * none, no line alignment will be performed which means transformed views
    * may overlap preceeding lines.
    */
/**
    * @attribute {String} [axis='x']
    * The orientation of the layout. Supported values are 'x' and 'y'.
    * A value of 'x' will orient the views horizontally with lines being
    * positioned vertically below the preceding line. A value of 'y' will 
    * orient the views vertically with columns positioned horizontally to 
    * the right of the preceding column. This is an alias for the "attribute" 
    * attribute.
    */
/**
    * @attribute attribute
    * @private
    * The axis attribute is an alias for this attribute.
    */
/**
    * @method doLineStart
    * Called at the start of the laying out of each line.
    * @param {Number} lineindex The index of the line being layed out.
    * @param {*} value The value at the start of laying out the line.
    * @return {void}
    */
/**
    * @method doLineEnd
    * Called at the end of the laying out of each line.
    * @param {Number} lineindex The index of the line being layed out.
    * @param {Array} items The items layed out in the line in the order they
    * were layed out.
    * @param {*} value The value at the end of laying out the line.
    * @return {void}
    */
/**
    * @event onlinecount
    * Fired after update.
    * @param {Number} The number of lines layed out for x-axis layouts or 
    * columns for layed out for y-axis layouts.
    */
/**
    * @event onmaxsize
    * Fired after update.
    * @param {Number} The maximum width achieved by any line for x-axis layouts
    * or maximum height achieved by any column for y-axis layouts.
    */
