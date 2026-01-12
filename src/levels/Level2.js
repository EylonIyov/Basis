import { LevelLoader } from './LevelLoader.js';

// Level 2
// Matrix format: 20x15 grid
// 0 = blank, 1 = wall, 2 = gate, 3 = start, 4 = goal

const level2Matrix = [
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 [1,3,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,1,1,1],
 [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
 [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
 [1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
 [1,2,0,0,0,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
 [1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1,1,1,1],
 [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1],
 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata - gates at (8,1), (1,6), (9,8)
const gateData = {
    '8,1': {
        id: 'gate1',
        path: 'main',
        riddleId: 'placeholder1'
    },
    '1,6': {
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
let Level2;
try {
    Level2 = loader.loadFromMatrix(level2Matrix, gateData);
    Level2.name = "Level 2";
    console.log('Level2 loaded successfully:', Level2);
} catch (error) {
    console.error('Error loading Level2:', error);
    throw error;
}
export { Level2 };
