/**
 * LevelLoader - Loads and parses level data from matrix format
 * Matrix format: 20x15 grid where:
 * 0 = blank/empty tile
 * 1 = wall
 * 2 = gate
 * 3 = starting position
 * 4 = end goal
 */
export class LevelLoader {
    constructor() {
        this.gridWidth = 20;
        this.gridHeight = 15;
    }

    /**
     * Load a level from matrix format
     * @param {Array<Array<number>>} matrix - 20x15 matrix representing the level
     * @param {Object} gateData - Object mapping gate positions to gate info (id, path, riddleId)
     * @returns {Object} Parsed level data
     */
    loadFromMatrix(matrix, gateData = {}) {
        if (!matrix || matrix.length !== this.gridHeight) {
            throw new Error(`Matrix must be ${this.gridHeight} rows tall`);
        }

        const level = {
            name: "Level",
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            start: null,
            goal: null,
            gates: [],
            walls: []
        };

        // Parse matrix
        for (let y = 0; y < this.gridHeight; y++) {
            if (!matrix[y] || matrix[y].length !== this.gridWidth) {
                throw new Error(`Row ${y} must be ${this.gridWidth} tiles wide`);
            }

            for (let x = 0; x < this.gridWidth; x++) {
                const cell = matrix[y][x];

                switch (cell) {
                    case 0: // Blank - do nothing
                        break;
                    
                    case 1: // Wall
                        level.walls.push({ x, y, width: 1, height: 1 });
                        break;
                    
                    case 2: // Gate
                        const gateKey = `${x},${y}`;
                        const gateInfo = gateData[gateKey] || {
                            id: `gate_${x}_${y}`,
                            path: 'unknown',
                            riddleId: 'placeholder'
                        };
                        level.gates.push({
                            id: gateInfo.id,
                            x: x,
                            y: y,
                            path: gateInfo.path,
                            riddleId: gateInfo.riddleId
                        });
                        break;
                    
                    case 3: // Start position
                        if (level.start) {
                            console.warn(`Multiple start positions found, using first one at (${level.start.x}, ${level.start.y})`);
                        } else {
                            level.start = { x, y };
                        }
                        break;
                    
                    case 4: // Goal
                        if (level.goal) {
                            console.warn(`Multiple goals found, using first one at (${level.goal.x}, ${level.goal.y})`);
                        } else {
                            level.goal = { x, y };
                        }
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
        if (!level.goal) {
            throw new Error('Level must have a goal position (value 4)');
        }

        return level;
    }

    /**
     * Convert walls array to optimized format (merge adjacent walls)
     * This is optional - the current format works fine too
     */
    optimizeWalls(walls) {
        // For now, just return walls as-is
        // Could be optimized to merge adjacent walls into larger rectangles
        return walls;
    }
}
