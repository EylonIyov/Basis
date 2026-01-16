import { LevelLoader } from './LevelLoader.js';

/**
 * Level 3 - Rule Change Introduction
 * Matrix format: 20x15 grid
 * 0 = empty, 1 = brick, 2 = gate, 3 = start, 4 = friend, 5 = pushable
 * 6 = socket, 7 = special wall, 8 = wood wall, 9 = iron wall, 10 = steel wall
 * 11 = emerald wall, 12 = gold wall, 13 = diamond wall, 14 = lapis wall, 15 = quartz wall
 * 
 * This level introduces wall type-specific rule riddles
 * Different paths are blocked by different wall types!
 */

const level3Matrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,2,0,0,0,0,0,0,2,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,10,10,10,10,10,10,10,10,10,10,10,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,8,8,8,8,8,1,1,1,1,1,1,9,9,9,9,9,9,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,1,1],
    [1,2,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,15,2,1],
    [1,1,13,13,13,13,13,13,13,1,1,1,15,15,15,15,15,15,0,1],
    [1,0,0,0,0,0,0,0,0,14,2,0,0,0,0,0,0,15,15,1],
    [1,1,14,14,14,14,14,14,14,14,1,12,12,12,12,12,12,12,0,1],
    [1,1,0,0,1,1,1,1,0,0,0,0,11,11,11,0,0,0,1,1],
     [1,1,1,0,0,0,0,0,0,1,0,0,11,4,11,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata - each gate uses a different wall type rule
const gateData = {
    // === TRANSFORMATION CHOICE RIDDLES (test all 7 transforms) ===
    '8,1': {
        id: 'gate_transform_metal',
        path: 'top_left',
        type: 'choice',
        riddleId: 'choice_transform_metal'  // Steel→Emerald, Iron→Steel, Steel→Iron, Wood→Iron
    },
    '15,1': {
        id: 'gate_transform_gems',
        path: 'top_right',
        type: 'choice',
        riddleId: 'choice_transform_gems'   // Lapis→Diamond, Gold→Lapis, Steel→Emerald, Iron→Steel
    },
    '1,8': {
        id: 'gate_transform_nature',
        path: 'left_side',
        type: 'choice',
        riddleId: 'choice_transform_nature' // Iron→Wood, Wood→Iron, Steel→Iron, Gold→Lapis
    },
    // === RULE RIDDLES ===
    '9,8': {
        id: 'gate_steel',
        path: 'center',
        type: 'rule',
        ruleEffect: {
            ruleId: 'STEEL_IS_AIR',
            value: true,
            description: 'Steel plates melt away!'
        }
    },
    '14,8': {
        id: 'gate_quartz',
        path: 'right_center',
        type: 'choice',
        riddleId: 'choice_gems'  // For testing gem walls
    },
    '18,8': {
        id: 'gate_exit',
        path: 'far_right'
        // Standard barrier riddle
    },
    '10,10': {
        id: 'gate_lapis',
        path: 'bottom_center'
        // Standard barrier riddle
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level3 = loader.loadFromMatrix(level3Matrix, gateData, {
    name: "Level 3 - Elements",
    theme: "cave",
    backgroundVideo: "bg_video_level3"
});
