import {tiny, defs} from './common.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Cylindrical_Tube, Triangle, Windmill, Tetrahedron, Combined_Shape_Shader } = defs;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// Imports for our term projects
import {LSystemPlant, LSystemGrammar, ForestPatch} from './l_system.js';
import {rules, genericSymbolMaps} from './grammars_and_maps.js';
import { Noise_Test_Scenes } from './perlin-noise-tests.js'
import {Combined_Shapes_Test} from './custom-shaders.js'

// pull rules, maps, and noise test scenes into this namespace
const { Algae, Binary } = rules;
const { AlgaeMap, BinaryMap } = genericSymbolMaps;
const { Grayscale_Grid, Height_Map_Test } = Noise_Test_Scenes;

// useful variables
//const leaf_pre_transform = Mat4.rotation(Math.PI/2, );
const Obj_Loader_Shape = class Shape_From_File extends Shape
{                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                    // all its arrays' data from an .obj 3D model file.
  constructor( filename )
    { super( "position", "normal", "texture_coord" );
                                    // Begin downloading the mesh. Once that completes, return
                                    // control to our parse_into_mesh function.
      this.load_file( filename );
    }
  load_file( filename )
      {                             // Request the external file and wait for it to load.
                                    // Failure mode:  Loads an empty shape.
        let file_response = fetch( filename )
          .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
              else                return Promise.reject ( response.status )
            })
          .then( (obj_file_contents) => {
          	//console.log("oi");
          	this.parse_into_mesh( obj_file_contents );
          	//console.log("oi2");
          	} )
          .catch( error => { this.copy_onto_graphics_card( this.gl ); } );

          // added a dumb hack to enforce synchronous file load
          //while(!(file_response instanceof Response))
          //{
          //	console.log("Loading file!");
          //}

          return file_response;
      }
  parse_into_mesh( data )
    {                           // Adapted from the "webgl-obj-loader.js" library found online:
      var verts = [], vertNormals = [], textures = [], unpacked = {};   

      unpacked.verts = [];        unpacked.norms = [];    unpacked.textures = [];
      unpacked.hashindices = {};  unpacked.indices = [];  unpacked.index = 0;

      var lines = data.split('\n');

      var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;
      var FACE_RE = /^f\s/;      var WHITESPACE_RE = /\s+/;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var elements = line.split(WHITESPACE_RE);
        elements.shift();

        if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
        else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
        else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
        else if (FACE_RE.test(line)) {
          var quad = false;
          for (var j = 0, eleLen = elements.length; j < eleLen; j++)
          {
              if(j === 3 && !quad) {  j = 2;  quad = true;  }
              if(elements[j] in unpacked.hashindices) 
                  unpacked.indices.push(unpacked.hashindices[elements[j]]);
              else
              {
                  var vertex = elements[ j ].split( '/' );

                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);   
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                  
                  if (textures.length) 
                    {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                        unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }
                  
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);
                  
                  unpacked.hashindices[elements[j]] = unpacked.index;
                  unpacked.indices.push(unpacked.index);
                  unpacked.index += 1;
              }
              if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
          }
        }
      }
      {
      const { verts, norms, textures } = unpacked;
        for( var j = 0; j < verts.length/3; j++ )
        { 
          this.arrays.position     .push( Vec.of( verts[ 3*j ], verts[ 3*j + 1 ], verts[ 3*j + 2 ] ) );        
          this.arrays.normal       .push( Vec.of( norms[ 3*j ], norms[ 3*j + 1 ], norms[ 3*j + 2 ] ) );
          this.arrays.texture_coord.push( Vec.of( textures[ 2*j ], textures[ 2*j + 1 ]  ));
        }
        this.indices = unpacked.indices;
      }
      this.normalize_positions( false );
      this.ready = true;
    }
  draw( context, program_state, model_transform, material )
    {               // draw(): Same as always for shapes, but cancel all 
                    // attempts to draw the shape before it loads:
      if( this.ready )
        super.draw( context, program_state, model_transform, material );
    }
}


class Test_Scene extends Scene
{              
  constructor()
  {
	super();
	this.box = new Cube();

	const phong_shader = new defs.Phong_Shader  (2);
	const combo_shader = new defs.Combined_Shape_Shader(2);
    this.materials = { combo : new Material( combo_shader, { ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 1,.5,1,1 ) } ),};

	// Plant generation testing

	// test string - from "binary tree" grammar, 3rd recursion
	//const testString = "1111[11[1[0]0]1[0]0]11[1[0]0]1[0]0";

	// An example rendering of a single plant, using a test mapping and binary tree rules

	const binaryGrammar = new LSystemGrammar(Binary);

	const testString = binaryGrammar.calcString("0",2);
	//const testString = "1111";

	// crude generation of a mapping from symbols to shape insertion functions

	const generatedBinaryMap = {};

	for( let symbol in BinaryMap )
	{
		const len = BinaryMap[symbol].length;
		generatedBinaryMap[symbol] = BinaryMap[symbol][len-1];
	}   

    this.plant = new LSystemPlant(generatedBinaryMap, testString);

    //test obj file load 
    //this.obj = new Obj_Loader_Shape("assets/leaf1.obj");

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


    const angle = Math.sin( t );
    const light_position = Mat4.rotation( angle, [ 1,0,0 ] ).times( Vec.of( 0,-1,1,0 ) );
    program_state.lights = [ new Light( light_position, Color.of(1,1,1,1), 1000000 ) ];
	let model_transform = Mat4.identity();

    //this.box.draw( context, program_state, model_transform.times(Mat4.translation([0,-2,0])), this.materials.plastic);

    // draw a plant
	this.plant.draw(context, program_state, model_transform, this.materials.combo);

	//this.obj.draw(context, program_state, model_transform.times(Mat4.translation([0,-4,0])), this.materials.plastic);
      
  }

}

const Main_Scene = Test_Scene;
const Additional_Scenes = [];
export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }