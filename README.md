# Basis

**A puzzle-adventure game where the rules of reality can change**

Inspired by "Baba Is You", Basis is a grid-based puzzle game featuring dynamic rule modifications, Sokoban-style push mechanics, and a modular, scalable architecture built with Phaser 3.

## 🎮 Game Features

- **Grid-Based Puzzle Gameplay**: Navigate 20×15 tile grids with precise movement
- **Dynamic Rule System**: Solve "Rule Riddles" to change the laws of physics
  - *Wall is Air*: Make all walls traversable
  - *Player is Fast*: Double your movement speed
- **Push Mechanics**: Sokoban-style object pushing (boxes, crates, boulders)
- **Barrier Riddles**: Classic riddles that unlock gates
- **Layered Rendering**: Beautiful backgrounds with semi-transparent grid overlay
- **Progressive Difficulty**: 3 levels (with room for 100+ more!)

## 🚀 Quick Start

### Running the Game

1. Start a local web server in the project directory:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server
   ```

2. Open your browser to `http://localhost:8000`

3. Use arrow keys to move, solve riddles, and reach your friend!

## 🎯 How to Play

- **Move**: Arrow keys (←↑→↓)
- **Push Objects**: Walk into boxes/crates/boulders to push them
- **Gates**: Answer riddles correctly to open gates
- **Rule Riddles**: Some riddles change the world permanently when solved!
- **Goal**: Navigate to your friend to complete the level

## 🏗️ Architecture

### Modular Design

The game uses a clean, modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Game Scene (Orchestrator)        │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────────┐
│Systems │      │  Managers   │
├────────┤      ├─────────────┤
│Physics │      │AssetLoader  │
│Rules   │      │LevelRenderer│
└────────┘      │RiddleUI     │
                └─────────────┘
                      │
                ┌─────┴─────┐
                │           │
           ┌────▼───┐  ┌────▼────┐
           │Entities│  │ Levels  │
           ├────────┤  ├─────────┤
           │Player  │  │Level1-3 │
           │Friend  │  │Loader   │
           │Pushable│  │Manager  │
           └────────┘  └─────────┘
```

### Key Systems

- **GridPhysics**: Collision detection, movement validation, push mechanics
- **RuleManager**: Global state management for dynamic rules
- **LevelRenderer**: Three-layer rendering (background, grid, gameplay)
- **RiddleUIManager**: Modal UI for riddles and answers
- **AssetLoader**: Centralized asset and animation management

### Code Quality

- ✅ **665 → 310 lines** in Game.js (53% reduction)
- ✅ **~2,270 lines** of new, organized code
- ✅ **Zero linting errors**
- ✅ **Comprehensive documentation**

## 📁 Project Structure

```
/Basis
├── assets/                    # Game assets
├── src/
│   ├── entities/             # Game entities
│   │   ├── Player.js         # Main character with animations
│   │   ├── FriendNPC.js      # Goal character
│   │   └── PushableObject.js # Boxes, crates, boulders
│   ├── systems/              # Core systems
│   │   ├── GridPhysics.js    # Movement & collision
│   │   └── RuleManager.js    # Dynamic rule system
│   ├── managers/             # Management systems
│   │   ├── AssetLoader.js    # Asset management
│   │   ├── LevelRenderer.js  # Rendering system
│   │   └── RiddleUIManager.js# Riddle UI
│   ├── levels/               # Level definitions
│   │   ├── LevelLoader.js    # Matrix parser
│   │   ├── LevelManager.js   # Level progression
│   │   ├── Level1.js         # Tutorial level
│   │   ├── Level2.js         # Forest theme + pushables
│   │   └── Level3.js         # Cave theme + rule riddle
│   ├── riddles/              # Riddle system
│   │   ├── RiddleManager.js  # Riddle logic
│   │   └── riddles.json      # 10 barrier + 2 rule riddles
│   ├── scenes/               # Phaser scenes
│   │   └── Game.js           # Main game scene (refactored)
│   └── main.js               # Game configuration
├── index.html                # Entry point
├── phaser.js                 # Phaser 3 library
├── IMPLEMENTATION_SUMMARY.md # Technical overview
└── DEVELOPER_GUIDE.md        # Developer documentation
```

## 🛠️ For Developers

### Adding a New Level

Create a 20×15 matrix with values:
- `0` = Empty
- `1` = Wall
- `2` = Gate
- `3` = Start position
- `4` = Goal (friend)
- `5` = Pushable object

```javascript
const loader = new LevelLoader();
export const Level4 = loader.loadFromMatrix(matrix, gateData, {
    theme: 'forest',              // Background theme
    pushables: { '5,7': { type: 'box' } },
    ruleRiddles: ['wall_is_air']  // Available rule riddles
});
```

See `DEVELOPER_GUIDE.md` for complete instructions.

### Adding a New Rule

1. Define in `RuleManager.ruleDefinitions`
2. Implement effect in `applyGameplayEffect()`
3. Add visual effect in `applyVisualEffect()`
4. Update `GridPhysics` to check the rule
5. Create rule riddle in `riddles.json`

Example rules you could add:
- **Gate is Open**: All gates become passable
- **Box is Light**: Boxes can be pulled, not just pushed
- **Player is Big**: Player occupies 2×2 tiles
- **Time is Slow**: Slow-motion effect

## 🎨 Visual Identity

- **Grid**: Semi-transparent white overlay (30% opacity)
- **Themes**: Default, Forest, Cave (extensible)
- **Particles**: Wall evaporation, celebration confetti
- **Animations**: Smooth tweening, bounce effects
- **Style**: Ready for high-quality 16-bit pixel art

## 📊 Current Content

- **3 Levels** (tutorial, forest, cave)
- **10 Barrier Riddles** (classic riddles)
- **2 Rule Riddles** (Wall is Air, Player is Fast)
- **3 Pushable Types** (box, crate, boulder)
- **3 Themes** (default, forest, cave)

## 🚧 Roadmap

### Phase 1: Content Expansion
- [ ] Add sprite sheets for Player and Friend
- [ ] Create background images for themes
- [ ] Design 10-15 more levels
- [ ] Add 5+ more rule types

### Phase 2: Polish
- [ ] Sound effects and music
- [ ] Particle effects enhancement
- [ ] UI polish and animations
- [ ] Level select screen

### Phase 3: Advanced Features
- [ ] Level editor
- [ ] Combine multiple rules
- [ ] Time-limited rule effects
- [ ] Achievement system

## 📖 Documentation

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**: Complete technical overview
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**: How to extend the game
- **[src/levels/HOW_TO_ADD_LEVELS.md](src/levels/HOW_TO_ADD_LEVELS.md)**: Level creation guide
- **[src/riddles/README.md](src/riddles/README.md)**: Riddle system documentation

## 🎓 Learning Resources

This codebase demonstrates:
- **Modular game architecture** (systems, managers, entities)
- **Phaser 3 best practices** (scene management, tweens, animations)
- **Grid-based game physics** (collision, movement validation)
- **State management** (global rules, level progression)
- **Data-driven design** (JSON-based levels and riddles)

Perfect for learning game development patterns!

## 🤝 Contributing

The codebase is designed for easy expansion:
- Clear separation of concerns
- Comprehensive inline documentation
- Consistent coding patterns
- Graceful fallback systems

Add your own levels, rules, entities, or mechanics by following the patterns in existing code.

## 📝 License

This project is provided as-is for educational and development purposes.

## 🙏 Credits

- **Game Engine**: Phaser 3
- **Inspiration**: "Baba Is You" by Arvi Teikari
- **Architecture**: Built following systemic game design principles

---

**Ready to change the rules? Start playing Basis!** 🎮✨

