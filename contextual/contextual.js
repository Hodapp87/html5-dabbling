"use strict";

function GrammarParser(renderer) {
    // You may safely reset this renderer without reinitializing the object.
    this.renderer = renderer;

    // These two values are the minimum scale before the recursion stops. They
    // are set to 1 by default, which corresponds to about the size of one
    // pixel.
    this.scaleMinX = 1.0;
    this.scaleMinY = 1.0;

    // maxPrims is the (rough) maximum number of primitives to permit any
    // grammar to draw.
    this.maxPrims = 50000;

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


    // These hold a stack of colors and alpha values for stroke and fill,
    // which we treat as being part of the transform.
    this.strokeStack = [];
    this.fillStack = [];
    // These are both intended to be [H,S,V] triplets, in which H is in the
    // range [0,360), S is in [0,100], V is in [0,100]
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

// drawRuleIterative: Pass in a rule, as in, a structure like { name: "foo",
// children: [ ... ] }, an overall [x,y] scale, and stroke and fill colors.
// This will render that rule, recursing if needed, but halting around the
// maximum number of primitives or at a certain minimum scale, which ever is
// reached first.
// This returns the number of primitives drawn.
GrammarParser.prototype.drawRuleIterative = function(grammar, seed) {

    // All of these variables are treated as stacks that store the current
    // state. Values are pushed on every time depth increases, and popped
    // every time depth decreases.
    // (However, the only state that we must keep around explicitly is the
    // state that we must perform computations on.  In the case of translation,
    // rotation, and stroke width, we leave these alone because the renderer
    // handles composing these transformations for us.)
    function getBlankState() {
        return {localScaleX: 1, // Overall X scale (to stop recursion at some level)
                localScaleY: 1, // Likewise for Y
                strokeHsv: [0, 0, 1, 1], // Stroke color [H,S,V,A], all in [0,1]
                fillHsv: [0, 0, 1, 1],  // Fill color, same convention
                children: [],  // Queue of children we must render still
               };
    }

    // 'stack' = The states we store for each recursion level; each element
    // will be a dictionary like getBlankState() returns.
    var stack = [];
    
    var state; // The current state (as a dictionary like from getBlankState)
    var child; // Current child (rule + transform)
    var rule;  // The current rule (if not a primitive)

    var prims = 0; // Running total of number of primitives

    var bgHsv; // Background color as [H, S, V], all in [0,1]

    // ===== Constants =====
    // 'scaleDefer' = the minimum recursion level before we check that scale
    // has not exceeded this.scaleMinX/Y
    var scaleDefer = 2;
    // To correct between the range used in Colors.js (0-255) and in Canvas
    // (0-1) we precompute this scale factor.
    var f = 1/255;

    // ===== Temporary variables =====
    var sample, primFn, i, bgColorRgb, strokeHsv, strokeRgb, fillHsv, fillRgb;
    
    // ==== Initial setup ====
    Math.seedrandom(seed);
    this.renderer.setStrokeWidth(1);

    bgHsv = grammar.background;
    if (bgHsv) {
        bgColorRgb = Colors.hsv2rgb(bgHsv[0] * 360, bgHsv[1] * 100, bgHsv[2] * 100);
        this.renderer.clear(bgColorRgb.R * f, bgColorRgb.G * f, bgColorRgb.B * f)
    } else {
        this.renderer.clear(1, 1, 1);
    }

    state = getBlankState();
    state.children = [{rule: grammar.startRule,
                       ruleRef: grammar.startRuleRef}];

    // ==== Begin drawing by iterating over a recursive structure! ====
    while (prims <= this.maxPrims) {

        // If we've run out of children to draw at this level, or the children
        // are all at too small of a scale to matter, then backtrack.
        if (state.children.length == 0 ||
            (stack.length >= scaleDefer && 
             (state.localScaleX < this.scaleMinX ||
              state.localScaleY < this.scaleMinY)))
        {
            // Rarely: Give up, because we backtracked our way out of the tree.
            if (stack.length == 0) {
                break;
            }
            state = stack.pop();
            this.renderer.popTransform();
            continue;

            // (Another possible check we may do is on the alpha channel. If it
            // is below some threshold near zero, continuing to render this path
            // may be a waste of time.  Some more sophisticated strategies might
            // also be good here, such as marking a specific branch as being
            // monotonically decreasing in size or opacity, to exclude cases
            // where alpha channel or scale might temporarily be too low to be
            // visible, but will increase sometimes.)
        }

        // Otherwise, grab the next child from our queue.
        child = state.children.shift();

	// If this is not a primitive, and we need to resolve child rules, we
	// must save our current transform for later.
        primFn = this.primitives[child.rule];
	if (!primFn) {
	    this.renderer.pushTransform();
	}

        // ==== Child transforms ====
        if (child.translate != undefined) {
            this.renderer.translate(child.translate[0], child.translate[1]);
        }

        if (child.rotate != undefined) {
            this.renderer.rotate(child.rotate);
        }

        if (child.scale != undefined) {
            this.renderer.scale(child.scale[0], child.scale[1]);
            state.localScaleX *= child.scale[0];
            state.localScaleY *= child.scale[1];
        }

	if (child.stroke != null) {
            strokeHsv = adjustColor(state.strokeHsv, child.stroke);
            strokeRgb = Colors.hsv2rgb(strokeHsv[0] * 360, strokeHsv[1] * 100, strokeHsv[2] * 100);
	    this.renderer.setStrokeColor(strokeRgb.R*f, strokeRgb.G*f, strokeRgb.B*f, strokeHsv[3]);
	} else {
            strokeHsv = state.strokeHsv;
        }

	if (child.fill != null) {
            fillHsv = adjustColor(state.fillHsv, child.fill);
            fillRgb = Colors.hsv2rgb(fillHsv[0] * 360, fillHsv[1] * 100, fillHsv[2] * 100);
	    this.renderer.setFillColor(fillRgb.R*f, fillRgb.G*f, fillRgb.B*f, fillHsv[3]);
	} else {
            fillHsv = state.fillHsv;
        }
        
        // ==== Drawing what's here (which might mean recursing further) ====
        if (primFn) {

            // If this is a primitive, draw it and move on.  Since our path ends
            // here, we have no need to store any transforms for later use.
            prims += 1;
            primFn(this);

        } else {
            rule = child.ruleRef;

            // If it is not a primitive, push our state onto the stack, make up
            // a new state to work with, and recurse further.
            stack.push(state);
            state = getBlankState();
            state.localScaleX = stack[stack.length-1].localScaleX;
            state.localScaleY = stack[stack.length-1].localScaleY;
            state.strokeHsv = strokeHsv;
            state.fillHsv = fillHsv;

	    if (rule.isRandom) {
	        // If policy is 'random', append single random child to queue.
	        sample = Math.random();
	        for (i = 0; i < rule.children.length; ++i) {
		    if (sample > rule.children[i].cumul) {
                        state.children.push(rule.children[i]);
                        break;
		    } 
	        }
	    } else {
	        // Otherwise, add every child onto the queue.
                for (i = 0; i < rule.children.length; ++i) {
                    state.children.push(rule.children[i]);
                }
	    }
        }

    } // while (prims < this.maxPrims)
    return prims;
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
// 
// The 'prims' argument is optional, and it specifies an object whose properties
// are the names of any primitive rules.  This is here only to silence the
// name-undefined warnings that occur when a child invokes a primitive (which at
// least one must, if it is to draw anything).
function resolveRules(grammar, prims) {
    var i, j, nameToRule = {}, rules, children, ruleName, error;
    error = false;
    prims = (prims == null) ? {} : prims;

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

        children = rules[i].children;

        for (j = 0; j < children.length; ++j) {

            ruleName = children[j].rule;

            if (!nameToRule[ruleName] && !prims[ruleName]) {
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

// Check if a grammar looks like it is valid; this will also try to log messages
// for anything that makes it invalid.  If it appears to be valid, this returns
// 0; otherwise, it returns a number of errors detected.
function validateGrammar(grammar) {
    var fails = 0;
    var i;
    var rule;

    // Check startRuleRef
    if (grammar.startRule == null) {
	console.log("Grammar needs a start rule ('startRuleRef' property).");
	fails += 1;
    } else if (typeof grammar.startRule !== "string") {
	console.log("startRuleRef must be a string");
	fails += 1;
    }

    // Check rules
    if (grammar.rules == null) {
	console.log("Grammar needs rules ('rules' property).");
	fails += 1;
    } else if (grammar.rules.constructor != Array) {
	console.log("'rules' property must be an array");
	fails += 1;
    } else {
	for (i = 0; i < grammar.rules.length; ++i) {
	    fails += validateRule(grammar.rules[i], i);
	}
    }

    if (fails == 0) {
	console.log("Grammar looks valid!");
    } else {
	console.log("Detected " + fails + " errors in this grammar.");
    }
    return fails;
}

// Validate an individual rule within a grammar, i.e. a structure that looks
// like: { name: "top",\n\
//         child: [{ rule: "tri", scale: [200, 200], translate: [300, 300]}] }
// ...and check if it looks valid; print a message explaining why if not. This
// returns true if it looks valid, and false otherwise.
// The 'id' argument is optional ID to use in the messages.
function validateRule(rule, id) {
    var fails = 0;
    var i;
    var prefix = "rule " + id;
    var name = prefix;

    // Check name
    if (rule.name == null) {
	console.log("Warning: " + prefix + " has no 'name' property.");
    } else if (typeof rule.name !== "string") {
	console.log(prefix + " has a 'name' property but it is not a string.");
	fails += 1;
	name = name + " (invalid name)";
    } else {
	name = name + " (" + rule.name + ")";
    }

    // Check policy
    if (rule.policy == null) {
        //console.log("Warning: " + prefix + " has no 'policy' property.");
    } else if (typeof rule.policy !== "string") {
	console.log("'policy' property of " + prefix + " must be a string.");
	fails += 1;
    }    

    // Check child rules
    if (rule.children == null) {
        console.log("Warning: " + prefix + " has no 'child' property.");
    }
    if (rule.children.constructor != Array) {
	console.log("'child' property must be an array.");
	fails += 1;
    } else {
	for (i = 0; i < rule.children.length; ++i) {
	    fails += validateChild(rule.children[i], name + ", child " + i);
	}
    }

    return fails;
}

// Validate a child inside of a rule, i.e. the 'child' property in the comment
// for validateRule.  Print a message explaining why if it looks invalid, and
// return false; otherwise, return true.
// The 'id' argument, as in validateRule', is an optional ID to use in the
// messages.
function validateChild(child, id) {
    var fails = 0;
    var name = (id == null) ? "" : id;

    // Check rule that this child invokes
    if (child.rule == null) {
        console.log(name + ": No 'rule' property!");
        fails += 1;
    } else if (typeof child.rule !== "string") {
        console.log("'rule' property of " + name + " must be a string.");
        fails += 1;
    }
   
    function checkOptionalNumber(numTest, prop) {
        // Missing is okay.
        if (numTest == null) {
            return 0;
        }

        // Non-number is not.
        if (typeof numTest !== "number") {
            console.log(name + ": property '" + prop + "' must be a number.");
            return 1;
        } else {
            return 0;
        }
    }

    function checkOptionalArray(arrayTest, len, prop) {
        var fails2 = 0;

        if (arrayTest != null) {
            if (arrayTest.constructor != Array) {
                console.log(name + " has '" + prop + "' but it is not an array.");
                fails2 += 1;
            } else if (arrayTest.length != len) {
                console.log(name + ": '" + prop + "' must be an array of length " + len); 
                fails2 += 1;
            } else if (typeof arrayTest[0] !== "number" ||
                       typeof arrayTest[1] !== "number") {
                console.log(name + ": '" + prop + "' contains non-numerical element.");
                fails2 += 1;
            }
        }
        return fails2;
    }

    // Check transforms
    fails = checkOptionalArray(child.scale, 2, "scale") +
        checkOptionalArray(child.translate, 2, "trans") +
        checkOptionalNumber(child.rotate, "rotate") + 
        checkOptionalNumber(child.prob, "prob") +
	checkOptionalArray(child.stroke, 4, "stroke") +
	checkOptionalArray(child.fill, 4, "fill");

    return fails;
}

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

        children = rules[i].children;

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
