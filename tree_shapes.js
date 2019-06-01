import {tiny, defs} from './common.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Cylindrical_Tube, Triangle, Windmill, Tetrahedron} = defs;

// INFO
// A file for shapes and helper functions with which to build symbol maps, 
// to be used with L System Plants (see grammar_and_maps.js for examples)

// helper function that curries the most common plant generation function - 
// assumes model_transform is the matrix for the plant, and recipient is the plant shape object being constructed
// takes in the shape class to be inserted (shape), arguments for that shape (shape_args), the matrix for that shape, and the transformation )
// returns a new model transform for storage

//to be exported, and possibly used for symbol map auto-generation
// TODO ad flowers, fruits, something else?
const insertBranchFunctions = [];
const insertLeafFunctions= [];
const branchOutFunctions = [];
const endBranchFunctions = [];

/********************* Helper Functions *******************/

// insertShape - returns a function that can be used to insert a shape into an LSystemPlant
// takes in the shape class to be inserted (shape), arguments for that shape (shape_args), the matrix for that shape (shape_transformation), 
// and the transformation before (pre_transformation)  and after (post_transformation)
// the returned function applies a transform, inserts a shape, and applies another transform
// it's called by LSystemPlant, with the current coordinate system (model_transform), and itself (recipient)
const insertShape = (shape, shape_args, shape_transformation = Mat4.identity(), pre_transformation = Mat4.identity(), post_transformation = Mat4.identity()) => {
	return (model_transform, recipient) => {
		let transform = model_transform.times(pre_transformation)
		shape.insert_transformed_copy_into(recipient, shape_args, transform.times(shape_transformation));
		return transform.times(post_transformation);
	}
}

//branchOut - pushes current location to the recipient's stack for later, and rotates for a given axis and angle
const branchOut = (angle, axis) => {
	return (model_transform, recipient) => {
		recipient.branchPoints.push(model_transform);
		return model_transform.times(Mat4.rotation(angle, axis));
	}
}

// endBranch - pops current position and rotates
const endBranch = (angle, axis) => {
	return (model_transform, recipient) => {
		let transform = recipient.branchPoints.pop();
		return transform.times(Mat4.rotation(angle, axis));
	}
}

/******************** Shapes and Insertion Functions ********/

// adds a simple box branch function
insertBranchFunctions.push(insertShape(Cube, [],undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0])));

// a simple tetrahedron leaf function
insertLeafFunctions.push(insertShape(Tetrahedron, [],undefined, Mat4.translation([0,0,0]), Mat4.translation([0,0,0])));

// a simple branch out that rotates 45 degrees to the left, along z
branchOutFunctions.push(branchOut(Math.PI/4, Vec.of(0,0,1)));

// a simple endBranch that rotates right 45 degrees along z
endBranchFunctions.push(endBranch(-Math.PI/4, Vec.of(0,0,1)));


// custom obj file loading shape
// TODO Erynn pls fix color buffers here, and in the obj functions below - the simple shapes matter less!
export class Shape_From_File extends Shape
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
          	console.log("oi");
          	this.parse_into_mesh( obj_file_contents );
          	console.log("oi2");
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

// TODO add some more sick custom shapes here, and add the appropriate symbol functions

// adds an insertion function for custom leaf 1, to be used in plant generation later
insertLeafFunctions.push(insertShape(Shape_From_File, ["assets/leaf1.obj"],undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0])));



// exports
export {insertBranchFunctions, insertLeafFunctions, branchOutFunctions, endBranchFunctions}
