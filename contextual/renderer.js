// - New primitives: Line? Dot?
// - New primitive, hard mode: A recursive reference to another grammar?
// - New primitive, super hard mode: A function generating pixel values?

function Renderer() { }
// Renderer.drawTriangle(x0, y0, x1, y1, x2, y2):
//     Draw a triangle with vertices at (x0,y0), (x1, y1), (x2, y2). Note that
//     the real coordinates are determined by whatever local transform is in use.

// Renderer.drawSquare(x0, y0, x1, y1):
//     Draw a square with corners (x0,y0), (x1, y1).  As in drawTriangle, the
//     current transforms still apply to these coordinates.

// Renderer.pushTransform():
//     Whatever the current transform is (scale/translate/rotate), push this
//     state on the transform stack so 'popTransform' may bring it back.

// Renderer.popTransform():
//     Discard the last set of transformations, and return to the state at the
//     time of the last pushTransform().

// Renderer.scale(scaleX, scaleY):
//     Scale the current coordinate system by the given factor in X and Y.
//     Setting either one to zero is liable to get you in a bad state.

// Renderer.translate(transX, transY):
//     Translate the current coordinate system by the given amount in each
//     axis.

// Renderer.translate(angle):
//     Rotate the current coordinate system clockwise by the given angle in
//     radians.

// Renderer.setStrokeWidth(width):
//     Set the stroke width, which applies to the edges of primitives.
//     TODO: Figure out what the units on this are.

// Renderer.setStrokeColor(r, g, b, alpha):
//     r, g, b, and alpha are all floats from 0 to 1. 'alpha' is optional.
//     Set the stroke color for any shape drawn, as an RGB value with optional
//     alpha; if alpha is left out, it is assumed as 1 (full opacity).

// Renderer.setFillColor(r, g, b, alpha):
//     Set the fill color for any shape drawn. Conventions here are the same as
//     setStrokeColor.

// Renderer.clear(r, g, b):
//     r, g, b are all optional floats from 0 to 1.
//     Reset basically all state of this renderer. That includes:
//      - Clearing everything that has been drawn, and filling with the given
//        RGB color (or white if not given)
//      - Clearing out any transforms.
//      - Resetting stroke width to its default.
//      - Resetting stroke color to black, and fill color to white.

