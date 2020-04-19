var drops = []; //rain array
var fireworks = []; //fireworks array
var gravity;
const flock = []; //boids array


function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');

  //firework setup
  gravity = createVector(0, 0.2);
  stroke(255);
  strokeWeight(4);

  //Rain setup
  for (var i = 0; i < 500; i++) {
    drops[i] = new Drop();
  }

  //boids setup
  for (let i = 0; i < 200; i++) {
    flock.push(new Boid());
  }
}

function draw() {
  background(0, 0, 0);
  if (rain) {
    rainRun();

  }
  if (firework) {
    fireworkRun();

  }
  if (boid) {
    boidRun();

  }

}

//addaptive canvas
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


//rain functionality start
var rain = false;

function rainBtn() {
  if (rain)
    rain = false;
  else {
    rain = true;
    firework = false;
    boid = false;
  }
}

function Drop() {
  this.x = random(width);
  this.y = random(-500, -50);
  this.z = random(0, 20);
  this.len = map(this.z, 0, 20, 10, 30);
  this.yspeed = map(this.z, 0, 20, 1, 20);

  this.fall = function () {
    this.y = this.y + this.yspeed;
    var grav = map(this.z, 0, 20, 0, 0.05);
    this.yspeed = this.yspeed + grav;

    if (this.y > height) {
      this.y = random(-200, -100);
      this.yspeed = map(this.z, 0, 20, 4, 10);
    }
  };

  this.show = function () {
    var thick = map(this.z, 0, 20, 1, 5);
    strokeWeight(thick);
    //stroke(138, 43, 226);
    stroke(41, 171, 135);
    line(this.x, this.y, this.x, this.y + this.len);
  };
}

function rainRun() {
  //background(0,0,0);
  for (var i = 0; i < drops.length; i++) {
    drops[i].fall();
    drops[i].show();
  }
}
//rain end

//Firework start
function Particle(x, y, hu, firework) {
  this.pos = createVector(x, y);
  this.firework = firework;
  this.lifespan = 255;
  this.hu = hu;
  this.acc = createVector(0, 0);

  if (this.firework) {
    this.vel = createVector(0, random(-17, -7));
  } else {
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 10));
  }

  this.applyForce = function (force) {
    this.acc.add(force);
  };

  this.update = function () {
    if (!this.firework) {
      this.vel.mult(0.9);
      this.lifespan -= 4;
    }

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  };

  this.done = function () {
    if (this.lifespan < 0) {
      return true;
    } else {
      return false;
    }
  };

  this.show = function () {
    //colorMode(HSB);

    if (!this.firework) {
      strokeWeight(5);
      stroke(41, 171, 135, this.lifespan);
    } else {
      strokeWeight(3);
      stroke(41, 171, 135);
    }

    point(this.pos.x, this.pos.y);
  };
}

function Firework() {
  this.hu = random(255);
  this.firework = new Particle(random(width), height, this.hu, true);
  this.exploded = false;
  this.particles = [];

  this.done = function () {
    if (this.exploded && this.particles.length === 0) {
      return true;
    } else {
      return false;
    }
  };

  this.update = function () {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();

      if (this.firework.vel.y >= 0) {
        this.exploded = true;
        this.explode();
      }
    }

    for (var i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  };

  this.explode = function () {
    for (var i = 0; i < 100; i++) {
      var p = new Particle(
        this.firework.pos.x,
        this.firework.pos.y,
        this.hu,
        false
      );
      this.particles.push(p);
    }
  };

  this.show = function () {
    if (!this.exploded) {
      this.firework.show();
    }

    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  };
}

function fireworkRun() {
  if (random(1) < 0.5) {
    fireworks.push(new Firework());
  }

  for (var i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();

    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
}

var firework = false;

function fireworkBtn() {
  if (firework)
    firework = false;
  else {
    firework = true;
    boid = false;
    rain = false;
  }
}
//end

//boids start

var boid = false;

function boidBtn() {
  if (boid)
    boid = false;
  else {
    boid = true;
    rain = false;
    firework = false;
  }
}

class Boid {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(2, 4));
    this.acceleration = createVector();
    this.maxForce = 1;
    this.maxSpeed = 5;
    this.r = 1.5;
  }

  edges() {
    if (this.position.x > width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = width;
    }
    if (this.position.y > height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = height;
    }
  }

  align(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  separation(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = 90;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);
  }

  show() {
    strokeWeight(5);
    stroke(41, 171, 135);
    var theta = this.velocity.heading() + radians(90);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    beginShape();
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);
    pop();

  }
}

function boidRun() {
  for (let boid of flock) {
    boid.edges();
    boid.flock(flock);
    boid.update();
    boid.show();
  }
}