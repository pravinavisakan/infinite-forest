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
      
      this.object_container = []; 
// I'm making a temporary container for object, bc I don't want to try and figure out hash table stuff
// at the same time as frustum culling stuff... so this is just an array. we have to iterate through the whole thing
      this.generate_test_grid(); // We only need to call this function once
    }

    generate_test_grid()
    {
      let objects_rendered = 0;
      let test_grid_transform = Mat4.identity();
      test_grid_transform = test_grid_transform.times(Mat4.translation( [-4, 40, -4] ));

      for (let j = 0; j < 10; j++)
      {
            test_grid_transform = test_grid_transform.times(Mat4.translation( [0, -4, 0] ));
            for (let k = 0; k < 10; k++)
            {
              test_grid_transform = test_grid_transform.times(Mat4.translation( [4, 0, 0]));

              // instead of drawing all the objects, store their radius and position
              let object_radius = Math.sqrt(2); // max distance from center of object, in model space
              let box = new Cube();
              this.object_container.push({shape  : box, 
                                          radius : object_radius, 
                                          model_transform : test_grid_transform.copy()})
            }
            test_grid_transform = test_grid_transform.times(Mat4.translation( [-40, 0, 0] ) );
      }


    }


  derive_frustum_points_from_matrix( m, points )
    {
      return points.map( p => Mat4.inverse( m ).times( p.to4(1) ) )
                   .map( p => p.map( x => x/p[3] ).to3() );
    }



  inside_frustum(object, program_state) {

    const view_box_normalized = Vec.cast ( [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
                                           [-1, -1, 1],  [1, -1, 1],  [-1, 1, 1], [1, 1, 1]  );

                                           // The 8 points in order:
                                           // flb, frb, frt, flt, nlb, nrb, nrt, nlt
                                           // However, they change once you put them into frustum_corner_points, like so:
                                           // nlb, nrb, nlt, nrt, flb, frb, flt, frt

    const frustum_corner_points = this.derive_frustum_points_from_matrix( program_state.projection_transform, view_box_normalized);

    // convert object location from model space to camera space
    let camera_inverse = program_state.camera_inverse.copy();
    let model_transform = object.model_transform.copy();
    let modelview_matrix = camera_inverse.post_multiply(model_transform);
    let object_location = modelview_matrix.times(Vec.of(0,0,0,1)); // object centered at origin
    let radius_in_model_space = Vec.of(object.radius, 0, 0);
    let object_radius = modelview_matrix.times(radius_in_model_space);

    let normals = []

    normals.push( this.set3Points_get_n( frustum_corner_points[0], frustum_corner_points[1], frustum_corner_points[2] ) );
    normals.push( this.set3Points_get_n( frustum_corner_points[5], frustum_corner_points[4], frustum_corner_points[7] ) );
    normals.push( this.set3Points_get_n( frustum_corner_points[1], frustum_corner_points[5], frustum_corner_points[3] ) );
    normals.push( this.set3Points_get_n( frustum_corner_points[4], frustum_corner_points[0], frustum_corner_points[6] ) );
    normals.push( this.set3Points_get_n( frustum_corner_points[2], frustum_corner_points[3], frustum_corner_points[6] ) );
    normals.push( this.set3Points_get_n( frustum_corner_points[1], frustum_corner_points[0], frustum_corner_points[5] ) );

    let d_values = []

    d_values.push( this.set3Points_get_d( normals[0], frustum_corner_points[0] ) );
    d_values.push( this.set3Points_get_d( normals[1], frustum_corner_points[5] ) );
    d_values.push( this.set3Points_get_d( normals[2], frustum_corner_points[1] ) );
    d_values.push( this.set3Points_get_d( normals[3], frustum_corner_points[4] ) );
    d_values.push( this.set3Points_get_d( normals[4], frustum_corner_points[2] ) );
    d_values.push( this.set3Points_get_d( normals[5], frustum_corner_points[1] ) );

    let is_inside_frustum = true; // by default we put true.

    // get object's relationship to each plane
    for (let i = 0; i < 6; i++) {
      // tbh, not sure why we have to scale up the object radius.
      // I just know the shapes at the edges don't get drawn if we follow the formula that makes more sense...
      let correction_factor = 300;
      if (normals[i].dot(object_location) + d_values[i] - correction_factor*object_radius[0] > 0) {
        is_inside_frustum = false;
        break;
      }
    }

    return is_inside_frustum
  }

  set3Points_get_n( v1, v2, v3)
  {
    let vectorp_1 = v1.minus(v2);
    let vectorp_2 = v1.minus(v3);

    let normal_vectorp = vectorp_1.cross(vectorp_2); // cross product. this gives the normal vector, or (a, b, c) in the equation.

    return normal_vectorp; // RETURN A VEC3.
  }

    set3Points_get_d( n, p )
  {
    let normal_vectorp = n;

    let d = -1 * normal_vectorp.dot(p); // dot product. gives a SCALAR.
    return d; // RETURN A SCALAR.
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


      const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 ), yellow_glass = Color.of( 1, 1, 0, 0.4 );

                                    // Variable model_transform will be a local matrix value that helps us position shapes.
                                    // It starts over as the identity every single frame - coordinate axes at the origin.
      let model_transform = Mat4.identity(); 

                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by 
                                                // the shader when coloring shapes.  See Light's class definition for inputs.

                                                // TODO (#3c):  Replace with a point light located at the origin, with the sun's color
                                                // (created above).  For the third argument pass in the point light's size.  Use
                                                // 10 to the power of sun_size.
      program_state.lights = [ new Light( Vec.of( 0,0,0,1 ), Color.of( 1,1,1,1 ), 100000 ) ];


      // iterate through all objects
      // if the object is in the frustum, draw it
      let objects_drawn = 0;
      let total_objects = this.object_container.length;
      for (let i=0; i < total_objects; i++) {
        let object = this.object_container[i];
        // we check to see if the object is inside frustum. If true, then draw object.
        if (this.inside_frustum(object, program_state)) {
          object.shape.draw(context, program_state, object.model_transform, this.materials.plastic);
          objects_drawn++; // debug counter
        }
      }

      console.log(objects_drawn);

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
      this.arrays.position = Vec.cast( [-0.1,1,0], [0.1,1,0], [2,-1,0], [0,-1,0], [-2,-1,0] ) // Original values were 1 where 0.1 are currently. 
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