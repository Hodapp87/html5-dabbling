// ==== deprecated ====
// drawRule: Call drawRuleRecurse with some sane initial values, starting from
// a given grammar.
GrammarParser.prototype.drawRule = function(grammar, seed) {
    var bgHsv, bgColorRgb, f;

    Math.seedrandom(seed);

    // [H, S, V, A]
    // All values are in [0,1].
    var stroke = [0, 0, 1, 1];
    var fill = [0, 0, 1, 1];

    // To correct between the range used in Colors.js (0-255) and in Canvas
    // (0-1) we precompute this scale factor.
    f = 1 / 255;

    this.renderer.setStrokeWidth(1);

    // Set the background color (white if not given)
    bgHsv = grammar.background;
    if (bgHsv) {
        bgColorRgb = Colors.hsv2rgb(bgHsv[0] * 359.9, bgHsv[1] * 100, bgHsv[2] * 100);
        this.renderer.clear(bgColorRgb.R * f, bgColorRgb.G * f, bgColorRgb.B * f)
    } else {
        this.renderer.clear(1, 1, 1);
    }

    // Finally, draw away.
    this.drawRuleRecurse(grammar.startRuleRef, this.maxPrims, [1, 1], stroke, fill);
}

// ==== deprecated ====
// drawRuleRecurse: Pass in a rule, as in, a structure like { name: "foo",
// children: [ ... ] }, an overall [x,y] scale, and stroke and fill colors.
// This will render that rule, recursing if needed, but halting around the
// maximum number of primitives or at a certain minimum scale, which ever is
// reached first.  (this.maxPrims sets the former limit; this.scaleMinX,
// this.scaleMinY set the latter one)
// This returns the number of primitives drawn, which may be zero.
GrammarParser.prototype.drawRuleRecurse = function(rule, maxPrims, localScale, stroke, fill) {
    var i, j, primFn, childRule, childRuleName, prims = 0, sample;
    var more = true;

    // Variables to hold transform parameters:
    var scale, trans, rotate;
    var oldLineWidth = 1, lineWidth = 1;
    
    // Fill & stroke colors we'll pass forward; these are in HSV, normalized:
    var newStroke = [0, 0, 1, 1];
    var newFill = [0, 0, 1, 1];
    // RGB counterparts; these are RGB colors from Colors.js:
    var newStrokeRgb;
    var newFillRgb;

    if (localScale[0] < this.scaleMinX || localScale[1] < this.scaleMinY) {
        return 0;
    }

    if (rule.isRandom) {
        sample = Math.random();
    }

    // For the normal policy: just iterate through
    // If using 'random' policy: iterate and only execute upon finding the right
    // cumulative value for the sample.
    for (i = 0; more && i < rule.children.length; ++i) {
        
        if (rule.isRandom) {
            if (sample > rule.children[i].cumul) {
                continue;
            }
            more = false;
        }

        childRuleName = rule.children[i].rule;

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

            childRule = rule.children[i].ruleRef;
            if (!childRule) {
                console.log("Child " + childRuleName + " is not a primitive, and has no other definition!");
                continue;
            }

            // If not a primitive, then apply transforms and recurse deeper.
            scale = rule.children[i].scale || [1,1];
            trans = rule.children[i].translate || [0,0];
            rotate = rule.children[i].rotate || 0;
	    
	    // Likewise, color transforms:
	    if (rule.children[i].stroke != null) {
		newStroke[0] = stroke[0] + rule.children[i].stroke[0];
                // since H is cyclical:
                newStroke[0] -= Math.floor(newStroke[0]);
		newStroke[1] = clamp(stroke[1] + rule.children[i].stroke[1]);
		newStroke[2] = clamp(stroke[2] + rule.children[i].stroke[2]);
		newStroke[3] = clamp(stroke[3] + rule.children[i].stroke[3]);
	    } else {
		for (j = 0; j < 4; ++j) {
		    newStroke[j] = stroke[j];
		}
	    }
            newStrokeRgb = Colors.hsv2rgb(newStroke[0] * 359.9, newStroke[1] * 100, newStroke[2] * 100);

	    if (rule.children[i].fill != null) {
		newFill[0] = fill[0] + rule.children[i].fill[0];
                newFill[0] -= Math.floor(newFill[0]);
		newFill[1] = clamp(fill[1] + rule.children[i].fill[1]);
		newFill[2] = clamp(fill[2] + rule.children[i].fill[2]);
		newFill[3] = clamp(fill[3] + rule.children[i].fill[3]);
	    } else {
		for (j = 0; j < 4; ++j) {
		    newFill[j] = fill[j];
		}
	    }
            newFillRgb = Colors.hsv2rgb(newFill[0] * 359.9, newFill[1] * 100, newFill[2] * 100);
	    
            //console.log("Push " + scaleX + "," + scaleY + " +" + transX + "," + transY);
            this.renderer.setStrokeWidth(lineWidth);
            this.renderer.pushTransform();
            oldLineWidth = lineWidth;
            lineWidth /= scale[0];
            {
                this.renderer.translate(trans[0], trans[1]);
                this.renderer.rotate(rotate);
                this.renderer.scale(scale[0], scale[1]);
		this.renderer.setStrokeColor(newStrokeRgb.R / 255,
                                             newStrokeRgb.G / 255,
                                             newStrokeRgb.B / 255,
                                             newStroke[3]);
		this.renderer.setFillColor(newFillRgb.R / 255,
                                           newFillRgb.G / 255,
                                           newFillRgb.B / 255,
                                           newFill[3]);

                // Accumulate local scales, and decrement recursion depth.
                prims += this.drawRuleRecurse(childRule,
                                              maxPrims - prims,
                                              [localScale[0] * scale[0], localScale[1] * scale[1]],
					      newStroke,
					      newFill);
            }
            this.renderer.popTransform();
            this.renderer.setStrokeWidth(oldLineWidth);
        }
    }
    
    return prims;
}
