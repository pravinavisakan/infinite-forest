import {tiny, defs} from './common.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Square, Grid_Patch } = defs;

import { Noise_Grid, Noise_Generator } from './perlin-noise.js'

    // Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
    // This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

///////////////////
// custom shapes //
///////////////////
const Colored_Square = defs.Colored_Square = 
class Colored_Square extends Shape {
    constructor(color) {
        super("position", "normal", "texture_coord", "color");
                                                  // Specify the 4 square corner locations, and match those up with normal vectors:
        this.arrays.position      = Vec.cast( [-1,-1,0], [1,-1,0], [-1,1,0], [1,1,0] );
        this.arrays.normal        = Vec.cast( [0,0,1],   [0,0,1],  [0,0,1],  [0,0,1] );
                                                          // Arrange the vertices into a square shape in texture space too:
        this.arrays.texture_coord = Vec.cast( [0,0],     [1,0],    [0,1],    [1,1]   );
                                                     // Use two triangles this time, indexing into four distinct vertices:
        this.arrays.color = [ color, color, color, color ];
        this.indices.push( 0, 1, 2,     1, 3, 2 );

    }
}

const Noise_Demo = defs.Noise_Demo = 
class Noise_Demo extends Shape {
    constructor(noiseGrid) {
        super("position", "normal", "texture_coord", "color");
        this.noiseGrid = noiseGrid;
        let model_transform = Mat4.identity();
        for (let i=0; i < noiseGrid.rows; i++) {
           let prev_row_start = model_transform.copy();
           for (let j=0; j < noiseGrid.columns; j++) {
                let noise = (noiseGrid.noise[i][j] + 1)/2;
                Colored_Square.insert_transformed_copy_into( this, [ Color.of(noise, noise, noise, 1) ], model_transform );
                model_transform.post_multiply( Mat4.translation([2,0,0]));
           }
           model_transform = prev_row_start.copy();
           model_transform.post_multiply(Mat4.translation([0,-2,0]));
        }
    }
}

const Height_Map = defs.Height_Map = class Height_Map extends Shape {
    constructor(rows, columns, heights, texture_coord_range = [ [ 0, (rows-1) ], [ 0, (columns-1) ] ]) {
        super("position", "normal", "texture_coord")

        // position and texture coordinates
        let points = [...Array(rows)].map(a => Array(columns));
        for (let i=0; i < rows; i++) {
            for (let j=0; j < columns; j++) {
                points[i][j] = Vec.of(i,j,heights[i][j]);
                this.arrays.position.push(Vec.of(i/(rows-1), j/(columns-1), heights[i][j]));

                // Interpolate texture coords from a provided range.
                const a1 = j/(columns-1), a2 = i/(rows-1), x_range = texture_coord_range[0], y_range = texture_coord_range[1];
                this.arrays.texture_coord.push( Vec.of( ( a1 )*x_range[1] + ( 1-a1 )*x_range[0], ( a2 )*y_range[1] + ( 1-a2 )*y_range[0] ) );
            }
        }
        
        // normal
        for(   let r = 0; r < rows;    r++ ) {           // Generate normals by averaging the cross products of all defined neighbor pairs.
            for( let c = 0; c < columns; c++ )
            { let curr = points[r][c], neighbors = new Array(4), normal = Vec.of( 0,0,0 );          
              for( let [ i, dir ] of [ [ -1,0 ], [ 0,1 ], [ 1,0 ], [ 0,-1 ] ].entries() )         // Store each neighbor by rotational order.
                neighbors[i] = points[ r + dir[1] ] && points[ r + dir[1] ][ c + dir[0] ];        // Leave "undefined" in the array wherever
                                                                                                  // we hit a boundary.
              for( let i = 0; i < 4; i++ )                                          // Take cross-products of pairs of neighbors, proceeding
                if( neighbors[i] && neighbors[ (i+1)%4 ] )                          // a consistent rotational direction through the pairs:
                  normal = normal.plus( neighbors[i].minus( curr ).cross( neighbors[ (i+1)%4 ].minus( curr ) ) );          
              normal.normalize();                                                              // Normalize the sum to get the average vector.
                                                         // Store the normal if it's valid (not NaN or zero length), otherwise use a default:
              if( normal.every( x => x == x ) && normal.norm() > .01 )  this.arrays.normal.push( Vec.from( normal ) );    
              else                                                      this.arrays.normal.push( Vec.of( 0,0,1 )    );
            }
        }   

        // indices
        for( var h = 0; h < rows-1; h++ )             // Generate a sequence like this (if #columns is 10):  
            for( var i = 0; i < 2 * (columns-1); i++ )    // "1 11 0  11 1 12  2 12 1  12 2 13  3 13 2  13 3 14  4 14 3..." 
                for( var j = 0; j < 3; j++ )
                    this.indices.push( h * columns + (columns-1) * ( ( i + ( j % 2 ) ) % 2 ) + ( ~~( ( j % 3 ) / 2 ) ? 
                                     ( ~~( i / 2 ) + 2 * ( i % 2 ) )  :  ( ~~( i / 2 ) + 1 ) ) );   
    }
}

/////////////////
// test scenes //
/////////////////
class Height_Map_Test extends Scene {
    constructor() {
      super();
      this.noiseGen = new Noise_Generator(50);
      this.grid_rows=60;
      this.grid_columns=30;

      // level 1
      let scale1 = 0.5;
      let var1 = 2;
      let grid1 = new Noise_Grid(this.grid_rows,this.grid_columns,var1,this.noiseGen);
      let heights1 = grid1.noise.map(a => a.map(b => (b+1)*scale1));

      // level 2
      let scale2 = 0.05;
      let var2 = 5;
      let grid2 = new Noise_Grid(this.grid_rows,this.grid_columns,var2,this.noiseGen);
      let heights2 = grid2.noise.map(a => a.map(b => (b+1)*scale2));

      // level 3
      let scale3 = 0.01;
      let var3 = 25;
      let grid3 = new Noise_Grid(this.grid_rows,this.grid_columns,var3,this.noiseGen);
      let heights3 = grid3.noise.map(a => a.map(b => (b+1)*scale3));

      // combined height
      let final_heights = heights1.map((a,i) => a.map((b,j) => b+heights2[i][j]+heights3[i][j]));
      // split into sub arrays
      let final_heightsA = final_heights.slice(0,this.grid_rows/2+1);
      let final_heightsB = final_heights.slice(this.grid_rows/2,this.grid_rows);

      this.shapes = { 'height_mapA' : new Height_Map(this.grid_rows/2+1, this.grid_columns, final_heightsA),
                      'height_mapB' : new Height_Map(this.grid_rows/2, this.grid_columns, final_heightsB)}; 

      const phong_shader = new defs.Phong_Shader  (2);     
      this.materials = { plastic: new Material( phong_shader, 
                         { ambient: 0.5, diffusivity: 0.7, specularity: 1, color: Color.of( 0.627451,0.321569,0.176471,1 ) } ) };        
    }
    display(context, program_state) {
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
          program_state.set_camera( Mat4.look_at( Vec.of( 80,50,70 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }
      const t = this.t = program_state.animation_time/1000;
      const angle = Math.sin( t );
      const light_position = Mat4.rotation( angle, [ 1,0,0 ] ).times( Vec.of( 0,-1,1,0 ) );
      program_state.lights = [ new Light( light_position, Color.of(1,1,1,1), 1000000 ) ];

      let model_transform = Mat4.identity();
      model_transform.post_multiply( Mat4.rotation( -Math.PI/2, [1,0,0] ) );
      model_transform.post_multiply( Mat4.scale([20,20,20]));
      this.shapes.height_mapA.draw( context, program_state, model_transform, this.materials.plastic );   
      model_transform.post_multiply( Mat4.translation([1,0,0]));
      this.shapes.height_mapB.draw( context, program_state, model_transform, this.materials.plastic ); 
    }
}

class Grayscale_Grid extends Scene
{                                            
  constructor()
    {                  
      super();

      this.noiseGen = new Noise_Generator(50);
      this.grid_variation=4;
      this.grid_rows=10;
      this.grid_columns=15;
      this.noiseGrid = new Noise_Grid(this.grid_rows,this.grid_columns,this.grid_variation,this.noiseGen);

      this.shapes = { 'box' : new Square(),
                  'big_box' : new Noise_Demo(this.noiseGrid) };
                                                              
      const phong_shader = new defs.Phong_Shader  (2);
      const basic_shader = new defs.Basic_Shader();
      
      this.materials = { plastic: new Material( phong_shader, 
                         { ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of(1,1,1,1) } ),
                         basic_material: new Material( basic_shader ) };
    }

  display( context, program_state )
    {                                                
     
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

        
      const blue = Color.of(0,0,.5,1);
      let model_transform = Mat4.identity();

      const light_position = Vec.of(0,-1,1,0); 
      program_state.lights = [ new Light( light_position, Color.of(1,1,1,1), 1000000 ) ];

      model_transform = Mat4.identity();

      this.shapes.big_box.draw( context, program_state, model_transform, this.materials.basic_material );

      // draw background for contrast
      model_transform = Mat4.identity();
      model_transform.post_multiply( Mat4.translation([this.grid_columns-1,-this.grid_rows,-1]));
      model_transform.post_multiply( Mat4.scale([this.grid_columns+1, this.grid_rows+1, 1]));
      this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override(blue));

    }
}

const Noise_Test_Scenes = { Grayscale_Grid, Height_Map_Test };

export { Noise_Test_Scenes, Height_Map, defs }




