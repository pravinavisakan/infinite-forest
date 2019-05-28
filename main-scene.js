import {tiny, defs} from './common.js';
// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Cylindrical_Tube, Triangle, Windmill, } = defs;

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

	const phong_shader = new defs.Phong_Shader  (2);
    this.materials = { plastic: new Material( phong_shader, { ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 1,.5,1,1 ) } ),};


	// Plant generation testing

	// test string - from "binary tree" grammaar, 3rd recursion
	const testString = "1111[11[1[0]0]1[0]0]11[1[0]0]1[0]0";

	// helper function that curries the most common plant generation function - returning a shape, and modifying the matrix
	// assumes Function.call is used, to allow insertion into this shape's object buffer
	// takes in the shape class to be inserted (shape), arguments for that shape (shape_args), the matrix for that shape, and the transformation )
	const insertShape = (shape, shape_args, shape_transform, transformation) => {
		return (model_transform) => {
			shape.insert_transformed_copy_into(this, shape_args, shape_transform);
			model_transform.times(transformation);
		}
	}

	// maps string symbols to transformations appropriate for that symbol 
	// Cylinder params [1,10, [[0,10],[0,10]]]
	const testSymbolMapping = {
		"1":insertShape(Cube, [], Mat4.translation([0,1,0]), Mat4.translation([0,2,0])),
		"0":insertShape(Triangle, [], Mat4.identity, Mat4.translation([0,2,0])),
		"[":(model_transform) => model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))),
		"]":(model_transform) => model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))),
	}

    this.plant = new LSystemPlant(testSymbolMapping, testString);
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

    // draw a plant
	this.plant.draw(context, program_state, model_transform, this.materials.plastic);
      
  }
}

// Creates a single plant shape, given a string of symbols and a mapping of symbols to basic shapes
const LSystemPlant = defs.LSystemPlant =
class LSystemPlant extends Shape
{
	constructor( symbol_map, symbols)
	{ 
		let transform = Mat4.identity();
		super( "position", "normal", "texture_coord" );
		for( let symbol of symbols )
		{
			symbol_map[symbol].call(this, transform);
		}          
	}
}

//TODO A class that creates a bunch of LSystemPlants given a symbol map, a grammar, a set of heights, maybe perlin noise data for density, etc.
const ForestPatch = defs.ForestPatch = 
class ForestPatch extends Shape
{

}

const Additional_Scenes = [];
export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }
