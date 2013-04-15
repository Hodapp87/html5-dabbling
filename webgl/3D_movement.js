var gl = null,
    canvas = null,
    glProgram = null,
    fragmentShader = null,
    vertexShader = null;

var vertexPositionAttribute = null,
    trianglesVerticeBuffer = null,
    vertexColorAttribute = null,
    trianglesColorBuffer = null;

var angle = 0.0;

var mvMatrix = mat4.create(),
pMatrix = mat4.create();

function initWebGL()
{
    canvas = document.getElementById("my-canvas");  
    try{
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");                 
    }catch(e){
    }
    
    if(gl)
    {
        initShaders();
        setupBuffers();
        getMatrixUniforms();
        (function animLoop(){
            setupWebGL();
            setupDynamicBuffers();
            setMatrixUniforms();
            drawScene();
            requestAnimationFrame(animLoop, canvas);
        })();
    }else{  
        alert(  "Error: Your browser does not appear to support WebGL.");
    }
}

function setupWebGL()
{
    //set the clear color to a shade of green
    gl.clearColor(0.1, 0.5, 0.1, 1.0);  
    gl.clear(gl.COLOR_BUFFER_BIT);  
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(45, canvas.width / canvas.height, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -2.0]);              
}

function initShaders()
{
    //get shader source
    var fs_source = document.getElementById('shader-fs').innerHTML,
        vs_source = document.getElementById('shader-vs').innerHTML;

    //compile shaders   
    var vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
    var fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);
    
    //create program
    glProgram = gl.createProgram();
    
    //attach and link shaders to the program
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);

    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }
    
    //use program
    gl.useProgram(glProgram);
}

function makeShader(src, type)
{
    //compile the vertex shader
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function setupBuffers()
{
    var triangleVerticeColors = [ 
        //left triangle 
        1.0, 0.0, 0.0,
        1.0, 1.0, 1.0,
        1.0, 0.0, 0.0,
        
        //right triangle
        0.0, 0.0, 1.0,
        1.0, 1.0, 1.0,
        0.0, 0.0, 1.0,
    ];

    trianglesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticeColors), gl.STATIC_DRAW);    
}

function setupDynamicBuffers()
{
    //limit translation amount to -0.5 to 0.5
    var x_translation = Math.sin(angle)/2.0;
    var z_translation = Math.sin(1.5*angle)/2.0;
    
    var triangleVertices = [ 
        //left triangle 
        -0.5 + x_translation, 0.5, z_translation,
         0.0 + x_translation, 0.0, z_translation,
        -0.5 + x_translation, -0.5, z_translation,
        
        //right triangle
        0.5 + x_translation, 0.5, -z_translation,
        0.0 + x_translation, 0.0, -z_translation,
        0.5 + x_translation, -0.5, -z_translation,
    ];
    angle += 0.01;              
    
    trianglesVerticeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);                
}

function drawScene()
{
    vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function getMatrixUniforms(){
    glProgram.pMatrixUniform = gl.getUniformLocation(glProgram, "uPMatrix");
    glProgram.mvMatrixUniform = gl.getUniformLocation(glProgram, "uMVMatrix");          
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(glProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(glProgram.mvMatrixUniform, false, mvMatrix);
}
