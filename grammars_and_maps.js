import {insertBranchFunctions, insertLeafFunctions, insertFlowerFunctions, insertFruitFunctions, branchOutFunctions, endBranchFunctions} from './tree_shapes.js';

//INFO
// File for the rules of grammars and symbol maps for use with L System Plant Rendering

// a "generic" symbol map contains refernces to arrays of insertion function for the appropriate "type" of shape 
// to be inserted, instead of a given shape insertion function. This will allow easier auto-generation in ForestPatch

//exports
const rules = [];
const genericSymbolMaps = [];
const startSymbols = [];

// ALGAE - rules, and a test symbol map 
const algaeRules = new Map([
    [ "A", [ ["AB", 1.] ] ],
    [ "B", [ ["A", 1.] ] ]
]);
rules.push(algaeRules);

const testAlgaeSymbolMapping = {
    "A":insertBranchFunctions,
    "B":branchOutFunctions,
}
genericSymbolMaps.push(testAlgaeSymbolMapping);

startSymbols.push("A");

// BINARY TREES - rules, and a test symbol map
const binaryRules = new Map([
    [ "1", [ ["11", 1.] ] ],
    [ "0", [ ["1[0]0", 1.] ] ],
    [ "[", [ ["[", 1.] ] ], // aka a constant
    [ "]", [ ["]", 1.] ] ]
]);
rules.push(binaryRules);

const testBinarySymbolMapping = {
    "1":insertBranchFunctions,
    "0":insertLeafFunctions,
    "[":branchOutFunctions,
    "]":endBranchFunctions,
}
genericSymbolMaps.push(testBinarySymbolMapping);
startSymbols.push("0");

// FRUIT TREES - rules, and a test symbol map
const fruitRules = new Map([
    [ "1", [ ["11", 1.] ] ],
    [ "L", [ ["1[L]L", .5] ] ],
    [ "L", [ ["1[F]R", .25] ] ],
    [ "L", [ ["1[R]F", .25] ] ],
    [ "F", [ ["1[F]F", .5] ] ],
    [ "F", [ ["1[F]R", .25] ] ],
    [ "F", [ ["1[R]F", .25] ] ],
    [ "R", [ ["1[R]R", 1.] ] ],
    [ "[", [ ["[", 1.] ] ],
    [ "]", [ ["]", 1.] ] ]
]);
rules.push(fruitRules);

const testFruitSymbolMapping = {
    "1":insertBranchFunctions,
    "L":insertLeafFunctions,
    "F":insertFlowerFunctions,
    "R":insertFruitFunctions,
    "[":branchOutFunctions,
    "]":endBranchFunctions,
}
genericSymbolMaps.push(testFruitSymbolMapping);
startSymbols.push("L");

export {rules, genericSymbolMaps, startSymbols}
