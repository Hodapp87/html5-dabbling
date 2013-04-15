function Renderer() {
    this.angle1 = 0.0;
    this.angle2 = 0.0;
    this.globalAngle = 0.0;
    this.numIters = 0;
    // dx, dy: Triangle size in X and Y (pre-transform)
    this.dx = 0.2;
    this.dy = 1.0;
    this.branch = true;
    this.iterScale = 1.0;
    this.scale = 10000;
}

Renderer.prototype.render = function(t, cx, cy) {
    // set t/dt here?
    // use cx/cy for mouse position?
    // dispatch to child? or can I even do that here?
};

function SvgRenderer(svgElement) {
    this.target = svgElement;
    this.ourSvgId = "genSvg";
    this.ourSvgIdLeft = "genSvgL";
    this.ourSvgIdRight = "genSvgR";
    this.svgNS = "http://www.w3.org/2000/svg";
    this.oldBranch = this.branch;
    this.oldNumIters = this.numIters;
}
SvgRenderer.prototype = new Renderer();
SvgRenderer.prototype.render = function(t, cx, cy) {
    var grp, xformMain, dirty;

    grp = this.target.getElementById(this.ourSvgId);
    dirty = (this.branch != this.oldBranch ||
             this.numIters != this.oldNumIters ||
             grp == null);

    // Build the transform
    xformMain = "translate(" + cx + "," + cy + ") ";
    xformMain += "rotate(" + (this.globalAngle * 180 / Math.PI) + ") ";
    xformMain += "scale(" + this.scale + ")";

    if (dirty) {
        // Delete the older outermost group if we created one
        if (grp) {
            this.target.removeChild(grp);
            grp = null;
        }

        // Create outermost group for everything
        grp = document.createElementNS(this.svgNS,"g");
        grp.setAttributeNS(null, "id", this.ourSvgId);
        this.target.appendChild(grp);
        this.triangleRecurse(this.numIters, grp);
    } else {
        this.triangleRecurseUpdate(this.numIters, grp);
    }

    grp.setAttributeNS(null, "transform", xformMain);
    // Build drawing settings that propagate down
    grp.setAttributeNS(null, "fill","none");
    grp.setAttributeNS(null, "stroke-width", 1 / this.scale); 
    grp.setAttributeNS(null, "stroke", "black"); 

    this.oldBranch = this.branch;
    this.oldNumIters = this.numIters;
};

// iters: How many iterations to recurse for (note that with branching this
// is O(2^N)!)
// elem: Which element receives as a child the elements we create
SvgRenderer.prototype.triangleRecurse = function(iters, elem) {
    var grp, xform, grp2, xform2;

    if (iters <= 0) {
        return;
    }

    // Draw one triangle here:
    this.drawTriangle(0, 0, this.dx, this.dy, -this.dx, this.dy, elem);

    // Start a new group here which holds transforms:
    grp = document.createElementNS(svgNS,"g");
    elem.appendChild(grp);
    //poly.setAttributeNS(null,"id","tri");
    xform = "translate(" + (this.branch ? this.dx : 0) + "," + this.dy + ") ";
    xform += "rotate(" + -(this.angle1 * 180 / Math.PI) + ") ";
    xform += "scale(" + this.iterScale + ")";
    grp.setAttributeNS(null, "transform", xform);
    grp.setAttributeNS(null, "id", this.ourSvgIdLeft);
    this.triangleRecurse(iters - 1, grp);

    if (this.branch) {
        grp2 = document.createElementNS(svgNS,"g");
        elem.appendChild(grp2);
        //poly.setAttributeNS(null,"id","tri");
        xform = "translate(" + (this.branch ? -this.dx : 0) + "," + this.dy + ") ";
        xform += "rotate(" + (this.angle2 * 180 / Math.PI) + ") ";
        xform += "scale(" + this.iterScale + ")";
        grp2.setAttributeNS(null, "transform", xform);
	grp2.setAttributeNS(null, "id", this.ourSvgIdRight);
        this.triangleRecurse(iters - 1, grp2);
    }
};

// Draw a triangle as an SVG element 
SvgRenderer.prototype.drawTriangle = function(x0, y0, x1, y1, x2, y2, elem) {
    var svgNS, poly, points;

    svgNS = "http://www.w3.org/2000/svg";
    poly = document.createElementNS(svgNS,"polygon");
    points = ""+x0+","+y0+" "+x1+","+y1+" "+x2+","+y2;
    poly.setAttributeNS(null,"points",points);

    elem.appendChild(poly);
};

// This does what triangleRecurse does, but rather than making new nodes, it
// updates old ones (as recreating them is unnecessary). 'elem' should be a
// group element!
SvgRenderer.prototype.triangleRecurseUpdate = function(iters, elem) {
    var xform, recurse, children;

    if (iters <= 0) {
        return;
    }

    recurse = false;
    if (elem.id === this.ourSvgIdLeft) {
	xform = "translate(" + (this.branch ? this.dx : 0) + "," + this.dy + ") ";
	xform += "rotate(" + -(this.angle1 * 180 / Math.PI) + ") ";
	xform += "scale(" + this.iterScale + ")";
	elem.setAttributeNS(null, "transform", xform);
        recurse = true;
    } else if (elem.id == this.ourSvgIdRight) {
        xform = "translate(" + (this.branch ? -this.dx : 0) + "," + this.dy + ") ";
        xform += "rotate(" + (this.angle2 * 180 / Math.PI) + ") ";
        xform += "scale(" + this.iterScale + ")";
        elem.setAttributeNS(null, "transform", xform);
        recurse = true;
    } else if (elem.id == this.ourSvgId) {
        recurse = true;
    }

    if (recurse) {
	children = elem.childNodes;
        for (var i = 0; i < children.length; i++) {
            this.triangleRecurseUpdate(iters - 1, children[i]);
        }
    }
};

function CanvasRenderer(canvasElement) {
    this.canvas = canvasElement;
    this.context = this.canvas.getContext('2d');
    // Some constants for drawing a triangle:
    var s = 1;
    var h = s * Math.sqrt(3) / 3;
    var ang0 = 90 * Math.PI / 180;
    var ang1 = ang0 + 120 * Math.PI / 180;
    var ang2 = ang1 + 120 * Math.PI / 180;
    this.triX0 = h * Math.cos(ang0);
    this.triY0 = h * Math.sin(ang0);
    this.triX1 = h * Math.cos(ang1);
    this.triY1 = h * Math.sin(ang1);
    this.triX2 = h * Math.cos(ang2);
    this.triY2 = h * Math.sin(ang2);

    this.scaleMinX = 1;
    this.scaleMinY = 1;
    console.log("Received " + this.canvas.width + "x" + this.canvas.height + " canvas.");

    this.maxPrims = 10000;
}

CanvasRenderer.prototype = new Renderer();

CanvasRenderer.prototype.primitives = {};
CanvasRenderer.prototype.primitives.triangle = function(this_) {
    this_.drawTriangle(this_.triX0, this_.triY0,
                       this_.triX1, this_.triY1,
                       this_.triX2, this_.triY2);
};

// drawRule: Call drawRuleRecurse with some sane initial values.
CanvasRenderer.prototype.drawRule = function(rule) {
    // Set up context
    this.context.strokeStyle = "black";

    this.drawRuleRecurse(rule, this.maxPrims, 1, 1);
}

// drawRuleRecurse: Pass in a rule, as in, a structure like { name: "foo",
// children: [ ... ] }, along with a maximum number of primitives to draw, and
// an overall scale.  This will render that rule, recursing if needed, but
// halting around the maximum number of primitives or at a certain minimum scale,
// which ever is reached first.  (this.maxPrims sets the former limit;
// this.scaleMinX, this.scaleMinY set the latter one)
// This returns the number of primitives drawn, which may be zero.
CanvasRenderer.prototype.drawRuleRecurse = function(rule, maxPrims, localScaleX, localScaleY) {
    var i, primFn, childRule, childRuleName, prims = 0, sample;
    var more = true;

    // Variables to hold transform parameters:
    var scale, trans;
    var scaleX, scaleY, rotate, transX, transY;
    var oldLineWidth;

    if (localScaleX < this.scaleMinX || localScaleY < this.scaleMinY) {
        return 0;
    }

    if (rule.isRandom) {
        sample = Math.random();
    }

    // If the normal 'select' rule: Just iterate through.
    // If using 'random': iterate and only execute upon finding the right
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

            // This section here is the only part that is Canvas-specific, short
            // of the strokeStyle in drawRule.  What can I do to factor this
            // out?
            this.context.save();
            oldLineWidth = this.context.lineWidth;
            this.context.lineWidth *= 1 / scaleX;
            {
                this.context.translate(transX, transY);
                this.context.rotate(rotate);
                this.context.scale(scaleX, scaleY);

                // Accumulate local scales, and decrement recursion depth.
                prims += this.drawRuleRecurse(childRule,
                                              maxPrims - prims,
                                              localScaleX * scaleX,
                                              localScaleY * scaleY);
            }
            this.context.lineWidth = oldLineWidth;
            this.context.restore();
        }

    }
    
    return prims;
}

// Draw a triangle as an SVG element 
CanvasRenderer.prototype.drawTriangle = function(x0, y0, x1, y1, x2, y2) {
    this.context.beginPath();
    this.context.moveTo(x0, y0);
    this.context.lineTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.closePath();
    //context.fillStyle = "rgba(0,1.0,1.0,1.0)";
    //context.fill();
    this.context.stroke();
};


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
// This walks through a rule tree, which is structured something like...
// { startRule: "foo",
//   rules: [ startRule: "foo",
//            {name: "foo", child: [ {rule: "foo", . . .},
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
function resolveRules(ruleTree) {
    var i, j, nameToRule = {}, rules, children, ruleName, error;
    error = false;

    // (1) Iterate through the rule list and make an object mapping names to
    // specific parts of the tree.
    rules = ruleTree.rules;
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
    ruleTree.startRuleRef = nameToRule[ruleTree.startRule];
    return !error;
}
// TODO: Make code to validate well-formedness of the rule tree, e.g. checking
// that 'scale' has two values
// TODO: Work primitives into this more seamlessly

function accumProbability(ruleTree) {
    var i, j, rules, children, total = 0, prob;

    rules = ruleTree.rules;
    for (i = 0; i < rules.length; ++i) {

        // If 'select' strategy isn't random, don't bother with this rule.
        if (rules[i].select !== "random") {
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
