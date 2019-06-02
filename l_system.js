import {tiny} from './common.js';
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
         
//INFO
// This file contains our classes for implementing L-System Plant Generation, with some examples

// LSystemGrammar class for calculating strings from grammars
const LSystemGrammar = class LSystemGrammar
{
	/*
		LSystemGrammar constructor
		
		inputs:
			rules- map of alphabet variables to a list of legal substitution tuples (C, P):
					C- character substitution
					P- probability of the substitution occurring: [0,1]
	*/
	constructor( rules )
	{
		this.rules = rules;
	}

	/*
		calcString method
		
		inputs:
			init- string of initial alphabet characters
			depth- maximum number of substitutions

		output: string resulting from substitutions
	*/
	calcString( init, depth )
	{
		if (depth == 0) return init;

		let output = "";

		for (var i = 0; i < init.length; i++)
		{
			let char = init[i], randval = Math.random();
			let sub = char;

			for( var r of this.rules.get(char) )
			{
				if (randval < r[1])
				{
					sub = r[0];

					break;
				}

				randval -= r[1];
			}

			output += sub;
		}

		return this.calcString( output, depth - 1 );
	}
}

// Creates a single plant as a single tinygraphics shape
// given a string of symbols and a mapping of symbols to other shapes or branch points
// see tree_shapes.js for shapes and helper functions for generating symbol maps
const LSystemPlant = 
class LSystemPlant extends Shape
{
	constructor( symbol_map, symbols)
	{ 
		super( "position", "normal", "texture_coord", "color" );

		let transform = Mat4.identity();
		this.branchPoints = [];

		// suppresses drawing while files haven't loaded
		// basically a counter - while files are loading, is > 0
		this.readyCount = 0;

		for( let symbol of symbols )
		{
			transform = symbol_map[symbol](transform, this);
		}          
	}

	//functions for loading obj files asynchronously - adapted from Shape_from_File
	  load_obj_file( filename, transform, shape_transformation, color )
      {                             // Request the external file and wait for it to load.
                                    // Failure mode:  Loads an empty shape.

        // set up ready entry
		this.readyCount +=1;

        
        let file_response = fetch( filename )
          .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
              else                return Promise.reject ( response.status )
            })
          .then( (obj_file_contents) => {
          	//console.log("oi");
          	this.parse_into_mesh( obj_file_contents, transform, shape_transformation, color );
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

      //adds file vertices to shape after load - adjusted to account for other shapes and transform
  parse_into_mesh( data, transform, shape_transformation, color )
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
      const temp_shape = { arrays: {
      	position:[],
      	normal:[],
      	texture_coord: [],
      }, }; // a temp to make variables from insert play nice, not actually a shape

      {

      	// puts vertices from file into tinyGraphics Shape/Vertex Buffer format
      const { verts, norms, textures } = unpacked;
      for( var j = 0; j < verts.length/3; j++ )
	  { 
	      temp_shape.arrays.position     .push( Vec.of( verts[ 3*j ], verts[ 3*j + 1 ], verts[ 3*j + 2 ] ) );        
	      temp_shape.arrays.normal       .push( Vec.of( norms[ 3*j ], norms[ 3*j + 1 ], norms[ 3*j + 2 ] ) );
	      temp_shape.arrays.texture_coord.push( Vec.of( textures[ 2*j ], textures[ 2*j + 1 ]  ));
	  }
	  temp_shape.indices = unpacked.indices;
      }


		// another temp to make variables apply correctly
		const points_transform = transform.times(shape_transformation);
      //applies transform to vertices and copies into plant shape (from insert function)
		this.indices.push( ...temp_shape.indices.map( i => i + this.arrays.position.length ) );
                                              // Copy each array from temp_shape into the recipient shape:
      for( let a in temp_shape.arrays )
      {                                 // Apply points_transform to all points added during this call:
        if( a == "position" || a == "tangents" )
          this.arrays[a].push( ...temp_shape.arrays[a].map( p => points_transform.times( p.to4(1) ).to3() ) );
                                        // Do the same for normals, but use the inverse transpose matrix as math requires:
        else if( a == "normal" )
          this.arrays[a].push( ...temp_shape.arrays[a].map( n => 
                                         Mat4.inverse( points_transform.transposed() ).times( n.to4(1) ).to3() ) );
                                        // All other arrays get copied in unmodified:
        else this.arrays[a].push( ...temp_shape.arrays[a] );
      }

       // add colors to buffer
      for (let p of temp_shape.arrays.position) {
        this.arrays.color.push(color);
      }

      //setup left from original
      this.normalize_positions( false );
      this.readyCount-=1;
    }


    draw( context, program_state, model_transform, material )
    {               // draw(): Same as always for shapes, but cancel all 
                    // attempts to draw the shape before it loads:
      if( this.readyCount == 0 )
        super.draw( context, program_state, model_transform, material );
    }
}

//TODO A class that creates a bunch of LSystemPlants given a symbol map, a grammar, a set of heights, 
// maybe perlin noise data for density and type
// NOTE: is not actually a shape - it contains an array of shapes and translations, and when draw is called, is displays them
const ForestPatch =  
class ForestPatch 
{
	constructor(heights){
		

	}
}

export {LSystemGrammar, LSystemPlant, ForestPatch }