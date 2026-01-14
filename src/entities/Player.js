/**
 * Player - Main character entity with animation and grid-based movement
 * Represents the "Brown Box" character with green shirt and cosmetic sword
 */
export class Player {
    constructor(scene, gridX, gridY) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Movement state
        this.isMoving = false;
        this.currentDirection = 'idle';
        this.facingRight = true;
        
        // Grid physics reference (set by scene)
        this.gridPhysics = null;
        
        // Create sprite
        this.createSprite();
    }

    /**
     * Create player sprite with animations
     */
    createSprite() {
        const pixelPos = this.getPixelPosition();
        
        // Try to use generated sprite sheet
        if (this.scene.textures.exists('player')) {
            this.sprite = this.scene.add.sprite(pixelPos.x, pixelPos.y, 'player');
            this.sprite.setOrigin(0.5);
            
            // Set display size to match tile
            const size = this.gridPhysics ? this.gridPhysics.tileSize - 4 : 28;
            this.sprite.setDisplaySize(size, size);
            
            // Play idle animation if it exists
            if (this.scene.anims.exists('player_idle')) {
                this.sprite.play('player_idle');
            }
        } else {
            // Fallback to placeholder - Brown Box character
            this.createPlaceholderSprite(pixelPos);
        }
        
        this.sprite.setDepth(10);
    }

    /**
     * Create placeholder sprite if texture not available
     */
    createPlaceholderSprite(pixelPos) {
        const size = this.gridPhysics ? this.gridPhysics.tileSize - 10 : 22;
        
        this.sprite = this.scene.add.container(pixelPos.x, pixelPos.y);
        
        // Shadow
        const shadow = this.scene.add.ellipse(0, size / 2 - 2, size * 0.7, 4, 0x000000, 0.3);
        this.sprite.add(shadow);
        
        // Body - brown rectangle (the "box")
        const body = this.scene.add.rectangle(0, 0, size, size, 0x8B4513);
        body.setStrokeStyle(2, 0x654321);
        this.sprite.add(body);
        
        // Green shirt indicator (horizontal stripe)
        const shirt = this.scene.add.rectangle(0, 2, size - 4, 6, 0x2ECC71);
        this.sprite.add(shirt);
        
        // Cosmetic sword (right side)
        const swordBlade = this.scene.add.rectangle(size / 2 + 6, 0, 12, 3, 0xC0C0C0);
        this.sprite.add(swordBlade);
        const swordHandle = this.scene.add.rectangle(size / 2, 0, 4, 6, 0x8B4513);
        this.sprite.add(swordHandle);
        
        // Face - two eyes
        const eye1 = this.scene.add.circle(-4, -4, 2, 0x000000);
        const eye2 = this.scene.add.circle(4, -4, 2, 0x000000);
        this.sprite.add(eye1);
        this.sprite.add(eye2);
        
        // Store references for animation
        this.bodyParts = { body, shirt, swordBlade, swordHandle, eye1, eye2, shadow };
    }

    /**
     * Set grid physics reference
     */
    setGridPhysics(gridPhysics) {
        this.gridPhysics = gridPhysics;
        
        // Reposition sprite with correct grid calculation
        const pixelPos = this.getPixelPosition();
        this.sprite.x = pixelPos.x;
        this.sprite.y = pixelPos.y;
        
        // Update size if using sprite
        if (this.sprite.setDisplaySize) {
            const size = this.gridPhysics.tileSize - 4;
            this.sprite.setDisplaySize(size, size);
        }
    }

    /**
     * Get current pixel position from grid position
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
     * @param {Object} direction - {x, y} direction vector
     * @returns {boolean} Whether the move was successful
     */
    tryMove(direction) {
        if (this.isMoving) {
            return false;
        }

        const newX = this.gridX + direction.x;
        const newY = this.gridY + direction.y;

        if (!this.gridPhysics) {
            console.error('[Player] GridPhysics not set');
            return false;
        }

        const moveResult = this.gridPhysics.canMoveTo(this.gridX, this.gridY, newX, newY, 'player');

        if (moveResult.allowed) {
            // Update facing direction
            if (direction.x !== 0) {
                this.facingRight = direction.x > 0;
                this.updateFacing();
            }

            if (moveResult.action === 'push') {
                this.executePush(newX, newY, moveResult.data);
            } else if (moveResult.action === 'win') {
                // Move to friend position (will trigger win in scene)
                this.moveTo(newX, newY);
            } else {
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

        // Movement blocked - play bump animation
        this.playBumpAnimation(direction);
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
                console.error('[Player] Push failed:', error);
                this.isMoving = false;
            });
    }

    /**
     * Move to a new grid position with animation
     */
    moveTo(newGridX, newGridY) {
        return new Promise((resolve) => {
            this.isMoving = true;
            
            // Calculate direction for animation
            const dirX = newGridX - this.gridX;
            const dirY = newGridY - this.gridY;
            
            // Update grid position immediately
            this.gridX = newGridX;
            this.gridY = newGridY;

            const targetPixel = this.gridPhysics.gridToPixel(newGridX, newGridY);
            const duration = this.gridPhysics.getMovementDuration();

            // Update animation
            this.playMoveAnimation(dirX, dirY);

            // Tween sprite to target position
            this.scene.tweens.add({
                targets: this.sprite,
                x: targetPixel.x,
                y: targetPixel.y,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    this.isMoving = false;
                    this.playIdleAnimation();
                    resolve();
                }
            });
        });
    }

    /**
     * Play movement animation
     */
    playMoveAnimation(dirX, dirY) {
        // For sprite sheet
        if (this.sprite.anims && this.scene.anims.exists('player_run_right')) {
            this.sprite.play('player_run_right', true);
            this.sprite.flipX = !this.facingRight;
        }
        
        // For placeholder - add bouncing effect
        if (this.bodyParts) {
            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 3,
                duration: 50,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    /**
     * Play idle animation
     */
    playIdleAnimation() {
        if (this.sprite.anims && this.scene.anims.exists('player_idle')) {
            this.sprite.play('player_idle', true);
        }
        this.currentDirection = 'idle';
    }

    /**
     * Play bump animation when movement is blocked
     */
    playBumpAnimation(direction) {
        const bumpDistance = 3;
        const currentX = this.sprite.x;
        const currentY = this.sprite.y;

        this.scene.tweens.add({
            targets: this.sprite,
            x: currentX + direction.x * bumpDistance,
            y: currentY + direction.y * bumpDistance,
            duration: 50,
            yoyo: true,
            ease: 'Power1'
        });
    }

    /**
     * Update sprite facing direction
     */
    updateFacing() {
        if (this.sprite.flipX !== undefined) {
            this.sprite.flipX = !this.facingRight;
        } else if (this.sprite.scaleX !== undefined) {
            // For containers, use scaleX
            this.sprite.scaleX = this.facingRight ? 1 : -1;
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
     * Teleport player to a new position (no animation)
     */
    teleportTo(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        
        const pixelPos = this.getPixelPosition();
        this.sprite.x = pixelPos.x;
        this.sprite.y = pixelPos.y;
    }

    /**
     * Destroy player sprite
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        this.bodyParts = null;
    }
}
