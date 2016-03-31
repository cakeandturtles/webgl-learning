var Shape = function(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
    this.vertices = {};
    this.rotation = [0, 0, 0];
    this.rotation_delta = [0, 0, 0];
    this.wiggle = false;
    
    this.vertex_id = 0;
}
Shape.prototype.addVertex = function(x, y, z){
    this.vertices[this.vertex_id] = new Shape.Vertex(x, y, z);
    this.vertex_id++;
    return this.vertex_id-1;
}
Shape.prototype.linkVertex = function(vid1, vid2){
    this.vertices[vid1].links.push(vid2);
}
Shape.prototype.RandomColors = function(){
    for (var vid in this.vertices){
        this.vertices[vid].RandomColor();
    }
}
Shape.prototype.StartWiggle = function(){
    this.wiggle = true;
}
Shape.prototype.StopWiggle = function(){
    this.wiggle = false;
}
Shape.prototype.update = function(){
    for (var i = 0; i < 3; i++){
        this.rotation[i] += this.rotation_delta[i];
    }
    
    for (var vid in this.vertices){
        var vertex = this.vertices[vid];
        vertex.drawn = false;
        
        if (this.wiggle){
            vertex.x += (Math.random() - 0.5);
            vertex.y += (Math.random() - 0.5);
            vertex.z += (Math.random() - 0.5);
        }
    }
}
Shape.prototype.draw = function(p){
    p.pushMatrix();
    
    p.translate(this.x, this.y, this.z);
    p.rotateX(this.rotation[0]);
    p.rotateY(this.rotation[1]);
    p.rotateZ(this.rotation[2]);
    
    p.beginShape();
    for (var vid in this.vertices){
        this.vertices[vid].draw(p, this.vertices);
        break;
    }
    p.endShape();
    
    p.popMatrix();
}

Shape.Vertex = function(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
    
    this.RandomColor();
    
    this.links = [];
    this.drawn = false;
}
Shape.Vertex.prototype.RandomColor = function(){
    this.r = Math.random();
    this.g = Math.random();
    this.b = Math.random();
}
Shape.Vertex.prototype.draw = function(p, vertices){
    p.stroke(this.r, this.g, this.b);
    p.vertex(this.x, this.y, this.z);
    
    if (this.drawn) return;
    this.drawn = true;
    for (var i = 0; i < this.links.length; i++){
        var v = vertices[this.links[i]];
        v.draw(p, vertices);
        p.stroke(this.r, this.g, this.b);
        p.vertex(this.x, this.y, this.z);
    }
}
