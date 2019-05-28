import {tiny, defs} from './common.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Square, Cube, Subdivision_Sphere, Transforms_Sandbox_Base } = defs;

import { Noise_Grid, Noise_Generator } from './perlin-noise.js'

    // Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
    // This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// (Can define Main_Scene's class here)

const Main_Scene =
class Test_Scene extends Scene
{                                             // **Solar_System**:  Your Assingment's Scene.
  constructor()
    {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
      super();
                                                        // At the beginning of our program, load one of each of these shape 
                                                        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape.
                                                        // Don't define blueprints for shapes in display() every frame.

                                                // TODO (#1):  Complete this list with any additional shapes you need.
      this.shapes = { 'box' : new Square() };

                                                        // TODO (#1d): Modify one sphere shape's existing texture 
                                                        // coordinates in place.  Multiply them all by 5.
      // this.shapes.ball_repeat.arrays.texture_coord.forEach( coord => coord
      
                                                              // *** Shaders ***

                                                              // NOTE: The 2 in each shader argument refers to the max
                                                              // number of lights, which must be known at compile time.
                                                              
                                                              // A simple Phong_Blinn shader without textures:
      const phong_shader      = new defs.Phong_Shader  (2);
      
      this.materials = { plastic: new Material( phong_shader, 
                                    { ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of( 1,.5,1,1 ) } ) };
      this.noiseGen = new Noise_Generator(50);
      this.grid_variation=1;
      this.grid_len=10;
      this.noiseGrid = new Noise_Grid(this.grid_len,this.grid_variation,this.noiseGen);
    }

  display( context, program_state )
    {                                                // display():  Called once per frame of animation.  For each shape that you want to
                                                     // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
                                                     // different matrix value to control where the shape appears.
     
                           // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
      if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 

                    // Define the global camera and projection matrices, which are stored in program_state.  The camera
                    // matrix follows the usual format for transforms, but with opposite values (cameras exist as 
                    // inverted matrices).  The projection matrix follows an unusual format and determines how depth is 
                    // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
                    // orthographic() automatically generate valid matrices for one.  The input arguments of
                    // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.          
          program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }

                                                                      // Find how much time has passed in seconds; we can use
                                                                      // time as an input when calculating new transforms:
      const t = program_state.animation_time / 1000;

                                             // Variables that are in scope for you to use:
                                             // this.shapes: Your shapes, defined above.
                                             // this.materials: Your materials, defined above.
                                             // this.lights:  Assign an array of Light objects to this to light up your scene.
                                             // this.lights_on:  A boolean variable that changes when the user presses a button.
                                             // this.camera_teleporter: A child scene that helps you see your planets up close.
                                             //                         For this to work, you must push their inverted matrices
                                             //                         into the "this.camera_teleporter.cameras" array.
                                             // t:  Your program's time in seconds.
                                             // program_state:  Information the shader needs for drawing.  Pass to draw().
                                             // context:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().                                                       


      /**********************************
      Start coding down here!!!!
      **********************************/         

      const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 );

                                    // Variable model_transform will be a local matrix value that helps us position shapes.
                                    // It starts over as the identity every single frame - coordinate axes at the origin.
      let model_transform = Mat4.identity();


                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by 
                                                // the shader when coloring shapes.  See Light's class definition for inputs.


      // ***** BEGIN TEST SCENE *****               

      const light_position = Vec.of(0,-1,1,0); 
      program_state.lights = [ new Light( light_position, Color.of(1,1,1,1), 1000000 ) ];

      model_transform = Mat4.identity();
      for (let i=0; i < this.grid_len; i++) {
        let prev_row_start = model_transform.copy();
        for (let j=0; j < this.grid_len; j++) {
        let noise = this.noiseGrid.noise[i][j];
        this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override( Color.of(noise,noise,noise,1) ) );
        model_transform.post_multiply( Mat4.translation([ 2, 0, 0 ]) );
        }
        model_transform = prev_row_start.copy();
        model_transform.post_multiply( Mat4.translation([ 0, -2, 0 ]) );

      }

      // draw background for contrast
      model_transform = Mat4.identity();
      let scale = 0.2;
      model_transform.post_multiply( Mat4.translation([this.grid_len-1,-this.grid_len,-1]));
      model_transform.post_multiply( Mat4.scale([this.grid_len+1, this.grid_len+1, 1]));
      this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override(blue));

      // ***** END TEST SCENE *****



    }
}

const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }




