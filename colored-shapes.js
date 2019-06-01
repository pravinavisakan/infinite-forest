import {tiny, defs} from './common.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Square, Cube, Tetrahedron} = defs;

/****************** Colored versions of shapes *********************/
const dark_green = Color.of(0,.392157,0,1); // default color

const Colored_Cube = 
class Colored_Cube extends Shape {
  constructor(color = dark_green)  
    { super( "position", "normal", "texture_coord", "color" );
      for( var i = 0; i < 3; i++ )
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
        }
      
      for ( let p of this.arrays.position ) {
      	this.arrays.color.push(color);
      }
    }	
}

const Colored_Tetrahedron =
class Colored_Tetrahedron extends Shape {
constructor( using_flat_shading = true, color = dark_green )
    { super( "position", "normal", "texture_coord", "color");
      var a = 1/Math.sqrt(3);
      if( !using_flat_shading )
      {                                         // Method 1:  A tetrahedron with shared vertices.  Compact, performs better,
                                                // but can't produce flat shading or discontinuous seams in textures.
          this.arrays.position      = Vec.cast( [ 0, 0, 0], [1,0,0], [0,1,0], [0,0,1] );          
          this.arrays.normal        = Vec.cast( [-a,-a,-a], [1,0,0], [0,1,0], [0,0,1] );          
          this.arrays.texture_coord = Vec.cast( [ 0, 0   ], [1,0  ], [0,1, ], [1,1  ] );
                                                // Notice the repeats in the index list.  Vertices are shared 
                                                // and appear in multiple triangles with this method.
          this.indices.push( 0, 1, 2,   0, 1, 3,   0, 2, 3,   1, 2, 3 );
      }
      else
      {                                           // Method 2:  A tetrahedron with four independent triangles.
        this.arrays.position = Vec.cast( [0,0,0], [1,0,0], [0,1,0],
                                         [0,0,0], [1,0,0], [0,0,1],
                                         [0,0,0], [0,1,0], [0,0,1],
                                         [0,0,1], [1,0,0], [0,1,0] );

                                          // The essence of flat shading:  This time, values of normal vectors can
                                          // be constant per whole triangle.  Repeat them for all three vertices.
        this.arrays.normal   = Vec.cast( [0,0,-1], [0,0,-1], [0,0,-1],
                                         [0,-1,0], [0,-1,0], [0,-1,0],
                                         [-1,0,0], [-1,0,0], [-1,0,0],
                                         [ a,a,a], [ a,a,a], [ a,a,a] );

                                          // Each face in Method 2 also gets its own set of texture coords (half the
                                          // image is mapped onto each face).  We couldn't do this with shared
                                          // vertices since this features abrupt transitions when approaching the
                                          // same point from different directions.
        this.arrays.texture_coord = Vec.cast( [0,0], [1,0], [1,1],
                                              [0,0], [1,0], [1,1],
                                              [0,0], [1,0], [1,1],
                                              [0,0], [1,0], [1,1] );
                                          // Notice all vertices are unique this time.
        this.indices.push( 0, 1, 2,    3, 4, 5,    6, 7, 8,    9, 10, 11 );
      }

      for ( let p of this.arrays.position ) {
      	this.arrays.color.push(color);
      }
    }	
}

export { Colored_Cube, Colored_Tetrahedron };