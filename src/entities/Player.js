/**
 * Player - Main character entity with animation and grid-based movement
 * Represents the "Brown Box" character with sword (cosmetic)
 */
export class Player {
    constructor(scene, gridX, gridY) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Movement state
        this.isMoving = false;
        this.currentDirection = 'idle';
        
        // Get grid physics reference (will be set by scene)
        this.gridPhysics = null;
        
        // Create sprite
        this.createSprite();
    }

    /**
     * Create player sprite with animations
     */
    createSprite() {
        // Calculate pixel position
        const pixelPos = this.getPixelPosition();
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:26',message:'createSprite - INITIAL',data:{gridX:this.gridX,gridY:this.gridY,pixelX:pixelPos.x,pixelY:pixelPos.y,hasGridPhysics:!!this.gridPhysics},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        // Try to use sprite sheet if available
        if (this.scene.textures.exists('player')) {
            this.sprite = this.scene.add.sprite(pixelPos.x, pixelPos.y, 'player');
            this.sprite.setOrigin(0.5);
            
            // Play idle animation if it exists
            if (this.scene.anims.exists('player_idle')) {
                this.sprite.play('player_idle');
            }
        } else {
            // Fallback to placeholder - Brown Box character with sword
            const size = this.scene.gridPhysics ? this.scene.gridPhysics.tileSize - 10 : 22;
            
            // Create container for player
            this.sprite = this.scene.add.container(pixelPos.x, pixelPos.y);
            
            // Body - brown rectangle (the "box")
            const body = this.scene.add.rectangle(0, 0, size, size, 0x8b4513);
            body.setStrokeStyle(2, 0x654321);
            this.sprite.add(body);
            
            // Green shirt indicator (horizontal stripe)
            const shirt = this.scene.add.rectangle(0, 2, size - 4, 6, 0x2ecc71);
            this.sprite.add(shirt);
            
            // Cosmetic sword (right side)
            const swordBlade = this.scene.add.rectangle(size/2 + 6, 0, 12, 3, 0xc0c0c0);
            this.sprite.add(swordBlade);
            const swordHandle = this.scene.add.rectangle(size/2, 0, 4, 6, 0x8b4513);
            this.sprite.add(swordHandle);
            
            // Simple face (two eyes)
            const eye1 = this.scene.add.circle(-4, -3, 2, 0x000000);
            const eye2 = this.scene.add.circle(4, -3, 2, 0x000000);
            this.sprite.add(eye1);
            this.sprite.add(eye2);
            
            // Store references for animation
            this.bodyParts = { body, shirt, swordBlade, swordHandle, eye1, eye2 };
        }
        
        this.sprite.setDepth(10); // Player depth
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:76',message:'createSprite - AFTER CREATE',data:{spriteX:this.sprite.x,spriteY:this.sprite.y,spriteType:this.sprite.type,depth:this.sprite.depth},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
    }

    /**
     * Set grid physics reference
     */
    setGridPhysics(gridPhysics) {
        this.gridPhysics = gridPhysics;
    }

    /**
     * Get current pixel position
     */
    getPixelPosition() {
        if (this.gridPhysics) {
            return this.gridPhysics.gridToPixel(this.gridX, this.gridY);
        }
        // Fallback calculation
        return {
            x: this.gridX * 32 + 16,
            y: this.gridY * 32 + 16
        };
    }

    /**
     * Attempt to move in a direction
     */
    tryMove(direction) {
        if (this.isMoving) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:103',message:'tryMove blocked - already moving',data:{currentPos:{x:this.gridX,y:this.gridY}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return false;
        }

        const newX = this.gridX + direction.x;
        const newY = this.gridY + direction.y;

        // Check if move is valid through physics system
        if (!this.gridPhysics) {
            console.error('GridPhysics not set on Player');
            return false;
        }

        const moveResult = this.gridPhysics.canMoveTo(this.gridX, this.gridY, newX, newY, 'player');

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:118',message:'canMoveTo result',data:{from:{x:this.gridX,y:this.gridY},to:{x:newX,y:newY},moveResult:{allowed:moveResult.allowed,action:moveResult.action,reason:moveResult.reason}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        if (moveResult.allowed) {
            if (moveResult.action === 'push') {
                // Handle push
                this.executePush(newX, newY, moveResult.data);
            } else {
                // Normal move
                this.moveTo(newX, newY);
            }
            return true;
        } else if (moveResult.action === 'gate') {
            // Trigger gate interaction (handled by scene)
            if (this.scene.handleGateCollision) {
                this.scene.handleGateCollision(moveResult.data);
            }
            return false;
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:142',message:'move BLOCKED',data:{from:{x:this.gridX,y:this.gridY},to:{x:newX,y:newY},reason:moveResult.reason},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        return false;
    }

    /**
     * Execute a push action
     */
    executePush(newX, newY, pushData) {
        this.isMoving = true;
        
        const duration = this.gridPhysics.getMovementDuration();
        
        // First, push the object
        this.gridPhysics.executePush(pushData.pushable, pushData.targetX, pushData.targetY, duration)
            .then(() => {
                // Then move the player
                return this.moveTo(newX, newY);
            })
            .catch(error => {
                console.error('Push failed:', error);
                this.isMoving = false;
            });
    }

    /**
     * Move to a new grid position with animation
     */
    moveTo(newGridX, newGridY) {
        return new Promise((resolve) => {
            this.isMoving = true;
            
            // Calculate direction BEFORE updating position
            const dirX = newGridX - this.gridX;
            const dirY = newGridY - this.gridY;
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:170',message:'moveTo - BEFORE UPDATE',data:{oldGrid:{x:this.gridX,y:this.gridY},newGrid:{x:newGridX,y:newGridY},currentSpritePos:{x:this.sprite.x,y:this.sprite.y}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
            // #endregion
            
            // UPDATE GRID POSITION IMMEDIATELY (before animation)
            this.gridX = newGridX;
            this.gridY = newGridY;

            const targetPixel = this.gridPhysics.gridToPixel(newGridX, newGridY);
            const duration = this.gridPhysics.getMovementDuration();

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:185',message:'moveTo - TWEEN TARGET',data:{targetPixel,duration,gridAfterUpdate:{x:this.gridX,y:this.gridY}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
            // #endregion

            // Update animation based on direction
            this.updateAnimation(dirX, dirY);

            // Tween sprite - single tween to target position
            this.scene.tweens.add({
                targets: this.sprite,
                x: targetPixel.x,
                y: targetPixel.y,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Player.js:202',message:'moveTo - TWEEN COMPLETE',data:{finalSpritePos:{x:this.sprite.x,y:this.sprite.y},finalGrid:{x:this.gridX,y:this.gridY}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
                    // #endregion
                    this.isMoving = false;
                    this.updateAnimation(0, 0); // Return to idle
                    resolve();
                }
            });
        });
    }

    /**
     * Update animation based on movement direction
     */
    updateAnimation(dirX, dirY) {
        // Only works with sprite sheet
        if (!this.sprite.anims) {
            return;
        }

        if (dirX === 0 && dirY === 0) {
            // Idle
            if (this.scene.anims.exists('player_idle')) {
                this.sprite.play('player_idle', true);
            }
            this.currentDirection = 'idle';
        } else if (Math.abs(dirX) > Math.abs(dirY)) {
            // Horizontal movement
            if (dirX > 0) {
                if (this.scene.anims.exists('player_run_right')) {
                    this.sprite.play('player_run_right', true);
                }
                this.currentDirection = 'right';
            } else {
                if (this.scene.anims.exists('player_run_left')) {
                    this.sprite.play('player_run_left', true);
                }
                this.currentDirection = 'left';
            }
        } else {
            // Vertical movement (use last horizontal direction or idle)
            if (this.scene.anims.exists('player_idle')) {
                this.sprite.play('player_idle', true);
            }
        }
    }

    /**
     * Get current grid position
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Check if player is at a specific position
     */
    isAt(gridX, gridY) {
        return this.gridX === gridX && this.gridY === gridY;
    }

    /**
     * Destroy player sprite
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.label) {
            this.label.destroy();
        }
        this.bodyParts = null;
    }
}

