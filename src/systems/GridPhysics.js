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

    /**
     * Check if a move is valid and return action type
     * @returns {Object} {allowed: boolean, action: "move"|"push"|"blocked"|"gate", data: any}
     */
    canMoveTo(fromX, fromY, toX, toY, entityType = 'player') {
        // 1. Check grid bounds
        if (toX < 0 || toX >= this.gridWidth || toY < 0 || toY >= this.gridHeight) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GridPhysics.js:58',message:'OUT OF BOUNDS',data:{from:{x:fromX,y:fromY},to:{x:toX,y:toY},gridSize:{w:this.gridWidth,h:this.gridHeight}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return { allowed: false, action: 'blocked', reason: 'out_of_bounds' };
        }

        // 2. Check wall collision (unless "Wall is Air" rule is active)
        if (!this.ruleManager.isRuleActive('wall_is_air')) {
            if (this.isWallAt(toX, toY)) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GridPhysics.js:65',message:'WALL COLLISION',data:{from:{x:fromX,y:fromY},to:{x:toX,y:toY}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                return { allowed: false, action: 'blocked', reason: 'wall' };
            }
        }

        // 3. Check gate collision
        const gate = this.getGateAt(toX, toY);
        if (gate && !gate.isOpen) {
            return { allowed: false, action: 'gate', data: gate };
        }

        // 4. Check pushable objects
        const pushable = this.getPushableAt(toX, toY);
        if (pushable && entityType === 'player') {
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

        // 5. All checks passed - move is allowed
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

        // Check if target position is empty
        if (this.isWallAt(targetX, targetY)) {
            return { allowed: false, reason: 'wall' };
        }

        const gate = this.getGateAt(targetX, targetY);
        if (gate && !gate.isOpen) {
            return { allowed: false, reason: 'gate' };
        }

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
        const hasWall = this.walls.some(wall => wall.gridX === gridX && wall.gridY === gridY);
        // #region agent log
        if (hasWall) {
            fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GridPhysics.js:141',message:'isWallAt CHECK',data:{pos:{x:gridX,y:gridY},hasWall},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        }
        // #endregion
        return hasWall;
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
        const result = {
            x: this.gridOffsetX + gridX * this.tileSize + this.tileSize / 2,
            y: this.gridOffsetY + gridY * this.tileSize + this.tileSize / 2
        };
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GridPhysics.js:165',message:'gridToPixel conversion',data:{gridPos:{x:gridX,y:gridY},pixelPos:result,config:{offsetX:this.gridOffsetX,offsetY:this.gridOffsetY,tileSize:this.tileSize}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        return result;
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
        if (this.ruleManager.isRuleActive('player_is_fast')) {
            return 100; // Half normal speed
        }
        return 200; // Normal speed
    }

    /**
     * Clear all entity references (for level reset)
     */
    clear() {
        this.walls = [];
        this.gates = [];
        this.pushables = [];
    }
}

