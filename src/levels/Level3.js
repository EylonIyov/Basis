import { LevelLoader } from './LevelLoader.js';

/**
 * Level 3 - Rule Change Introduction
 * Matrix format: 20x15 grid
 * 0 = empty, 1 = brick, 2 = gate, 3 = start, 4 = friend, 5 = pushable
 * 8 = wood wall, 9 = iron wall, 10 = steel wall
 * 
 * This level introduces wall type-specific rule riddles
 * Different paths are blocked by different wall types!
 */

const level3Matrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,0,8,8,8,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,8,8,8,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,0,9,9,9,9,9,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,2,0,9,9,9,9,9,1,1,0,0,1,1,1,1],
    [1,0,1,1,1,1,0,9,9,9,9,9,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,10,10,10,10,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,10,10,10,10,0,0,0,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,10,10,10,10,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata - each gate uses a different wall type rule
const gateData = {
    '6,1': {
        id: 'gate_wood',
        path: 'top',
        type: 'rule',
        ruleEffect: {
            ruleId: 'WOOD_IS_AIR',
            value: true,
            description: 'Wood walls rot away!'
        }
    },
    '5,6': {
        id: 'gate_iron',
        path: 'middle',
        type: 'rule',
        ruleEffect: {
            ruleId: 'IRON_IS_AIR',
            value: true,
            description: 'Iron bars rust and break!'
        }
    },
    '9,8': {
        id: 'gate_steel',
        path: 'bottom',
        type: 'rule',
        ruleEffect: {
            ruleId: 'STEEL_IS_AIR',
            value: true,
            description: 'Steel plates melt away!'
        }
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level3 = loader.loadFromMatrix(level3Matrix, gateData, {
    name: "Level 3 - Elements",
    theme: "cave"
});
