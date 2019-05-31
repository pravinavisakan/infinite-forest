import {insertBranchFunctions, insertLeafFunctions, branchOutFunctions, endBranchFunctions} from './tree_shapes.js';

//INFO
// File for the rules of grammars and symbol maps for use with L System Plant Rendering

// TODO current maps are for testing - auto generate using random/perlin noise shape insertions

//exports
const rules = {};
const symbolMaps = {};

// ALGAE - rules, and a test symbol map 
const algaeRules = new Map([
    [ "A", [ ["AB", 1.] ] ],
    [ "B", [ ["A", 1.] ] ]
]);
rules.Algae = algaeRules;

const testAlgaeSymbolMapping = {
    "A":insertLeafFunctions[0],
    "B":insertBranchFunctions[0],
}
symbolMaps.AlgaeMap = testAlgaeSymbolMapping;

// BINARY TREES - rules, and a test symbol map
const binaryRules = new Map([
    [ "1", [ ["11", 1.] ] ],
    [ "0", [ ["1[0]0", 1.] ] ],
    [ "[", [ ["[", 1.] ] ], // aka a constant
    [ "]", [ ["]", 1.] ] ]
]);
rules.Binary = binaryRules;

const testBinarySymbolMapping = {
    "1":insertBranchFunctions[0],
    "0":insertLeafFunctions[0],
    "[":branchOutFunctions[0],
    "]":endBranchFunctions[0],
}
symbolMaps.BinaryMap = testBinarySymbolMapping;

export {rules, symbolMaps}