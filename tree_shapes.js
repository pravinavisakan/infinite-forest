import {tiny, defs} from './common.js';
import {colored_shapes_defs} from './colored-shapes.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Cylindrical_Tube, Triangle, Windmill, Tetrahedron} = defs;
const { cCube, cTetrahedron } = colored_shapes_defs;

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

const brown = Color.of(0.545098, 0.270588, 0.0745098, 1);
const green = Color.of(0.180392, 0.545098, 0.341176, 1);

// a simple box branch
insertBranchFunctions.push(insertShape(cCube, [brown],undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0])));

// a simple tetrahedron leaf
insertLeafFunctions.push(insertShape(cTetrahedron, [green],undefined, Mat4.translation([0,0,0]), Mat4.translation([0,0,0])));

// a simple branch out that rotates 45 degrees to the left, along z
branchOutFunctions.push(branchOut(Math.PI/4, Vec.of(0,0,1)));

// a simple endBranch that rotates right 45 degrees along z
endBranchFunctions.push(endBranch(-Math.PI/4, Vec.of(0,0,1)));

// TODO add some sick custom shapes here, and add the appropriate symbol functions


// exports
export {insertBranchFunctions, insertLeafFunctions, branchOutFunctions, endBranchFunctions}

