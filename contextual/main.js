"use strict";

console.log("Initializing JavaScript stuff!");
var svgNS = "http://www.w3.org/2000/svg";
// Populated in onLoad
var canvas;

var codeMirror;

// Set at every mouse click
var mouseX;
var mouseY;
var mouseClicked;

var svgDownloadId = "svgDownload";

// Set every frame
var t;
var t0;
var dt; // time delta since last frame

var grammarParse;
var canvasRender;
var svgRender;

// This is set to whatever was last rendered with:
var activeRenderer;

var grammarString = "";

// The function that generates the grammar:
var grammarFn;
// The grammar which it evaluated to this frame:
var grammar;

function onLoad() {
    var time, svg, style, codeMirrorDiv;

    reseed();

    codeMirrorDiv = document.getElementById('codeMirror');
    codeMirror = CodeMirror(codeMirrorDiv, {
        value: grammarStringStart,
        mode: "javascript",
        lineNumbers: true,
        lineWrapping: true
    });
    // TODO: Make this not hard-coded?
    codeMirror.setSize(null, "500px");

    // Do the initial evaluation of the source code in the box
    evalGrammar();

    canvas = document.getElementById('canvasRender');
    /*style = window.getComputedStyle(canvas);
      canvas.width = style.width;
      canvas.height = style.height;*/
    canvasRender = new CanvasRenderer(canvas);
    svg = document.getElementById("svgRender");
    //svg.setAttributeNS(null, "width", 600);
    //svg.setAttributeNS(null, "height", 600);
    svgRender = new SvgRenderer(svg);
    grammarParse = new GrammarParser(canvasRender);
    activeRenderer = canvasRender;

    // Listeners for mouse: Update mouseX/mouseY only when dragging.
    canvas.addEventListener("mousedown", function() { mouseClicked = true; }, true);
    canvas.addEventListener("mouseup", function() { mouseClicked = false; }, true);
    canvas.addEventListener("mousemove", function(event) {
        if (mouseClicked) {
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    }, true);

    document.getElementById("reseed").onclick = function() {
        reseed();
    };

    document.getElementById("renderCanvasButton").onclick = function() {
        console.log("rendering Canvas!");
        // Make SVG invisible, and Canvas visible:
        svg.style.display = "none";
        canvas.style.display = "inline";
        activeRenderer = canvasRender;
        render();
    };

    document.getElementById("renderSvgButton").onclick = function() {
        console.log("rendering SVG!");
        // Make Canvas invisible, and SVG visible:
        svg.style.display = "inline";
        canvas.style.display = "none";
        activeRenderer = svgRender;
        render();
    };

    document.getElementById("svgButton").onclick = function() {
        var svgLink, dlElem, oldRenderer, svgBigRender, svgTemp;

	// Make sure we have a place to put this SVG scene graph once we
	// create it; taking the time to create it and then having nowhere to
	// put it would be rather senseless.
        dlElem = document.getElementById('downloadLinks');
        svgLink = document.getElementById(svgDownloadId);
        if (svgLink) {
            dlElem.removeChild(svgLink);
        }

	// Make a temporary 'svg' element, but don't put it in our DOM.
	svgTemp = document.createElement("svg");
	//svgTemp = svg;
	
	// Make a new SvgRenderer with a much higher primitives limit, and use
	// that separate element as its target.
	svgBigRender = new SvgRenderer(svgTemp);
	svgBigRender.maxPrims = 100000;

	// Swap in our renderer, do the render, and swap the old one back in.
	oldRenderer = activeRenderer;
	activeRenderer = svgBigRender;
	render();
	activeRenderer = oldRenderer;
	
	// Finally, dump this whole tree to a file.
        svgLink = makeDownload(svgTemp, "file.svg", "Download SVG");
        svgLink.setAttribute("id", svgDownloadId);
        dlElem.appendChild(svgLink);
    };

    mouseX = canvas.width / 2;
    mouseY = canvas.height / 2;
    var time = new Date();
    t0 = time.getTime();

    t = time.getTime();
}

// This sets up a slider on the page which controls the given parameter (if it
// has not been done already), and returns the parameter's value.
// name: a string which controls what name displayed on the slider
// min and max: lower and upper bounds to permit the slider to move within
// default_: the initial value of the slider
function param(name, min, max, default_) {
    var id, labelElem, sliderElem, steps, paramVal;

    steps = 500;

    // Check if we already made this element
    id = "userSliders " + name;
    sliderElem = document.getElementById(id);
    if (sliderElem == null) {
        // If not, create a new one (wrapped in a label)
        labelElem = document.createElement("label");
        labelElem.setAttribute("class", "userSliders");
        labelElem.innerHTML = name;
        document.getElementById('userSliders').appendChild(labelElem);

        sliderElem = document.createElement("input");
        sliderElem.setAttribute("id", id);
        sliderElem.setAttribute("value", default_);
        sliderElem.setAttribute("type", "range");
        sliderElem.setAttribute("onChange", "render()");
        //sliderElem.setAttribute("class", "userSliders");
        labelElem.appendChild(sliderElem);

        // Just return the default value if we're newly creating this slider.
        paramVal = default_;
    } else {
        // If it existed already., get its current value.
        paramVal = parseFloat(sliderElem.value);
    }

    // Set the min/max/step (even if it's redundant)
    sliderElem.setAttribute("min", min);
    sliderElem.setAttribute("max", max);
    sliderElem.setAttribute("step", (max-min) / steps);

    return paramVal;
}

function render() {
    var seed, startMs, dt, prims;

    evalGrammar();

    seed = document.getElementById("seed").value;

    startMs = (new Date).getTime();
    grammarParse.renderer = activeRenderer;
    prims = grammarParse.drawRuleIterative(grammar, seed);
    dt = ((new Date).getTime() - startMs);
    console.log("Drew " + prims + " primitives in " + dt + " ms (" + Math.floor(prims/dt*1000) + " prims/s)");

    //window.requestAnimFrame(step);
}

function evalGrammar() {
    // TODO: Don't re-evaluate if any changes are impossible?
    var grammarString = codeMirror.getValue();
    eval("grammarFn = " + grammarString);
    if (typeof grammarFn != "function") {
        console.log("This grammar looks like an expression, not a function. Trying anyway.");
        grammar = grammarFn;
    } else {
        grammar = grammarFn(t, {});
    }

    validateGrammar(grammar);

    resolveRules(grammar, GrammarParser.prototype.primitives);
    accumProbability(grammar);
}

function reseed() {
    document.getElementById("seed").value = Math.seedrandom();
}

window.addEventListener("load", onLoad, true);
