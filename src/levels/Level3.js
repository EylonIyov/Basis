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
    [1,16,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,2,0,0,0,0,0,0,2,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,10,10,10,10,10,10,10,10,10,10,10,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,8,8,8,8,8,1,1,1,1,1,1,9,9,9,9,9,9,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,1,1],
    [1,2,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,15,2,1],
    [1,1,13,13,13,13,13,13,13,1,1,1,15,15,15,15,15,15,0,1],
    [1,0,0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,15,15,1],
    [1,1,14,14,14,14,14,14,14,1,1,12,12,12,12,12,12,12,0,1],
    [1,1,0,0,1,1,1,1,0,0,0,0,11,11,11,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,1,0,0,11,4,11,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Gate metadata - each gate uses a different wall type rule
const gateData = {
    // === NEW CHOICE RIDDLES (shuffled answers) ===
    '8,1': {
        id: 'gate_forge_steel',
        path: 'top_left',
        type: 'choice',
        riddleId: 'choice_forge_steel'  // Steel→Iron, Wood→Steel, Iron→Steel, Steel→Emerald
    },
    '15,1': {
        id: 'gate_elemental_shift',
        path: 'top_right',
        type: 'choice',
        riddleId: 'choice_elemental_shift'  // Iron→Air, Wood→Iron, Emerald→Air, Iron→Wood
    },
    // === OTHER TRANSFORMATION RIDDLES ===
    '1,8': {
        id: 'gate_lapis_to_diamond',
        path: 'left_side',
        type: 'rule',
        ruleEffect: {
            ruleId: 'LAPIS_TO_DIAMOND',
            value: true,
            description: 'Lapis becomes Diamond!'
        }
    },
    '9,8': {
        id: 'gate_gold_to_lapis',
        path: 'center',
        type: 'rule',
        ruleEffect: {
            ruleId: 'GOLD_TO_LAPIS',
            value: true,
            description: 'Gold becomes Lapis!'
        }
    },
    '14,8': {
        id: 'riddle_diamond_air',
        path: 'right_center',
        type: 'rule',
        ruleEffect: {
            ruleId: 'DIAMOND_IS_AIR',
            value: true,
            description: 'Diamond becomes Air!'
        }
    },
    '18,8': {
        id: 'riddle_emerald_air',
        path: 'far_right',
        type: 'rule',
        ruleEffect: {
            ruleId: 'EMERALD_IS_AIR',
            value: true,
            description: 'Emerald becomes Air!'
        }
    },
    '10,10': {
        id: 'riddle_quartz_air',
        path: 'bottom_center',
        type: 'rule',
        ruleEffect: {
            ruleId: 'QUARTZ_IS_AIR',
            value: true,
            description: 'Quartz becomes Air!'
        }
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level3 = loader.loadFromMatrix(level3Matrix, gateData, {
    name: "Level 3 - Elements",
    theme: "cave",
    backgroundVideo: "bg_video_level3"
});
