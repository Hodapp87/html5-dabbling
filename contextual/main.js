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

var grammarString = "";

// The function that generates the grammar:
var grammarFn;
// The grammar which it evaluated to this frame:
var grammar;

function onLoad() {
    var time, svg, style, codeMirrorDiv;

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

    // Listeners for mouse: Update mouseX/mouseY only when dragging.
    canvas.addEventListener("mousedown", function() { mouseClicked = true; }, true);
    canvas.addEventListener("mouseup", function() { mouseClicked = false; }, true);
    canvas.addEventListener("mousemove", function(event) {
        if (mouseClicked) {
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    }, true);

    document.getElementById("renderCanvasButton").onclick = function() {
        console.log("rendering Canvas!");
        // Make SVG invisible, and Canvas visible:
        svg.style.display = "none";
        canvas.style.display = "inline";
        evalGrammar();
        step(canvasRender);
    };

    document.getElementById("renderSvgButton").onclick = function() {
        console.log("rendering SVG!");
        // Make Canvas invisible, and SVG visible:
        svg.style.display = "inline";
        canvas.style.display = "none";
        evalGrammar();
        step(svgRender);
    };

    document.getElementById("svgButton").onclick = function() {
        var svgLink, dlElem;
        dlElem = document.getElementById('downloadLinks');

        svgLink = document.getElementById(svgDownloadId);
        if (svgLink) {
            dlElem.removeChild(svgLink);
        }

        svgLink = makeDownload(svg, "file.svg", "Download SVG");
        svgLink.setAttribute("id", svgDownloadId);
        dlElem.appendChild(svgLink);
    };

    mouseX = canvas.width / 2;
    mouseY = canvas.height / 2;
    var time = new Date();
    t0 = time.getTime();

    t = time.getTime();

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

    resolveRules(grammar);
    accumProbability(grammar);
}

function step(renderer) {
    var time = new Date();

    dt = (time.getTime() - t) / 1000;
    t = time.getTime();
    
    grammarParse.renderer = renderer;
    grammarParse.drawRule(grammar);

    //window.requestAnimFrame(step);
}

window.addEventListener("load", onLoad, true);
