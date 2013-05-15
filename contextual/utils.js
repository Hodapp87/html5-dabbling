"use strict";


// This is a utility function for converting RGB values (with an optional alpha
// channel) which are all from 0 to 1, to a string like rgb(10,20,30) or
// rgba(0,10,20,0.5), suitable for use in strokeStyle and fillStyle.
function rgb2string(r, g, b, a) {
    var r255 = 255 * r;
    var g255 = 255 * g;
    var b255 = 255 * b;
    
    // Note that 'a' is not scaled, but r, g, and b are.
    if (a == null) {
	return "rgb(" + r255 + "," + g255 + "," + b255 + ")";
    } else {
	return "rgba(" + r255 + "," + g255 + "," + b255 + "," + a + ")";
    }
}

// makeDownload: This turns the given element into a string, and then returns
// a link element that when clicked will download that element, defaulting to
// the given filename.  Text of the link will be set from the 'text' argument.
function makeDownload(elem, filename, text) {
    // Note that, while this is in the standard, it only works in Chrome so far.
    var blob, a, s, buttons;

    s = new XMLSerializer();
    blob = new Blob([s.serializeToString(elem)]);
    a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.textContent = text;

    return a;
}

// Clamp a number to be in between 0 and 1.
function clamp(val) {
    return val < 0 ? 0 : (val > 1 ? 1 : val);
}

// Take a color as [H,S,V,A], all values in the range [0,1], and apply the given
// delta array, returning another [H, S, V, A] array.   The delta array has
// [dH, dS, dV, dA], all values in [-1, 1], and these values specify how much
// the color should change.
// In the case of H, this wraps any values into [0,1].  For S, V, and A, it
// clamps all returns values into [0,1].
function adjustColor(color, delta)
{
    var hueTemp = color[0] + delta[0];
    return [ hueTemp - Math.floor(hueTemp),
             clamp(color[1] + delta[1]),
             clamp(color[2] + delta[2]),
             clamp(color[3] + delta[3]) ];
}
