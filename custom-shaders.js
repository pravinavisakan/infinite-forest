import {tiny, defs} from './common.js';
import {colored_shapes_defs} from './colored-shapes.js'

const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere } = defs;
const { Snowman } = colored_shapes_defs;


// This is the modified shader we can use on our plants.
// It's for any shape that has color values for each vertex 
// and it also does Phong lighting
// When you make one, pass it the maximum number of lights in the scene.
const Combined_Shape_Shader = defs.Combined_Shape_Shader =
class Combined_Shape_Shader extends Shader
{                                  
  
  constructor( num_lights = 2 )
    { super(); 
      this.num_lights = num_lights;
    }

  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return ` precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec3 squared_scale, camera_center;

                              // Specifier "varying" means a variable's final value will be passed from the vertex shader
                              // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
                              // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 VERTEX_COLOR;
                                             // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace )
          {                                        // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++)
              {
                            // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                            // light will appear directional (uniform direction from all points), and we 
                            // simply obtain a vector towards the light by directly using the stored value.
                            // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                            // the point light's location from the current surface point.  In either case, 
                            // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                                                  // Compute the diffuse and specular components from the Phong
                                                  // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                
                vec3 light_contribution = VERTEX_COLOR.xyz * light_colors[i].xyz * diffusivity * diffuse
                                          + light_colors[i].xyz * specularity * specular;

                result += attenuation * light_contribution;
              }
            return result;
          } ` ;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `
        attribute vec4 color;
        attribute vec3 position, normal;                            // Position is expressed in object coordinates.
        
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;

        void main()
          {                                                                   // The vertex's final resting place (in NDCS):
            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                                                                              // The final normal vector in screen space.
            N = normalize( mat3( model_transform ) * normal / squared_scale);
            
            vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            VERTEX_COLOR = color;
          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER ********* 
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.                                 
      return this.shared_glsl_code() + `
        void main()
          {                                                           // Compute an initial (ambient) color:
            gl_FragColor = vec4( VERTEX_COLOR.xyz * ambient, VERTEX_COLOR.w );
                                                                     // Compute the final color with contributions from lights:
            gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
          } ` ;
    }
  send_material( gl, gpu, material )
    {                                       // send_material(): Send the desired shape-wide material qualities to the
                                            // graphics card, where they will tweak the Phong lighting formula.                                      
      gl.uniform1f ( gpu.ambient,        material.ambient     );
      gl.uniform1f ( gpu.diffusivity,    material.diffusivity );
      gl.uniform1f ( gpu.specularity,    material.specularity );
      gl.uniform1f ( gpu.smoothness,     material.smoothness  );
    }
  send_gpu_state( gl, gpu, gpu_state, model_transform )
    {                                       // send_gpu_state():  Send the state of our whole drawing context to the GPU.
      const O = Vec.of( 0,0,0,1 ), camera_center = gpu_state.camera_transform.times( O ).to3();
      gl.uniform3fv( gpu.camera_center, camera_center );
                                         // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
      const squared_scale = model_transform.reduce( 
                                         (acc,r) => { return acc.plus( Vec.from(r).mult_pairs(r) ) }, Vec.of( 0,0,0,0 ) ).to3();                                            
      gl.uniform3fv( gpu.squared_scale, squared_scale );     
                                                      // Send the current matrices to the shader.  Go ahead and pre-compute
                                                      // the products we'll need of the of the three special matrices and just
                                                      // cache and send those.  They will be the same throughout this draw
                                                      // call, and thus across each instance of the vertex shader.
                                                      // Transpose them since the GPU expects matrices as column-major arrays.
      const PCM = gpu_state.projection_transform.times( gpu_state.camera_inverse ).times( model_transform );
      gl.uniformMatrix4fv( gpu.                  model_transform, false, Mat.flatten_2D_to_1D( model_transform.transposed() ) );
      gl.uniformMatrix4fv( gpu.projection_camera_model_transform, false, Mat.flatten_2D_to_1D(             PCM.transposed() ) );

                                             // Omitting lights will show only the material color, scaled by the ambient term:
      if( !gpu_state.lights.length )
        return;

      const light_positions_flattened = [], light_colors_flattened = [];
      for( var i = 0; i < 4 * gpu_state.lights.length; i++ )
        { light_positions_flattened                  .push( gpu_state.lights[ Math.floor(i/4) ].position[i%4] );
          light_colors_flattened                     .push( gpu_state.lights[ Math.floor(i/4) ].color[i%4] );
        }      
      gl.uniform4fv( gpu.light_positions_or_vectors, light_positions_flattened );
      gl.uniform4fv( gpu.light_colors,               light_colors_flattened );
      gl.uniform1fv( gpu.light_attenuation_factors, gpu_state.lights.map( l => l.attenuation ) );
    }
  update_GPU( context, gpu_addresses, gpu_state, model_transform, material )
    {             // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader 
                  // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                  // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or 
                  // program (which we call the "Program_State").  Send both a material and a program state to the shaders 
                  // within this function, one data field at a time, to fully initialize the shader for a draw.                  
      
                  // Fill in any missing fields in the Material object with custom defaults for this shader:
      const defaults = { ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40 };
      material = Object.assign( {}, defaults, material );

      this.send_material ( context, gpu_addresses, material );
      this.send_gpu_state( context, gpu_addresses, gpu_state, model_transform );
    }
}
// This is the end of the modified shader

// EXAMPLE SCENE USING Combined_Shape_Shader
const Combined_Shapes_Test =
class Combined_Shapes_Test extends Scene {
  constructor()
    {                  
      super();

      this.shapes = { 'box' : new Cube(),
                  'snowman' : new Snowman() }; // I added my example combined shape to the shapes object
      
      const phong_shader = new defs.Phong_Shader(2);                                                      
      const combo_shader = new defs.Combined_Shape_Shader(2); // 2 =  maximum number of lights in the scene
      const basic_shader = new defs.Basic_Shader();
      
      // I made a material called "combo"
      // When you make a material with the Combined_Shape_Shader, you can specify ambient, diffusivity, and specularity 
      // The same way we do for the normal Phong Shader.
      // Don't pass it a color
      this.materials = { plastic: new Material( phong_shader, 
                         { ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of(1,1,1,1) } ),
                         combo: new Material( combo_shader, 
                         { ambient: 0.3, diffusivity: 0.5, specularity: 0 } ), 
                         basic_material: new Material( basic_shader ) };
    }

  display( context, program_state )
    {                                                
     
      if( !context.scratchpad.controls ) 
        {                       
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 
     
          program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }
      
      const blue = Color.of(0,0,.5,1);
      let model_transform = Mat4.identity();

      const angle = Math.sin( program_state.animation_time / 1000 );
      const light_position = Mat4.rotation(angle, [1,0,0]).times( Vec.of(0,-1,1,0) ); 
      program_state.lights = [ new Light( light_position, Color.of(1,1,1,1), 1000000 ) ];

      model_transform = Mat4.identity();
      model_transform.post_multiply(Mat4.translation([0,0,-2]))
      // When you draw a shape with the combo material, don't use the override method with a color.
      this.shapes.snowman.draw( context, program_state, model_transform, this.materials.combo );

      model_transform.post_multiply( Mat4.translation([2,1,-5]));
      model_transform.post_multiply( Mat4.scale([2, 2, 1]));
      this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override(blue));

    }  
}

export { defs, Combined_Shapes_Test, Combined_Shape_Shader }