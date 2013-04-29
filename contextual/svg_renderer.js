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
    //this.target.setAttributeNS(null, "stroke", "black");
    this.target.setAttributeNS(null, "stroke", Colors.rgb2hex(255, 0, 0));
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

