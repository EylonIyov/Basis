import { LevelLoader } from './LevelLoader.js';

/**
 * Level 3 - Rule Change Introduction
 * Matrix format: 20x15 grid
 * 0 = empty, 1 = wall, 2 = gate, 3 = start, 4 = friend, 5 = pushable
 * 
 * This level introduces the WALL_IS_AIR rule riddle
 */

const level3Matrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,2,0,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata - one gate is a RULE RIDDLE
const gateData = {
    '6,1': {
        id: 'gate1',
        path: 'main',
        type: 'barrier'
    },
    '5,6': {
        id: 'gate2_rule',
        path: 'side',
        type: 'rule',  // This is a RULE RIDDLE gate
        ruleEffect: {
            ruleId: 'WALL_IS_AIR',
            value: true,
            description: 'Walls have become transparent!'
        }
    },
    '9,8': {
        id: 'gate3',
        path: 'main',
        type: 'barrier'
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level3 = loader.loadFromMatrix(level3Matrix, gateData, {
    name: "Level 3 - Change the Rules",
    theme: "cave"
});
