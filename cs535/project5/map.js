var canvas;
var gl;

var texSize = 64;
var program;

var mvMatrixUniform;
var pMatrixUniform;

function TV(){};
TV.is_on = false;
TV.pointsArray = [];
TV.colorsArray = [];
TV.texCoordsArray = [];
TV.numVertices  = 0;

var texture;

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var colors = {
    black: vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    red: vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    yellow: vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    green: vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    blue: vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    magenta: vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    white: vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    cyan: vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
};

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


TV.quad = function(a, b, c, d) {
     TV.pointsArray.push(TV.vertices[a]);
     TV.colorsArray.push(colors['black']);
     TV.texCoordsArray.push(texCoord[0]);

     TV.pointsArray.push(TV.vertices[b]);
     TV.colorsArray.push(colors['black']);
     TV.texCoordsArray.push(texCoord[1]);

     TV.pointsArray.push(TV.vertices[c]);
     TV.colorsArray.push(colors['black']);
     TV.texCoordsArray.push(texCoord[2]);
   
     TV.pointsArray.push(TV.vertices[a]);
     TV.colorsArray.push(colors['black']);
     TV.texCoordsArray.push(texCoord[0]);

     TV.pointsArray.push(TV.vertices[c]);
     TV.colorsArray.push(colors['black']);
     TV.texCoordsArray.push(texCoord[2]);

     TV.pointsArray.push(TV.vertices[d]);
     TV.colorsArray.push(colors['black']);
     TV.texCoordsArray.push(texCoord[3]);
}


TV.initialize = function()
{
    TV.vertices = [
      vec4( -0.5, 0.5,  0.5, 1.0 ),
      vec4( -0.5,  1.5,  0.5, 1.0 ),
      vec4( 0.5,  1.5,  0.5, 1.0 ),
      vec4( 0.5, 0.5,  0.5, 1.0 ),
      vec4( -0.5, 0.5, -0.5, 1.0 ),
      vec4( -0.5,  1.5, -0.5, 1.0 ),
      vec4( 0.5,  1.5, -0.5, 1.0 ),
      vec4( 0.5, 0.5, -0.5, 1.0 )
    ];
  
    //INITIALIZE TV VERTICES
    TV.quad( 1, 0, 3, 2 );
    TV.quad( 2, 3, 7, 6 );
    TV.quad( 3, 0, 4, 7 );
    TV.quad( 6, 5, 1, 2 );
    TV.quad( 4, 5, 6, 7 );
    TV.quad( 5, 4, 0, 1 );
    
    TV.numVertices  = TV.pointsArray.length;
    
    // Initialize a texture
    //var image = new Image();
    //image.onload = function() {
     //   configureTexture( image );
    //}
    //image.src = "SA2011_black.gif"
    var image = document.getElementById("texImage");
 
    configureTexture( image );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight);
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    TV.initialize();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    //get matrix uniform variables
    pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	  mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
    
    document.getElementById("OnOffButton").onclick = function(){
      TV.is_on = !TV.is_on;
    };
       
    render();
 
}

var eyex = 2.0;
var eyey = 2.0;
var eyez = 4.0;
var atx = 0.0;
var aty = 0.0;
var atz = 0.0;

var render = function(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1i(gl.getUniformLocation(program, "TV_is_on"), TV.is_on);
    
    pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);
  
  	var eye = [eyex, eyey, eyez];
  	var at = [atx, aty, atz];
  	var up = [0.0, 1.0, 0.0];
  	mvMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(mvMatrixUniform, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(pMatrixUniform, false, flatten(pMatrix));
    
    gl.drawArrays( gl.TRIANGLES, 0, TV.numVertices );
    requestAnimFrame(render);
}