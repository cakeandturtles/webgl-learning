//
// CS535, Project #7, Jake Trower
//
// file to initialize webgl, and set up the buffers/arrays to handle the vertices and textures of the foreground and background surfaces
// also sets up event handlers for the HTML buttons to perform the required logic
// and sends the necessary information to the webgl shaders
//

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

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}
//END UTILS

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
    //black: vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    red: vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    yellow: vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    green: vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    blue: vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    magenta: vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    white: vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    cyan: vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
};
//a palette i found online!
var colors_array = [
	vec4(0.24, 0.23, 0.31),
	vec4(0.85, 0.35, 0.37),
	vec4(0.91, 0.53, 0.33),
	vec4(0.88, 0.67, 0.33),
	vec4(0.91, 0.79, 0.55)
];

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

var autoQuad = function(x1, x2, y1, y2, z1, z2, pointsArray, normalsArray, texCoordsArray, indexArray){
	var vertices = [
		vec3(x1, y1, z1),
		vec3(x1, y2, z1),
		vec3(x2, y2, z1),
		vec3(x2, y1, z1),
		vec3(x1, y1, z2),
		vec3(x1, y2, z2),
		vec3(x2, y2, z2),
		vec3(x2, y1, z2)
	];
	if (z1 === z2){ //only back face!
		quad( 1, 0, 3, 2, vertices, pointsArray, normalsArray, vec3(0.0, 0.0, 1.0), texCoordsArray, indexArray);
	}else if (y1 === y2){ //only bottom face!
		//bottom face
		quad( 6, 5, 1, 2, vertices, pointsArray, normalsArray, vec3(0.0, 1.0, 0.0), texCoordsArray, indexArray);
	}
	else { //get all faces!
		//back face
		quad( 1, 0, 3, 2, vertices, pointsArray, normalsArray, vec3(0.0, 0.0, -1.0), texCoordsArray, indexArray);
		//right face
		quad( 2, 3, 7, 6, vertices, pointsArray, normalsArray, vec3(1.0, 0.0, 0.0), texCoordsArray, indexArray);
		//top face
		quad( 3, 0, 4, 7, vertices, pointsArray, normalsArray, vec3(0.0, 1.0, 0.0), texCoordsArray, indexArray);
		//bottom face
		quad( 6, 5, 1, 2, vertices, pointsArray, normalsArray, vec3(0.0, -1.0, 0.0), texCoordsArray, indexArray);
		//front face
		quad( 4, 5, 6, 7, vertices, pointsArray, normalsArray, vec3(0.0, 0.0, 1.0), texCoordsArray, indexArray);
		//left face
		quad( 5, 4, 0, 1, vertices, pointsArray, normalsArray, vec3(-1.0, 0.0, 0.0), texCoordsArray, indexArray);
	}
}

var quad = function(a, b, c, d, vertices, pointsArray, normalsArray, normal, texCoordsArray, indexArray) {
     pointsArray.push(vertices[a]);
	 normalsArray.push(normal);
     texCoordsArray.push(texCoord[0]);
	 indexArray.push(a);

     pointsArray.push(vertices[b]);
	 normalsArray.push(normal);
     texCoordsArray.push(texCoord[1]);
	 indexArray.push(b);

     pointsArray.push(vertices[c]);
	 normalsArray.push(normal);
     texCoordsArray.push(texCoord[2]);
	 indexArray.push(c);
   
     pointsArray.push(vertices[a]);
	 normalsArray.push(normal);
     texCoordsArray.push(texCoord[0]);
	 indexArray.push(a);

     pointsArray.push(vertices[c]);
	 normalsArray.push(normal);
     texCoordsArray.push(texCoord[2]);
	 indexArray.push(c);

     pointsArray.push(vertices[d]);
	 normalsArray.push(normal);
     texCoordsArray.push(texCoord[3]);
	 indexArray.push(d);
}

var GAME_OBJECT = function(mobile){
	if (mobile === undefined) mobile = true;
	this.mobile = mobile;
	this.x = 0; this.y = 0; this.z = 0;
	this.using_model = false;
	this.loaded = false;
	//0 for solid color, 1 for gradient, 2 for texture, 3 for environment mapping
	this.skin = 0;
	this.angle = 270;	//in degrees!
	this.keysDown = {};
	
	this.camera_height = 15;
	this.camera_front = 12;
}

GAME_OBJECT.prototype.initializeRectangularPrism = function(x, y, z, width, height, depth, texture_img){
	this.x = x;
	this.y = y;
	this.z = z;
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.shiftWidth = 0;
	this.shiftHeight = 0;
	this.shiftDepth = 0;
	this.using_model = false;
	this.powerup = false;
	
	this.texture = configureTexture(document.getElementById(texture_img));
	
	var vertexNormals = [];
	var vertexTextureCoords = [];
	var vertexPositions = [];
	var indices = [];
	autoQuad(x, x+width, y, y+height, z, z+depth, vertexPositions, vertexNormals, vertexTextureCoords, indices);
	vertexNormals = Array.prototype.slice.call(flatten(vertexNormals));
	vertexTextureCoords = Array.prototype.slice.call(flatten(vertexTextureCoords));
	vertexPositions = Array.prototype.slice.call(flatten(vertexPositions));
	indices = Array.prototype.slice.call(flatten(indices));
	
	this.vertex_normal_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_normal_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	this.vertex_normal_buffer.itemSize = 3;
	this.vertex_normal_buffer.numItems = vertexNormals.length / 3;
	
	//randomly assign colors to each vertex :)
	this.vertex_color_array = [];
	for (var i = 0; i < this.vertex_normal_buffer.numItems; i++){
		var r = Math.floor(Math.random() * colors_array.length);
		var color = colors_array[r];
		this.vertex_color_array.push(color[0]);
		this.vertex_color_array.push(color[1]);
		this.vertex_color_array.push(color[2]);
	}
	//now set up all the webgl buffer information for vertex colors
	this.vertex_color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_color_array), gl.STATIC_DRAW);
	this.vertex_color_buffer.itemSize = 3;
	this.vertex_color_buffer.numItems = this.vertex_color_array.length / 3;
	
	this.vertex_textureCoord_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_textureCoord_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
	this.vertex_textureCoord_buffer.itemSize = 2;
	this.vertex_textureCoord_buffer.numItems = vertexTextureCoords.length / 2;
	
	this.vertex_positions = vertexPositions;
	this.vertex_positions_original = this.vertex_positions.slice(0);
	this.vertex_position_original_original = this.vertex_positions.slice(0);
	this.vertex_position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_positions), gl.STATIC_DRAW);
	this.vertex_position_buffer.itemSize = 3;
	this.vertex_position_buffer.numItems = vertexPositions.length / 3;
	
	this.vertex_index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertex_index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	this.vertex_index_buffer.itemSize = 1;
	this.vertex_index_buffer.numItems = indices.length / 1;
	
	this.loaded = true;
}

GAME_OBJECT.prototype.powerupdate = function(){
	this.powerup = true;
	if (this.loaded)
		this.angle += 10;
	else this.angle -= 5;
	this.update();
	
	//very rough collision check with player object to see if player has "collected" an object
	if (!this.loaded) return;
	var rough = 0.0;
	if (game_obj.x < this.x + this.width/2 && 
		game_obj.x + game_obj.width/2 > this.x &&
		game_obj.z + 4 < this.z + this.depth/2 &&
		game_obj.z + game_obj.depth/2 + 2 > this.z){
			
			this.onPlayerCollision();
	}
}

GAME_OBJECT.prototype.update = function(){
	if ((!this.loaded && !this.powerup) || !this.mobile) return;
	
	var vel = 0;
	if (this.keysDown[38]){ //up arrow
		vel = 0.5;
	}
	else if (this.keysDown[40]){	//down arrow
		vel = -0.5;
	}
	
	if (this.keysDown[37]){ //left arrow
		this.angle -= 5;
	}
	if (this.keysDown[39]){	//right arrow
		this.angle += 5;
	}
	
	//now update the x/z positions based on the velocity and the angle of the object
	//so that the "angle" is considered forward the object and a positive "vel" is also forward
	this.z += vel * Math.cos(degToRad(90-this.angle));
	this.x += vel * Math.sin(degToRad(90-this.angle));
	
	//the below will just move the vertices of the object relative to its set x/y/z and angle coordinates
	
	this.vertex_positions = this.vertex_positions_original.slice(0);
	//translate to the origin so rotation will happen correctly!
	var T1 = realTranslate(-(this.x+this.width/2), -(this.y), -(this.z+this.depth/2));
	//rotate bounding box by the facing
	var R = rotate(this.angle, [0, 1, 0]);
	//translate back
	var T2 = realTranslate(this.x+this.width/2, this.y, this.z+this.depth/2);
	//(and then some if the model is offset weirdly)
	var T3 = realTranslate(this.shiftWidth, this.shiftHeight, this.shiftDepth);
	var T3e = realTranslate(0, this.camera_height, this.camera_front);
	var T3a = realTranslate(0, 0, -0);
	
	if (!locked_camera){
		this.eye = vec4(this.x+this.width/2, this.y+this.height/2, this.z+this.depth/2);
		this.at = vec4(this.x+this.width/2, this.y+this.height/2, this.z+this.depth/2);

		this.eye = matrixTimesVector(T1, this.eye);
		this.eye = matrixTimesVector(R, this.eye);
		this.eye = matrixTimesVector(T2, this.eye);
		this.eye = matrixTimesVector(T3e, this.eye);

		this.at = matrixTimesVector(T1, this.at);
		this.at = matrixTimesVector(R, this.at);
		this.at = matrixTimesVector(T2, this.at);
		this.at = matrixTimesVector(T3a, this.at);
	}else{
		this.eye = vec4(eyex, eyey, eyez);
		this.at = vec4(atx, aty, atz);
	}

	for (var i = 0; i < this.vertex_positions.length; i+=3){	
		var vertex = vec4(
			this.vertex_positions[i] + this.x, 
			this.vertex_positions[i+1] + this.y, 
			this.vertex_positions[i+2] + this.z, 
			1.0);
		vertex = matrixTimesVector(T1, vertex);
		vertex = matrixTimesVector(R, vertex);
		vertex = matrixTimesVector(T2, vertex);
		vertex = matrixTimesVector(T3, vertex);
		
		//now reassign the vertex position to our vertex positions variables
		this.vertex_positions[i] = vertex[0];
		this.vertex_positions[i+1] = vertex[1];
		this.vertex_positions[i+2] = vertex[2];
	}	
}
GAME_OBJECT.prototype.initializeModel = function(x, y, z, model_file, texture_img){
	this.x = x;
	this.y = y;
	this.z = z;
	this.width = 10;
	this.height = 0;
	this.depth = 10;
	
	this.texture = configureTexture(document.getElementById(texture_img));
	var request = new XMLHttpRequest();
	request.open("GET", model_file);
	request.onreadystatechange = function(){
		if (request.readyState == 4){
			this.handleLoadedModel(JSON.parse(request.responseText));
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
	
	//randomly assign colors to each vertex :)
	this.vertex_color_array = [];
	for (var i = 0; i < this.vertex_normal_buffer.numItems; i++){
		var r = Math.floor(Math.random() * colors_array.length);
		var color = colors_array[r];
		this.vertex_color_array.push(color[0]);
		this.vertex_color_array.push(color[1]);
		this.vertex_color_array.push(color[2]);
	}
	//now set up all the webgl buffer information for vertex colors
	this.vertex_color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_color_array), gl.STATIC_DRAW);
	this.vertex_color_buffer.itemSize = 3;
	this.vertex_color_buffer.numItems = this.vertex_color_array.length / 3;
	
	this.vertex_textureCoord_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_textureCoord_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_json.vertexTextureCoords), gl.STATIC_DRAW);
	this.vertex_textureCoord_buffer.itemSize = 2;
	this.vertex_textureCoord_buffer.numItems = model_json.vertexTextureCoords.length / 2;
	
	this.vertex_positions = model_json.vertexPositions;
	this.vertex_positions_original = this.vertex_positions.slice(0);
	this.vertex_position_original_original = this.vertex_positions.slice(0);
	this.vertex_position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_positions), gl.STATIC_DRAW);
	this.vertex_position_buffer.itemSize = 3;
	this.vertex_position_buffer.numItems = model_json.vertexPositions.length / 3;
	
	//translate the teapot over (the model doesn't have a good center
	//this.shiftWidth = -4;
	this.shiftHeight = 1.8;
	this.shiftDepth = 3;
	
	this.vertex_index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertex_index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model_json.indices), gl.STATIC_DRAW);
	this.vertex_index_buffer.itemSize = 1;
	this.vertex_index_buffer.numItems = model_json.indices.length / 1;
	
	this.loaded = true;
	this.using_model = true;
}

GAME_OBJECT.prototype.render = function(){
	if (!this.loaded && !this.powerup) return;
	
	//send the skin information to the shader
	var skinBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, skinBuffer);
	var vSkin = gl.getAttribLocation(program, "aSkin");
	var skin = [];
	for (var i = 0; i < this.vertex_position_buffer.numItems; i++){
		skin.push(this.skin);
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skin), gl.STATIC_DRAW);
	gl.vertexAttribPointer(vSkin, 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vSkin);
	
	//do the same for the vertex positions
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertex_position_buffer);
    var vPosition = gl.getAttribLocation( program, "aVertexPosition" );
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, this.vertex_position_buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition );
	
	//and vertex colors
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_color_buffer);
	var vColor = gl.getAttribLocation(program, "aVertexColor");
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_color_array), gl.STATIC_DRAW);
	gl.vertexAttribPointer(vColor, this.vertex_color_buffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);
    
	//and vertex texture coordinates
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_textureCoord_buffer);
	var vTexCoord = gl.getAttribLocation(program, "aTextureCoord");
	gl.vertexAttribPointer(vTexCoord, this.vertex_textureCoord_buffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);
	
	//and vertex normals
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_normal_buffer);
	var vNormal = gl.getAttribLocation(program, "aVertexNormal");
	gl.vertexAttribPointer(vNormal, this.vertex_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);
	
	if (this.using_model){
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertex_index_buffer);
		gl.drawElements(gl.TRIANGLES, this.vertex_index_buffer.numItems, gl.UNSIGNED_SHORT,
		0);
	}else{
		gl.drawArrays( gl.TRIANGLES, 0, this.vertex_position_buffer.numItems);
	}
};

//NOW STUFF TO ACTUALLY RUN THE APPLICATION!!
var locked_camera = true;
var eyex = 0.0;
var eyey = 50.0;
var eyez = 80.0;
var atx = 0.0;
var aty = 0.0;
var atz = 0.0;
var lights_on = false;

//matrix utility function
function Mat4toInverseMat3(m4,m3){
	var m00 = m4[0][0], 
		m01 = m4[0][1], 
		m02 = m4[0][2], 
		m10 = m4[1][0], 
		m11 = m4[1][1], 
		m12 = m4[1][2], 
		m20 = m4[2][0], 
		m21 = m4[2][1], 
		m22 = m4[2][2];
	var a = m22*m11-m12*m21, 
		b = -m22*m10+m12*m20,
		c = m21*m10-m11*m20,
		d = m00*a+m01*b+m02*c;
	if(!d)
		return null;
	d=1/d;
	m3=mat3();
	m3[0][0]=a*d;
	m3[0][1]=(-m22*m01+m02*m21)*d;
	m3[0][2]=(m12*m01-m02*m11)*d;
	m3[1][0]=b*d;
	m3[1][1]=(m22*m00-m02*m20)*d;
	m3[1][2]=(-m12*m00+m02*m10)*d;
	m3[2][0]=c*d;
	m3[2][1]=(-m21*m00+m01*m20)*d;
	m3[2][2]=(m11*m00-m01*m10)*d;
	return m3
};

var mvMatrixStack = [];
var setMatrixUniforms = function(){
	gl.uniformMatrix4fv(mvMatrixUniform, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(pMatrixUniform, false, flatten(pMatrix));
	
	var normalMatrix = mat3(0);
	normalMatrix = Mat4toInverseMat3(mvMatrix);
	normalMatrix = transpose(normalMatrix);
	gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNMatrix"), false, flatten(normalMatrix));
}
function mvPushMatrix() {
	var copy = mat4(0);
	for (var i = 0; i < mvMatrix.length; i++){
		copy[i] = mvMatrix[i].slice();
	}
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

var tick = function(){
	update();
	render();
	requestAnimFrame(tick);
}

var update = function(){
	game_obj.update();
	for (var i = 0; i < powerups.length; i++){
		powerups[i].powerupdate();
	}
	
	//update the camera variables
	if (!locked_camera){
		eyex = game_obj.eye[0];
		eyey = game_obj.eye[1];
		eyez = game_obj.eye[2];
		atx = game_obj.at[0];
		aty = game_obj.at[1];
		atz = game_obj.at[2];
	}
}
var debug = false;
var lightX = 0.0, lightY = 5.0, lightZ = 0.0;
var render = function(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);
  
  	var eye = [eyex, eyey, eyez];
  	var at = [atx, aty, atz];
  	var up = [0.0, 1.0, 0.0];
  	mvMatrix = lookAt(eye, at, up);
	
	//SEND THE LIGHTSON VARIABLE!!!
	gl.uniform1i(gl.getUniformLocation(program, "uUseLighting"), lights_on);
	if (lights_on) {
		gl.uniform3f(gl.getUniformLocation(program, "uAmbientColor"), 0.1, 0.1, 0.1);
		
		gl.uniform3f(gl.getUniformLocation(program, "uLightLocation"), lightX, lightY, lightZ);
		//now add the other point lights
		gl.uniform3f(gl.getUniformLocation(program, "uLightLocation2"), -32, 10, -350);
		gl.uniform3f(gl.getUniformLocation(program, "uLightLocation3"), -32, 10, -400);
		gl.uniform3f(gl.getUniformLocation(program, "uLightLocation4"), -32, 10, -450);

		gl.uniform3f(gl.getUniformLocation(program, "uLightColor"), 1.0, 1.0, 1.0);
	}

    setMatrixUniforms();
	for (var i = 0; i < walls.length; i++){
		walls[i].render();
	}
	for (var i = 0; i < powerups.length; i++){
		powerups[i].render();
	}
	game_obj.render();
}

var game_obj;
var walls = [];
var powerups = [];
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
	game_obj.initializeRectangularPrism(0.0, 0.0, 0.0, 10, 10, 10, "metalImg");
	game_obj.x = -5.0; game_obj.z = 5.0;
	game_obj.skin = 1;
	
	powerups = [];
	powerups[0] = new GAME_OBJECT();
	powerups[0].initializeRectangularPrism(0.0, 0.0, 0.0, 10, 10, 0.0, "cameraImg");
	powerups[0].x = -5; powerups[0].z = -10.0;
	powerups[0].skin = 2;
	powerups[0].onPlayerCollision = function(){ 
		locked_camera = false; 
		document.getElementById("hint_text").innerHTML = "Powerup acquired: <span style='color: #ff00ff;'>Camera will follow you!</span><br/><br/>Follow the carpets to the next powerup! <br/><br/>(Left and right arrows will change your facing)";
		
		//using the "loaded" variable as a visible/invisible toggle kind of
		powerups[0].loaded = false;
	};
	powerups[1] = new GAME_OBJECT();
	powerups[1].initializeRectangularPrism(0.0, 0.0, 0.0, 10, 10, 0, "teapotImg");
	powerups[1].x = 15;
	powerups[1].z = -55;
	powerups[1].skin = 2;
	powerups[1].onPlayerCollision = function(){
		var x = game_obj.x;
		var y = game_obj.y;
		var z = game_obj.z;
		game_obj.initializeModel(0.0, 0.0, 0.0, "teapot.json", "metalImg");
		game_obj.x = x+5; game_obj.y = y; game_obj.z = z;
		game_obj.skin = 2;
		game_obj.camera_height += 5;
		
		document.getElementById("hint_text").innerHTML = "Powerup acquired: <span style='color: #00aa00;'>Short & Stout</span><br/><br/>Follow the carpets to the next powerup! <br/><br/>(Left and right arrows will change your facing)";
		
		powerups[1].loaded = false;
	}
	powerups[2] = new GAME_OBJECT();
	powerups[2].initializeRectangularPrism(0.0, 0.0, 0.0, 10, 10, 0, "lightImg");
	powerups[2].x = -20;
	powerups[2].z = -110;
	powerups[2].skin = 2;
	powerups[2].onPlayerCollision = function(){
		lights_on = true;
		
		document.getElementById("hint_text").innerHTML = "Powerup acquired: <span style='color: #ffaa00;'>Lights!!!</span><br/><br/>Follow the spotlights to the last powerup! <br/><br/>(Left and right arrows will change your facing)";
		
		powerups[2].loaded = false;
	}
	powerups[3] = new GAME_OBJECT();
	powerups[3].initializeRectangularPrism(0.0, 0.0, 0.0, 10, 10, 0, "puzzleImg");
	powerups[3].x = -15;
	powerups[3].z = -170;
	powerups[3].skin = 2;
	powerups[3].onPlayerCollision = function(){
		document.getElementById("hint_text").innerHTML = "Powerup acquired: <span style='color: #00ffff;'>Ultimate Power</span><br/><br/>Congratulations, you won!! <br/><br/>(Press X to mutate teapot model. Press Z to unmutate!.)";
		
		powerups[3].loaded = false;
	}
	
	walls = [];	
	walls[0] = new GAME_OBJECT(false);
	walls[0].initializeRectangularPrism(-5, 0.0, -100.0, 10.0, 0.0, 60.0, "floorImg");
	walls[0].skin = 2;
	walls[1] = new GAME_OBJECT(false);
	walls[1].initializeRectangularPrism(-5, 0.0, -160.0, 10.0, 0.0, 60.0, "floorImg");
	walls[1].skin = 2;
	walls[2] = new GAME_OBJECT(false);
	walls[2].initializeRectangularPrism(-5, 0.0, -170, 60.0, 0.0, 10.0, "floorImg");
	walls[2].skin = 2;
	for (var i = 3; i < 10; i++){
		walls[i] = new GAME_OBJECT(false);
		walls[i].initializeRectangularPrism(55, 0.0, -130-(i*10), 10.0, 0.0, -10.0, "floor2Img");
		walls[i].skin = 2;
	}
	for (var i = 10; i < 20; i++){
		walls[i] = new GAME_OBJECT(false);
		walls[i].initializeRectangularPrism(55-((i-10)*10), 0.0, -200-((i-8)*10), 10.0, 0.0, -10.0, "floor2Img");
		walls[i].skin = 2;
	}
	walls[20] = new GAME_OBJECT(false);
	walls[20].initializeRectangularPrism(-55, 0.0, -320, 40, 0.0, -200.0, "floorImg");
	walls[21] = new GAME_OBJECT(false);
	walls[21].initializeRectangularPrism(-100, -1.0, -100, 200, 0.0, 200, "floorImg");
	
	//to ensure smooth key down holding, use an object on the gameobj to store keys 
	//that are currently down
	window.onkeydown = function(e){
		game_obj.keysDown[e.keyCode] = true;
	}
	//and remove the pressed keys when the key is released
	window.onkeyup = function(e){
		delete game_obj.keysDown[e.keyCode];
	}
	window.onkeypress = function(e){
		if (e.keyCode === 120){ //X KEY! RANDOMIZE THE MODEL VERTICES
			for (var i = 0; i < game_obj.vertex_positions_original.length; i++){
				game_obj.vertex_positions_original[i] += Math.floor(Math.random()*2) - 1;
			}
		}
		if (e.keyCode === 122){ //Z key! UNMUTATE
			console.log(game_obj.vertex_position_original_original);
			game_obj.vertex_positions_original = game_obj.vertex_position_original_original.slice(0);
		}
	}
    
    //get matrix uniform variables
    pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
       
    tick();
}