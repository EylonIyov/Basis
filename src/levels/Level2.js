import { LevelLoader } from './LevelLoader.js';

/**
 * Level 2 - Push Introduction
 * Matrix format: 20x15 grid
 * 0 = empty, 1 = wall, 2 = gate, 3 = start, 4 = friend, 5 = pushable
 * 6 = socket (pressure plate), 7 = special wall (unlocks when socket filled)
 */

const level2Matrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1,1],
    [1,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,2,1,1],
    [1,0,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1],
    [1,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,0,1,1,1],
    [1,2,0,0,0,0,1,0,1,1,1,1,1,1,1,0,0,6,1,1],
    [1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,0,1,1,1],
    [1,6,0,0,0,0,0,5,0,2,0,0,0,0,0,0,0,1,1,1],
    [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,7,1,1,1,1],
    [1,0,1,1,2,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
    [1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,4,0,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata
const gateData = {
    '8,1': {
        id: 'gate1',
        path: 'main',
        type: 'barrier'
    },
    '1,6': {
        id: 'gate2',
        path: 'side',
        type: 'barrier'
    },
    '9,8': {
        id: 'gate3',
        path: 'main',
        type: 'barrier'
    },
    '15,2': {
        id: 'gate4',
        path: 'shortcut',
        type: 'barrier'
    }
};

// Socket metadata - links sockets to the special walls they unlock
// Format: 'row,col' of socket -> { unlocksWall: { row, col } }
const socketData = {
    '8,1': {
        id: 'socket1',
        unlocksWall: { row: 11, col: 1 }  // Socket at (8,1) unlocks wall at (11,1)
    },
    '6,17': {
        id: 'socket2',
        unlocksWall: { row: 9, col: 15 }  // Socket at (6,17) unlocks wall at (9,15)
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level2 = loader.loadFromMatrix(level2Matrix, gateData, {
    name: "Level 2 - Push It",
    theme: "cave",
    backgroundVideo: "bg_video_level2",
    socketData: socketData
});
