# Level System

The level system uses a matrix-based format for easy level creation and editing.

## Matrix Format

Each level is defined as a **20x15 matrix** (20 columns wide, 15 rows tall) where each cell represents a tile:

- **0** = Blank/Empty tile (walkable)
- **1** = Wall (blocks movement)
- **2** = Gate (requires solving a riddle to pass)
- **3** = Starting position (where Babi spawns)
- **4** = Goal/End position (where the food is)

## Matrix Coordinates

- **X-axis (columns)**: 0-19 (left to right)
- **Y-axis (rows)**: 0-14 (top to bottom)
- Matrix is accessed as `matrix[row][column]` or `matrix[y][x]`

## Example Level Structure

```javascript
import { LevelLoader } from './LevelLoader.js';

const levelMatrix = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 0
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 1 - Start at (1,1)
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 2
    // ... more rows ...
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1], // Row 13 - Goal at (18,13)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // Row 14
];

// Gate metadata - maps gate positions to gate info
const gateData = {
    '5,6': {  // Gate at position (5, 6)
        id: 'gateA',
        path: 'top',
        riddleId: 'placeholder1'
    }
};

// Load level
const loader = new LevelLoader();
export const Level1 = loader.loadFromMatrix(levelMatrix, gateData);
Level1.name = "Level 1";
```

## Gate Data

Gates require additional metadata that can't be represented in the matrix. Use the `gateData` object to provide:

- **id**: Unique identifier for the gate (e.g., 'gateA', 'gateB')
- **path**: Which path this gate belongs to (e.g., 'top', 'middle', 'bottom')
- **riddleId**: ID of the riddle to use (currently uses placeholders)

Gate positions are specified as `'x,y'` strings (e.g., `'5,6'` for gate at column 5, row 6).

## Creating a New Level

1. Create a new file in the `levels` folder (e.g., `Level2.js`)
2. Define your 20x15 matrix
3. Define gate metadata
4. Use `LevelLoader` to load the level:

```javascript
import { LevelLoader } from './LevelLoader.js';

const level2Matrix = [
    // Your 20x15 matrix here
];

const gateData = {
    // Your gate data here
};

const loader = new LevelLoader();
export const Level2 = loader.loadFromMatrix(level2Matrix, gateData);
Level2.name = "Level 2";
```

## Tips

- Always surround your level with walls (value 1) on borders
- Ensure there's exactly one start position (3) and one goal (4)
- Make sure paths are walkable (no walls blocking the route)
- Gates (2) should be placed on walkable paths
- Use walls strategically to create linear paths that force players through gates
