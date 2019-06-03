import {insertBranchFunctions, insertLeafFunctions, branchOutFunctions, endBranchFunctions} from './tree_shapes.js';

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
    "A":insertLeafFunctions,
    "B":insertBranchFunctions,
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

export {rules, genericSymbolMaps, startSymbols}