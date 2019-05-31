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
		super( "position", "normal", "texture_coord" );

		let transform = Mat4.identity();
		this.branchPoints = [];

		for( let symbol of symbols )
		{
			transform = symbol_map[symbol](transform, this);
		}          
	}
}

//TODO A class that creates a bunch of LSystemPlants given a symbol map, a grammar, a set of heights, 
// maybe perlin noise data for density and type
const ForestPatch =  
class ForestPatch extends Shape
{

}

export {LSystemGrammar, LSystemPlant, ForestPatch }