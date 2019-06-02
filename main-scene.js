import {tiny, defs} from './assignment-4-resources.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Triangle, Cube, Subdivision_Sphere, Transforms_Sandbox_Base, Square, Grid_Patch } = defs;

import { Noise_Grid, Noise_Generator } from './perlin-noise.js'

    // Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
    // This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// (Can define Main_Scene's class here)


var spatialHashTable = {}; 
var CELL_SIZE = 50;

spatialHashTable.add = function(obj)
  {
      var X = Math.round(obj.x / CELL_SIZE) * CELL_SIZE;
      var Y = Math.round(obj.y / CELL_SIZE) * CELL_SIZE;
      var key = X + "," + Y;
      if(spatialHashTable[key] == undefined)
        {
          spatialHashTable[key] = []
        }
      spatialHashTable[key].push(obj)
  }



















const Main_Scene =
class Solar_System extends Scene
{                                             // **Solar_System**:  Your Assignment's Scene.
  constructor()
    {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
      super();
                                                        // At the beginning of our program, load one of each of these shape 
                                                        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape.
                                                        // Don't define blueprints for shapes in display() every frame.

                                                // TODO (#1):  Complete this list with any additional shapes you need.
      this.shapes = { 'box' : new Cube(),
                   'ball_4' : new Subdivision_Sphere( 4 ),
                     'star' : new Planar_Star(),
                      'triangle' : new Triangle(),
                      'square' : new Square(),
                      'trapezoid' : new Trapezoid()};

                                                        // TODO (#1d): Modify one sphere shape's existing texture 
                                                        // coordinates in place.  Multiply them all by 5.
      // this.shapes.ball_repeat.arrays.texture_coord.forEach( coord => coord
      
                                                              // *** Shaders ***

                                                              // NOTE: The 2 in each shader argument refers to the max
                                                              // number of lights, which must be known at compile time.
                                                              
                                                              // A simple Phong_Blinn shader without textures:
      const phong_shader      = new defs.Phong_Shader  (2);
                                                              // Adding textures to the previous shader:
      const texture_shader    = new defs.Textured_Phong(2);
                                                              // Same thing, but with a trick to make the textures 
                                                              // seemingly interact with the lights:
      const texture_shader_2  = new defs.Fake_Bump_Map (2);
                                                              // A Simple Gouraud Shader that you will implement:
      const gouraud_shader    = new Gouraud_Shader     (2);
                                                              // Extra credit shaders:
      const black_hole_shader = new Black_Hole_Shader();
      const sun_shader        = new Sun_Shader();
      
                                              // *** Materials: *** wrap a dictionary of "options" for a shader.

                                              // TODO (#2):  Complete this list with any additional materials you need:

      this.materials = { plastic: new Material( phong_shader, 
                                    { ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of( 1,.5,1,1 ) } ),
                   plastic_stars: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/stars.png" ),
                                      ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of( .4,.4,.4,1 ) } ),
                           metal: new Material( phong_shader,
                                    { ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( 1,.5,1,1 ) } ),
                     metal_earth: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/earth.gif" ),
                                      ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( .4,.4,.4,1 ) } ),
                      black_hole: new Material( black_hole_shader ),
                             sun: new Material( sun_shader, { ambient: 1, color: Color.of( 0,0,0,1 ) } )
                       };

                                  // Some setup code that tracks whether the "lights are on" (the stars), and also
                                  // stores 30 random location matrices for drawing stars behind the solar system:
      this.lights_on = false;
      this.star_matrices = [];
      for( let i=0; i<30; i++ )
        this.star_matrices.push( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 0,1,0 ) )
                         .times( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 1,0,0 ) ) )
                         .times( Mat4.translation([ 0,0,-150 ]) ) );
    }
  make_control_panel()
    {                                 // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                      // buttons with key bindings for affecting this scene, and live info readouts.

                                 // TODO (#5b): Add a button control.  Provide a callback that flips the boolean value of "this.lights_on".
       // this.key_triggered_button( 
    }

    generate_test_grid(context, program_state)
    {
      let objects_rendered = 0;
      let test_grid_transform = Mat4.identity();
      test_grid_transform = test_grid_transform.times(Mat4.translation( [-4, 0, -4] ));

    for (let j = 0; j < 10; j++)
    {
          test_grid_transform = test_grid_transform.times(Mat4.translation( [0, 0, 4] ));
          for (let k = 0; k < 10; k++)
          {
            test_grid_transform = test_grid_transform.times(Mat4.translation( [0, 4, 0]));
            this.shapes.box.draw( context , program_state ,test_grid_transform , this.materials.plastic );
            objects_rendered++;
          }
          test_grid_transform = test_grid_transform.times(Mat4.translation( [0, -40, 0] ) );
    }


    }


  derive_frustum_points_from_matrix( m, points )
    {
      return points.map( p => Mat4.inverse( m ).times( p.to4(1) ) )
                   .map( p => p.map( x => x/p[3] ).to3() );
    }


// Display() will have to be called.
  display( context, program_state )
    {                                                // display():  Called once per frame of animation.  For each shape that you want to
                                                     // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
                                                     // different matrix value to control where the shape appears.
     
                           // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
      if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 

                                // Add a helper scene / child scene that allows viewing each moving body up close.
          this.children.push( this.camera_teleporter = new Camera_Teleporter() );

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

                                                  // Have to reset this for each frame:
      this.camera_teleporter.cameras = [];
      this.camera_teleporter.cameras.push( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );


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

      const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 ), yellow_glass = Color.of( 1, 1, 0, 0.4 );

                                    // Variable model_transform will be a local matrix value that helps us position shapes.
                                    // It starts over as the identity every single frame - coordinate axes at the origin.
      let model_transform = Mat4.identity();

                                                  // TODO (#3b):  Use the time-varying value of sun_size to create a scale matrix 
                                                  // for the sun. Also use it to create a color that turns redder as sun_size
                                                  // increases, and bluer as it decreases.
      const smoothly_varying_ratio = .5 + .5 * Math.sin( 2 * Math.PI * t/10 ),
            sun_size = 1 + 2 * smoothly_varying_ratio,
                 sun = undefined,
           sun_color = undefined;

      this.materials.sun.color = sun_color;     // Assign our current sun color to the existing sun material.          

                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by 
                                                // the shader when coloring shapes.  See Light's class definition for inputs.

                                                // TODO (#3c):  Replace with a point light located at the origin, with the sun's color
                                                // (created above).  For the third argument pass in the point light's size.  Use
                                                // 10 to the power of sun_size.
      program_state.lights = [ new Light( Vec.of( 0,0,0,1 ), Color.of( 1,1,1,1 ), 100000 ) ];

                            // TODO (#5c):  Throughout your program whenever you use a material (by passing it into draw),
                            // pass in a modified version instead.  Call .override( modifier ) on the material to
                            // generate a new one that uses the below modifier, replacing the ambient term with a 
                            // new value based on our light switch.                         
      const modifier = this.lights_on ? { ambient: 0.3 } : { ambient: 0.0 };

                                              
     









      this.generate_test_grid(context, program_state);

      let new_camera_transform = Mat4.identity();

      new_camera_transform = new_camera_transform.times(Mat4.translation( [5, 5, 10] )).times(Mat4.inverse(Mat4.look_at( Vec.of(0, 0, 1), Vec.of(Math.sin(t), 0, 0), Vec.of(0, 1, 0) ))) ;

      // okay... I think I get it, how to use look_at. First argument is the eye. That's the axis...or something. Second argument is the direction you are looking.
      // third argument is which direction is up. Uusally just put 0, 1, 0 and be done with it.

      this.shapes.box.draw (context, program_state, new_camera_transform, this.materials.plastic_stars);
      // console.log(new_camera_transform);

      //program_state.set_camera( Mat4.translation(Vec.of(0, 0, -20)).times(Mat4.rotation( Math.sin(t), Vec.of( 0, 1, 0))) );



      this.camera_teleporter.cameras.push (Mat4.translation( [0, 0, -10] ).times(Mat4.inverse(new_camera_transform)));




// I'm going to try drawing a frustum using the Trapezoid class. let's hope this goes well!

      let near_fplane_transform = new_camera_transform.copy().times(Mat4.translation( [0, 0, -2]));
      // let near_fplane_transform = Mat4.identity();

      this.shapes.square.draw ( context, program_state, near_fplane_transform, this.materials.plastic.override( yellow_glass ) );


      let far_fplane_transform = near_fplane_transform.copy();
      var NEAR_FAR_FPLANE_DIST = 100
       // var NEAR_FAR_FPLANE_DIST = 20 + Math.sin(2 * t) * 5;

      var NEAR_FPLANE_SCALE = 1;
      var FAR_FPLANE_SCALE = 20;

      var NEAR_FAR_FPLANE_SDIFF = FAR_FPLANE_SCALE - NEAR_FPLANE_SCALE;

      far_fplane_transform = far_fplane_transform.times(Mat4.translation( [0, 0, -NEAR_FAR_FPLANE_DIST ] ))
                                                 .times(Mat4.rotation( Math.PI , [1, 0, 0] ));

      this.shapes.square.draw (context, program_state, far_fplane_transform.times(Mat4.scale( [ FAR_FPLANE_SCALE, FAR_FPLANE_SCALE, 1 ] ) ),
                               this.materials.plastic.override( yellow_glass ) );


      let right_fplane_transform = near_fplane_transform.copy();
      right_fplane_transform = right_fplane_transform.times(Mat4.translation( [NEAR_FAR_FPLANE_SDIFF/2 + NEAR_FPLANE_SCALE, 0, -NEAR_FAR_FPLANE_DIST / 2] ))
                                                     .times(Mat4.rotation( Math.PI / 2 - Math.atan( NEAR_FAR_FPLANE_SDIFF / NEAR_FAR_FPLANE_DIST), [0, 1, 0] ))
                                                     .times(Mat4.rotation( Math.PI / 2, [0, 0, 1] ));

      this.shapes.trapezoid.draw (context, program_state, right_fplane_transform.times(Mat4.scale( [FAR_FPLANE_SCALE/2, NEAR_FAR_FPLANE_DIST/2, 1])),
                               this.materials.plastic.override( yellow_glass ));


      let left_fplane_transform = near_fplane_transform.copy();
      left_fplane_transform = left_fplane_transform.times(Mat4.translation( [-NEAR_FAR_FPLANE_SDIFF/2 - NEAR_FPLANE_SCALE, 0, -NEAR_FAR_FPLANE_DIST / 2] ))
                                                     .times(Mat4.rotation( -Math.PI / 2 + Math.atan( NEAR_FAR_FPLANE_SDIFF / NEAR_FAR_FPLANE_DIST), [0, 1, 0] ))
                                                     .times(Mat4.rotation( -Math.PI / 2, [0, 0, 1] ));

      this.shapes.trapezoid.draw (context, program_state, left_fplane_transform.times(Mat4.scale( [ FAR_FPLANE_SCALE/2, NEAR_FAR_FPLANE_DIST/2, 1])),
                               this.materials.plastic.override( yellow_glass ));



      let top_fplane_transform = near_fplane_transform.copy();
      top_fplane_transform = top_fplane_transform.times(Mat4.translation( [0, NEAR_FAR_FPLANE_SDIFF/2 + NEAR_FPLANE_SCALE, -NEAR_FAR_FPLANE_DIST / 2] ))
                                                     .times(Mat4.rotation( -Math.PI / 2 + Math.atan( NEAR_FAR_FPLANE_SDIFF / NEAR_FAR_FPLANE_DIST), [1, 0, 0] ))
                                                     .times(Mat4.rotation( Math.PI, [0, 0, 1]))

      this.shapes.trapezoid.draw (context, program_state, top_fplane_transform.times(Mat4.scale( [FAR_FPLANE_SCALE/2, NEAR_FAR_FPLANE_DIST/2, 1] )), 
                                this.materials.plastic.override( yellow_glass));


      let bottom_fplane_transform = near_fplane_transform.copy();
      bottom_fplane_transform = bottom_fplane_transform.times(Mat4.translation( [0, -NEAR_FAR_FPLANE_SDIFF/2 - NEAR_FPLANE_SCALE, -NEAR_FAR_FPLANE_DIST / 2] ))
                                                     .times(Mat4.rotation( Math.PI / 2 - Math.atan( NEAR_FAR_FPLANE_SDIFF / NEAR_FAR_FPLANE_DIST), [1, 0, 0] ))
                                                     

      this.shapes.trapezoid.draw (context, program_state, bottom_fplane_transform.times(Mat4.scale( [ FAR_FPLANE_SCALE/2, NEAR_FAR_FPLANE_DIST/2, 1] )), 
                                this.materials.plastic.override( yellow_glass));



      const view_box_normalized = Vec.cast ( [-1, -1, -1], [1, -1, -1], [1, 1, -1], [1, 1, -1],
                                             [-1, -1, 1],  [1, -1, 1],  [-1, 1, 1], [1, 1, 1]  );

      const frustum_corner_points = this.derive_frustum_points_from_matrix( program_state.projection_transform, view_box_normalized);


for (let k = 0; k < 6; k++)
  {
    if (k == 0) 
    {

    }
  }

      var aFrustum = new Frustum();

      aFrustum.set_frustum_coords(frustum_corner_points[0], frustum_corner_points[1], frustum_corner_points[2], frustum_corner_points[3],
                                  frustum_corner_points[4], frustum_corner_points[5], frustum_corner_points[6], frustum_corner_points[7]);


// Curses... I ran into a problem. To fix it, I will no longer be able to adjust the angle of the field of view.
// AKA the problem lies with scaling the Trapezoids. I had previously hard-coded them so that the top side is length 2 and bottom side is length 4. With that, scaling will make the ratio
// of 2:4 always remain.

// That can be remedied by no longer allowing the player to change the frustum view. 
// I decided to use a distance of 100 between the near and far planes. Now, the Trapezoids have been given 0.2 instead of 1 to reflect that change. See Trapezoid class for more.

// Depending on how large the far plane is compared to the near plane, the vertices for the Trapezoids will have to change accordingly.


// 2 / x








      // ***** BEGIN TEST SCENE *****               
                                          // TODO:  Delete (or comment out) the rest of display(), starting here:
                                          /*

      program_state.set_camera( Mat4.translation([ 0,3,-10 ]) );
      const angle = Math.sin( t );
      const light_position = Mat4.rotation( angle, [ 1,0,0 ] ).times( Vec.of( 0,-1,1,0 ) );
      program_state.lights = [ new Light( light_position, Color.of( 1,1,1,1 ), 1000000 ) ];
      model_transform = Mat4.identity();
      this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override( yellow ) );
      model_transform.post_multiply( Mat4.translation([ 0, -2, 0 ]) );
      this.shapes.ball_4.draw( context, program_state, model_transform, this.materials.metal_earth.override( blue ) );
      model_transform.post_multiply( Mat4.rotation( t, Vec.of( 0,1,0 ) ) )
      model_transform.post_multiply( Mat4.rotation( 1, Vec.of( 0,0,1 ) )
                             .times( Mat4.scale      ([ 1,   2, 1 ]) )
                             .times( Mat4.translation([ 0,-1.5, 0 ]) ) );
      this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic_stars.override( yellow ) );
      */

      // ***** END TEST SCENE *****

      // Warning: Get rid of the test scene, or else the camera position and movement will not work.


    }
}

const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }


const Camera_Teleporter = defs.Camera_Teleporter =
class Camera_Teleporter extends Scene
{                               // **Camera_Teleporter** is a helper Scene meant to be added as a child to
                                // your own Scene.  It adds a panel of buttons.  Any matrices externally
                                // added to its "this.cameras" can be selected with these buttons. Upon
                                // selection, the program_state's camera matrix slowly (smoothly)
                                // linearly interpolates itself until it matches the selected matrix.
  constructor() 
    { super();
      this.cameras = [];
      this.selection = 0;
    }
  make_control_panel()
    {                                // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                     // buttons with key bindings for affecting this scene, and live info readouts.
      
      this.key_triggered_button(  "Enable",       [ "e" ], () => this.enabled = true  );
      this.key_triggered_button( "Disable", [ "Shift", "E" ], () => this.enabled = false );
      this.new_line();
      this.key_triggered_button( "Previous location", [ "g" ], this.decrease );
      this.key_triggered_button(              "Next", [ "h" ], this.increase );
      this.new_line();
      this.live_string( box => { box.textContent = "Selected camera location: " + this.selection } );
    }  
  increase() { this.selection = Math.min( this.selection + 1, Math.max( this.cameras.length-1, 0 ) ); }
  decrease() { this.selection = Math.max( this.selection - 1, 0 ); }   // Don't allow selection of negative indices.
  display( context, program_state )
  {
    const desired_camera = this.cameras[ this.selection ];
    if( !desired_camera || !this.enabled )
      return;
    const dt = program_state.animation_delta_time;
    program_state.set_camera( desired_camera.map( (x,i) => Vec.from( program_state.camera_inverse[i] ).mix( x, .01*dt ) ) );    
  }
}


const Planar_Star = defs.Planar_Star =
class Planar_Star extends Shape
{                                 // **Planar_Star** defines a 2D five-pointed star shape.  The star's inner 
                                  // radius is 4, and its outer radius is 7.  This means the complete star 
                                  // fits inside a 14 by 14 sqaure, and is centered at the origin.
  constructor()
    { super( "position", "normal", "texture_coord" );
                    
      this.arrays.position.push( Vec.of( 0,0,0 ) );
      for( let i = 0; i < 11; i++ )
        {
          const spin = Mat4.rotation( i * 2*Math.PI/10, Vec.of( 0,0,-1 ) );

          const radius = i%2 ? 4 : 7;
          const new_point = spin.times( Vec.of( 0,radius,0,1 ) ).to3();

          this.arrays.position.push( new_point );
          if( i > 0 )
            this.indices.push( 0, i, i+1 )
        }         
                 
      this.arrays.normal        = this.arrays.position.map( p => Vec.of( 0,0,-1 ) );

                                      // TODO (#5a):  Fill in some reasonable texture coordinates for the star:
      // this.arrays.texture_coord = this.arrays.position.map( p => 
    }
}


// TODO: this needs to be implemented properly! This is for the view frustum.

const Trapezoid = defs.Trapezoid =
class Trapezoid extends Shape
{                                 // **Trapezoid** demonstrates two triangles that share vertices.  On any planar surface, the 
                                  // interior edges don't make any important seams.  In these cases there's no reason not
                                  // to re-use data of the common vertices between triangles.  This makes all the vertex 
                                  // arrays (position, normals, etc) smaller and more cache friendly.
  constructor()
    { super( "position", "normal", "texture_coord" );
                                          // Specify the 4 square corner locations, and match those up with normal vectors:
     // this.arrays.position      = Vec.cast( [-1,-1,0], [1,-1,0], [-1,1,0], [1,1,0] );
      this.arrays.position = Vec.cast( [-0.1,1,0], [0.1,1,0], [2,-1,0], [0,-1,0], [-2,-1,0] ) // Original values were 1 where 0.1 are currently. I put 0.2 to 
      this.arrays.normal        = Vec.cast( [0,0,1],   [0,0,1],  [0,0,1],  [0,0,1], [0,0,1] );
                                                          // Arrange the vertices into a square shape in texture space too:
      this.arrays.texture_coord = Vec.cast( [0,1],     [1,1],    [1,0],    [0.5,0], [0,0]   );
                                                     // Use two triangles this time, indexing into four distinct vertices:
      this.indices.push( 4, 0, 3,     0, 1, 3,     1, 2, 3 );
    }

}




const Frustum = defs.Frustum = 
class Frustum extends Shape
  {
    constructor()
    {
      super( "position", "normal", "texture_coord" );


      this.ntl;
      this.ntr;
      this.nbl;
      this.nbr;

      this.ftl;
      this.ftr;
      this.fbl;
      this.fbr;
                                          // Specify the 4 square corner locations, and match those up with normal vectors:
     // this.arrays.position      = Vec.cast( [-1,-1,0], [1,-1,0], [-1,1,0], [1,1,0] );
      this.arrays.position = Vec.cast( [-0.1,this.nbr,0], [0.1,1,0], [2,-1,0], [0,-1,0], [-2,-1,0] ) // Original values were 1 where 0.1 are currently. 
      this.arrays.normal        = Vec.cast( [0,0,1],   [0,0,1],  [0,0,1],  [0,0,1], [0,0,1] );
                                                          // Arrange the vertices into a square shape in texture space too:
      this.arrays.texture_coord = Vec.cast( [0,1],     [1,1],    [1,0],    [0.5,0], [0,0]   );
                                                     // Use two triangles this time, indexing into four distinct vertices:
      this.indices.push( 4, 0, 3,     0, 1, 3,     1, 2, 3 );

      // this.blah = 2;

      

      
    
    }
      set_frustum_coords( ntl_input, ntr_input, nbl_input, nbr_input, ftl_input, ftr_input, fbl_input, fbr_input )
      {
        this.ntl = ntl_input;
        this.ntr = ntr_input;
        this.nbl = nbl_input;
        this.nbr = nbr_input;

        this.ftl = ftl_input;
        this.ftr = ftr_input;
        this.fbl = fbl_input;
        this.fbr = fbr_input;
      }
    

  }




const Gouraud_Shader = defs.Gouraud_Shader =
class Gouraud_Shader extends defs.Phong_Shader
{ 
  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { 
                          // TODO (#6b2.1):  Copy the Phong_Shader class's implementation of this function, but
                          // change the two "varying" vec3s declared in it to just one vec4, called color.
                          // REMEMBER:
                          // **Varying variables** are passed on from the finished vertex shader to the fragment
                          // shader.  A different value of a "varying" is produced for every single vertex
                          // in your array.  Three vertices make each triangle, producing three distinct answers
                          // of what the varying's value should be.  Each triangle produces fragments (pixels), 
                          // and the per-fragment shader then runs.  Each fragment that looks up a varying 
                          // variable will pull its value from the weighted average of the varying's value
                          // from the three vertices of its triangle, weighted according to how close the 
                          // fragment is to each extreme corner point (vertex).

      return `

      ` ;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { 
                                          // TODO (#6b2.2):  Copy the Phong_Shader class's implementation of this function,
                                          // but declare N and vertex_worldspace as vec3s local to function main,
                                          // since they are no longer scoped as varyings.  Then, copy over the
                                          // fragment shader code to the end of main() here.  Computing the Phong
                                          // color here instead of in the fragment shader is called Gouraud
                                          // Shading.  
                                          // Modify any lines that assign to gl_FragColor, to assign them to "color", 
                                          // the varying you made, instead.  You cannot assign to gl_FragColor from 
                                          // within the vertex shader (because it is a special variable for final
                                          // fragment shader color), but you can assign to varyings that will be 
                                          // sent as outputs to the fragment shader.

      return this.shared_glsl_code() + `
        void main()
          {
             
          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER ********* 
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.  

                               // TODO (#6b2.3):  Leave the main function almost blank, except assign gl_FragColor to
                               // just equal "color", the varying you made earlier.
      return this.shared_glsl_code() + `
        void main()
          {
                        
          } ` ;
    }
}


const Black_Hole_Shader = defs.Black_Hole_Shader =
class Black_Hole_Shader extends Shader         // Simple "procedural" texture shader, with texture coordinates but without an input image.
{ update_GPU( context, gpu_addresses, program_state, model_transform, material )
      { 
                  // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader 
                  // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                  // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or 
                  // program (which we call the "Program_State").  Send both a material and a program state to the shaders 
                  // within this function, one data field at a time, to fully initialize the shader for a draw.

                  // TODO (#EC 1b):  Send the GPU the only matrix it will need for this shader:  The product of the projection, 
                  // camera, and model matrices.  The former two are found in program_state; the latter is directly 
                  // available here.  Finally, pass in the animation_time from program_state. You don't need to allow
                  // custom materials for this part so you don't need any values from the material object.
                  // For an example of how to send variables to the GPU, check out the simple shader "Funny_Shader".

        // context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform,       
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { 
                  // TODO (#EC 1c):  For both shaders, declare a varying vec2 to pass a texture coordinate between
                  // your shaders.  Also make sure both shaders have an animation_time input (a uniform).
      return `precision mediump float;
             
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    {
                          // TODO (#EC 1d,e):  Create the final "gl_Position" value of each vertex based on a displacement
                          // function.  Also pass your texture coordinate to the next shader.  As inputs,
                          // you have the current vertex's stored position and texture coord, animation time,
                          // and the final product of the projection, camera, and model matrices.
      return this.shared_glsl_code() + `

        void main()
        { 

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { 
                          // TODO (#EC 1f):  Using the input UV texture coordinates and animation time,
                          // calculate a color that makes moving waves as V increases.  Store
                          // the result in gl_FragColor.
      return this.shared_glsl_code() + `
        void main()
        { 

        }`;
    }
}


const Sun_Shader = defs.Sun_Shader =
class Sun_Shader extends Shader
{ update_GPU( context, gpu_addresses, graphics_state, model_transform, material )
    {
                      // TODO (#EC 2): Pass the same information to the shader as for EC part 1.  Additionally
                      // pass material.color to the shader.


    }
                                // TODO (#EC 2):  Complete the shaders, displacing the input sphere's vertices as
                                // a fireball effect and coloring fragments according to displacement.

  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
                            
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `

        void main()
        {

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        void main() 
        {

        } ` ;
    }
}