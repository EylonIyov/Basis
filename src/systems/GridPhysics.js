/**
 * GridPhysics - Core movement and collision system
 * Handles grid-based movement, collision detection, and push mechanics
 * Integrates with RuleManager for dynamic physics rules
 */
export class GridPhysics {
    constructor(scene, ruleManager) {
        this.scene = scene;
        this.ruleManager = ruleManager;
        
        // Grid configuration (set by scene)
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.tileSize = 32;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        
        // Entity tracking
        this.walls = [];
        this.gates = [];
        this.pushables = [];
        this.friend = null;
    }

    /**
     * Initialize grid configuration from scene
     */
    configure(gridWidth, gridHeight, tileSize, offsetX, offsetY) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.tileSize = tileSize;
        this.gridOffsetX = offsetX;
        this.gridOffsetY = offsetY;
    }

    /**
     * Register entities for collision detection
     */
    registerWalls(walls) {
        this.walls = walls;
    }

    registerGates(gates) {
        this.gates = gates;
    }

    registerPushables(pushables) {
        this.pushables = pushables;
    }

    registerFriend(friend) {
        this.friend = friend;
    }

    /**
     * Check if a move is valid and return action type
     * @returns {Object} {allowed: boolean, action: "move"|"push"|"blocked"|"gate"|"win", data: any}
     */
    canMoveTo(fromX, fromY, toX, toY, entityType = 'player') {
        // 1. Check grid bounds
        if (toX < 0 || toX >= this.gridWidth || toY < 0 || toY >= this.gridHeight) {
            return { allowed: false, action: 'blocked', reason: 'out_of_bounds' };
        }

        // 2. Check for ghost mode (player can pass through everything)
        const isGhost = this.ruleManager && this.ruleManager.isRuleActive('PLAYER_IS_GHOST');
        
        // 3. Check wall collision (unless "WALL_IS_AIR" or ghost mode is active)
        if (!isGhost) {
            const wallIsAir = this.ruleManager && this.ruleManager.isRuleActive('WALL_IS_AIR');
            if (!wallIsAir && this.isWallAt(toX, toY)) {
                return { allowed: false, action: 'blocked', reason: 'wall' };
            }
        }

        // 4. Check gate collision (unless ghost mode or all gates open)
        if (!isGhost) {
            const allGatesOpen = this.ruleManager && this.ruleManager.isRuleActive('GATE_IS_OPEN');
            const gate = this.getGateAt(toX, toY);
            if (gate && !gate.isOpen && !allGatesOpen) {
                return { allowed: false, action: 'gate', data: gate };
            }
        }

        // 5. Check for friend (win condition)
        if (this.friend && this.friend.isAt && this.friend.isAt(toX, toY)) {
            const friendIsGoal = !this.ruleManager || this.ruleManager.isRuleActive('FRIEND_IS_GOAL');
            if (friendIsGoal) {
                return { allowed: true, action: 'win', data: this.friend };
            }
        }

        // 6. Check pushable objects (unless push is disabled or ghost mode)
        if (!isGhost) {
            const pushDisabled = this.ruleManager && this.ruleManager.isRuleActive('PUSH_IS_DISABLED');
            const pushable = this.getPushableAt(toX, toY);
            
            if (pushable && entityType === 'player') {
                if (pushDisabled) {
                    return { allowed: false, action: 'blocked', reason: 'push_disabled' };
                }
                
                // Calculate push direction
                const direction = {
                    x: toX - fromX,
                    y: toY - fromY
                };
                
                // Check if push is possible
                const pushResult = this.canPush(toX, toY, direction);
                if (pushResult.allowed) {
                    return { allowed: true, action: 'push', data: { pushable, direction, ...pushResult } };
                } else {
                    return { allowed: false, action: 'blocked', reason: 'push_failed' };
                }
            }
        }

        // 7. All checks passed - move is allowed
        return { allowed: true, action: 'move' };
    }

    /**
     * Check if a pushable object can be pushed in a direction
     */
    canPush(pushableX, pushableY, direction) {
        const targetX = pushableX + direction.x;
        const targetY = pushableY + direction.y;

        // Check bounds
        if (targetX < 0 || targetX >= this.gridWidth || targetY < 0 || targetY >= this.gridHeight) {
            return { allowed: false, reason: 'out_of_bounds' };
        }

        // Check if target position is empty (walls block push)
        const wallIsAir = this.ruleManager && this.ruleManager.isRuleActive('WALL_IS_AIR');
        if (!wallIsAir && this.isWallAt(targetX, targetY)) {
            return { allowed: false, reason: 'wall' };
        }

        // Gates block push unless all gates are open
        const allGatesOpen = this.ruleManager && this.ruleManager.isRuleActive('GATE_IS_OPEN');
        const gate = this.getGateAt(targetX, targetY);
        if (gate && !gate.isOpen && !allGatesOpen) {
            return { allowed: false, reason: 'gate' };
        }

        // Can't push into another pushable
        if (this.getPushableAt(targetX, targetY)) {
            return { allowed: false, reason: 'another_pushable' };
        }

        return { allowed: true, targetX, targetY };
    }

    /**
     * Execute a push action
     */
    executePush(pushable, targetX, targetY, duration = 200) {
        if (!pushable || !pushable.push) {
            console.error('Invalid pushable object', pushable);
            return Promise.reject('Invalid pushable');
        }

        return pushable.push(targetX, targetY, duration);
    }

    /**
     * Check if there's a wall at grid position
     */
    isWallAt(gridX, gridY) {
        if (!this.walls) return false;
        return this.walls.some(wall => wall.gridX === gridX && wall.gridY === gridY);
    }

    /**
     * Get gate at grid position (returns null if none or if open)
     */
    getGateAt(gridX, gridY) {
        if (!this.gates) return null;
        return this.gates.find(gate => gate.gridX === gridX && gate.gridY === gridY && !gate.isOpen);
    }

    /**
     * Get pushable object at grid position
     */
    getPushableAt(gridX, gridY) {
        if (!this.pushables) return null;
        return this.pushables.find(pushable => pushable.gridX === gridX && pushable.gridY === gridY);
    }

    /**
     * Convert grid coordinates to pixel coordinates
     */
    gridToPixel(gridX, gridY) {
        return {
            x: this.gridOffsetX + gridX * this.tileSize + this.tileSize / 2,
            y: this.gridOffsetY + gridY * this.tileSize + this.tileSize / 2
        };
    }

    /**
     * Convert pixel coordinates to grid coordinates
     */
    pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor((pixelX - this.gridOffsetX) / this.tileSize),
            y: Math.floor((pixelY - this.gridOffsetY) / this.tileSize)
        };
    }

    /**
     * Get movement speed based on active rules
     */
    getMovementDuration() {
        if (this.ruleManager) {
            if (this.ruleManager.isRuleActive('PLAYER_IS_FAST')) {
                return 100; // Fast movement
            }
            if (this.ruleManager.isRuleActive('PLAYER_IS_SLOW')) {
                return 400; // Slow movement
            }
        }
        return 200; // Normal speed
    }

    /**
     * Apply visual effect when walls become air
     */
    applyWallIsAirEffect() {
        if (!this.walls) return;
        
        this.walls.forEach(wall => {
            if (wall.sprite) {
                // Fade out walls
                this.scene.tweens.add({
                    targets: wall.sprite,
                    alpha: 0.3,
                    duration: 500,
                    ease: 'Power2'
                });
            }
        });
    }

    /**
     * Revert wall is air effect
     */
    revertWallIsAirEffect() {
        if (!this.walls) return;
        
        this.walls.forEach(wall => {
            if (wall.sprite) {
                this.scene.tweens.add({
                    targets: wall.sprite,
                    alpha: 1,
                    duration: 500,
                    ease: 'Power2'
                });
            }
        });
    }

    /**
     * Clear all entity references (for level reset)
     */
    clear() {
        this.walls = [];
        this.gates = [];
        this.pushables = [];
        this.friend = null;
    }
}
