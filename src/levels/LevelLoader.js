/**
 * LevelLoader - Loads and parses level data from matrix format
 * 
 * Expanded Matrix Format (20x15 grid):
 * 0  = Empty/Floor tile (walkable)
 * 1  = Brick Wall (classic, affected by BRICK_IS_AIR)
 * 2  = Gate (requires riddle to pass)
 * 3  = Player Start position
 * 4  = Friend NPC (Win condition)
 * 5  = Pushable Block
 * 6  = Socket (pressure plate for blocks)
 * 7  = Special Wall (unlocks when socket is filled)
 * 8  = Wood Wall (affected by WOOD_IS_AIR, can shuffle)
 * 9  = Iron Wall (affected by IRON_IS_AIR)
 * 10 = Steel Wall (affected by STEEL_IS_AIR)
 */
export class LevelLoader {
    constructor() {
        this.gridWidth = 20;
        this.gridHeight = 15;
    }

    /**
     * Load a level from matrix format
     * @param {Array<Array<number>>} matrix - 20x15 matrix representing the level
     * @param {Object} gateData - Object mapping gate positions to gate info
     * @param {Object} options - Additional level options (background, theme)
     * @returns {Object} Parsed level data
     */
    loadFromMatrix(matrix, gateData = {}, options = {}) {
        if (!matrix || matrix.length !== this.gridHeight) {
            throw new Error(`Matrix must be ${this.gridHeight} rows tall`);
        }

        const level = {
            name: options.name || "Level",
            theme: options.theme || "cave",
            backgroundVideo: options.backgroundVideo || null, // Video key for background
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            start: null,
            friend: null,  // Replaces 'goal' - now an entity position
            gates: [],
            walls: [],
            pushables: [],
            sockets: [],      // Pressure plates for blocks
            specialWalls: [], // Walls that unlock when sockets are filled
            matrix: matrix  // Store original matrix for reference
        };

        // Parse matrix
        for (let y = 0; y < this.gridHeight; y++) {
            if (!matrix[y] || matrix[y].length !== this.gridWidth) {
                throw new Error(`Row ${y} must be ${this.gridWidth} tiles wide`);
            }

            for (let x = 0; x < this.gridWidth; x++) {
                const cell = matrix[y][x];

                switch (cell) {
                    case 0: // Empty/Floor - do nothing
                        break;
                    
                    case 1: // Brick Wall
                        level.walls.push({ 
                            x, 
                            y, 
                            width: 1, 
                            height: 1,
                            type: 'brick'
                        });
                        break;
                    
                    case 8: // Wood Wall
                        level.walls.push({ 
                            x, 
                            y, 
                            width: 1, 
                            height: 1,
                            type: 'wood'
                        });
                        break;
                    
                    case 9: // Iron Wall
                        level.walls.push({ 
                            x, 
                            y, 
                            width: 1, 
                            height: 1,
                            type: 'iron'
                        });
                        break;
                    
                    case 10: // Steel Wall
                        level.walls.push({ 
                            x, 
                            y, 
                            width: 1, 
                            height: 1,
                            type: 'steel'
                        });
                        break;
                    
                    case 2: // Gate
                        const gateKey = `${x},${y}`;
                        const gateInfo = gateData[gateKey] || {
                            id: `gate_${x}_${y}`,
                            path: 'main',
                            riddleId: null,
                            type: 'barrier' // 'barrier' or 'rule'
                        };
                        level.gates.push({
                            id: gateInfo.id,
                            x: x,
                            y: y,
                            path: gateInfo.path,
                            riddleId: gateInfo.riddleId,
                            type: gateInfo.type || 'barrier',
                            ruleEffect: gateInfo.ruleEffect || null
                        });
                        break;
                    
                    case 3: // Player Start
                        if (level.start) {
                            console.warn(`Multiple start positions found, using first one at (${level.start.x}, ${level.start.y})`);
                        } else {
                            level.start = { x, y };
                        }
                        break;
                    
                    case 4: // Friend (Win condition - replaces old 'goal')
                        if (level.friend) {
                            console.warn(`Multiple friends found, using first one at (${level.friend.x}, ${level.friend.y})`);
                        } else {
                            level.friend = { x, y };
                        }
                        // Also set goal for backwards compatibility
                        if (!level.goal) {
                            level.goal = { x, y };
                        }
                        break;
                    
                    case 5: // Pushable Block
                        level.pushables.push({
                            x,
                            y,
                            id: `pushable_${x}_${y}`,
                            type: 'block'
                        });
                        break;
                    
                    case 6: // Socket (pressure plate)
                        level.sockets.push({
                            x,
                            y,
                            id: `socket_${x}_${y}`,
                            isFilled: false
                        });
                        break;
                    
                    case 7: // Special Wall (unlocks when sockets filled)
                        level.specialWalls.push({
                            x,
                            y,
                            id: `specialwall_${x}_${y}`,
                            isUnlocked: false
                        });
                        break;
                    
                    default:
                        console.warn(`Unknown cell value ${cell} at position (${x}, ${y})`);
                }
            }
        }

        // Validate required elements
        if (!level.start) {
            throw new Error('Level must have a start position (value 3)');
        }
        if (!level.friend && !level.goal) {
            throw new Error('Level must have a friend/goal position (value 4)');
        }

        // Backwards compatibility: if only goal exists (old levels), use it as friend
        if (!level.friend && level.goal) {
            level.friend = { ...level.goal };
        }

        return level;
    }

    /**
     * Create a visual representation of the level for debugging
     */
    visualizeLevel(level) {
        const symbols = {
            empty: '.',
            wall: '#',
            gate: 'G',
            start: 'S',
            friend: 'F',
            pushable: 'P'
        };

        let output = `Level: ${level.name}\n`;
        output += `Grid: ${level.gridWidth}x${level.gridHeight}\n`;
        output += '-'.repeat(level.gridWidth + 2) + '\n';

        for (let y = 0; y < level.gridHeight; y++) {
            let row = '|';
            for (let x = 0; x < level.gridWidth; x++) {
                // Check what's at this position
                if (level.start && level.start.x === x && level.start.y === y) {
                    row += symbols.start;
                } else if (level.friend && level.friend.x === x && level.friend.y === y) {
                    row += symbols.friend;
                } else if (level.walls.some(w => w.x === x && w.y === y)) {
                    row += symbols.wall;
                } else if (level.gates.some(g => g.x === x && g.y === y)) {
                    row += symbols.gate;
                } else if (level.pushables.some(p => p.x === x && p.y === y)) {
                    row += symbols.pushable;
                } else {
                    row += symbols.empty;
                }
            }
            row += '|';
            output += row + '\n';
        }

        output += '-'.repeat(level.gridWidth + 2);
        return output;
    }

    /**
     * Validate a level for common issues
     */
    validateLevel(level) {
        const issues = [];

        // Check start position is accessible
        if (this.isBlocked(level, level.start.x, level.start.y)) {
            issues.push('Start position is blocked by a wall');
        }

        // Check friend position is accessible (theoretically)
        if (level.friend && this.isBlocked(level, level.friend.x, level.friend.y)) {
            issues.push('Friend position is blocked by a wall');
        }

        // Check gates don't overlap with walls
        level.gates.forEach(gate => {
            if (level.walls.some(w => w.x === gate.x && w.y === gate.y)) {
                issues.push(`Gate at (${gate.x}, ${gate.y}) overlaps with a wall`);
            }
        });

        // Check pushables don't overlap with walls or gates
        level.pushables.forEach(pushable => {
            if (level.walls.some(w => w.x === pushable.x && w.y === pushable.y)) {
                issues.push(`Pushable at (${pushable.x}, ${pushable.y}) overlaps with a wall`);
            }
            if (level.gates.some(g => g.x === pushable.x && g.y === pushable.y)) {
                issues.push(`Pushable at (${pushable.x}, ${pushable.y}) overlaps with a gate`);
            }
        });

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Check if a position is blocked by a wall
     */
    isBlocked(level, x, y) {
        return level.walls.some(w => w.x === x && w.y === y);
    }

    /**
     * Get adjacent empty cells from a position
     */
    getAdjacentEmpty(level, x, y) {
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];

        return directions
            .map(d => ({ x: x + d.dx, y: y + d.dy }))
            .filter(pos => 
                pos.x >= 0 && pos.x < level.gridWidth &&
                pos.y >= 0 && pos.y < level.gridHeight &&
                !this.isBlocked(level, pos.x, pos.y)
            );
    }
}
