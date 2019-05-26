import {tiny, defs} from './common.js';
// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Transforms_Sandbox_Base } = defs;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// (Can define Main_Scene's class here)

const Main_Scene =
class Test_Scene extends Scene
{              
  constructor()
  {
	super();
	this.box = new Cube();
	this.plant = new LSystemPlant(5);
	const phong_shader      = new defs.Phong_Shader  (2);
    this.materials = { plastic: new Material( phong_shader, 
                     	{ ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 1,.5,1,1 ) } ),
                     };
  }

  display( context, program_state )
  {

      // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
      if( !context.scratchpad.controls ) 
      {
          // Add a movement controls panel to the page:
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


    program_state.lights = [ new Light( Vec.of( 0,0,0,1 ), Color.of( 1,1,1,1 ), 100000 ) ];
	let model_transform = Mat4.identity();

    this.box.draw( context, program_state, model_transform.times(Mat4.translation([0,-2,0])), this.materials.plastic);
	this.plant.draw(context, program_state, model_transform, this.materials.plastic);
      
  }
}


const LSystemPlant = defs.LSystemPlant =
class LSystemPlant extends Shape
{
  constructor( num_blades)
  { 
      super( "position", "normal", "texture_coord" );
      for( let i = 0; i < num_blades; i++ )
        {                                      // Rotate around a few degrees in the XZ plane to place each new point:
          const spin = Mat4.rotation( i * 2*Math.PI/num_blades, Vec.of( 0,1,0 ) );
                                               // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
          const newPoint  = spin.times( Vec.of( 1,0,0,1 ) ).to3();
          const triangle = [ newPoint,                      // Store that XZ position as point 1.
                             newPoint.plus( [ 0,1,0 ] ),    // Store it again but with higher y coord as point 2.
                             Vec.of( 0,0,0 )    ];          // All triangles touch this location -- point 3.

          this.arrays.position.push( ...triangle );
                        // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!  Normal vectors are not
                        // points; their perpendicularity constraint gives them a mathematical quirk that when applying 
                        // matrices you have to apply the transposed inverse of that matrix instead.  But right now we've
                        // got a pure rotation matrix, where the inverse and transpose operations cancel out, so it's ok.
          var newNormal = spin.times( Vec.of( 0,0,1 ).to4(0) ).to3();
                                                                       // Propagate the same normal to all three vertices:
          this.arrays.normal.push( newNormal, newNormal, newNormal );
          this.arrays.texture_coord.push( ...Vec.cast( [ 0,0 ], [ 0,1 ], [ 1,0 ] ) );
                                                                // Procedurally connect the 3 new vertices into triangles:
          this.indices.push( 3*i, 3*i + 1, 3*i + 2 );
        }          
  }
}

const Additional_Scenes = [];
export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }
