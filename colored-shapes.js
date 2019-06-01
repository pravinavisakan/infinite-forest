import {tiny, defs} from './common.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Square, Cube, Tetrahedron} = defs;

/****************** Colored versions of shapes *********************/
const colored_shapes_defs = {};

const dark_green = Color.of(0,.392157,0,1); // default color

const cCube = colored_shapes_defs.cCube = 
class cCube extends Shape {
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

const cTetrahedron = colored_shapes_defs.cTetrahedron = 
class cTetrahedron extends Shape {
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

// These are examples used in the Scene Colored_Shapes_test

// EXAMPLE SUB-SHAPE
const cSphere = colored_shapes_defs.cSphere = 
class cSphere extends Shape {
  constructor(color) { // pass color as an argument to the sub-shape constructor
    // add "color" as a parameter to the super constructor
    super("position", "normal", "texture_coord", "color");

      // this stuff is specific to subdivision spheres. (ignore this section)
      const max_subdivisions = 4;
      const tetrahedron = [ [ 0, 0, -1 ], [ 0, .9428, .3333 ], [ -.8165, -.4714, .3333 ], [ .8165, -.4714, .3333 ] ];
      this.arrays.position = Vec.cast( ...tetrahedron );
      this.subdivide_triangle( 0, 1, 2, max_subdivisions);
      this.subdivide_triangle( 3, 2, 1, max_subdivisions);
      this.subdivide_triangle( 1, 0, 3, max_subdivisions);
      this.subdivide_triangle( 0, 2, 3, max_subdivisions);
      
      for( let p of this.arrays.position )
        {                                    
          this.arrays.normal.push( p.copy() );
                                         
          this.arrays.texture_coord.push(Vec.of(
                0.5 - Math.atan2(p[2], p[0]) / (2 * Math.PI),
                0.5 + Math.asin(p[1]) / Math.PI) );
        }

      const tex = this.arrays.texture_coord;
      for (let i = 0; i < this.indices.length; i += 3) {
          const a = this.indices[i], b = this.indices[i + 1], c = this.indices[i + 2];
          if ([[a, b], [a, c], [b, c]].some(x => (Math.abs(tex[x[0]][0] - tex[x[1]][0]) > 0.5))
              && [a, b, c].some(x => tex[x][0] < 0.5))
          {
              for (let q of [[a, i], [b, i + 1], [c, i + 2]]) {
                  if (tex[q[0]][0] < 0.5) {
                      this.indices[q[1]] = this.arrays.position.length;
                      this.arrays.position.push( this.arrays.position[q[0]].copy());
                      this.arrays.normal  .push( this.arrays.normal  [q[0]].copy());
                      tex.push(tex[q[0]].plus(Vec.of(1, 0)));
                  }
              }
          }
      }
      // this is the end of the stuff you can ignore

      // add colors to buffer
      for (let p of this.arrays.position) {
        this.arrays.color.push(color);
      }
    }

  subdivide_triangle( a, b, c, count )
    {                                           // subdivide_triangle(): Recurse through each level of detail 
                                                // by splitting triangle (a,b,c) into four smaller ones.
      if( count <= 0)
        {                                       // Base case of recursion - we've hit the finest level of detail we want.
          this.indices.push( a,b,c ); 
          return; 
        }
                                                // So we're not at the base case.  So, build 3 new vertices at midpoints,
                                                // and extrude them out to touch the unit sphere (length 1).
      var ab_vert = this.arrays.position[a].mix( this.arrays.position[b], 0.5).normalized(),     
          ac_vert = this.arrays.position[a].mix( this.arrays.position[c], 0.5).normalized(),
          bc_vert = this.arrays.position[b].mix( this.arrays.position[c], 0.5).normalized(); 
                                                // Here, push() returns the indices of the three new vertices (plus one).
      var ab = this.arrays.position.push( ab_vert ) - 1,
          ac = this.arrays.position.push( ac_vert ) - 1,  
          bc = this.arrays.position.push( bc_vert ) - 1;  
                               // Recurse on four smaller triangles, and we're done.  Skipping every fourth vertex index in 
                               // our list takes you down one level of detail, and so on, due to the way we're building it.
      this.subdivide_triangle( a, ab, ac,  count - 1 );
      this.subdivide_triangle( ab, b, bc,  count - 1 );
      this.subdivide_triangle( ac, bc, c,  count - 1 );
      this.subdivide_triangle( ab, bc, ac, count - 1 );
    }    
}
// END OF EXAMPLE SUB-SHAPE

// EXAMPLE COMBINED SHAPE
const Snowman = colored_shapes_defs.snowman = 
class Snowman extends Shape {
  constructor() {
    // add "color" as a parameter to the super constructor
    super("position", "normal", "texture_coord", "color");

    const sphere4 = new Subdivision_Sphere(4);

    let model_transform = Mat4.identity();
    for (let i=1; i < 4; i++) {
       // pass sub-shape color in the array of shape arguments.
       cSphere.insert_transformed_copy_into(this, [Color.of(Math.random(), Math.random(), Math.random(), 1)], model_transform);
       model_transform.post_multiply(Mat4.translation([0,-1,0]));
       model_transform.post_multiply(Mat4.scale([2,2,2]));
       model_transform.post_multiply(Mat4.translation([0,-1,0]));
    }
  }
}
// END OF EXAMPLE COMBINED SHAPE


export { colored_shapes_defs };