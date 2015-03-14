
var gl;

function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
}


function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}



function createProgram(fragmentShaderID, vertexShaderID) {
	var fragmentShader = getShader(gl, fragmentShaderID);
	var vertexShader = getShader(gl, vertexShaderID);

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
	gl.enableVertexAttribArray(program.vertexPositionAttribute);

	program.vertexNormalAttribute = gl.getAttribLocation(program, "aVertexNormal");
	gl.enableVertexAttribArray(program.vertexNormalAttribute);

	program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
	program.nMatrixUniform = gl.getUniformLocation(program, "uNMatrix");
	program.samplerUniform = gl.getUniformLocation(program, "uSampler");
	program.useLightingUniform = gl.getUniformLocation(program, "uUseLighting");
	program.ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
	program.pointLightingAtUniform = gl.getUniformLocation(program, "uPointLightingAt");
	program.pointLightingColorUniform = gl.getUniformLocation(program, "uPointLightingColor");

	return program;
}


var currentProgram;
var perFragmentProgram;

function initShaders() {
	perFragmentProgram = createProgram("per-fragment-lighting-fs", "per-fragment-lighting-vs");
}


var mvMatrix = mat4(0);
var mvMatrixStack = [];
var pMatrix = mat4(0);

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

function setMatrixUniforms() {
	gl.uniformMatrix4fv(currentProgram.pMatrixUniform, false, flatten(pMatrix));
	gl.uniformMatrix4fv(currentProgram.mvMatrixUniform, false, flatten(mvMatrix));

	var normalMatrix = mat3(0);
	normalMatrix = Mat4toInverseMat3(mvMatrix);
	normalMatrix = transpose(normalMatrix);
	gl.uniformMatrix3fv(currentProgram.nMatrixUniform, false, flatten(normalMatrix));
}


function degToRad(degrees) {
	return degrees * Math.PI / 180;
}


var cubeVertexPositionBuffer;
var cubeVertexNormalBuffer;
var cubeVertexIndexBuffer;

function initBuffers() {
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	vertices = [
		// Front face
		-1.0, 0.0,  1.0,
		 1.0, 0.0,  1.0,
		 1.0,  0.5,  1.0,
		-1.0,  0.5,  1.0,

		// Back face
		-1.0, 0.0, -1.0,
		-1.0,  0.5, -1.0,
		 1.0,  0.5, -1.0,
		 1.0, 0.0, -1.0,

		// Bottom face
		-1.0, 0.0, -1.0,
		 1.0, 0.0, -1.0,
		 1.0, 0.0,  1.0,
		-1.0, 0.0,  1.0,

		// Right face
		 1.0, 0.0, -1.0,
		 1.0,  0.5, -1.0,
		 1.0,  0.5,  1.0,
		 1.0, 0.0,  1.0,

		// Left face
		-1.0, 0.0, -1.0,
		-1.0, 0.0,  1.0,
		-1.0,  0.5,  1.0,
		-1.0,  0.5, -1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = vertices.length / cubeVertexPositionBuffer.itemSize;

	cubeVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	var vertexNormals = [
		// Front face
		 0.0,  0.0,  -1.0,
		 0.0,  0.0, -1.0,
		 0.0,  0.0,  -1.0,
		 0.0,  0.0,  -1.0,

		// Back face
		 0.0,  0.0, 1.0,
		 0.0,  0.0, 1.0,
		 0.0,  0.0, 1.0,
		 0.0,  0.0, 1.0,

		// Bottom face
		 0.0, 1.0,  0.0,
		 0.0, 1.0,  0.0,
		 0.0, 1.0,  0.0,
		 0.0, 1.0,  0.0,

		// Right face
		 -1.0,  0.0,  0.0,
		 -1.0,  0.0,  0.0,
		 -1.0,  0.0,  0.0,
		 -1.0,  0.0,  0.0,

		// Left face
		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0,
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	cubeVertexNormalBuffer.itemSize = 3;
	cubeVertexNormalBuffer.numItems = vertexNormals.length / cubeVertexNormalBuffer.itemSize;

	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	var cubeVertexIndices = [
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  //Bottom face
		12, 13, 14,   12, 14, 15, // Right face
		16, 17, 18,   16, 18, 19, // Left face
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = cubeVertexIndices.length;
}

var viewpoint_index = 0;
var eyex = 0.0, eyey = 0.75, eyez = 0.5;
var atx = 0.0, aty = 0.25, atz = -0.5;
var eye = [eyex, eyey, eyez];
var at = [atx, aty, atz];
var up = [0.0, 1.0, 0.0];
var lightAtX = 0.0;
var lightAtY = 0.25;
var lightAtZ = 0.0;
var lightEyeX = 0.0;
var lightEyeY = 0.75;
var lightEyeZ = 0.0;
var lightAngle = 10; //degrees


function viewLeft(){
	viewpoint_index--;
	if (viewpoint_index < 0){
		viewpoint_index = 7;
	}
	setViewpoint();
}

function viewRight(){
	viewpoint_index++;
	if (viewpoint_index > 7){
		viewpoint_index = 0;
	}
	setViewpoint();
}

function setViewpoint(){
	eyey = 0.75;
	aty = 0.25;
	switch(viewpoint_index){
		case 0:
			eyez = 0.5;
			eyex = 0.0;
			break;
		case 1:
			eyez = 0.5;
			eyex = 0.5;
			break;
		case 2:
			eyez = 0.0;
			eyex = 0.5;
			break;
		case 3:
			eyez = -0.5;
			eyex = 0.5;
			break;
		case 4:
			eyez = -0.5;
			eyex = 0.0;
			break;
		case 5:
			eyez = -0.5;
			eyex = -0.5;
			break;
		case 6:
			eyez = 0.0;
			eyex = -0.5;
			break;
		case 7:
			eyez = -0.5;
			eyex = -0.5;
			break;
	}
	atx = -eyex;
	atz = -eyez;
}

function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

	currentProgram = perFragmentProgram;
	gl.useProgram(currentProgram);

	mvMatrix = mat4();

	var eye = [eyex, eyey, eyez];
	var at = [atx, aty, atz];
	var up = [0.0, 1.0, 0.0];
	mvMatrix = lookAt(eye, at, up);

	var lighting = document.getElementById("lighting").checked;
	gl.uniform1i(currentProgram.useLightingUniform, lighting);
	if (lighting) {
		var lightAt = [lightAtX, lightAtY, lightAtZ];
		
		gl.uniform3f(
			currentProgram.ambientColorUniform,
			parseFloat(document.getElementById("ambientR").value),
			parseFloat(document.getElementById("ambientG").value),
			parseFloat(document.getElementById("ambientB").value)
		);

		gl.uniform3f(
			currentProgram.pointLightingAtUniform, lightAt[0], lightAt[1], lightAt[2]
		);
		
		gl.uniform3f(
			gl.getUniformLocation(currentProgram, "uPointLightingEye"),
			lightEyeX, lightEyeY, lightEyeZ
		);

		gl.uniform3f(
			currentProgram.pointLightingColorUniform,
			parseFloat(document.getElementById("pointR").value),
			parseFloat(document.getElementById("pointG").value),
			parseFloat(document.getElementById("pointB").value)
		);
	}

	mvPushMatrix();

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	mvPopMatrix();
}


var lastTime = 0;


function tick() {
	requestAnimFrame(tick);
	drawScene();
}


function webGLStart() {
	var canvas = document.getElementById("displaycanvas");
	initGL(canvas);
	initShaders();
	initBuffers();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	tick();
}

//matrix utility function
function vector3Matrix3Mult(v3, m3){
	var result = [0, 0, 0];
	for (var i = 0; i < 3; i++){
		for (var j = 0; j < 3; j++){
			result[i] += v3[j]*m3[j][i];
		}
	}
	return result;
}

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
