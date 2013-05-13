"use strict";

function CanvasRenderer(canvasElement) {
    this.canvas = canvasElement;
    this.context = this.canvas.getContext('2d');

    this.baseLineWidth = 50 / (this.canvas.width + this.canvas.height);

    console.log("Received " + this.canvas.width + "x" + this.canvas.height + " canvas.");

    // These three store a stack of stroke style, fill style, and stroke width,
    // which we treat as transforms and need to keep track of with
    // pushTransform & popTransform
    this.strokeStack = [];
    this.fillStack = [];
    this.strokeWidthStack = [];
}

CanvasRenderer.prototype = new Renderer();

CanvasRenderer.prototype.drawTriangle = function(x0, y0, x1, y1, x2, y2) {
    this.context.beginPath();
    this.context.moveTo(x0, y0);
    this.context.lineTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.closePath();
    this.context.stroke();
    this.context.fill();
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
    this.context.fill();
};

CanvasRenderer.prototype.pushTransform = function() {
    this.context.save();
    this.strokeStack.push(this.context.strokeStyle);
    this.fillStack.push(this.context.fillStyle);
    this.strokeWidthStack.push(this.context.lineWidth);
};

CanvasRenderer.prototype.popTransform = function() {
    this.context.restore();
    this.context.strokeStyle = this.strokeStack.pop();
    this.context.fillStyle = this.fillStack.pop();
    this.context.lineWidth = this.strokeWidthStack.pop();
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

CanvasRenderer.prototype.setStrokeColor = function(r, g, b, a) {
    this.context.strokeStyle = rgb2string(r, g, b, a);
};

CanvasRenderer.prototype.setFillColor = function(r, g, b, a) {
    this.context.fillStyle = rgb2string(r, g, b, a);
};

CanvasRenderer.prototype.clear = function(r, g, b) {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    if (r != null) {
        this.setFillColor(r, g, b, 1.0);
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.setStrokeWidth(1);
};
