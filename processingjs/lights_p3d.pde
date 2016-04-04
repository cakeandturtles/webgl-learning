void setup()
{
    size(450, 200, P3D);
    noStroke();
}

void draw()
{
    background(245, 238, 184);
    fill(246, 225, 65);
    
    lights();
    
    pushMatrix();
    translate(width/3, height/2);
    rotateY(radians(frameCount));
    rotateX(PI/6);
    box(50);
    popMatrix();

    pushMatrix();
    translate(width/2 + width/4, height/2);
    rotateY(radians(frameCount));
    sphere(30);
    popMatrix();
}
