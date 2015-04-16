//
// CS535, Project #6, Jake Trower
//
// file to initialize webgl, and set up the buffers/arrays to handle the vertices and textures of the foreground and background surfaces
// also sets up event handlers for the HTML buttons to perform the required logic
// and sends the necessary information to the webgl shaders
//

var canvas;
var gl;

var texSize = 64;
var program;

var mvMatrixUniform;
var pMatrixUniform;

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
	var texture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, texture );
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA,
		gl.RGBA, gl.UNSIGNED_BYTE, image );
	gl.generateMipmap( gl.TEXTURE_2D );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
					gl.NEAREST_MIPMAP_LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
	return texture;
}

var autoQuad = function(x1, x2, y1, y2, z1, z2, pointsArray, colorsArray, texCoordsArray){
	var vertices = [
		vec4(x1, y1, z1, 1.0),
		vec4(x1, y2, z1, 1.0),
		vec4(x2, y2, z1, 1.0),
		vec4(x2, y1, z1, 1.0),
		vec4(x1, y1, z2, 1.0),
		vec4(x1, y2, z2, 1.0),
		vec4(x2, y2, z2, 1.0),
		vec4(x2, y1, z2, 1.0)
	];
	if (y1 !== y2){
		quad( 1, 0, 3, 2, vertices, pointsArray, colorsArray, texCoordsArray);
		quad( 2, 3, 7, 6, vertices, pointsArray, colorsArray, texCoordsArray);
	}
    quad( 3, 0, 4, 7, vertices, pointsArray, colorsArray, texCoordsArray);
	if (y1 !== y2){
		quad( 6, 5, 1, 2, vertices, pointsArray, colorsArray, texCoordsArray);
		quad( 4, 5, 6, 7, vertices, pointsArray, colorsArray, texCoordsArray);
		quad( 5, 4, 0, 1, vertices, pointsArray, colorsArray, texCoordsArray);
	}
}

var quad = function(a, b, c, d, vertices, pointsArray, colorsArray, texCoordsArray) {
     pointsArray.push(vertices[a]);
     colorsArray.push(colors['white']);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     colorsArray.push(colors['white']);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     colorsArray.push(colors['white']);
     texCoordsArray.push(texCoord[2]);
   
     pointsArray.push(vertices[a]);
     colorsArray.push(colors['white']);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[c]);
     colorsArray.push(colors['white']);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     colorsArray.push(colors['white']);
     texCoordsArray.push(texCoord[3]);
}

var GAME_OBJECT = function(){
	this.loaded = false;
	this.angle = 180;	//in degrees!
}

GAME_OBJECT.prototype.update = function(){
	if (!this.loaded) return;
	
	this.vertex_positions = this.vertex_positions_original.slice(0);
	
	//translate to the origin so rotation will happen correctly!
	var T1 = realTranslate(-this.x, -this.y, -this.z);
	//rotate bounding box by the facing
	var R = rotate(this.angle, [0, 1, 0]);
	//translate back
	var T2 = realTranslate(this.x, this.y, this.z);
	
	for (var i = 0; i < this.vertex_positions.length; i+=3){	
		var vertex = vec4(
			this.vertex_positions[i] + this.x, 
			this.vertex_positions[i+1] + this.y, 
			this.vertex_positions[i+2] + this.z, 
			1.0);
		vertex = matrixTimesVector(T1, vertex);
		vertex = matrixTimesVector(R, vertex);
		vertex = matrixTimesVector(T2, vertex);
		
		//now reassign the vertex position to our vertex positions variables
		this.vertex_positions[i] = vertex[0];
		this.vertex_positions[i+1] = vertex[1];
		this.vertex_positions[i+2] = vertex[2];
	}
}
//helper function to quickly reassign vertices to the points array of an object
GAME_OBJECT.prototype.requad = function(){	
	this.pointsArray = [];
	this.colorsArray = [];
	this.texCoordsArray = [];
	autoQuad(this.x1, this.x2, this.y1, this.y2, this.z1, this.z2, this.pointsArray, this.colorsArray, this.texCoordsArray);
}
GAME_OBJECT.prototype.initializeModel = function(x, y, z, model_file, texture_img){
	this.x = x;
	this.y = y;
	this.z = z;
	
	var request = new XMLHttpRequest();
	request.open("GET", model_file);
	request.onreadystatechange = function(){
		if (request.readyState == 4){
			this.handleLoadedModel(JSON.parse(request.responseText));
			this.texture = configureTexture(document.getElementById(texture_img));
		}
	}.bind(this);
	request.send();
}
GAME_OBJECT.prototype.handleLoadedModel = function(model_json){
	this.vertex_normal_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_normal_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_json.vertexNormals), gl.STATIC_DRAW);
	this.vertex_normal_buffer.itemSize = 3;
	this.vertex_normal_buffer.numItems = model_json.vertexNormals.length / 3;
	
	this.vertex_textureCoord_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_textureCoord_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_json.vertexTextureCoords), gl.STATIC_DRAW);
	this.vertex_textureCoord_buffer.itemSize = 2;
	this.vertex_textureCoord_buffer.numItems = model_json.vertexTextureCoords.length / 2;
	
	this.vertex_positions = model_json.vertexPositions;
	this.vertex_positions_original = this.vertex_positions.slice(0);
	this.vertex_position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_positions), gl.STATIC_DRAW);
	this.vertex_position_buffer.itemSize = 3;
	this.vertex_position_buffer.numItems = model_json.vertexPositions.length / 3;
	
	this.vertex_index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertex_index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model_json.indices), gl.STATIC_DRAW);
	this.vertex_index_buffer.itemSize = 1;
	this.vertex_index_buffer.numItems = model_json.indices.length / 1;
	
	this.loaded = true;
}

GAME_OBJECT.prototype.render = function(){
	if (!this.loaded) return;
	
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertex_position_buffer);
    var vPosition = gl.getAttribLocation( program, "aVertexPosition" );
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, this.vertex_position_buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition );
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);
    
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_textureCoord_buffer);
	var vTexCoord = gl.getAttribLocation(program, "aTextureCoord");
	gl.vertexAttribPointer(vTexCoord, this.vertex_textureCoord_buffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_normal_buffer);
	var vNormal = gl.getAttribLocation(program, "aVertexNormal");
	gl.vertexAttribPointer(vNormal, this.vertex_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertex_index_buffer);
    gl.drawElements(gl.TRIANGLES, this.vertex_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
};

var game_obj;
var bg_obj;
window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	game_obj = new GAME_OBJECT();
	game_obj.initializeModel(10.0, 0.0, 0.0, "teapot.json", "metalImg");
	
	//bg_obj = new GAME_OBJECT();
	//bg_obj.initialize(-1.0, 0.0, -1.0, 2.0, 0.0, 2.0, "bgImg");
    
    //get matrix uniform variables
    pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
       
    tick();
}
var eyex = 0.0;
var eyey = 20.0;
var eyez = 50.0;
var atx = 0.0;
var aty = 0.0;
var atz = 0.0;

var setMatrixUniforms = function(){
	gl.uniformMatrix4fv(mvMatrixUniform, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(pMatrixUniform, false, flatten(pMatrix));
}

var tick = function(){
	update();
	render();
	requestAnimFrame(tick);
}

var update = function(){
	game_obj.update();
}

var render = function(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);
  
  	var eye = [eyex, eyey, eyez];
  	var at = [atx, aty, atz];
  	var up = [0.0, 1.0, 0.0];
  	mvMatrix = lookAt(eye, at, up);
    setMatrixUniforms();
	
	//bg_obj.render();
	game_obj.render();
}

//UTILS
//treating a row vector [v1, v2, v3, 1] like a column vector
//returns a column vector
function matrixTimesVector(mat, vec){
	if (vec.length !== mat.length){
		throw "INVALID DIMENSIONS ON MATRIX VECTOR MULTIPLICATION";
	}
	var result = vec4();
	
	//now multiply them together
	for (var i = 0; i < mat.length; i++){
		for (var j = 0; j < vec.length; j++){
			result[i] += mat[j][i] * vec[j];
		}
	}
	return result;
}

function realTranslate(x, y, z) {
	var a = mat4();
    var a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;
		
	var out = mat4();

	a00 = a[0][0]; a01 = a[0][1]; a02 = a[0][2]; a03 = a[0][3];
	a10 = a[1][0]; a11 = a[1][1]; a12 = a[1][2]; a13 = a[1][3];
	a20 = a[2][0]; a21 = a[2][1]; a22 = a[2][2]; a23 = a[2][3];

	out[0][0] = a00; out[0][1] = a01; out[0][2] = a02; out[0][3] = a03;
	out[1][0] = a10; out[1][1] = a11; out[1][2] = a12; out[1][3] = a13;
	out[2][0] = a20; out[2][1] = a21; out[2][2] = a22; out[2][3] = a23;

	out[3][0] = a00 * x + a10 * y + a20 * z + a[3][0];
	out[3][1] = a01 * x + a11 * y + a21 * z + a[3][1];
	out[3][2] = a02 * x + a12 * y + a22 * z + a[3][2];
	out[3][3] = a03 * x + a13 * y + a23 * z + a[3][3];

    return out;
};