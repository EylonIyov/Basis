import { LevelLoader } from './LevelLoader.js';

/**
 * Level 1 - Introduction
 * Matrix format: 20x15 grid
 * 0 = empty, 1 = wall, 2 = gate, 3 = start, 4 = friend, 5 = pushable
 */

const level1Matrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1,1,1,1],
    [1,0,1,1,1,1,2,1,1,1,1,1,1,1,1,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,2,0,0,0,0,0,0,2,0,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,1],
    [1,2,1,1,1,1,0,1,1,1,1,1,1,1,0,0,0,0,1,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,2,1,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1,0,0,1,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1,0,0,1,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,1,1],
    [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata
const gateData = {
    '6,2': {
        id: 'gate1',
        path: 'top',
        type: 'barrier'
    },
    '6,4': {
        id: 'gate2',
        path: 'middle',
        type: 'barrier'
    },
    '14,1': {
        id: 'gate3',
        path: 'shortcut',
        type: 'barrier'
    },
    '1,6': {
        id: 'gate4',
        path: 'left',
        type: 'barrier'
    },
    '9,8': {
        id: 'gate5',
        path: 'center',
        type: 'barrier'
    },
    '1,9': {
        id: 'gate6',
        path: 'left',
        type: 'barrier'
    },
    '11,10': {
        id: 'gate7',
        path: 'bottom',
        type: 'barrier'
    },
    '1,12': {
        id: 'gate8',
        path: 'left',
        type: 'barrier'
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level1 = loader.loadFromMatrix(level1Matrix, gateData, {
    name: "Level 1 - The Beginning",
    theme: "cave",
    backgroundVideo: "bg_video_level1"
});
