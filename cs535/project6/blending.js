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

function configureTexture( image, alpha_color, inverse_alpha) {
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
	//quad( 1, 0, 3, 2, vertices, pointsArray, colorsArray, texCoordsArray);
    //quad( 2, 3, 7, 6, vertices, pointsArray, colorsArray, texCoordsArray);
    quad( 3, 0, 4, 7, vertices, pointsArray, colorsArray, texCoordsArray);
    //quad( 6, 5, 1, 2, vertices, pointsArray, colorsArray, texCoordsArray);
    //quad( 4, 5, 6, 7, vertices, pointsArray, colorsArray, texCoordsArray);
    //quad( 5, 4, 0, 1, vertices, pointsArray, colorsArray, texCoordsArray);
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

var GAME_OBJECT = function(){
}
//helper function to quickly reassign vertices to the points array of an object
GAME_OBJECT.prototype.requad = function(){	
	this.pointsArray = [];
	this.colorsArray = [];
	this.texCoordsArray = [];
	autoQuad(this.x1, this.x2, this.y1, this.y2, this.z1, this.z2, this.pointsArray, this.colorsArray, this.texCoordsArray);
}
GAME_OBJECT.prototype.initialize = function(y, img_id, alpha_color){
	//INITIALIZE THE VERTICES
	this.x1 = -1.0, this.x2 = 1.0;
	this.y1 = y;
	this.y2 = y;
	this.z1 = 1.0;
	this.z2 = -1.0;
	this.requad();
	
    this.numVertices  = this.pointsArray.length;
	//INIT TEXTURE
	if (alpha_color === undefined || alpha_color === null){
		this.texture = configureTexture(document.getElementById(img_id), alpha_color);
		this.textures = [];
		this.texture_index = null;
	}
	else{
		var image = document.getElementById(img_id);
		
		//make the partitions
		//in order to add alpha value to bitmap image,
		//first make a canvas to draw the image onto,
		//grab the pixels, and set the alpha value of the pixels manually
		var canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 512;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
		//partition 1: everything visible except alpha color
		var data = ctx.getImageData(0, 0, image.width, image.height);
		//partition 2: only alpha color is visible
		var data2 = ctx.getImageData(0, 0, image.width, image.height);
		//NOW SET THE ALPHA COLOR!!!!
		for (var i = 0; i < data.data.length; i+=4){
			if (data.data[i+0] === alpha_color[0] &&	//partition 1: get rid of alpha color
				data.data[i+1] === alpha_color[1] &&	//only if the R G B values of the pixel
				data.data[i+2] === alpha_color[2]){		//match the RGB values of the alpha color (white)
					data.data[i+3] = 0;					//if they do, make it transparent!
					data2.data[i+3] = 255;				//for partition 2, make it nontransparent
			}else{
					data.data[i+3] = 255;				//every other color can be visible
					data2.data[i+3] = 0;				//opposite for partition 2
					
			}
		}
		
		this.textures = [];
		image = new Image();
		image.onload = function(image){
			this.textures[0] = configureTexture(image);
			this.texture_index = 0;
			this.texture = this.textures[this.texture_index];
			
			image = new Image();
			image.onload = function(image){
				this.textures[1] = configureTexture(image);
			}.bind(this, image);
			ctx.putImageData(data2, 0, 0);
			image.src = canvas.toDataURL();
		}.bind(this, image);
		ctx.putImageData(data, 0, 0, 0, 0, 512, 512);
		image.src = canvas.toDataURL();		
	}
}

GAME_OBJECT.prototype.render = function(){
	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	
    gl.drawArrays( gl.TRIANGLES, 0, this.numVertices );
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
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0 );
    
	//disabling so i can easily put one image on top of another
	//just with drawing order
    gl.disable(gl.DEPTH_TEST);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	game_obj = new GAME_OBJECT();
	game_obj.initialize(1.0, "alImg", [255, 255, 255]);
	
	bg_obj = new GAME_OBJECT();
	bg_obj.initialize(1.0, "bgImg");
    
    //get matrix uniform variables
    pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
	
	document.getElementById("partitionButton").onclick = function(){
		game_obj.texture_index++;
		if (game_obj.texture_index >= game_obj.textures.length){
			game_obj.texture_index = 0;
		}
		game_obj.texture = game_obj.textures[game_obj.texture_index];
	}
	
	document.getElementById("leftButton").onclick = function(){
		game_obj.z1 -= 0.1;
		game_obj.z2 -= 0.1;
		game_obj.requad();
	}
	document.getElementById("rightButton").onclick = function(){
		game_obj.z1 += 0.1;
		game_obj.z2 += 0.1;
		game_obj.requad();
	}
	document.getElementById("upButton").onclick = function(){
		game_obj.x1 += 0.1;
		game_obj.x2 += 0.1;
		game_obj.requad();
	}
	document.getElementById("downButton").onclick = function(){
		game_obj.x1 -= 0.1;
		game_obj.x2 -= 0.1;
		game_obj.requad();
	}
       
    render();
 
}
var eyex = -0.1;
var eyey = 3.5;
var eyez = 0.0;
var atx = 0.0;
var aty = 0.0;
var atz = 0.0;

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
	
	bg_obj.render();
	game_obj.render();
  
    requestAnimFrame(render);
}