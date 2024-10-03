
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;

//webgl related variables
const VertexAttributeEnum =
{
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_TEXCOORD: 1
};

var shaderProgramObject = null;

var vao_pyramid = null;
var vbo_pyramid = null;
var vbo_pyramid_texcoord = null;

var mvpMatrixUniform;
var perspectiveProjectionMatrix;

//texture
var texture_stone = null;
var textureSamplerUniform = null;

var Pangle = 0.0;

var requestAnimationFrame =
    window.requestAnimationFrame || // chrome
    window.webkitRequestAnimationFrame || // safari
    window.mozRequestAnimationFrame || // mozila
    window.oRequestAnimationFrame || // opera
    window.msRequestAnimationFrame; // edge

/* main */
function main() {
    /* Prepare the canvas and get WebGL context */
    canvas = document.getElementById("grk");
    if (canvas == null) {
        console.log("Getting canvas failed...!\n");
        return;
    }
    else {
        console.log("Getting canvas Successeded...!\n");
    }

    // set canvas width and height for future use.
    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;

    /* : register for keyboard events */
    window.addEventListener("keydown",
        keyDown, // our function
        false); // event bubble propagation

    /* : register for mouse events */
    window.addEventListener("click",
        mouseDown,
        false);

    window.addEventListener("resize",
        resize,
        false);

    initialize();
    resize();
    display();
}

function keyDown(event) {
    //code
    switch (event.keyCode) {
        case 81: // Q
        case 113: //q
            uninitialize();
            window.close();
            break;
        case 70: // F
        case 102: // f
            toggleFullscreen();
            break;

        default:
            break;
    }
}

function mouseDown() {

}

function toggleFullscreen() {
    var fullscreen_element =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null;

    // if not Fullscreen
    if (fullscreen_element == null) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        }
        else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        }
        else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        }
        else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }

        bFullscreen = true;
    }
    else // if already fullscreen
    {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        bFullscreen = false;
    }
}

function initialize() {
    //code
    gl = canvas.getContext("webgl2");
    if (gl == null) {
        console.log("Getting WebGL2 context failed...!\n");
        return;
    }
    else {
        console.log("Getting WebGL2 context Succeeded...!\n");
    }

    //set WebGL2 context's view width and view height 
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    //vertex shader
    var vertexShaderSourceCode =
        "#version 300 es" +
        "\n" +
        "in vec4 aPosition;" +
        "in vec2 aTexCoord;" +
        "out vec2 oTexCoord;" +
        "uniform mat4 uMVPMatrix;" +
        "void main(void)" +
        "{" +
        "gl_Position = uMVPMatrix * aPosition;" +
        "oTexCoord = aTexCoord;" +
        "}";

    var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);

    //compile shader
    gl.compileShader(vertexShaderObject);
    if (gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false) {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if (error.length > 0) {
            var log = "vertex shader compilation error : " + error;
            alert(log); // or use console.log()
            uninitialize();
        }
    }
    else {
        console.log("vertex shader compile successfully.");
    }

    //fragment shader
    var fragmentShaderSourceCode =
        "#version 300 es" +
        "\n" +
        "precision highp float;" +
        "in vec2 oTexCoord;" +
        "uniform highp sampler2D uTextureSampler;" +
        "out vec4 FragColor;" +
        "void main(void)" +
        "{" +
        "FragColor = texture(uTextureSampler,oTexCoord);" +
        "}";

    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);

    gl.compileShader(fragmentShaderObject);
    if (gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false) {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if (error.length > 0) {
            var log = "fragment shader compilation error : " + error;
            alert(log);
            uninitialize();
        }
    }
    else {
        console.log("fragment shader compilation successfully.")
    }

    //shader program
    shaderProgramObject = gl.createProgram();

    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);

    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, "aPosition");
    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_TEXCOORD, "aTexCoord");
    gl.linkProgram(shaderProgramObject);

    if (gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS) == false) {
        var error = gl.getProgramInfoLog(shaderProgramObject);
        if (error.length > 0) {
            var log = "shader program linking error : " + error;
            alert(log);
            uninitialize();
        }
    }
    else {
        console.log("shader program linking successfully ");
    }

    mvpMatrixUniform = gl.getUniformLocation(shaderProgramObject, "uMVPMatrix");
    textureSamplerUniform = gl.getUniformLocation(shaderProgramObject, "uTextureSampler");

    //geometery attribute declaration
    var pyramid_position = new Float32Array(
        [
            // front
            0.0, 1.0, 0.0, // front-top
            -1.0, -1.0, 1.0, // front-left
            1.0, -1.0, 1.0, // front-right

            // right
            0.0, 1.0, 0.0, // right-top
            1.0, -1.0, 1.0, // right-left
            1.0, -1.0, -1.0, // right-right

            // back
            0.0, 1.0, 0.0, // back-top
            1.0, -1.0, -1.0, // back-left
            -1.0, -1.0, -1.0, // back-right

            // left
            0.0, 1.0, 0.0, // left-top
            -1.0, -1.0, -1.0, // left-left
            -1.0, -1.0, 1.0, // left-right
        ]
    );
    var pyramid_texcoord = new Float32Array(
        [
            // front
            0.5, 1.0, // front-top
            0.0, 0.0, // front-left
            1.0, 0.0, // front-right

            // right
            0.5, 1.0, // right-top
            1.0, 0.0, // right-left
            0.0, 0.0, // right-right

            // back
            0.5, 1.0, // back-top
            0.0, 0.0, // back-left
            1.0, 0.0, // back-right

            // left
            0.5, 1.0, // left-top
            1.0, 0.0, // left-left
            0.0, 0.0, // left-right
        ]
    );
    //vao
    vao_pyramid = gl.createVertexArray();
    gl.bindVertexArray(vao_pyramid);

    //vbo
    vbo_pyramid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_pyramid);
    gl.bufferData(gl.ARRAY_BUFFER, pyramid_position, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  // vbo unbind

    //vbo texcoord
    vbo_pyramid_texcoord = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_pyramid_texcoord);
    gl.bufferData(gl.ARRAY_BUFFER, pyramid_texcoord, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_TEXCOORD, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_TEXCOORD);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  // vbo unbind

    gl.bindVertexArray(null); // vao_triangle unbind

    //depth initialization
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // texture
    texture_stone = loadGLTexture();

    //set clearcolor
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //initialize projection matrix
    perspectiveProjectionMatrix = mat4.create();
}


function loadGLTexture() {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.src = "./resources/stone.png";

    texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, // target
                      0,              // level
                      gl.RGBA,        // internal format
                      gl.RGBA,        // format
                      gl.UNSIGNED_BYTE, // type
                      texture.image);  // pixels

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);  // Unbind texture
        console.log("Texture loaded and set up successfully.");
    };

    texture.image.onerror = function () {
        console.log("Error loading texture image.");
    };

    return texture;
}

function resize() {
    if (canvas.height <= 0)
        canvas.height = 1;

    if (bFullscreen == true) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }

    //set viewport
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);

    //set perspective projection
    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);
}

function degToRad(degree) {
    return (degree * Math.PI / 180.0);
}

function display() {
    // Code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    // transformation
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();
    var rotationMatrix = mat4.create();

    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]);// (targate,source)
    mat4.rotateY(rotationMatrix, rotationMatrix, degToRad(Pangle));
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);

    gl.uniformMatrix4fv(mvpMatrixUniform, false, modelViewProjectionMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture_stone);
    gl.uniform1i(textureSamplerUniform, 0);
    gl.bindVertexArray(vao_pyramid);
    gl.drawArrays(gl.TRIANGLES, 0, 12);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);

    gl.useProgram(null);

    // call update
    update();

    //set double bufferring
    requestAnimationFrame(display, canvas);

}

function update() {
    Pangle = Pangle + 1.0;
    if (Pangle >= 360.0) {
        Pangle = Pangle - 360.0; // or angle = 0.0f
    }
}

function uninitialize() {
    if (shaderProgramObject != null) {
        gl.useProgram(shaderProgramObject);

        var shaderObjects = gl.getAttachedShaders(shaderProgramObject);

        if (shaderObjects != null && shaderObjects.length > 0) {
            for (let i = 0; i < shaderObjects.length; i++) {
                gl.detachShader(shaderProgramObject, shaderObjects[i]);
                gl.deleteShader(shaderObjects[i]);
            }
            shaderObjects = null;
        }

        gl.useProgram(null);
        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }

    if (vbo_pyramid) {
        gl.deleteBuffer(vbo_pyramid);
        vbo_pyramid = null;
    }
    
    if (vbo_pyramid_texcoord) {
        gl.deleteBuffer(vbo_pyramid_texcoord);
        vbo_pyramid_texcoord = null;
    }

    if (texture_stone) {
        gl.deleteTexture(texture_stone);
        texture_stone = null;
    }

    if (vao_pyramid) {
        gl.deleteVertexArray(vao_pyramid);
        vao_pyramid = null;
    }
}

