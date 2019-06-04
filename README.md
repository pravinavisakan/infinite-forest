# CS 174A Term Project - An LSystem and Perlin Noise Forest

Advanced Topics covered:

Perlin noise, height map generation, L-systems, frustum culling (attempted).

Perlin noise was used to generate a height map/terrain upon which trees were placed. These trees were generated using L-Systems (see l_systems for the relevant classes, and grammars_and_maps for the grammars), and a library of component tiny-graphics shapes, and obj files for things like leaves, fruit, and branches (see tree_shapes). The obj files were made by our team.

We found that loading multiple OBJ files into one vertex buffer difficult - due to the asynchronous nature of the fetch API, the given Shape_from_File class was unable to be used in conjunction with the insert_transformed_copy_into function. We got around this by making implementing our own callback functions.

We had great difficulty in making everything work together - with many moving parts involving advanced projects that were not fully understood at first, many interfaces between classes ended up proving inadequate, requiring design overhauls.

Also, despite our best efforts to store shapes in as few buffers as possible, there were slowdowns, likely due to frequent file requests and large file sizes - stuff we didn't have time to fix. As a result, the tree density and complexity/size is scaled kind of low, to make things presentable.


Brandon: l-system grammars, shape modeling
Pravin: l-system, obj file rendering
Erynn: perlin noise, height map generation
Matthew: frustum culling
