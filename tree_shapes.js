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
const insertFlowerFunctions= [];
const insertFruitFunctions= [];
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

// a new function - returns a function that inserts a shape based on an obj file (to handle asynchronous file load)
const insertObj = (filename, shape_transformation = Mat4.identity(), pre_transformation = Mat4.identity(), post_transformation = Mat4.identity(), color) => {
	return (model_transform, recipient) => {
		let transform = model_transform.times(pre_transformation)
		recipient.load_obj_file(filename, transform, shape_transformation, color);
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
const red = Color.of(0.9, 0.4, 0.0745098, 1);
const white = Color.of(1., 1., 1., 1);
const yellow = Color.of(0.87, 0.87, 0.1, 1);
const blue = Color.of(0.1, 0.6, 0.95, 1);
const darkred = Color.of(0.96, 0.08, 0.12, 1);

// a simple box branch
insertBranchFunctions.push(insertShape(cCube, [brown],undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0])));

// a simple tetrahedron leaf
insertLeafFunctions.push(insertShape(cTetrahedron, [green],undefined, Mat4.translation([0,0,0]), Mat4.translation([0,0,0])));

// a simple branch out that rotates 45 degrees to the left, along z
branchOutFunctions.push(branchOut(Math.PI/4, Vec.of(0,0,1)));

// a simple endBranch that rotates right 45 degrees along z
endBranchFunctions.push(endBranch(-Math.PI/4, Vec.of(0,0,1)));

// TODO add some more sick custom shapes here, and add the appropriate symbol functions

// adds an insertion function for custom leaf 1, to be used in plant generation later
insertLeafFunctions.push(insertObj("assets/leaf1.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), green));

// adds an insertion function for custom leaf 2, to be used in plant generation later
insertLeafFunctions.push(insertObj("assets/leaf2.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), green));

// adds an insertion function for custom leaf 3, to be used in plant generation later
insertLeafFunctions.push(insertObj("assets/leaf3.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), red));

// adds an insertion function for custom leaf 4, to be used in plant generation later
insertLeafFunctions.push(insertObj("assets/leaf4.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), green));


// adds an insertion function for custom branch 1, to be used in plant generation later
insertBranchFunctions.push(insertObj("assets/branch1.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), brown));

// adds an insertion function for custom branch 2, to be used in plant generation later
insertBranchFunctions.push(insertObj("assets/branch2.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), brown));

// adds an insertion function for custom branch 3, to be used in plant generation later
insertBranchFunctions.push(insertObj("assets/branch3.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), brown));


// adds an insertion function for custom flower 1, to be used in plant generation later
insertFlowerFunctions.push(insertObj("assets/flower1.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), white));

// adds an insertion function for custom flower 2, to be used in plant generation later
insertFlowerFunctions.push(insertObj("assets/flower2.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), yellow));


// adds an insertion function for custom fruit 1, to be used in plant generation later
insertFruitFunctions.push(insertObj("assets/fruit1.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), blue));

// adds an insertion function for custom fruit 2, to be used in plant generation later
insertFruitFunctions.push(insertObj("assets/fruit2.obj",undefined, Mat4.translation([0,1,0]), Mat4.translation([0,1,0]), darkred));


// exports
export {insertBranchFunctions, insertLeafFunctions, insertFlowerFunctions, insertFruitFunctions, branchOutFunctions, endBranchFunctions}