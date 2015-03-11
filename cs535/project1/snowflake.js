//
//CS535, Project #1, Jake Trower
//A program to generate the Koch Snowflake by iteratively replacing line segments with shorter segments

var gl;

//
//  Initialize our data for the Koch Snowflake
//
var points = [];
var new_points = [];
var angle = -60.0 * Math.PI / 180.0;
var timeout_ids = [];

// First, initialize the corners of our snowflake with three points.
//make sure it's an equilateral triangle
//REQUESTED GLOBAL VARIABLES
var triangle_points = [
	vec2(-0.8, -0.5),
	vec2(0.8, -0.5),
	vec2(0, 1)
];
var NumIterations = 8;

window.onload = function init(){
	animateSnowflake();
	document.getElementById("replay").onclick = function(){
		for (var i = 0; i < timeout_ids.length; i++){
			window.clearTimeout(timeout_ids[i]);
		}
		timeout_ids = [];
		points = [];
		new_points = [];
		angle = -60.0 * Math.PI / 180.0;

		document.getElementById("num_iterations").innerHTML = "Number of Iterations: 0";
		animateSnowflake();
	}
};

function animateSnowflake(){
	var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
	
	//
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	//add original triangle points to the array of points
	points = triangle_points.slice(0);
    for ( var i = 0; i < NumIterations; ++i ) {
		timeout_ids.push(window.setTimeout(function(k){animateFrame(program, k)}.bind(this, i+1), 500+i*500));
    }    
	
	// Load the data into the GPU
	var bufferId = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

	// Associate out shader variables with our data buffer

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	render();
};

function animateFrame(program, i){
	document.getElementById("num_iterations").innerHTML = "Number of Iterations: "+i;
	timeout_ids.splice(0, 1);

	var big_length = Math.sqrt(Math.pow(points[1][0]-points[0][0], 2) + Math.pow(points[1][1]-points[0][1], 2));
	var length = big_length / 3.0;
	for (var j = 0; j < points.length; j++){
		//Get the two points of an existing line segment to split
		var p1 = points[j];
		var p2;
		//if we're on the last point, we need to connect it
		//back to the first
		if (j == points.length-1)
			p2 = points[0];
		else p2 = points[j+1];
		//calculate the angle the extending point needs to extend by
		var a = Math.atan2(p2[1]-p1[1], p2[0]-p1[0]);
		a = a + angle;
		
		//add the first point to the new points array
		new_points.push(p1);
		//get point that is 1/3rd between two points
		var pthird1 = add(scale((2.0/3.0), p1), scale((1.0/3.0), p2));
		new_points.push(pthird1);
		
		//get point that is 2/3rd between p1 and p2
		var pthird2 = add(scale((1.0/3.0), p1), scale((2.0/3.0), p2));
		
		//Now, let's calculate the middle extending point
		var pmidx = pthird1[0] + (length * Math.cos(a));
		var pmidy = pthird1[1] + (length * Math.sin(a));
		var pmid = vec2(pmidx, pmidy);
		
		//finally, add the middle and last point of the new flake extension
		new_points.push(pmid);
		new_points.push(pthird2);
	}
	//reassign the points to be the calculated new points
	points = new_points.splice(0);
	
	// Load the data into the GPU
	var bufferId = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

	// Associate out shader variables with our data buffer

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	render();
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINE_LOOP, 0, points.length );
}
