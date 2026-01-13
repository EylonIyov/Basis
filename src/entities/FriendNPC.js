/**
 * FriendNPC - The goal character that replaces the "food"
 * Win condition: Player reaches the friend
 */
export class FriendNPC {
    constructor(scene, gridX, gridY) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Grid physics reference (for positioning)
        this.gridPhysics = null;
        
        // Create sprite
        this.createSprite();
    }

    /**
     * Create friend NPC sprite with animations
     */
    createSprite() {
        const pixelPos = this.getPixelPosition();
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FriendNPC.js:23',message:'createSprite - FRIEND POSITION',data:{gridX:this.gridX,gridY:this.gridY,pixelX:pixelPos.x,pixelY:pixelPos.y},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FRIEND'})}).catch(()=>{});
        // #endregion
        
        // Try to use sprite sheet if available
        if (this.scene.textures.exists('friend')) {
            this.sprite = this.scene.add.sprite(pixelPos.x, pixelPos.y, 'friend');
            this.sprite.setOrigin(0.5);
            
            // Play wave animation if it exists
            if (this.scene.anims.exists('friend_wave')) {
                this.sprite.play('friend_wave');
            }
        } else {
            // Fallback to placeholder - Friendly character
            const size = this.scene.gridPhysics ? this.scene.gridPhysics.tileSize - 10 : 22;
            
            // Create container for friend
            this.sprite = this.scene.add.container(pixelPos.x, pixelPos.y);
            
            // Body - yellow/gold circle (friendly)
            const body = this.scene.add.circle(0, 0, size/2, 0xffd700);
            body.setStrokeStyle(2, 0xffa500);
            this.sprite.add(body);
            
            // Happy face
            const eye1 = this.scene.add.circle(-5, -4, 2, 0x000000);
            const eye2 = this.scene.add.circle(5, -4, 2, 0x000000);
            this.sprite.add(eye1);
            this.sprite.add(eye2);
            
            // Big smile
            const smile = this.scene.add.arc(0, 2, 8, 0, Math.PI, false, 0x000000);
            smile.setStrokeStyle(2, 0x000000);
            smile.isFilled = false;
            this.sprite.add(smile);
            
            // Waving hand (small circle to the side)
            const hand = this.scene.add.circle(size/2 + 4, -size/3, 4, 0xffd700);
            hand.setStrokeStyle(1, 0xffa500);
            this.sprite.add(hand);
            
            // Store references
            this.bodyParts = { body, eye1, eye2, smile, hand };
        }
        
        this.sprite.setDepth(8); // Friend depth
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
     * Play celebration animation when player reaches friend
     */
    celebrate() {
        // Stop existing animations
        this.scene.tweens.killTweensOf(this.sprite);
        if (this.bodyParts) {
            Object.values(this.bodyParts).forEach(part => {
                this.scene.tweens.killTweensOf(part);
            });
        }
        
        // Play celebrate animation
        if (this.sprite.anims && this.scene.anims.exists('friend_celebrate')) {
            this.sprite.play('friend_celebrate');
        } else {
            // Placeholder celebration: jump and spin
            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 40,
                duration: 400,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
            
            this.scene.tweens.add({
                targets: this.sprite,
                angle: 360,
                duration: 800,
                ease: 'Back.easeOut'
            });
            
            this.scene.tweens.add({
                targets: this.sprite,
                scale: 1.3,
                duration: 400,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        }
        
        // Create celebration particles
        this.createCelebrationParticles();
    }

    /**
     * Create simple celebration particle effect
     */
    createCelebrationParticles() {
        const x = this.sprite.x;
        const y = this.sprite.y;
        
        // Create confetti-like particles
        const colors = [0xffd700, 0xff69b4, 0x00ffff, 0xff4500, 0x9370db];
        
        for (let i = 0; i < 20; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.scene.add.rectangle(x, y, 6, 6, color);
            particle.setDepth(15);
            
            const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
            const distance = 50 + Math.random() * 50;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance - 30; // Upward bias
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                angle: Math.random() * 720 - 360,
                duration: 800 + Math.random() * 400,
                ease: 'Quad.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Get current grid position
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Check if friend is at a specific position
     */
    isAt(gridX, gridY) {
        return this.gridX === gridX && this.gridY === gridY;
    }

    /**
     * Check if player has reached friend
     */
    checkReached(playerGridX, playerGridY) {
        return this.gridX === playerGridX && this.gridY === playerGridY;
    }

    /**
     * Destroy friend sprite
     */
    destroy() {
        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);
            if (this.bodyParts) {
                Object.values(this.bodyParts).forEach(part => {
                    this.scene.tweens.killTweensOf(part);
                });
            }
            this.sprite.destroy();
        }
        if (this.label) {
            this.scene.tweens.killTweensOf(this.label);
            this.label.destroy();
        }
        this.bodyParts = null;
    }
}

