# How to Add More Levels

This guide explains how to add new levels to the game.

## Step 1: Create a New Level File

Create a new file in the `src/levels/` folder, for example `Level3.js`:

```javascript
import { LevelLoader } from './LevelLoader.js';

// Level 3: Your Level Name
// 
// Matrix format: 20x15 grid
// 0 = blank, 1 = wall, 2 = gate, 3 = start, 4 = goal

const level3Matrix = [
    // Row 0 (y=0) - Top border
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // Row 1 (y=1) - Start at (1,1)
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    // Row 2 (y=2)
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    // ... continue for all 15 rows ...
    // Row 13 (y=13) - Goal at (18,13)
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1],
    // Row 14 (y=14) - Bottom border
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Gate metadata - maps gate positions to gate information
const gateData = {
    '10,6': {  // Gate at position (10, 6)
        id: 'gate1',
        path: 'main',
        riddleId: 'placeholder1'
    }
};

// Load level using LevelLoader
const loader = new LevelLoader();
export const Level3 = loader.loadFromMatrix(level3Matrix, gateData);
Level3.name = "Level 3";
```

## Step 2: Register the Level in LevelManager

Open `src/levels/LevelManager.js` and add your new level to the imports and levels array:

```javascript
import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level3 } from './Level3.js';  // Add this import

export class LevelManager {
    constructor() {
        // Register all available levels
        this.levels = [
            Level1,
            Level2,
            Level3  // Add your new level here
            // Add more levels here as you create them
        ];
        
        this.currentLevelIndex = 0;
    }
    // ... rest of the code
}
```

## Step 3: Test Your Level

1. Start the game - it will begin with Level 1
2. Complete Level 1 to unlock Level 2
3. Complete Level 2 to unlock Level 3 (your new level)
4. Or press R to restart the current level

## Matrix Format Quick Reference

- **0** = Blank/Empty (walkable)
- **1** = Wall (blocks movement)
- **2** = Gate (requires solving a riddle)
- **3** = Start position (where Babi spawns)
- **4** = Goal (where the food is)

## Tips for Level Design

1. **Always add border walls**: Surround your level with walls (value 1) on all sides
2. **One start, one goal**: Make sure there's exactly one start (3) and one goal (4)
3. **Test walkability**: Ensure there's a path from start to goal
4. **Gate placement**: Place gates (2) on walkable paths, not in walls
5. **Gate metadata**: Don't forget to add gate information in the `gateData` object

## Example: Simple Level Template

Here's a minimal level template you can copy and modify:

```javascript
import { LevelLoader } from './LevelLoader.js';

const levelMatrix = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const gateData = {
    '10,6': {
        id: 'gate1',
        path: 'main',
        riddleId: 'placeholder1'
    }
};

const loader = new LevelLoader();
export const LevelX = loader.loadFromMatrix(levelMatrix, gateData);
LevelX.name = "Level X";
```

## Level Progression

- Levels are played in order (Level 1 → Level 2 → Level 3 → ...)
- After completing a level, press **N** to go to the next level
- Press **R** to restart the current level
- The game automatically tracks which level you're on

## Need Help?

- Check `Level1.js` and `Level2.js` for examples
- See `README.md` for detailed matrix format documentation
- Make sure your matrix is exactly 20 columns × 15 rows
