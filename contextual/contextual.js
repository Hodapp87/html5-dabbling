"use strict";
// - New primitives: Line? Dot?
// - New primitive, hard mode: A recursive reference to another grammar?
// - New primitive, super hard mode: A function generating pixel values?
// 

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

function GrammarParser(renderer) {
    // You may safely reset this renderer without reinitializing the object.
    this.renderer = renderer;

    // These two values are the minimum scale before the recursion stops. They
    // are set to 1 by default, which corresponds to about the size of one
    // pixel.
    this.scaleMinX = 1;
    this.scaleMinY = 1;

    // maxPrims is the (rough) maximum number of primitives to permit any
    // grammar to draw.
    this.maxPrims = 10000;

    // Some constants for drawing a triangle:
    var s = 1;
    var h = s / Math.sqrt(3);
    var ang0 = 0 * Math.PI / 180;
    var ang1 = ang0 + 120 * Math.PI / 180;
    var ang2 = ang1 + 120 * Math.PI / 180;
    this.triX0 = h * Math.cos(ang0);
    this.triY0 = h * Math.sin(ang0);
    this.triX1 = h * Math.cos(ang1);
    this.triY1 = h * Math.sin(ang1);
    this.triX2 = h * Math.cos(ang2);
    this.triY2 = h * Math.sin(ang2);
}

GrammarParser.prototype.primitives = {};
GrammarParser.prototype.primitives.triangle = function(this_) {
    this_.renderer.drawTriangle(this_.triX0, this_.triY0,
                                this_.triX1, this_.triY1,
                                this_.triX2, this_.triY2);
};

GrammarParser.prototype.primitives.square = function(this_) {
    this_.renderer.drawSquare(-0.5, -0.5, 0.5, 0.5);
};

// drawRule: Call drawRuleRecurse with some sane initial values, starting from
// a given grammar.
GrammarParser.prototype.drawRule = function(grammar) {
    var bgColorHsv, bgColorRgb, f;
    // this.context.strokeStyle = "black";

    // To correct between the range used in Colors.js (0-255) and in Canvas
    // (0-1) we precompute this scale factor.
    f = 1 / 255;

    this.renderer.setStrokeWidth(1);

    // Set the background color (white if not given)
    bgColorHsv = grammar.background;
    if (bgColorHsv) {
        bgColorRgb = Colors.hsv2rgb(bgColorHsv);
    } else {
        bgColorRgb = { R: 255, G: 255, B: 255 };
    }
    console.log(bgColorRgb);
    this.renderer.clear(bgColorRgb.R * f, bgColorRgb.G * f, bgColorRgb.B * f);

    // Finally, draw away.
    this.drawRuleRecurse(grammar.startRuleRef, this.maxPrims, 1, 1);
}

// drawRuleRecurse: Pass in a rule, as in, a structure like { name: "foo",
// children: [ ... ] }, along with a maximum number of primitives to draw, and
// an overall scale.  This will render that rule, recursing if needed, but
// halting around the maximum number of primitives or at a certain minimum scale,
// which ever is reached first.  (this.maxPrims sets the former limit;
// this.scaleMinX, this.scaleMinY set the latter one)
// This returns the number of primitives drawn, which may be zero.
GrammarParser.prototype.drawRuleRecurse = function(rule, maxPrims, localScaleX, localScaleY) {
    var i, primFn, childRule, childRuleName, prims = 0, sample;
    var more = true;

    // Variables to hold transform parameters:
    var scale, trans;
    var scaleX, scaleY, rotate, transX, transY;
    var oldLineWidth = 1, lineWidth = 1;

    if (localScaleX < this.scaleMinX || localScaleY < this.scaleMinY) {
        return 0;
    }

    if (rule.isRandom) {
        sample = Math.random();
    }

    // For the normal policy: just iterate through
    // If using 'random' policy: iterate and only execute upon finding the right
    // cumulative value for the sample.
    for (i = 0; more && i < rule.child.length; ++i) {
        
        if (rule.isRandom) {
            if (sample > rule.child[i].cumul) {
                continue;
            }
            more = false;
        }

        childRuleName = rule.child[i].rule;

        if (prims > maxPrims) {
            return prims;
        }

        primFn = this.primitives[childRuleName];
        // If this looks like a primitive, call that function.
        if (primFn) {
            //console.log("Prim");
            prims += 1;
            primFn(this);
        } else {

            childRule = rule.child[i].ruleRef;
            if (!childRule) {
                console.log("Child " + childRuleName + " is not a primitive, and has no other definition!");
                continue;
            }

            // If not a primitive, then apply transforms and recurse deeper.
            scale = rule.child[i].scale;
            scaleX = scale ? scale[0] : 1.0;
            scaleY = scale ? scale[1] : 1.0;
            trans = rule.child[i].translate;
            transX = trans ? trans[0] : 0.0;
            transY = trans ? trans[1] : 0.0;
            rotate = rule.child[i].rotate;
            rotate = rotate ? rotate : 0.0;

            //console.log("Push " + scaleX + "," + scaleY + " +" + transX + "," + transY);
            this.renderer.setStrokeWidth(lineWidth);
            this.renderer.pushTransform();
            oldLineWidth = lineWidth;
            lineWidth /= scaleX;
            {
                this.renderer.translate(transX, transY);
                this.renderer.rotate(rotate);
                this.renderer.scale(scaleX, scaleY);

                // Accumulate local scales, and decrement recursion depth.
                prims += this.drawRuleRecurse(childRule,
                                              maxPrims - prims,
                                              localScaleX * scaleX,
                                              localScaleY * scaleY);
            }
            this.renderer.popTransform();
            this.renderer.setStrokeWidth(oldLineWidth);
        }
    }
    
    return prims;
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

// resolveRules:
// This walks through a grammar, which is structured something like...
// { startRule: "foo",
//   rules: [ {name: "foo", child: [ {rule: "foo", . . .},
//                                   {rule: "bar", . . .},
//                                   {rule: "triangle", . . .} ] },
//            {name: "bar", child: [ {rule: "square", scale 2, ... } ] },
//          ] }
// ...and for every 'rule' property in 'child', adds a 'ruleRef' alongside it
// which points back at the rule with the given name. Likewise, startRuleRef is
// set in the same manner. Thus, in the given case, a cyclic object would
// result, and all other sorts of recursive, infinite trees are possible (and
// often intentional).
// This will echo a warning about conflicting names in the 'name' field, as well
// as nonexistent names in the 'rule' field. It will return false in this case,
// but in all cases, it will still walk the tree and try to resolve everything.
// Cases where no conflicts or nonexistent references occur, it returns true.
function resolveRules(grammar) {
    var i, j, nameToRule = {}, rules, children, ruleName, error;
    error = false;

    // (1) Iterate through the rule list and make an object mapping names to
    // specific parts of the tree.
    rules = grammar.rules;
    for (i = 0; i < rules.length; ++i) {

        ruleName = rules[i].name;

        if (nameToRule[ruleName]) {
            console.log("Rule " + ruleName + " was already used! Ignoring conflicting definition.");
            error = true;
        } else {
            nameToRule[ruleName] = rules[i];
        }
    }

    // (2) Replace all instantiations with a reference to the rule directly.
    for (i = 0; i < rules.length; ++i) {

        children = rules[i].child;

        for (j = 0; j < children.length; ++j) {

            ruleName = children[j].rule;

            if (!nameToRule[ruleName]) {
                console.log("Name " + ruleName + " not found!");
                error = true;
            } else {
                children[j].ruleRef = nameToRule[ruleName];
            }
        }
    }

    // Do likewise for startRule
    grammar.startRuleRef = nameToRule[grammar.startRule];
    return !error;
}
// TODO: Make code to validate well-formedness of the rule tree, e.g. checking
// that 'scale' has two values
// TODO: Work primitives into this more seamlessly

// This walks through a grammar, and for any rule with a policy of 'random', it
// accumulates the probabilities in each of the children (i.e. the 'prob'
// property, or assuming 1.0 if missing) and turns each one into a cumulative
// distribution from 0 to 1, which it puts in a 'cumul' field alongside 'prob'.
// It's just some preprocessing to simplify computations later.
function accumProbability(grammar) {
    var i, j, rules, children, total = 0, prob;

    rules = grammar.rules;
    for (i = 0; i < rules.length; ++i) {

        // If policy isn't random, don't bother with this rule.
        if (rules[i].policy !== "random") {
            rules[i].isRandom = false;
            continue;
        }
        rules[i].isRandom = true;

        children = rules[i].child;

        // First, get a total of all probabilities within this rule, and a
        // cumulative value at each level.
        for (j = 0; j < children.length; ++j) {
            prob = children[j].prob;
            total += prob ? prob : 1;
            children[j].cumul = total;
        }

        // Then normalize to [0,1].
        for (j = 0; j < children.length; ++j) {
            children[j].cumul /= total;
        }

    }
}
