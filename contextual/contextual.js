function Renderer() {
}

function SvgRenderer(svgElement) {
    var width, height, scale;

    this.svg = svgElement;
    this.ourSvgId = "genSvg";
    this.svgNS = "http://www.w3.org/2000/svg";

    // transformStr holds the string with the current transform; it accumulates
    // until a pushTransform.
    this.transformStr = "";

    width = parseInt(this.svg.getAttribute("width"));
    height = parseInt(this.svg.getAttribute("height"));
    this.baseWidth = 50 / (width + height);

    this.initGroup();
}

SvgRenderer.prototype = new Renderer();

SvgRenderer.prototype.initGroup = function() {
    // 'target' is a group that all new elements are attached.
    // This might not be a great way to go if recursion gets too deep...
    // We may have to apply transforms directly rather than chain tons of them
    // together and let the browser sort it out.
    this.target = document.createElementNS(this.svgNS,"g");
    this.target.setAttributeNS(null, "id", this.ourSvgId);
    this.target.setAttributeNS(null, "fill","none");
    this.target.setAttributeNS(null, "stroke-width", this.baseWidth); 
    this.target.setAttributeNS(null, "stroke", "black");
    this.svg.appendChild(this.target);
};

// Draw a triangle as an SVG element 
SvgRenderer.prototype.drawTriangle = function(x0, y0, x1, y1, x2, y2) {
    var svgNS, poly, points;

    poly = document.createElementNS(this.svgNS, "polygon");
    points = ""+x0+","+y0+" "+x1+","+y1+" "+x2+","+y2;
    poly.setAttributeNS(null,"points",points);

    this.target.appendChild(poly);
};

SvgRenderer.prototype.drawSquare = function(x0, y0, x1, y1) {
    var svgNS, poly, points;

    poly = document.createElementNS(this.svgNS, "polygon");
    points = ""+x0+","+y0+" "+x1+","+y0+" "+x1+","+y1+" "+x0+","+y1;
    poly.setAttributeNS(null,"points",points);

    this.target.appendChild(poly);
};

SvgRenderer.prototype.pushTransform = function() {
    // The way that we push a transform is to make a group, assign the transform
    // to that group.
    var grp;
    grp = document.createElementNS(this.svgNS,"g");
    grp.setAttributeNS(null, "transform", this.transformStr);
    this.target.appendChild(grp);

    // Then set that group as our new target.
    this.target = grp;
};

SvgRenderer.prototype.popTransform = function() {
    // To pop this 'transform' off, we just move our target to the parent node.
    this.target = this.target.parentNode;
    if (!this.target) {
        console.log("SvgRenderer: No transforms left to pop!");
    }
};

SvgRenderer.prototype.scale = function(scaleX, scaleY) {
    var oldXform = this.target.getAttribute("transform");
    oldXform += "scale(" + scaleX + "," + scaleY + ") ";
    this.target.setAttributeNS(null, "transform", oldXform);
};

SvgRenderer.prototype.translate = function(transX, transY) {
    var oldXform = this.target.getAttribute("transform");
    oldXform += "translate(" + transX + "," + transY + ") ";
    this.target.setAttributeNS(null, "transform", oldXform);
};

SvgRenderer.prototype.rotate = function(angleRadians) {
    var oldXform = this.target.getAttribute("transform");
    oldXform += "rotate(" + (angleRadians * 180 / Math.PI) + ") ";
    this.target.setAttributeNS(null, "transform", oldXform);
};

SvgRenderer.prototype.setStrokeWidth = function(width) {
    this.target.setAttributeNS(null, "stroke-width", this.baseWidth * width); 
};

SvgRenderer.prototype.clear = function() {
    // Look for any SVG element that looks like ours, and get rid of it.
    var grp = this.svg.getElementById(this.ourSvgId);
    if (grp) {
        this.svg.removeChild(grp);
    }
    this.initGroup();
};

function CanvasRenderer(canvasElement) {
    this.canvas = canvasElement;
    this.context = this.canvas.getContext('2d');

    this.baseLineWidth = 50 / (this.canvas.width + this.canvas.height);

    console.log("Received " + this.canvas.width + "x" + this.canvas.height + " canvas.");
}

CanvasRenderer.prototype = new Renderer();

// Draw a triangle (sidelength = 1, centered at the origin)
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

// Draw a square (sidelength = 1, centered at the origin)
CanvasRenderer.prototype.drawSquare = function(x0, y0, x1, y1) {
    this.context.beginPath();
    this.context.moveTo(x0, y0);
    this.context.lineTo(x0, y1);
    this.context.lineTo(x1, y1);
    this.context.lineTo(x1, y0);
    this.context.closePath();
    this.context.stroke();
};

CanvasRenderer.prototype.pushTransform = function() {
    this.context.save();
};

CanvasRenderer.prototype.popTransform = function() {
    this.context.restore();
};

CanvasRenderer.prototype.scale = function(scaleX, scaleY) {
    this.context.scale(scaleX, scaleY);
};

CanvasRenderer.prototype.translate = function(transX, transY) {
    this.context.translate(transX, transY);
};

CanvasRenderer.prototype.rotate = function(angleRadians) {
    this.context.rotate(angleRadians);
};

CanvasRenderer.prototype.setStrokeWidth = function(width) {
    this.context.lineWidth = this.baseLineWidth * width;
};

CanvasRenderer.prototype.clear = function() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setStrokeWidth(1);
};

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

// drawRule: Call drawRuleRecurse with some sane initial values.
GrammarParser.prototype.drawRule = function(rule) {
    // this.context.strokeStyle = "black";

    this.renderer.setStrokeWidth(1);

    this.renderer.clear();
    this.drawRuleRecurse(rule, this.maxPrims, 1, 1);
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
