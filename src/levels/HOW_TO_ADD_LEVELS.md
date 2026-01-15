# Level Design Guide

This guide explains everything you need to know to create levels, add riddles, and use the game's mechanics.

---

## Quick Reference: Tile Numbers

| Number | What It Is | Description |
|--------|------------|-------------|
| 0 | Empty | Walkable floor |
| 1 | Brick Wall | Standard wall (can be affected by BRICK_IS_AIR rule) |
| 2 | Gate | Blocks path until a riddle is solved |
| 3 | Player Start | Where the player spawns (only one per level!) |
| 4 | Friend | The goal - reach your friend to win (only one per level!) |
| 5 | Pushable Block | Player can push this onto sockets |
| 6 | Socket | Pressure plate - put a pushable block here to activate |
| 7 | Special Wall | Disappears when its linked socket is filled |
| 8 | Wood Wall | Affected by WOOD_IS_AIR rule |
| 9 | Iron Wall | Affected by IRON_IS_AIR rule |
| 10 | Steel Wall | Affected by STEEL_IS_AIR rule |

---

## Part 1: Creating a New Level

### Step 1: Create the Level File

Create a new file in `src/levels/` called `Level4.js` (or whatever number is next):

```javascript
import { LevelLoader } from './LevelLoader.js';

// Your 20x15 matrix (20 columns, 15 rows)
const level4Matrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Row 0 - top border
    [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Row 1 - player start at (1,1)
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],  // Row 6 - gate at (10,6)
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1],  // Row 13 - friend at (17,13)
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Row 14 - bottom border
];

// Gate configuration (explained below)
const gateData = {
    '10,6': {
        id: 'gate1',
        path: 'main',
        type: 'barrier'
    }
};

// Export the level
const loader = new LevelLoader();
export const Level4 = loader.loadFromMatrix(level4Matrix, gateData, {
    name: "Level 4 - My New Level",
    theme: "cave",
    backgroundVideo: "bg_video_level1"  // optional
});
```

### Step 2: Register in LevelManager

Open `src/levels/LevelManager.js` and add your level:

```javascript
import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level3 } from './Level3.js';
import { Level4 } from './Level4.js';  // Add this

export class LevelManager {
    constructor() {
        this.levels = [
            Level1,
            Level2,
            Level3,
            Level4  // Add this
        ];
        this.currentLevelIndex = 0;
    }
    // ...
}
```

That's it! Your level will now appear after Level 3.

---

## Part 2: Gate Types

Gates block the player until they solve a riddle. There are two types:

### Barrier Gate (Simple)

Just blocks the path. Solving it opens the gate.

```javascript
const gateData = {
    '10,6': {
        id: 'gate1',
        path: 'main',
        type: 'barrier'
    }
};
```

### Rule Gate (Changes Game Rules)

When solved, it changes a game rule (like making walls disappear).

```javascript
const gateData = {
    '10,6': {
        id: 'gate1',
        path: 'main',
        type: 'rule',
        ruleEffect: {
            ruleId: 'IRON_IS_AIR',      // Which rule to activate
            value: true,                 // Turn it on
            description: 'Iron walls crumble to dust!'
        }
    }
};
```

### Linking a Specific Riddle to a Gate

Want a specific riddle to appear at a gate? Use `riddleId`:

```javascript
const gateData = {
    '10,6': {
        id: 'gate1',
        path: 'main',
        type: 'barrier',
        riddleId: 'riddle_003'  // This specific riddle will appear
    }
};
```

You can combine `riddleId` with `ruleEffect` too:

```javascript
const gateData = {
    '10,6': {
        id: 'gate1',
        path: 'main',
        type: 'rule',
        riddleId: 'riddle_iron_air',  // Show this specific riddle
        ruleEffect: {
            ruleId: 'IRON_IS_AIR',
            value: true,
            description: 'Iron walls crumble!'
        }
    }
};
```

---

## Part 3: Available Rules

These rules can be activated by rule gates:

### Wall Rules (Make Walls Disappear)

| Rule ID | Effect |
|---------|--------|
| `WALL_IS_AIR` | ALL walls become passable |
| `BRICK_IS_AIR` | Brick walls (1) become passable |
| `WOOD_IS_AIR` | Wood walls (8) become passable |
| `IRON_IS_AIR` | Iron walls (9) become passable |
| `STEEL_IS_AIR` | Steel walls (10) become passable |

### Shuffle Rules (Walls Move Around)

| Rule ID | Effect |
|---------|--------|
| `BRICK_SHUFFLE` | Brick walls move to new positions |
| `WOOD_SHUFFLE` | Wood walls move to new positions |
| `IRON_SHUFFLE` | Iron walls move to new positions |
| `STEEL_SHUFFLE` | Steel walls move to new positions |

### Player Rules

| Rule ID | Effect |
|---------|--------|
| `PLAYER_IS_FAST` | Player moves faster |
| `PLAYER_IS_SLOW` | Player moves slower |
| `PLAYER_IS_GHOST` | Player can walk through everything |

### Other Rules

| Rule ID | Effect |
|---------|--------|
| `GATE_IS_OPEN` | All gates open automatically |
| `PUSH_IS_DISABLED` | Can't push blocks anymore |

---

## Part 4: Sockets and Special Walls (Puzzle Mechanics)

Create puzzles where pushing a block onto a socket unlocks a wall.

### In the Matrix

```javascript
const levelMatrix = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,5,0,0,0,0,1],  // 5 = pushable block
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,6,0,0,0,7,0,1],  // 6 = socket, 7 = special wall
    [1,0,0,0,0,0,0,4,0,1],  // 4 = friend (behind the wall)
    [1,1,1,1,1,1,1,1,1,1],
];
```

### Linking Sockets to Walls

In level options, define which socket unlocks which wall:

```javascript
const socketData = {
    '3,3': {  // Socket position as 'row,col' (y,x format)
        id: 'socket1',
        unlocksWall: { row: 3, col: 7 }  // Which special wall to unlock
    }
};

// Pass it to the loader
export const Level4 = loader.loadFromMatrix(level4Matrix, gateData, {
    name: "Level 4",
    theme: "cave",
    socketData: socketData  // Add this!
});
```

When the player pushes the block (5) onto the socket (6), the special wall (7) disappears!

---

## Part 5: Adding New Riddles

Riddles are stored in `src/riddles/riddles.json`.

### Barrier Riddle (Just Opens Gate)

```json
{
    "id": "riddle_my_new_one",
    "type": "barrier",
    "question": "What has hands but can't clap?",
    "answers": [
        "A clock",
        "A statue",
        "A robot",
        "A tree"
    ],
    "correctAnswer": 0,
    "hint": "It tells you the time"
}
```

- `id`: Unique identifier (use this in `riddleId` field of gates)
- `type`: Use `"barrier"` for regular riddles
- `answers`: Array of 4 choices
- `correctAnswer`: Index of correct answer (0 = first, 1 = second, etc.)

### Rule Riddle (Changes Game Rules)

```json
{
    "id": "riddle_my_rule",
    "type": "rule",
    "question": "What force can reduce ancient bricks to dust?",
    "answers": [
        "Time and erosion",
        "More bricks",
        "Freezing cold",
        "Total silence"
    ],
    "correctAnswer": 0,
    "effect": {
        "ruleId": "BRICK_IS_AIR",
        "value": true,
        "description": "BRICK IS AIR - Bricks crumble!"
    }
}
```

### Available Riddle IDs

**Barrier Riddles:**
- `riddle_001` through `riddle_010`

**Rule Riddles:**
- `riddle_rule_speed` → PLAYER_IS_FAST
- `riddle_rule_gates` → GATE_IS_OPEN
- `riddle_brick_air` → BRICK_IS_AIR
- `riddle_wood_air` → WOOD_IS_AIR
- `riddle_iron_air` → IRON_IS_AIR
- `riddle_steel_air` → STEEL_IS_AIR
- `riddle_brick_shuffle` → BRICK_SHUFFLE
- `riddle_wood_shuffle` → WOOD_SHUFFLE
- `riddle_iron_shuffle` → IRON_SHUFFLE
- `riddle_steel_shuffle` → STEEL_SHUFFLE
- `riddle_ghost` → PLAYER_IS_GHOST

---

## Part 6: Adding New Rules

To add a completely new rule to the game:

### Step 1: Add to RuleManager

Open `src/systems/RuleManager.js` and add your rule:

```javascript
this.rules = {
    // ... existing rules ...
    'MY_NEW_RULE': false,  // Add your new rule here
};
```

### Step 2: Add Description

In the same file, add a description:

```javascript
getRuleDescription(ruleId) {
    const descriptions = {
        // ... existing descriptions ...
        'MY_NEW_RULE': 'Something amazing happens!',
    };
}
```

### Step 3: Handle the Rule in Game.js

Open `src/scenes/Game.js` and add logic to respond to your rule:

```javascript
// Listen for rule changes
this.ruleManager.on('rule:MY_NEW_RULE', (isActive) => {
    if (isActive) {
        // Do something when rule activates
    }
});
```

---

## Part 7: Tips for Good Level Design

1. **Always surround with walls** - Border your level with walls (1) on all sides
2. **One start, one friend** - Exactly one `3` and one `4` per level
3. **Test the path** - Make sure the player can actually reach the friend
4. **Gates on paths** - Place gates (2) where the player must walk through them
5. **Use different wall types** - Mix brick (1), wood (8), iron (9), steel (10) for variety
6. **Create puzzles** - Use sockets (6) and special walls (7) for push puzzles

---

## Complete Example: Level with Everything

```javascript
import { LevelLoader } from './LevelLoader.js';

const levelMatrix = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Start + gate
    [1,0,8,8,8,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1],  // Wood walls
    [1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Pushable block
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,6,0,9,9,9,9,9,0,0,0,0,0,0,0,1],  // Socket + Iron walls
    [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Gate
    [1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,7,0,0,0,0,0,0,0,10,10,10,0,0,0,0,0,0,0,1],  // Special wall + Steel walls
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,1],  // Friend
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const gateData = {
    '6,1': {
        id: 'gate_wood',
        path: 'top',
        type: 'rule',
        riddleId: 'riddle_wood_air',  // Specific riddle
        ruleEffect: {
            ruleId: 'WOOD_IS_AIR',
            value: true,
            description: 'Wood walls rot away!'
        }
    },
    '3,6': {
        id: 'gate_barrier',
        path: 'side',
        type: 'barrier',
        riddleId: 'riddle_003'  // Specific barrier riddle
    }
};

const socketData = {
    '5,5': {  // Format: 'row,col'
        id: 'socket1',
        unlocksWall: { row: 9, col: 1 }
    }
};

const loader = new LevelLoader();
export const Level4 = loader.loadFromMatrix(levelMatrix, gateData, {
    name: "Level 4 - Complete Example",
    theme: "cave",
    backgroundVideo: "bg_video_level1",
    socketData: socketData
});
```

---

## Need Help?

- Check existing levels (`Level1.js`, `Level2.js`, `Level3.js`) for examples
- Matrix must be exactly **20 columns × 15 rows**
- Gate positions in gateData use format `'x,y'` (column, row)
- Socket positions in socketData use format `'row,col'` (y, x)
