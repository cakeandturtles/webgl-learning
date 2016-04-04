var Shape = function(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
    this.vertices = [];
    this.faces = [];
    this.rotation = [0, 0, 0];
    this.rotation_delta = [0, 0, 0];
}
Shape.prototype.addVertex = function(x, y, z, nx, ny, nz, r, g, b){
    this.vertices.push(new Shape.Vertex(x, y, z, nx, ny, nz, r, g, b));
    return this.vertices.length-1;
}
Shape.prototype.addFace = function(face){
    this.faces.push(face);
}
Shape.prototype.update = function(p){
    for (var i = 0; i < 3; i++){
        this.rotation[i] += this.rotation_delta[i];
    }
}
Shape.prototype.draw = function(p){
    p.pushMatrix();

    p.translate(this.x, this.y, this.z);
    p.rotateX(this.rotation[0]);
    p.rotateY(this.rotation[1]);
    p.rotateZ(this.rotation[2]);

    p.beginShape();
    for (var i = 0; i < this.faces.length; i++){
        var face = this.faces[i];
        for (var j = 0; j < face.length; j++){
            this.vertices[face[j]].draw(p);
        }
    }
    p.endShape();

    p.popMatrix();
}
Shape.createFromPly = function(x, y, z, ply){
    //assumes .ply file has already been read into a string object
    var lines = ply.split("\n");
    lines = lines.splice(3, lines.length-1);

    var elements = [];

    //let's do things line by line from now on
    var i = 0; //keep incrementer so we can change it manually later

    //populate the element configuration
    while (true){
        var line = lines[i].split(" ");
        i++;

        if (line[0] === "element"){
            elements.push(
                {type: line[1],
                 amount: parseInt(line[2])}
            );
        }
        if (line[0] === "end_header")
            break;
    }

    var shape = new Shape(x, y, z);
    //start actually creating the shape
    for (var j = 0; j < elements.length; j++){
        var element = elements[j];
        //iterate over all the element types
        for (var n = 0; n < element.amount; n++){
            var line = lines[i].split(" "); i++;
            line = line.map(Number);

            if (element.type === "vertex"){
                shape.addVertex(line[0], line[1], line[2],
                                line[3], line[4], line[5],
                                line[6], line[7], line[8]);
            }
            if (element.type === "face"){
                shape.addFace(line.slice(1, line.length))
            }
        }
    }
    return shape;
}

var BLENDER_SIZE_MULT = 25;
Shape.Vertex = function(x, y, z, nx, ny, nz, r, g, b){
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

    this.x *= BLENDER_SIZE_MULT;
    this.y *= BLENDER_SIZE_MULT;
    this.z *= BLENDER_SIZE_MULT;

    this.nx = nx || 0;
    this.ny = ny || 0;
    this.nz = nz || 0;

    this.r = r || 255;
    this.g = g || 255;
    this.b = b || 255;
}
Shape.Vertex.prototype.draw = function(p){
    p.fill(this.r, this.g, this.b);

    p.normal(this.nx, this.ny, this.nz);
    p.vertex(this.x, this.y, this.z);
}
