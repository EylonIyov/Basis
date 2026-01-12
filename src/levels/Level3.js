import { LevelLoader } from './LevelLoader.js';

// Level 3
// Matrix format: 20x15 grid
// 0 = blank, 1 = wall, 2 = gate, 3 = start, 4 = goal

const level3Matrix = [
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 [1,3,0,0,0,0,2,0,0,0,0,0,0,0,0,1,1,1,1,1],
 [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
 [1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,0,0,0,2,0,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
 [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata - gates at (5,1), (5,6), (9,8)
const gateData = {
    '5,1': {
        id: 'gate1',
        path: 'main',
        riddleId: 'placeholder1'
    },
    '5,6': {
        id: 'gate2',
        path: 'main',
        riddleId: 'placeholder2'
    },
    '9,8': {
        id: 'gate3',
        path: 'main',
        riddleId: 'placeholder3'
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level3 = loader.loadFromMatrix(level3Matrix, gateData);
Level3.name = "Level 3";
