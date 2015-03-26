//
// CS535, Project #5, Jake Trower
//
// file to initialize webgl, and set up the buffers/arrays to handle the vertices and textures of the TV, TV stand, and carpet
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
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
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
	quad( 1, 0, 3, 2, vertices, pointsArray, colorsArray, texCoordsArray);
    quad( 2, 3, 7, 6, vertices, pointsArray, colorsArray, texCoordsArray);
    quad( 3, 0, 4, 7, vertices, pointsArray, colorsArray, texCoordsArray);
    quad( 6, 5, 1, 2, vertices, pointsArray, colorsArray, texCoordsArray);
    quad( 4, 5, 6, 7, vertices, pointsArray, colorsArray, texCoordsArray);
    quad( 5, 4, 0, 1, vertices, pointsArray, colorsArray, texCoordsArray);
}

var quad = function(a, b, c, d, vertices, pointsArray, colorsArray, texCoordsArray) {
     pointsArray.push(vertices[a]);
     colorsArray.push(colors['black']);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     colorsArray.push(colors['black']);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     colorsArray.push(colors['black']);
     texCoordsArray.push(texCoord[2]);
   
     pointsArray.push(vertices[a]);
     colorsArray.push(colors['black']);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[c]);
     colorsArray.push(colors['black']);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     colorsArray.push(colors['black']);
     texCoordsArray.push(texCoord[3]);
}

var BG = function(){
}
BG.initialize = function(){
	//INITIALIZE THE VERTICES OF THE TV STAND
	BG.stand = {};
	BG.stand.pointsArray = [];
	BG.stand.colorsArray = [];
	BG.stand.texCoordsArray = [];
	autoQuad(-1.0, 1.0, 0.4, 0.5, 1.0, -1.0, BG.stand.pointsArray, BG.stand.colorsArray, BG.stand.texCoordsArray);
	
	//NOW initialize the vertices for each of the legs
	//front left leg
	autoQuad(-0.9, -0.8, 0.0, 0.4, 0.9, 0.8, BG.stand.pointsArray, BG.stand.colorsArray, BG.stand.texCoordsArray);
	//front right leg
	autoQuad(0.8, 0.9, 0.0, 0.4, 0.9, 0.8, BG.stand.pointsArray, BG.stand.colorsArray, BG.stand.texCoordsArray);
	//back left leg
	autoQuad(-0.9, -0.8, 0.0, 0.4, -0.8, -0.9, BG.stand.pointsArray, BG.stand.colorsArray, BG.stand.texCoordsArray);
	//back right leg
	autoQuad(0.8, 0.9, 0.0, 0.4, -0.8, -0.9, BG.stand.pointsArray, BG.stand.colorsArray, BG.stand.texCoordsArray);
	
    BG.stand.numVertices  = BG.stand.pointsArray.length;
	//INIT TEXTURE OF TV STAND
	BG.stand.texture = configureTexture(document.getElementById("woodTexImage"));
	
	/////////////////////////////////////////////
	//INITIALIZE THE VERTICES OF THE CARPET
	BG.carp = {};
	BG.carp.pointsArray = [];
	BG.carp.colorsArray = [];
	BG.carp.texCoordsArray = [];
	autoQuad(-2.0, 2.0, -0.01, 0.0, 2.0, -2.0, BG.carp.pointsArray, BG.carp.colorsArray, BG.carp.texCoordsArray);
	autoQuad(-4.0, -2.0, -0.01, 0.0, 2.0, -2.0, BG.carp.pointsArray, BG.carp.colorsArray, BG.carp.texCoordsArray);
	autoQuad(2.0, 4.0, -0.01, 0.0, 2.0, -2.0, BG.carp.pointsArray, BG.carp.colorsArray, BG.carp.texCoordsArray);
	autoQuad(-2.0, 2.0, -0.01, 0.0, 4.0, 2.0, BG.carp.pointsArray, BG.carp.colorsArray, BG.carp.texCoordsArray);
	autoQuad(-2.0, 2.0, -0.01, 0.0, -2.0, -4.0, BG.carp.pointsArray, BG.carp.colorsArray, BG.carp.texCoordsArray);
	autoQuad(-4.0, -2.0, -0.01, 0.0, -2.0, -4.0, BG.carp.pointsArray, BG.carp.colorsArray, BG.carp.texCoordsArray);
	BG.carp.numVertices = BG.carp.pointsArray.length;
	//INIT TEXTURE OF THE CARPET
	BG.carp.texture = configureTexture(document.getElementById("carpetTexImage"));
}

BG.render = function(){
	BG.renderStand();
	BG.renderCarpet();
}

BG.renderStand = function(){	
	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BG.stand.colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BG.stand.pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, BG.stand.texture);
	
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BG.stand.texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	
    gl.drawArrays( gl.TRIANGLES, 0, BG.stand.numVertices );
};

BG.renderCarpet = function(){
	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BG.carp.colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BG.carp.pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, BG.carp.texture);
	
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BG.carp.texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	
    gl.drawArrays( gl.TRIANGLES, 0, BG.carp.numVertices );
};

var TV = function(){};
TV.initialize = function(){
    var vertices = [
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
	TV.pointsArray = [];
	TV.colorsArray = [];
	TV.texCoordsArray = [];
    quad( 1, 0, 3, 2, vertices, TV.pointsArray, TV.colorsArray, TV.texCoordsArray);
    quad( 2, 3, 7, 6, vertices, TV.pointsArray, TV.colorsArray, TV.texCoordsArray);
    quad( 3, 0, 4, 7, vertices, TV.pointsArray, TV.colorsArray, TV.texCoordsArray);
    quad( 6, 5, 1, 2, vertices, TV.pointsArray, TV.colorsArray, TV.texCoordsArray);
    quad( 4, 5, 6, 7, vertices, TV.pointsArray, TV.colorsArray, TV.texCoordsArray);
    quad( 5, 4, 0, 1, vertices, TV.pointsArray, TV.colorsArray, TV.texCoordsArray);
    TV.numVertices  = TV.pointsArray.length;
	
	var vertices = [
		vec4(-0.4, 0.6, 0.501, 1.0),
		vec4(-0.4, 1.4, 0.501, 1.0),
		vec4(0.4, 1.4, 0.501, 1.0),
		vec4(0.4, 0.6, 0.501, 1.0)
	];
	TV.face = {};
	TV.face.pointsArray = [];
	TV.face.colorsArray = [];
	TV.face.texCoordsArray = [];
	quad(1, 0, 3, 2, vertices, TV.face.pointsArray, TV.face.colorsArray, TV.face.texCoordsArray);
	TV.face.numVertices = TV.face.pointsArray.length;
	
	//initialize animation
	TV.is_on = false;
	TV.is_playing = true;
	TV.frame_index = 0;
	TV.max_frames = [];
	
	TV.nextFrameCounter = 0;
	TV.nextFrameLimit = 5;
    
    // Initialize a texture
	TV.channelIndex = 0;
	TV.face.textures = [];
	TV.face.textures[0] = [];
	for (var i = 0; i < 36; i++){
		if ((i+1) % 3 == 0) continue;
		var zero = (i < 10) ? '0':'';
		var img_name = "channel1/frame_0"+zero+i+".gif";
		
		var image = new Image();
		image.onload = function(image){
			TV.face.textures[0].push(configureTexture(image));
			TV.max_frames[0] = TV.face.textures[0].length;
		}.bind(null, image);
		image.src = img_name;
	}
	TV.face.textureOff = configureTexture(document.getElementById("tvOffTexImage"));
    TV.texture = configureTexture(document.getElementById("tvTexImage"));
}

TV.changeChannel = function(){
	TV.frame_index = 0;
	TV.channelIndex++;
	if (TV.channelIndex >= TV.face.textures.length)
		TV.channelIndex = 0;
}

TV.update = function(){
	if (TV.is_playing){
		TV.nextFrameCounter++;
		if (TV.nextFrameCounter >= TV.nextFrameLimit){
			TV.nextFrameCounter = 0;
			TV.nextFrame();
		}
	}
}
TV.nextFrame = function(){
	TV.frame_index++;
	if (TV.frame_index >= TV.max_frames[TV.channelIndex])
		TV.frame_index = 0;
}
TV.prevFrame = function(){
	TV.frame_index--;
	if (TV.frame_index < 0)
		TV.frame_index = TV.max_frames[TV.channelIndex]-1;
}

TV.render = function(){
	gl.uniform1i(gl.getUniformLocation(program, "TV_is_on"), TV.is_on);
	
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
    
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, TV.texture);
	
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	
    gl.drawArrays( gl.TRIANGLES, 0, TV.numVertices );
	
	TV.renderFrontFace();
}

TV.renderFrontFace = function(){
	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.face.colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.face.pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
	gl.activeTexture(gl.TEXTURE0);
	if (TV.is_on){
		gl.bindTexture(gl.TEXTURE_2D, TV.face.textures[TV.channelIndex][TV.frame_index]);
	}else{
		gl.bindTexture(gl.TEXTURE_2D, TV.face.textureOff);
	}
	
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(TV.face.texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	
    gl.drawArrays( gl.TRIANGLES, 0, TV.face.numVertices );
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
	BG.initialize();
    
    //get matrix uniform variables
    pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	  mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
    
    document.getElementById("OnOffButton").onclick = function(){
      TV.is_on = !TV.is_on;
	  if (animate_camera){
		  if (TV.is_on) StartAnimateToTV();
		  else StartAnimateToRoom();
	  }
    };
	document.getElementById("PausePlayButton").onclick = function(){
		TV.is_playing = !TV.is_playing;
	};
	document.getElementById("PrevFrameButton").onclick = function(){
		if (!TV.is_playing){
			TV.prevFrame();
		}
	};
	document.getElementById("NextFrameButton").onclick = function(){
		if (!TV.is_playing){
			TV.nextFrame();
		}
	};
	document.getElementById("disableCamera").onchange = function(){
		animate_camera = !this.checked;
		if (!animate_camera){
			ResetToRoomView();
		}
	}
       
    render();
 
}

var animate_camera = true;
var animating = false;
var going_to = null;
var eyex = 2.0;
var eyey = 2.0;
var eyez = 4.0;
var atx = 0.0;
var aty = 1.0;
var atz = 0.0;

function ResetToRoomView(){
	animating = false;
	eyex = 2.0;
	eyey = 2.0;
	eyez = 4.0;
	atx = 0.0;
	aty = 1.0;
	atz = 0.0;
}
function ResetToTVView(){
	animating = false;
	eyex = 0.0;
	eyey = 1.0;
	eyez = 2.0;
	atx = 0.0;
	aty = 1.0;
	atz = 0.0;
}
function StartAnimateToTV(){
	if (!animate_camera) return;
//	ResetToRoomView();
	animating = true;
	going_to = "tv";
}
function StartAnimateToRoom(){
	if (!animate_camera) return;
//	ResetToTVView();
	animating = true;
	going_to = "room";
}
function Animate(){
	if (!animate_camera || !animating){
		return;
	}
	var change = 0.12;
	if (going_to === "tv"){
		if (eyex > 0.0){
			eyex -= change;
			if (eyex < 0.0) eyex = 0.0;
		}
		if (eyey > 1.0){
			eyey -= change/2;
			if (eyey < 1.0) eyey = 1.0;
		}
		if (eyez > 2.0){
			eyez -= change;
			if (eyez < 2.0) eyez = 2.0;
		}
		if (eyex === 0.0 && eyey === 1.0 && eyez === 2.0) animating = false;
	}else if (going_to === "room"){
		if (eyex < 2.0){
			eyex += change;
			if (eyex > 2.0) eyex = 2.0;
		}
		if (eyey < 2.0){
			eyey += change/2;
			if (eyey > 2.0) eyey = 2.0;
		}
		if (eyez < 4.0){
			eyez += change;
			if (eyez > 4.0) eyez = 4.0;
		}
		if (eyex === 2.0 && eyey === 2.0 && eyez === 4.0) animating = false;
	}
}

var render = function(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);
  
  	var eye = [eyex, eyey, eyez];
  	var at = [atx, aty, atz];
  	var up = [0.0, 1.0, 0.0];
  	mvMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(mvMatrixUniform, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(pMatrixUniform, false, flatten(pMatrix));
    
	Animate();
	TV.update();
    TV.render();
	BG.render();
    requestAnimFrame(render);
}