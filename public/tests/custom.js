//javascript


// Enclose the content element in a frame or viewport of the specified width
// and height (minimum 50x50). The optional contentX and contentY arguments
// specify the initial offset of the content relative to the frame. (If
// specified, they must be <= 0.) The frame has mousewheel event handlers that
// allow the user to pan the element, and to shrink or enlarge the frame.
function enclose(content, framewidth, frameheight, contentX, contentY) {
// These arguments aren't just the initial values: they maintain the
// current state and are used and modified by the mousewheel handler.
framewidth = Math.max(framewidth, 50);
frameheight = Math.max(frameheight, 50);
contentX = Math.min(contentX, 0) || 0;
contentY = Math.min(contentY, 0) || 0;
// Create the frame element and set a CSS classname and styles
var frame = document.createElement("div");
frame.className = "enclosure"; // So we can define styles in a stylesheet
frame.style.width = framewidth + "px"; // Set the frame size.
frame.style.height = frameheight + "px";
frame.style.overflow = "hidden"; // No scrollbars, no overflow
frame.style.boxSizing = "border-box"; // Border-box simplifies the
frame.style.webkitBoxSizing = "border-box"; // calculations for resizing
frame.style.MozBoxSizing = "border-box"; // the frame.
// Put the frame in the document and move the content elt into the frame.
content.parentNode.insertBefore(frame, content);
frame.appendChild(content);
// Position the element relative to the frame
content.style.position = "relative";
content.style.left = contentX + "px";
content.style.top = contentY + "px";
// We'll need to work around some browser-specific quirks below
var isMacWebkit = (navigator.userAgent.indexOf("Macintosh") !== -1 &&
navigator.userAgent.indexOf("WebKit") !== -1);
var isFirefox = (navigator.userAgent.indexOf("Gecko") !== -1);
// Register mousewheel event handlers.
frame.onwheel = wheelHandler; // Future browsers
frame.onmousewheel = wheelHandler; // Most current browsers
if (isFirefox) // Firefox only
frame.addEventListener("DOMMouseScroll", wheelHandler, false);
function wheelHandler(event) {
var e = event || window.event; // Standard or IE event object
// Extract the amount of rotation from the event object, looking
// for properties of a wheel event object, a mousewheel event object
// (in both its 2D and 1D forms), and the Firefox DOMMouseScroll event.
// Scale the deltas so that one "click" toward the screen is 30 pixels.
// If future browsers fire both "wheel" and "mousewheel" for the same
// event, we'll end up double-counting it here. Hopefully, however,
// cancelling the wheel event will prevent generation of mousewheel.
var deltaX = e.deltaX*-30 || // wheel event
e.wheelDeltaX/4 || // mousewheel
0; // property not defined
var deltaY = e.deltaY*-30 || // wheel event
e.wheelDeltaY/4 || // mousewheel event in Webkit
(e.wheelDeltaY===undefined && // if there is no 2D property then
e.wheelDelta/4) || // use the 1D wheel property
e.detail*-10 || // Firefox DOMMouseScroll event
0; // property not defined
// Most browsers generate one event with delta 120 per mousewheel click.
// On Macs, however, the mousewheels seem to be velocity-sensitive and
// the delta values are often larger multiples of 120, at
// least with the Apple Mouse. Use browser-testing to defeat this.
if (isMacWebkit) {
deltaX /= 30;
deltaY /= 30;
}
// If we ever get a mousewheel or wheel event in (a future version of)
// Firefox, then we don't need DOMMouseScroll anymore.
if (isFirefox && e.type !== "DOMMouseScroll")
frame.removeEventListener("DOMMouseScroll", wheelHandler, false);
// Get the current dimensions of the content element
var contentbox = content.getBoundingClientRect();
var contentwidth = contentbox.right - contentbox.left;
var contentheight = contentbox.bottom - contentbox.top;
if (e.altKey) { // If Alt key is held down, resize the frame
if (deltaX) {
framewidth -= deltaX; // New width, but not bigger than the
framewidth = Math.min(framwidth, contentwidth); // content
framewidth = Math.max(framewidth,50); // and no less than 50.
frame.style.width = framewidth + "px"; // Set it on frame
}
if (deltaY) {
frameheight -= deltaY; // Do the same for the frame height
frameheight = Math.min(frameheight, contentheight);
frameheight = Math.max(frameheight-deltaY, 50);
frame.style.height = frameheight + "px";
}
}
else { // Without the Alt modifier, pan the content within the frame
if (deltaX) {
// Don't scroll more than this
var minoffset = Math.min(framewidth-contentwidth, 0);
// Add deltaX to contentX, but don't go lower than minoffset
contentX = Math.max(contentX + deltaX, minoffset);
contentX = Math.min(contentX, 0); // or higher than 0
content.style.left = contentX + "px"; // Set new offset
}
if (deltaY) {
var minoffset = Math.min(frameheight - contentheight, 0);
// Add deltaY to contentY, but don't go lower than minoffset
contentY = Math.max(contentY + deltaY, minoffset);
contentY = Math.min(contentY, 0); // Or higher than 0
content.style.top = contentY + "px"; // Set the new offset.
}
}
// Don't let this event bubble. Prevent any default action.
// This stops the browser from using the mousewheel event to scroll
// the document. Hopefully calling preventDefault() on a wheel event
// will also prevent the generation of a mousewheel event for the
// same rotation.
if (e.preventDefault) e.preventDefault();
if (e.stopPropagation) e.stopPropagation();
e.cancelBubble = true; // IE events
e.returnValue = false; // IE events
return false;
}
}








// Return the current scrollbar offsets as the x and y properties of an object
function getScrollOffsets(w) {
    // Use the specified window or the current window if no argument
    w = w || window;
    // This works for all browsers except IE versions 8 and before
    if (w.pageXOffset != null) return {x: w.pageXOffset, y:w.pageYOffset};
    // For IE (or any browser) in Standards mode
    var d = w.document;
    if (document.compatMode == "CSS1Compat")
    return {x:d.documentElement.scrollLeft, y:d.documentElement.scrollTop};
    // For browsers in Quirks mode
    return { x: d.body.scrollLeft, y: d.body.scrollTop };
}

/*
 * Pass a function to whenReady() and it will be invoked (as a method of the
 * document) when the document is parsed and ready for manipulation. Registered
 * functions are triggered by the first DOMContentLoaded, readystatechange, or
 * load event that occurs. Once the document is ready and all functions have
 * been invoked, any functions passed to whenReady() will be invoked
 * immediately.
 */
var whenReady = (function() { // This function returns the whenReady() function
    var funcs = []; // The functions to run when we get an event
    var ready = false; // Switches to true when the handler is triggered
    
    // The event handler invoked when the document becomes ready
    function handler(e) {
       
        // If we've already run once, just return
        if (ready) return;
        
        // If this was a readystatechange event where the state changed to
        // something other than "complete", then we're not ready yet
        if (e.type === "readystatechange" && document.readyState !== "complete")
            return;
        
        // Run all registered functions.
        // Note that we look up funcs.length each time, in case calling
        // one of these functions causes more functions to be registered.
        for(var i = 0; i < funcs.length; i++) funcs[i].call(document);
        
        // Now set the ready flag to true and forget the functions
        ready = true;
        funcs = null;
    }
    
    // Register the handler for any event we might receive
    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", handler, false);
        document.addEventListener("readystatechange", handler, false);
        window.addEventListener("load", handler, false);
    }
    else if (document.attachEvent) {
        document.attachEvent("onreadystatechange", handler);
        window.attachEvent("onload", handler);
    }
    
    // Return the whenReady function
    return function whenReady(f) {
        if (ready) f.call(document); // If already ready, just run it
        else funcs.push(f); // Otherwise, queue it for later.
    }
}());


/**
 * fades an element out then in
 */
function fadeIO(e,time,io) {
	if (typeof e === "string") e = document.getElementById(e);
		
	var interval = 25;
	var elapsed = 0;
	time = time || 2000;
	
	var io = 1;//1->fades out 0->fades in
    var revert = 1;
    
    animate(); // And start animating
    
	function animate(){ 
        var fraction = elapsed/time;
       	elapsed += interval;
	    if (fraction < 1 ) { // If the animation is not yet complete
		    var opacity = io == 1 ? io - Math.sqrt(fraction) : Math.pow(fraction,2); // Compute element opacity
            e.style.opacity = String(opacity); // Set it on e
            setTimeout(animate, interval); // Schedule another frame
        }

        // Otherwise, we're done
		else {

		     if(revert) {
		        io = io == 1? 0 : 1;
		        elapsed = 0;
		        e.style.opacity = "0"; // Make e fully transparent
		        revert = 0;
		        setTimeout(animate, interval); // Schedule another frame
		     }
		    
		}
    }
}

/**
 * get get a computed style from an element 
 * @usage getStyle("element-id","z-index");
 */
function getStyle(e, styleProp){
    if (typeof e === "string") e = document.getElementById(e);
    if (window.getComputedStyle) var y = document.defaultView.getComputedStyle(e,null).getPropertyValue(styleProp); 
    else if (e.currentStyle) var y = e.currentStyle[styleProp];
    return y;
}

//add the ability to replace all spaces in a string with nonbreaking spaces 
//in order to prevent it from wrapping around
String.prototype.nbsp = function() { 
    return this.replace(/ /g, '&nbsp;');
};

String.prototype.trimAll = function() { return this.replace(/^\s+|\s+$/g, '') }
//function that writes a line
var write = function(text){
    document.writeln(text);
};

// inherit() returns a newly created object that inherits properties from the
// prototype object p. It uses the ECMAScript 5 function Object.create() if
// it is defined, and otherwise falls back to an older technique.
function inherit(p) {
    if (p == null) throw TypeError(); // p must be a non-null object
    if (Object.create) // If Object.create() is defined...
    return Object.create(p); // then just use it.
    
    var t = typeof p; // Otherwise do some more type checking
    if (t !== "object" && t !== "function") throw TypeError();
    function f() {}; // Define a dummy constructor function.
    f.prototype = p; // Set its prototype property to p.
    return new f(); // Use f() to create an "heir" of p.
}

//this function returns the class of any object you pass it.
function classof(o) {
    if (o === null) return "Null";
    if (o === undefined) return "Undefined";
    return Object.prototype.toString.call(o).slice(8,-1);
}


/*
* Copy the enumerable properties of p to o, and return o.
* If o and p have a property by the same name, o's property is overwritten.
* This function does not handle getters and setters or copy attributes.

function extend(o, p) {
    for(prop in p) { // For all props in p.
        o[prop] = p[prop]; // Add the property to o.
    }
    return o;
}
*/
// Define an extend function that copies the properties of its second and
// subsequent arguments onto its first argument.
// We work around an IE bug here: in many versions of IE, the for/in loop
// won't enumerate an enumerable property of o if the prototype of o has
// a nonenumerable property by the same name. This means that properties
// like toString are not handled correctly unless we explicitly check for them.
var extend = (function() { // Assign the return value of this function
    // First check for the presence of the bug before patching it.
    for(var p in {toString:null}) {
        
        // If we get here, then the for/in loop works correctly and we return
        // a simple version of the extend() function
        return function extend(o) {
            for(var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                for(var prop in source) o[prop] = source[prop];
            }
            return o;
        };
        
    }
    
    // If we get here, it means that the for/in loop did not enumerate
    // the toString property of the test object. So return a version
    // of the extend() function that explicitly tests for the nonenumerable
    // properties of Object.prototype.
    return function patched_extend(o) {
        for(var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            // Copy all the enumerable properties
            for(var prop in source) o[prop] = source[prop];
            // And now check the special-case properties
            for(var j = 0; j < protoprops.length; j++) {
                prop = protoprops[j];
                if (source.hasOwnProperty(prop)) o[prop] = source[prop];
            }
        }
        return o;
    };
    
    // This is the list of special-case properties we check for
    var protoprops = ["toString", "valueOf", "constructor", "hasOwnProperty",
    "isPrototypeOf", "propertyIsEnumerable","toLocaleString"];
}());


// A simple function for defining simple classes
function defineClass(
    constructor, // A function that sets instance properties
    methods, // Instance methods: copied to prototype
    statics
    ) // Class properties: copied to constructor
{
    if (methods) extend(constructor.prototype, methods);
    if (statics) extend(constructor, statics);
    return constructor;
}

// A simple function for creating simple subclasses
function defineSubclass(superclass, // Constructor of the superclass
    constructor, // The constructor for the new subclass
    methods, // Instance methods: copied to prototype
    statics) // Class properties: copied to constructor
{
    
    //***********************************************
    // Set up the prototype object of the subclass
    constructor.prototype = Object.create(superclass.prototype);//inherit(superclass.prototype);
    constructor.prototype.constructor = constructor;
    //*************************************************
    
    // Copy the methods and statics as we would for a regular class
    if (methods) extend(constructor.prototype, methods);
    if (statics) extend(constructor, statics);
    // Return the class
    return constructor;
}
// We can also do this as a method of the superclass constructor
Function.prototype.extend = function(constructor, methods, statics) {
    return defineSubclass(this, constructor, methods, statics);
    
};
