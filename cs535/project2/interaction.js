//
// CS535, Project #2, Jake Trower
// javascript code that initializes webgl and adds event handlers to do the following:
// pressing down specific keys (RGBCYM) sets the cIndex to the correct index of the colors array, and sets the keydown variable to true
// releasing a key will set keydown to false and reset the cIndex if appropriate
// pressing the left mouse button will either create a new circle/dot (if the appropriate keyboard key is down
// otherwise it will attempt to select a circle for movement by seeing which circle the mouse coordinates are withinCircle
// pressing right mouse button down will select a circle similarly for deletion
// moving the mouse when a circle is selected for movement will move it
// releasing the right mouse button will delete a circle if it positioned over the same circle it originally was pressed down upon
//
var canvas;
var gl;


var num_points = 32;
var maxNumTriangles = 200;  
var maxNumVertices  = 3 * maxNumTriangles;
var index = 0;

var t1, t2, t3, t4;

var cIndex = 0;
var keydown = false;

var circleIndex_to_be_moved = -1;
var original_x = 0;
var original_y = 0;
var circleIndex_to_be_deleted = -1;

var colors = [
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var circles = [
];

function withinCircle(x, y, circle){
	//use geometry to find out if the distance from the mouse to the center is less than the radius (which means the mouse is within the circle)
	var c = circle.center;
	var square_dist = Math.pow((c[0] - x), 2) + Math.pow((c[1] - y), 2);
	return square_dist < Math.pow(circle.radius, 2);
}

function findContainingCircleIndex(x, y){
	//search backwards so top drawn circles have precendence
	for (var i = circles.length-1; i >= 0; i--){
		if (withinCircle(x, y, circles[i])){
			return i;
		}
	}
	return -1;
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );


    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 2*num_points*maxNumVertices, gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 4*num_points*maxNumVertices, gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
	
	window.addEventListener("keydown", function(event){
		if (event.keyCode === 82){
			cIndex = 0;	//red
			keydown = true;
		}
		if (event.keyCode === 89){
			cIndex = 1;	//yellow
			keydown = true;
		}
		if (event.keyCode === 71){
			cIndex = 2;	//green
			keydown = true;
		}
		if (event.keyCode === 66){
			cIndex = 3;	//blue
			keydown = true;
		}
		if (event.keyCode === 77){
			cIndex = 4;	//magenta
			keydown = true;
		}
		if (event.keyCode === 67){
			cIndex = 5;	//cyan
			keydown = true;
		}
	});
	
	window.addEventListener("keyup", function(event){
		if ((event.keyCode === 82 && cIndex == 0) ||	//red
			(event.keyCode === 89 && cIndex == 1) ||	//yellow
			(event.keyCode === 71 && cIndex == 2) ||	//green
			(event.keyCode === 66 && cIndex == 3) ||	//blue
			(event.keyCode === 77 && cIndex == 4) ||	//magenta
			(event.keyCode === 67 && cIndex == 5)){		//cyan
			
			//only reset keydown variables if we're releasing an appropriate key
			keydown = false; 
			cIndex = -1;
		}
	});
	
	function degreesToRad(degrees) {
        return degrees * Math.PI / 180;
    }
	
	window.oncontextmenu = function(){
		return false;
	}
	
	function ShiftCircles(shift_index){
		//if circle is not on top, move it to top (really the end of the array, and this is so the circle is drawn above the other circles when selected. sort of like "bring to front"
		if (shift_index < circles.length-1){
			var cim = shift_index;
			var cim_circle = circles[cim];

			//shift all the circles down
			for (var h = cim+1; h < circles.length; h++){
				var circle = circles[h];
				
				//move it in gpu
				for (var i = 0; i < circle.coordinates.length; i++){
					gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
					gl.bufferSubData(gl.ARRAY_BUFFER, 
						8*(((h-1)*num_points)+i), flatten(circle.coordinates[i]));
					//do it for color too!!!
					gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*(((h-1)*num_points)+i), flatten(circle.color));
				}
				//move it in javascript
				circles[h-1] = circles[h];
			}
			//move selected circle to top
			// in gpu
			for (var i = 0; i < cim_circle.coordinates.length; i++){
				gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 8*(((circles.length-1)*num_points)+i), flatten(cim_circle.coordinates[i]));
				//do the same for color buffer
				gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*(((circles.length-1)*num_points)+i), flatten(cim_circle.color));
			}
			circles[circles.length-1] = cim_circle;
		}
	}
	
	canvas.addEventListener("mouseup", function(event){
		var x = event.clientX;
		x = 2*x/canvas.width-1;
		var y = event.clientY;
		y = 2*(canvas.height-y)/canvas.height-1;
		
		circleIndex_to_be_moved = -1;
		if (circleIndex_to_be_deleted >= 0){
			//check to make sure the cursor is still in the circle
			if (findContainingCircleIndex(x, y) === circleIndex_to_be_deleted){
				//delete the circle!
				ShiftCircles(circleIndex_to_be_deleted);
				circleIndex_to_be_deleted = circles.length-1;
				
				//now actually remove it from the buffer!!!
				circles = circles.slice(0, circles.length-1);
				index -= num_points;
			}
		}
		circleIndex_to_be_deleted = -1;
	});
	
	canvas.addEventListener("mousemove", function(event){
		var x = 2*event.clientX/canvas.width-1;
		var y = 2*(canvas.height-event.clientY)/canvas.height-1;
		if (circleIndex_to_be_moved >= 0){
			//move the circle!!!
			var diff_x = x - original_x;
			var diff_y = y - original_y;	
			
			var circle = circles[circleIndex_to_be_moved];
			var coordinates = circle.coordinates;
			for (var i = 0; i < coordinates.length; i++){
				coordinates[i][0] += diff_x;
				coordinates[i][1] += diff_y;
			}
			//make circle have new coordinates
			circle.coordinates = coordinates;
			//update circles center!!
			circle.center[0] += diff_x;
			circle.center[1] += diff_y;
			
			//reset original mouse coordinates so we move relative to this new position
			original_x = x;
			original_y = y;
			
			//put the moved coordinates into the gpu
			gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
			for (var i = 0; i < circle.coordinates.length; i++){
				gl.bufferSubData(gl.ARRAY_BUFFER, 
					8*((circleIndex_to_be_moved*num_points)+i), flatten(circle.coordinates[i]));
			}	
		}
	});
	
    canvas.addEventListener("mousedown", function(event){
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
		var x = event.clientX;
		var y = event.clientY; 
		var r = 60;
		r /= canvas.width;
		
		var x1 = 2*(x-r)/canvas.width-1;
		var y1 = 2*(canvas.height-(y-r))/canvas.height-1;
		var x2 = 2*(x+r)/canvas.width-1;
		var y2 = 2*(canvas.height-(y+r))/canvas.height-1;
		var c = vec2((x1+x2)*0.5, (y1+y2)*0.5);

		if (!keydown){
			//mutate mouse-x and mouse-y to work with webgl coordinates
			x = 2*x/canvas.width-1;
			y = 2*(canvas.height-y)/canvas.height-1;
			
			//try to select a circle for moving
			if (event.which === 1){
				circleIndex_to_be_moved = findContainingCircleIndex(x, y);
				if (circleIndex_to_be_moved >= 0){					
					ShiftCircles(circleIndex_to_be_moved);
					circleIndex_to_be_moved = circles.length-1;
					//set the appropriate position offsets
					//so moving the circle is relative to where you clicked it
					original_x = x;
					original_y = y;
				}
			}
			//try to delete a circle!! or prepare it for deletion
			else if (event.which === 3){
				circleIndex_to_be_deleted = findContainingCircleIndex(x, y);
			}
		}
		//add a new circle
        else if(keydown && cIndex >= 0) {			
			var t_positions = [];
			var step_size = 360 / num_points;
			for (var d = 0; d <= 360 - step_size; d += step_size){
				t_positions.push(
					vec2(
						(Math.sin(degreesToRad(d)) * r) + c[0],
						(Math.cos(degreesToRad(d)) * r) + c[1]
					)
				);
			}

			//add the vertex position coordinates
			gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer)
			for (var i = 0; i < t_positions.length; i++){
				gl.bufferSubData(gl.ARRAY_BUFFER, 
					(8)*(index+i), flatten(t_positions[i]));
			}

			//now add the color
			t = vec4(colors[cIndex]);

			gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
			for (var i = 0; i < t_positions.length; i++){
				gl.bufferSubData(gl.ARRAY_BUFFER, 
					(16)*(index+i), flatten(t));
			}

			index += num_points;
			
			circles.push({
				center: c,
				radius: r,
				coordinates: t_positions,
				color: t
			});
        }
    } );

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    for(var i = 0; i<index; i+=num_points)
        gl.drawArrays( gl.TRIANGLE_FAN, i, num_points);

    window.requestAnimFrame(render);
}
