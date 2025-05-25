let particles = [];
const numParticles = 150;
let osc; // Oscillator for drone sound
let audioStarted = false;

let chimeOsc, chimeEnv;
let lastChimeTime = 0;
const minChimeInterval = 2000; // Minimum milliseconds between chimes

// Particle class
class Particle {
    constructor() {
        this.z = random(0.1, 1); // Depth factor (0.1 = far, 1 = close)
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = map(this.z, 0.1, 1, 0.1, 0.7); // Speed depends on depth
        this.size = map(this.z, 0.1, 1, 1, 4);      // Size depends on depth
        this.baseAlpha = map(this.z, 0.1, 1, 30, 180); // Alpha depends on depth
        this.alpha = this.baseAlpha;
        this.noiseOffsetX = random(1000);
        this.noiseOffsetY = random(10000);
        this.noiseOffsetZAlpha = random(20000); // For alpha twinkling (renamed for clarity)
    }

    update() {
        // Perlin noise for movement
        let angle = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.001) * TWO_PI * 2;
        this.acc = p5.Vector.fromAngle(angle);
        this.acc.mult(0.1 * this.z); // Acceleration also influenced by depth (closer moves more dynamically)

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);

        // Twinkling effect for alpha
        this.alpha = map(noise(this.noiseOffsetZAlpha + frameCount * 0.01), 0, 1, this.baseAlpha * 0.3, this.baseAlpha);

        this.edges();
    }

    display() {
        noStroke();
        // Cosmic color palette - shades of white, light blues, purples
        let r = map(this.pos.x, 0, width, 150, 200);
        let g = map(this.pos.y, 0, height, 180, 220);
        let b = 255;
        fill(r, g, b, this.alpha);
        ellipse(this.pos.x, this.pos.y, this.size);
    }

    edges() {
        // Adjust wrapping based on particle size to prevent premature disappearance/reappearance
        if (this.pos.x > width + this.size) this.pos.x = -this.size;
        if (this.pos.x < -this.size) this.pos.x = width + this.size;
        if (this.pos.y > height + this.size) this.pos.y = -this.size;
        if (this.pos.y < -this.size) this.pos.y = height + this.size;
    }
}

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    cnv.id('defaultCanvas0');
    
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function touchStarted() { 
  if (!audioStarted) {
    userStartAudio(); 
    osc = new p5.Oscillator('sine'); 
    osc.amp(0); 
    osc.start();

    chimeOsc = new p5.Oscillator('sine');
    chimeOsc.amp(0);
    chimeOsc.start();

    chimeEnv = new p5.Envelope();
    chimeEnv.setADSR(0.01, 0.2, 0.1, 0.5); // Attack, Decay, Sustain (as ratio), Release
    chimeEnv.setRange(0.3, 0); // Attack Level, Release Level (chimes are quiet)

    audioStarted = true;
  }
  return false; 
}

function draw() {
    let t = frameCount * 0.0005;
    let bgR = map(noise(t + 10), 0, 1, 5, 20);
    let bgG = map(noise(t + 20), 0, 1, 5, 15);
    let bgB = map(noise(t + 30), 0, 1, 15, 35);
    background(bgR, bgG, bgB, 25);

    for (let particle of particles) {
        particle.update();
        particle.display();
    }

    if (audioStarted) {
        let droneFreq = map(noise(frameCount * 0.0005 + 100), 0, 1, 50, 100); 
        let droneAmp = map(noise(frameCount * 0.0002 + 200), 0, 1, 0.05, 0.15); 
        osc.freq(droneFreq, 0.1); 
        osc.amp(droneAmp, 0.1);   

        if (millis() - lastChimeTime > minChimeInterval) { // Ensure minimum interval
            if (random(1) < 0.01) { // Low probability for chimes (adjust for frequency)
                let chimeFreq = random(600, 1200); // Higher frequencies for chimes
                chimeOsc.freq(chimeFreq);
                chimeEnv.play(chimeOsc);
                lastChimeTime = millis();
            }
        }
    }
}
