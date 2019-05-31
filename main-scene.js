import {tiny, defs} from './common.js';
// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Cylindrical_Tube, Triangle, Windmill, Tetrahedron} = defs;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// (Can define Main_Scene's class here)

// helper function that curries the most common plant generation function - applying a transform, inserting a shape, 
// and applying another transform
// assumes model_transform is the matrix for the plant, and recipient is the plant shape object being constructed
// takes in the shape class to be inserted (shape), arguments for that shape (shape_args), the matrix for that shape, and the transformation )
// returns a new model transform for storage
const insertShape = (shape, shape_args, shape_transformation = Mat4.identity(), pre_transformation = Mat4.identity(), post_transformation = Mat4.identity()) => {
	return (model_transform, recipient) => {
		let transform = model_transform.times(pre_transformation)
		shape.insert_transformed_copy_into(recipient, shape_args, transform.times(shape_transformation));
		return transform.times(post_transformation);
	}
}

const insertBranch = (angle, axis) => {
	return (model_transform, recipient) => {
		recipient.branchPoints.push(model_transform);
		return model_transform.times(Mat4.rotation(angle, axis));
	}
}

const endBranch = (angle, axis) => {
	return (model_transform, recipient) => {
		let transform = recipient.branchPoints.pop();
		return transform.times(Mat4.rotation(angle, axis));
	}
}

// useful variables
//const leaf_pre_transform = Mat4.rotation(Math.PI/2, );

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

	// maps string symbols to transformations appropriate for that symbol 
	// Cylinder params [1,10, [[0,10],[0,10]]]
	const testSymbolMapping = {
		"1":insertShape(Cube, [],undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0])),
		"0":insertShape(Tetrahedron, [],undefined, Mat4.translation([0,0,0]), Mat4.translation([0,0,0])),
		"[":insertBranch(Math.PI/4, Vec.of(0,0,1)),
		"]":endBranch(-Math.PI/4, Vec.of(0,0,1)),
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


    program_state.lights = [ new Light( Vec.of( 0,1,0,1 ), Color.of( 1,1,1,1 ), 100000 ) ];
	let model_transform = Mat4.identity();

    //this.box.draw( context, program_state, model_transform.times(Mat4.translation([0,-2,0])), this.materials.plastic);

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
		super( "position", "normal", "texture_coord" );

		let transform = Mat4.identity();
		this.branchPoints = [];

		for( let symbol of symbols )
		{
			transform = symbol_map[symbol](transform, this);
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
