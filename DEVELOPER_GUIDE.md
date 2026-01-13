# Basis - Developer Quick Start Guide

## Project Structure Overview

```
/Basis
├── assets/              # Game assets (sprites, backgrounds)
├── src/
│   ├── entities/       # Game entities (Player, Friend, Pushables)
│   ├── systems/        # Core systems (Physics, Rules)
│   ├── managers/       # Managers (Assets, Rendering, UI)
│   ├── levels/         # Level definitions
│   ├── riddles/        # Riddle data and logic
│   ├── scenes/         # Phaser scenes
│   └── main.js         # Game entry point
├── index.html          # HTML entry point
└── phaser.js           # Phaser 3 library
```

## How to Run

1. Open `index.html` in a web browser with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

2. Navigate to `http://localhost:8000`

3. Play the game!
   - Arrow keys to move
   - Push boxes by walking into them
   - Solve riddles to open gates or activate rules
   - Reach your friend to win

## How to Add a New Level

1. Create a new file in `src/levels/` (e.g., `Level4.js`)

2. Define your level matrix (20x15 grid):
```javascript
import { LevelLoader } from './LevelLoader.js';

const level4Matrix = [
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,1],
 // ... 13 more rows
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Values: 0=empty, 1=wall, 2=gate, 3=start, 4=goal, 5=pushable

const gateData = {
    '8,5': { id: 'gate1', path: 'main', riddleId: 'placeholder' }
};

const pushableData = {
    '10,7': { type: 'box' }  // Types: box, crate, boulder
};

const loader = new LevelLoader();
export const Level4 = loader.loadFromMatrix(level4Matrix, gateData, {
    theme: 'forest',  // forest, cave, or default
    pushables: pushableData,
    ruleRiddles: ['wall_is_air']  // Optional rule riddles
});
Level4.name = "Level 4 - Your Title";
```

3. Register in `src/levels/LevelManager.js`:
```javascript
import { Level4 } from './Level4.js';

this.levels = [
    Level1,
    Level2,
    Level3,
    Level4  // Add here
];
```

## How to Add a New Rule

1. Define the rule in `src/systems/RuleManager.js`:
```javascript
this.ruleDefinitions = {
    // ... existing rules
    gate_is_open: {
        name: 'Gate is Open',
        description: 'All gates become passable',
        effect: 'gates_open',
        visualEffect: 'fade_gates',
        persistent: true
    }
};
```

2. Implement the effect in `applyGameplayEffect()`:
```javascript
applyGameplayEffect(ruleId, effectType) {
    switch (effectType) {
        case 'gates_open':
            // Logic here
            console.log('All gates now open');
            break;
    }
}
```

3. Implement visual effect in `applyVisualEffect()`:
```javascript
applyVisualEffect(ruleId, effectType) {
    switch (effectType) {
        case 'fade_gates':
            this.fadeGates();
            break;
    }
}
```

4. Update `GridPhysics.canMoveTo()` to check the rule:
```javascript
// Check gate collision
const gate = this.getGateAt(toX, toY);
if (gate && !gate.isOpen && !this.ruleManager.isRuleActive('gate_is_open')) {
    return { allowed: false, action: 'gate', data: gate };
}
```

5. Add rule riddle to `src/riddles/riddles.json`:
```json
{
  "id": "rule_gate_open",
  "type": "rule",
  "question": "Your riddle question here?",
  "answers": ["Gate is Open", "Gate is Closed", "Open the Gate", "Close the Gate"],
  "correctAnswer": 0,
  "ruleEffect": "gate_is_open"
}
```

## How to Add a New Entity Type

1. Create a new file in `src/entities/` (e.g., `Enemy.js`)

2. Follow this pattern:
```javascript
export class Enemy {
    constructor(scene, gridX, gridY) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridPhysics = null;
        this.createSprite();
    }
    
    setGridPhysics(gridPhysics) {
        this.gridPhysics = gridPhysics;
    }
    
    createSprite() {
        // Create your sprite here
    }
    
    update() {
        // Update logic (called from scene)
    }
    
    destroy() {
        // Cleanup
    }
}
```

3. Import and create in `src/scenes/Game.js`:
```javascript
import { Enemy } from '../entities/Enemy.js';

createEntities() {
    // ... existing entities
    
    this.enemies = [];
    if (this.level.enemies) {
        this.level.enemies.forEach(enemyData => {
            const enemy = new Enemy(this, enemyData.x, enemyData.y);
            enemy.setGridPhysics(this.gridPhysics);
            this.enemies.push(enemy);
        });
    }
}

update() {
    // ... existing update logic
    
    this.enemies.forEach(enemy => enemy.update());
}
```

## How to Add a New Riddle

Simply add to `src/riddles/riddles.json`:

**Barrier Riddle (opens gates):**
```json
{
  "id": "riddle_011",
  "question": "Your riddle question?",
  "answers": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
  "correctAnswer": 0,
  "hint": "Optional hint"
}
```

**Rule Riddle (changes game state):**
```json
{
  "id": "rule_new_effect",
  "type": "rule",
  "question": "Your riddle question?",
  "answers": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
  "correctAnswer": 0,
  "ruleEffect": "your_rule_id"
}
```

## Key Classes Reference

### GridPhysics
- `canMoveTo(fromX, fromY, toX, toY, entityType)` - Check if move is valid
- `executePush(pushable, targetX, targetY)` - Execute a push
- `gridToPixel(gridX, gridY)` - Convert grid to screen coordinates

### RuleManager
- `activateRule(ruleId, scene)` - Activate a game rule
- `isRuleActive(ruleId)` - Check if rule is active
- `resetRules()` - Clear all active rules

### Player
- `tryMove(direction)` - Attempt to move in direction {x, y}
- `getGridPosition()` - Get current grid position

### LevelRenderer
- `renderBackground(theme)` - Render themed background
- `renderGridOverlay()` - Draw grid lines
- `renderWalls(wallsData)` - Create wall sprites
- `renderGates(gatesData)` - Create gate sprites

### RiddleUIManager
- `showGateRiddle(gate)` - Show barrier riddle modal
- `showRuleRiddle(riddle)` - Show rule riddle modal
- `isModalVisible()` - Check if modal is open

## Debugging Tips

### Enable Console Logging
All systems log important events. Check browser console for:
- Level loading confirmation
- Rule activations
- Push attempts
- Movement validation

### Common Issues

**Pushable objects not appearing:**
- Check matrix has value `5` at correct position
- Verify pushableData object key format: `'x,y'`
- Ensure LevelLoader options includes `pushables: pushableData`

**Rule not working:**
- Verify ruleEffect matches RuleManager definition
- Check GridPhysics is querying the rule correctly
- Confirm riddle.type === 'rule' in riddles.json

**Level not loading:**
- Check matrix is exactly 20×15
- Verify exactly one start (3) and one goal (4)
- Ensure level is registered in LevelManager

**Sprites not showing:**
- AssetLoader gracefully falls back to shapes
- Check browser console for loading errors
- Verify asset paths in AssetLoader.assetManifest

## Performance Considerations

- Grid is 20×15 = 300 tiles maximum
- All entities use object pooling where possible
- Tweens are reused, not recreated each frame
- Particle effects auto-cleanup after animation

## Testing Your Changes

1. **Movement**: Test all 4 directions, grid boundaries
2. **Collision**: Test walls, gates, pushables
3. **Push**: Test pushing into walls, other objects, boundaries
4. **Riddles**: Test both barrier and rule riddles
5. **Win**: Test reaching friend, level progression
6. **Rules**: Test rule activation and visual effects

## Asset Integration

When you have actual sprites:

1. Add files to `/assets/` folder
2. Update `AssetLoader.assetManifest`:
```javascript
sprites: {
    player: {
        key: 'player',
        path: 'assets/player_sheet.png',
        frameWidth: 32,
        frameHeight: 32
    }
}
```

3. Update animation frame numbers in `createPlayerAnimations()`

The game will automatically use sprites when available, or fall back to placeholder shapes.

## Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for architecture overview
- Review existing entity classes for patterns
- All code is heavily commented for clarity
- Test in browser console: `window.game = this` in Game.js to access scene

Happy coding! 🎮

