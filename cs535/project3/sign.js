//
// CS535, Project #3, Jake Trower
// JAVASCRIPT that creates a 3d font, and a rectangular prism affixed to a cylinder
//the font is then imposed on the rectangular prism to display gas prices!!!
//
var canvas;
var gl;
var program;
//initializing variables to handle rectangular prism shape/color
var rec_cBuffer;
var rec_vBuffer;
var rec_numVertices  = 36;
var rec_pointsArray = [];
var rec_colorsArray = [];
var rec_vertices = [
    vec4(-0.75, 0.0,  0.2, 1.0),
    vec4(-0.75,  1.0,  0.2, 1.0),
    vec4(0.75,  1.0,  0.2, 1.0),
    vec4(0.75, 0.0,  0.2, 1.0),
    vec4(-0.75, 0.0, 0.0, 1.0),
    vec4(-0.75,  1.0, 0.0, 1.0),
    vec4(0.75,  1.0, 0.0, 1.0),
    vec4( 0.75, 0.0, 0.0, 1.0) 
];
var rec_vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
	vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
];

//functions necessary for generating cylinders
function degreesToRad(degrees) {
	return degrees * Math.PI / 180;
}

//used to generate the circle coordinates for the sign post
function generateCircleCoordinates(c, r, y, num_points){
	var vertices = [];
	var step_size = 360 / num_points;
	for (var d = 0; d <= 360 - step_size; d += step_size){
		vertices.push(
			vec4(
				(Math.sin(degreesToRad(d)) * r) + c[0],
				y,
				(Math.cos(degreesToRad(d)) * r) + c[1],
				1.0
			)
		);
	}
	return vertices;
}

//initializing variables to handle cylindrical post shape/colour
var cyl_cBuffer;
var cyl_vBuffer;
var cyl_pointsArray = [];
var cyl_colorsArray = [];
var cyl_height = 1.0;
var cyl_vertices = [];
var num_points = 8;
var c = [0.0, 0.1];	//using x = 0, z = 0 as the center of the cylinder
cyl_vertices = cyl_vertices.concat(generateCircleCoordinates(c, 0.1, 0.0, num_points));
cyl_vertices = cyl_vertices.concat(generateCircleCoordinates(c, 0.1, -cyl_height, num_points));
var cyl_vertexColor = vec4(0.0, 1.0, 1.0, 1.0); //cyan

var cyl_numVertices = 6*num_points;

//will be used to hold the text string representations
var text_objects = [];

var gas_price_regular = 197;
var gas_price_plus = 219;
var gas_price_supreme = 235;

var near = 0.98;
var far = 9.8;
var radius = 4.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function quad(a, b, c, d) {
     rec_pointsArray.push(rec_vertices[a]); 
     rec_colorsArray.push(rec_vertexColors[a]); 
     rec_pointsArray.push(rec_vertices[b]); 
     rec_colorsArray.push(rec_vertexColors[a]); 
     rec_pointsArray.push(rec_vertices[c]); 
     rec_colorsArray.push(rec_vertexColors[a]);     
     rec_pointsArray.push(rec_vertices[a]); 
     rec_colorsArray.push(rec_vertexColors[a]); 
     rec_pointsArray.push(rec_vertices[c]); 
     rec_colorsArray.push(rec_vertexColors[a]); 
     rec_pointsArray.push(rec_vertices[d]); 
     rec_colorsArray.push(rec_vertexColors[a]);  
}


function colorRectangle()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad_cyl_generic(a, b, c, d, arr1, arr2, col_arr, color){
	arr1.push(arr2[a]);
	if (col_arr !== null) col_arr.push(color);
	arr1.push(arr2[b]);
	if (col_arr !== null) col_arr.push(color);
	arr1.push(arr2[c]);
	if (col_arr !== null) col_arr.push(color);
	
	arr1.push(arr2[b]);
	if (col_arr !== null) col_arr.push(color);
	arr1.push(arr2[c]);
	if (col_arr !== null) col_arr.push(color);
	arr1.push(arr2[d]);
	if (col_arr !== null) col_arr.push(color);
}

function quad_cyl(a, b, c, d) {
	quad_cyl_generic(a, b, c, d, 
		cyl_pointsArray, cyl_vertices, cyl_colorsArray, cyl_vertexColor);
}


function colorCylinder()
{
	for (var i = 0; i < num_points; i++){
		if (i < num_points-1){
			quad_cyl(i, i+1, i+num_points, i+1+num_points);
		}else{
			quad_cyl(i, 0, i+num_points, num_points);
		}
	}
}

//HERE WILL BE THE DECLARATION OF OUR TEXT OBJECT WHICH WE WILL USE TO HOLD INFORMATION FOR TEXT AND RENDER IT AS CYLINDERS USING THE SIXTEEN SEGMENT DISPLAY
function Text(text, x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
	this.cyl_length = 0.05;
	this.text_width = this.cyl_length;
	this.gap_width = 0.04;
	
	this.cylinder_vertices_array = [];
	this.cylinder_buffers_array = [];
	this.ChangeText(text);
}

Text.prototype.ChangeText = function(text){
	this.text_string = text;
	this.characters = [];
	
	//Now iterate through each letter/digit, and create a corresponding set of vertex arrays to represent the cylinders representing the character
	for (var i = 0; i < text.length; i++){
		//character is an array of objects
		//these objects contain both an array of vertex buffers and an array of vertices, both of which are used to contain information and render each cylinder that makes up the character representation
		var character = this.GenerateCharacterVertices(text[i], this.x+(i*(this.text_width+this.gap_width)), this.y);
		
		this.characters.push(character);
	}
}

Text.prototype.Render = function(){
	//Render will iterate through all of the character objects, and render each of them!!!
	for (var i = 0; i < this.characters.length; i++){
		var character = this.characters[i];
		//iterate through all the cylinders in the character, and render those!
		for (var j = 0; j < character.length; j++){
			var cylinder = character[j];
			//bind the rectangle frame's vertex buffer to tell gpu to use it
			gl.bindBuffer(gl.ARRAY_BUFFER, cylinder.buffer);
			var vPosition = gl.getAttribLocation( program, "vPosition" );
			gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
			//bind rectangle's color buffer to tell gpu to use it
			//gl.bindBuffer(gl.ARRAY_BUFFER, rec_cBuffer);
			//var vColor = gl.getAttribLocation( program, "vColor" );
			//gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
			//draw the rectangular frame
			gl.drawArrays( gl.TRIANGLES, 0, cylinder.vertices.length);
		}
	}
}

Text.prototype.GenerateCharacterVertices = function(character, o_x, o_y){
	var array_vertices_arrays = [];
	var r = 0.01;
	
	//setting up some variables specifying coordinates for various parts of the character
	var y1 = o_y;
	var y2 = y1-this.cyl_length-(this.cyl_length/5);
	var y3 = y2-this.cyl_length-(this.cyl_length/5);
	var w = this.cyl_length;
	var h = this.cyl_length;
	
	switch (character){
		//THE NUMBERS!!!
		case '1':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //The top right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			break;
		case '2':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case '3':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //the bottom right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case '4':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //The top right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			break;
		case '5':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //the upper left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //the bottom right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case '6':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case '7':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //The top right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			break;
		case '8':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case '9':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //The top right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			break;
		case '0':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		//THE NECESSARY LETTERS (only going to do for "REGULAR", "PLUS", and "SUPREME"
		case 'A': case 'a':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			break;
		case 'E': case 'e':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case 'G': case 'g':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x+w/2, w/2, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case 'L': case 'l':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case 'M': case 'm':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w/2, this.z), r, y1, h, num_points)); //The top middle vertical
			break;
		case 'P': case 'p':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			break;
		case 'R': case 'r':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w/2, this.z), r, y2, h, num_points, vec2(o_x+w, this.z))); //The bottom right diagonal
			break;
		case 'S': case 's':
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y1, this.z), r, o_x, w, num_points)); //the top horizontal
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y2, this.z), r, o_x, w, num_points)); // the middle horizontal
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		case 'U': case 'u':
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y1, h, num_points)); //the upper right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y1, h, num_points)); //The top left vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x+w, this.z), r, y2, h, num_points)); //The bottom right vertical
			array_vertices_arrays.push(this.GenerateVerticalCylinder(vec2(o_x, this.z), r, y2, h, num_points)); //the bottom left vertical
			array_vertices_arrays.push(this.GenerateHorizontalCylinder(vec2(y3, this.z), r, o_x, w, num_points)); //the bottom horizontal
			break;
		default: break;
	}	
	
	
	return this.GenerateCylinders(array_vertices_arrays);
}

//use this function to convert the generated vertices of cylinders into the correct point organization for webgl to render
Text.prototype.GenerateCylinders = function(array_vertices_arrays){
	var cylinders = [];
	var array_points_arrays = [];
	
	//NOW YOU NEED TO PUT THE VERTICES INTO THE ARRAY POINTS ARRAY SO THAT THEY WILL RENDER CORRECTLY
	for (var i = 0; i < array_vertices_arrays.length; i++){
		var array_vertices = array_vertices_arrays[i];
		var array_points = [];
		for (var j = 0; j < num_points; j++){
			if (j < num_points-1){
				//use the same function used for making the post
				quad_cyl_generic(j, j+1, j+num_points, j+1+num_points,
					array_points, array_vertices, null, null);
			}else{
				quad_cyl_generic(j, 0, j+num_points, num_points,
					array_points, array_vertices, null, null);
			}
		}
		array_points_arrays.push(array_points);
	}
	//Now, need to iterate through the array representing the arrays of vertices for each cylinder representing the character, and create a corresponding buffer for each and return this array of objects
	for (var i = 0; i < array_points_arrays.length; i++){
		var cylinder = {};
		cylinder['vertices'] = array_points_arrays[i];
		//initialize the vertex buffer in webgl
		cylinder['buffer'] = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, cylinder.buffer);
		gl.bufferData( gl.ARRAY_BUFFER, flatten(cylinder.vertices), gl.STATIC_DRAW );
		
		cylinders.push(cylinder);
	}
	return cylinders;
}

Text.prototype.GenerateVerticalCylinder = function(c, r, y, height, num_points, c2){
	var vertices = [];
	var step_size = 360 / num_points;
	//Generate the top face coordinates of the cylinder
	for (var d = 0; d <= 360 - step_size; d += step_size){
		vertices.push(
			vec4(
				(Math.sin(degreesToRad(d)) * r) + c[0],
				y,
				(Math.cos(degreesToRad(d)) * r) + c[1],
				1.0
			)
		);
	}
	//Generate the bottom face coordinates of the cylinder
	for (var d = 0; d <= 360 - step_size; d += step_size){
		if (c2 === undefined){
			vertices.push(
				vec4(
					(Math.sin(degreesToRad(d)) * r) + c[0],
					y-height,
					(Math.cos(degreesToRad(d)) * r) + c[1],
					1.0
				)
			);
		}else{
			vertices.push(
				vec4(
					(Math.sin(degreesToRad(d)) * r) + c2[0],
					y-height,
					(Math.cos(degreesToRad(d)) * r) + c2[1],
					1.0
				)
			);
		}
	}
	return vertices;
}

Text.prototype.GenerateHorizontalCylinder = function(c, r, x, width, num_points){
	var vertices = [];
	var step_size = 360 / num_points;
	//Generate left face coordinates of the cylinder
	for (var d = 0; d <= 360 - step_size; d += step_size){
		vertices.push(
			vec4(
				x,
				(Math.sin(degreesToRad(d))*r) + c[0],
				(Math.cos(degreesToRad(d))*r) + c[1],
				1.0
			)
		);
	}
	//Generate RIGHT face coordinates of the cylinder
	for (var d = 0; d <= 360 - step_size; d += step_size){
		vertices.push(
			vec4(
				x+width,
				(Math.sin(degreesToRad(d))*r) + c[0],
				(Math.cos(degreesToRad(d))*r) + c[1],
				1.0
			)
		);
	}
	return vertices;
}

function ChangeGasPrice(gas_type, amount){
	switch (gas_type){
		case "REGULAR":
			gas_price_regular = gas_price_regular + amount;
			if (gas_price_regular > 999) gas_price_regular = 999;
			if (gas_price_regular < 1) gas_price_regular = 1;
			
			text = gas_price_regular + "";
			while (text.length < 3) text = "0" + text;
			//Regular is stored in the 0th index
			text_objects[0].ChangeText(text);
			break;
		case "PLUS":
			gas_price_plus = gas_price_plus + amount;
			if (gas_price_plus > 999) gas_price_plus = 999;
			if (gas_price_plus < 1) gas_price_plus = 1;
			
			text = gas_price_plus + "";
			while (text.length < 3) text = "0" + text;
			//Plus is stored in the 1st index
			text_objects[1].ChangeText(text);
			break;
		case "SUPREME":
			gas_price_supreme = gas_price_supreme + amount;
			if (gas_price_supreme > 999) gas_price_supreme = 999;
			if (gas_price_supreme < 1) gas_price_supreme = 1;
			
			text = gas_price_supreme + "";
			while (text.length < 3) text = "0" + text;
			//Supreme is stored in the 2nd index
			text_objects[2].ChangeText(text);
			break;
		default: break;
	}
}


//ACTUALLY SETTING UP WEBGL AND RENDERING IT BELOW
window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    aspect =  canvas.width/canvas.height;
    
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	//SET UP RECTANGLE
    colorRectangle();
	//rectangle color buffer
    rec_cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, rec_cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(rec_colorsArray), gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor);
	//rectangle vertex buffer
    rec_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, rec_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(rec_pointsArray), gl.STATIC_DRAW );
	var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	//SET UP CYLINDRICAL POST
	colorCylinder();
	//cylinder color buffer
	cyl_cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cyl_cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cyl_colorsArray), gl.STATIC_DRAW);
	vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	//cylinder vertex buffer
	cyl_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cyl_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cyl_pointsArray), gl.STATIC_DRAW );
	var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	//SET UP THE TEXT OBJECTS
	text_objects = [
		new Text(gas_price_regular+"", 0.3, 0.8, 0.2),	//regular gas price		XXX
		new Text(gas_price_plus+"", 0.3, 0.6, 0.2), 	//plus gas price		XXX
		new Text(gas_price_supreme+"", 0.3, 0.4, 0.2),	//supreme gas price 	XXX
		
		new Text("REGULAR", -0.6, 0.8, 0.2),
		new Text("PLUS", -0.6, 0.6, 0.2),
		new Text("SUPREME", -0.6, 0.4, 0.2)
	];
  
 
    modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );
	
// buttons for manipulating gas prices
	document.getElementById("up_price").onclick = function(){
		var e = document.getElementById("gas_type");
		var gas_type = e.options[e.selectedIndex].value;
		ChangeGasPrice(gas_type, 1);
	};
	
	document.getElementById("down_price").onclick = function(){
		var e = document.getElementById("gas_type");
		var gas_type = e.options[e.selectedIndex].value;
		ChangeGasPrice(gas_type, -1);
	};

// buttons for viewing parameters
    document.getElementById("increase_theta").onclick = function(){changeTheta(1);};
    document.getElementById("decrease_theta").onclick = function(){changeTheta(-1);};
    document.getElementById("increase_phi").onclick = function(){changePhi(1);};
    document.getElementById("decrease_phi").onclick = function(){changePhi(-1);};
	
	document.getElementById("rotate_theta_fast").onclick = function(){ 
		if (Math.abs(rotate_theta) < 0.0001)
			rotate_theta = 0.1;
		else rotate_theta += 0.1;
	}
	document.getElementById("rotate_theta_slow").onclick = function(){ 
		if (Math.abs(rotate_theta) < 0.0001)
			rotate_theta = -0.1;
		else rotate_theta -= 0.1;
	}
	document.getElementById("rotate_theta_stop").onclick = function(){ rotate_theta = 0; }
	
	//same as above but for phi
	document.getElementById("rotate_phi_fast").onclick = function(){ 
		if (Math.abs(rotate_phi) < 0.0001)
			rotate_phi = 0.1;
		else rotate_phi += 0.1;
	}
	document.getElementById("rotate_phi_slow").onclick = function(){ 
		if (Math.abs(rotate_phi) < 0.0001)
			rotate_phi = -0.1;
		else rotate_phi -= 0.1;
	}
	document.getElementById("rotate_phi_stop").onclick = function(){ rotate_phi = 0; }
       
    render(); 
}

var rotate_theta = 0;
var rotate_phi = 0;
function changeTheta(vv){ theta += dr*vv; }
function changePhi(vv){ phi += dr*vv; }


var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//Use these plus the toggle rotation buttons to change phi and theta automatically
	changeTheta(rotate_theta);
	changePhi(rotate_phi);
            
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    mvMatrix = lookAt(eye, at , up);
    pMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	//bind the rectangle frame's vertex buffer to tell gpu to use it
	gl.bindBuffer(gl.ARRAY_BUFFER, rec_vBuffer);
	var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	//bind rectangle's color buffer to tell gpu to use it
	gl.bindBuffer(gl.ARRAY_BUFFER, rec_cBuffer);
	var vColor = gl.getAttribLocation( program, "vColor" );
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	//draw the rectangular frame
    gl.drawArrays( gl.TRIANGLES, 0, rec_numVertices );
	
	//bind cylinder's vertex buffer to tell gpu to use it
	gl.bindBuffer(gl.ARRAY_BUFFER, cyl_vBuffer);
	vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	//bind cylinder's color buffer to tell gpu to use it
	gl.bindBuffer(gl.ARRAY_BUFFER, cyl_cBuffer);
	vColor = gl.getAttribLocation( program, "vColor" );
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	//draw the cylinder
    gl.drawArrays( gl.TRIANGLES, 0, cyl_numVertices );
	
	//NOW render the other cylinders representing the text
	for (var i = 0; i < text_objects.length; i++){
		text_objects[i].Render();
	}
	
	//don't have to rebind a color buffer, as we'll just use the same color as the post :)
	
    requestAnimFrame(render);
}