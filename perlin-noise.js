import { tiny, defs } from './assignment-4-resources.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Transforms_Sandbox_Base } = defs;

const Noise_Grid = class Noise_Grid {
  constructor(length, variation, generator) { // variation = 1,2, or 3, length >= 2 and > variation
        
    variation = Math.round(variation);
    if (variation < 1) {
        variation = 1;
    } else if (variation > 3) {
        variation = 3;
    } 
        
    length = Math.round(length);
    if (length < 2) {
        length = 2;
    } 
    if (variation > length) { // if variation > length, truncate some gradient vectors
        variation = length;
    }

    if (variation == 1) {
        this.increment = 1.0 / length;
    } 
    if (variation == 2) { // debug these later
        this.increment = 1.0 / 2*length;
    }
    if (variation == 3) { // debug these later
        this.increment = 1.0 / 3*length;
    }
 
    this.generator = generator;

    this.noise = [...Array(length)].map(a => Array(length));
    for (let i=0; i < length; i++) {
        for (let j=0; j < length; j++) {
            this.noise[i][j] = generator.calculateNoise(this.increment*(i+1), this.increment*(j+1));
        }
    } 
  }

}

const Noise_Generator = class Noise_Generator {
    constructor(len) {
        // get size of gradient vector array
        if (len > 2) {
            this.len = Math.floor(len);
        } else {
            this.len = 2;
        }

        // assign gradient vectors
        let cornerVectors = [ Vec.of(1,1), Vec.of(1,-1), Vec.of(-1,1), Vec.of(-1,-1) ];
        this.gradientVectors =[...Array(this.len)].map(a => Array(this.len));
        for (let i=0; i < this.len; i++) {
            for (let j=0; j < this.len; j++) {
            this.gradientVectors[i][j] = cornerVectors[ Math.floor(Math.random()*4) ].copy(); 
            }
        }
    }

    calculateNoise(fx, fy) {

        // get grid cell coordinates
        let x0 = Math.floor(fx);
        let y0 = Math.floor(fy);

        let x1 = x0+1;
        let y1 = y0+1;

        // get interpolation weights
        let sx = fx - x0;
        let sy = fy - y0;

        // get distance from gradient vectors
        let dist00 = Vec.of(sx, sy);
        let dist01 = Vec.of(sx, fy-y1);
        let dist10 = Vec.of(fx-x1, sy);
        let dist11 = Vec.of(fx-x1, fy-y1);

        // dot with gradient vectors
        let dot00 = dist00.dot(this.gradientVectors[x0 % this.len][y0 % this.len]);
        let dot01 = dist01.dot(this.gradientVectors[x0 % this.len][y1 % this.len]);
        let dot10 = dist10.dot(this.gradientVectors[x1 % this.len][y0 % this.len]);
        let dot11 = dist11.dot(this.gradientVectors[x1 % this.len][y1 % this.len]); 

        // linear interpolation between dot products
        let mix0 = dot00*(1-sx) + dot10*sx;
        let mix1 = dot01*(1-sx) + dot11*sx;
        
        return mix0*(1-sy) + mix1*sy;
    }

}


export { Noise_Grid, Noise_Generator }