/**
 * Friend - The goal NPC entity
 * Reaching the Friend triggers the level win condition
 */
export class Friend {
    constructor(scene, gridX, gridY, gridPhysics) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridPhysics = gridPhysics;
        
        this.sprite = null;
        
        this.createSprite();
    }

    /**
     * Create the friend sprite with animation
     */
    createSprite() {
        const pixelPos = this.getPixelPosition();

        // Try to use generated sprite
        if (this.scene.textures.exists('friend')) {
            this.sprite = this.scene.add.sprite(pixelPos.x, pixelPos.y, 'friend');
            this.sprite.setOrigin(0.5);
            
            // Play idle animation if it exists
            if (this.scene.anims.exists('friend_idle')) {
                this.sprite.play('friend_idle');
            }
        } else {
            // Fallback to placeholder
            this.createPlaceholderSprite(pixelPos);
        }

        this.sprite.setDepth(8); // Below player but above floor
        
        // Add particle effect around friend
        this.createParticleEffect(pixelPos);
        
        // Add glow effect
        this.createGlowEffect();
    }

    /**
     * Create placeholder sprite if texture not available
     */
    createPlaceholderSprite(pixelPos) {
        const size = this.gridPhysics ? this.gridPhysics.tileSize - 8 : 24;
        
        this.sprite = this.scene.add.container(pixelPos.x, pixelPos.y);
        
        // Body - purple circle
        const body = this.scene.add.circle(0, 0, size / 2, 0x9B59B6);
        body.setStrokeStyle(2, 0x8E44AD);
        this.sprite.add(body);
        
        // Eyes
        const eyeLeft = this.scene.add.circle(-4, -3, 3, 0xFFFFFF);
        const eyeRight = this.scene.add.circle(4, -3, 3, 0xFFFFFF);
        this.sprite.add(eyeLeft);
        this.sprite.add(eyeRight);
        
        // Pupils
        const pupilLeft = this.scene.add.circle(-3, -3, 1.5, 0x000000);
        const pupilRight = this.scene.add.circle(5, -3, 1.5, 0x000000);
        this.sprite.add(pupilLeft);
        this.sprite.add(pupilRight);
        
        // Smile
        const smile = this.scene.add.arc(0, 2, 5, 10, 170, false, 0xFFFFFF);
        this.sprite.add(smile);
        
        // Star indicator
        this.star = this.scene.add.star(size / 2 + 4, -size / 2, 5, 3, 6, 0xF1C40F);
        this.sprite.add(this.star);
        
        // Animate the star
        this.scene.tweens.add({
            targets: this.star,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    /**
     * Create subtle particle effect
     */
    createParticleEffect(pixelPos) {
        // Create sparkle particles around the friend
        this.sparkleTimer = this.scene.time.addEvent({
            delay: 500,
            callback: () => this.emitSparkle(),
            loop: true
        });
    }

    /**
     * Emit a single sparkle particle
     */
    emitSparkle() {
        const pixelPos = this.getPixelPosition();
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 10;
        const x = pixelPos.x + Math.cos(angle) * distance;
        const y = pixelPos.y + Math.sin(angle) * distance;

        const sparkle = this.scene.add.star(x, y, 4, 2, 4, 0xF1C40F);
        sparkle.setDepth(7);
        sparkle.setAlpha(0.8);

        this.scene.tweens.add({
            targets: sparkle,
            y: y - 20,
            alpha: 0,
            scale: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => sparkle.destroy()
        });
    }

    /**
     * Create glow effect
     */
    createGlowEffect() {
        const pixelPos = this.getPixelPosition();
        const size = this.gridPhysics ? this.gridPhysics.tileSize : 32;
        
        // Outer glow circle
        this.glow = this.scene.add.circle(pixelPos.x, pixelPos.y, size / 2 + 8, 0x9B59B6, 0.2);
        this.glow.setDepth(7);
        
        // Pulsing animation
        this.scene.tweens.add({
            targets: this.glow,
            scale: 1.3,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Get pixel position from grid position
     */
    getPixelPosition() {
        if (this.gridPhysics) {
            return this.gridPhysics.gridToPixel(this.gridX, this.gridY);
        }
        return {
            x: this.gridX * 32 + 16,
            y: this.gridY * 32 + 16
        };
    }

    /**
     * Check if friend is at a specific grid position
     */
    isAt(gridX, gridY) {
        return this.gridX === gridX && this.gridY === gridY;
    }

    /**
     * Get grid position
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Play celebration animation when player reaches friend
     */
    celebrate() {
        // Jump animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 20,
            duration: 200,
            yoyo: true,
            repeat: 2,
            ease: 'Bounce'
        });

        // Burst of sparkles
        for (let i = 0; i < 10; i++) {
            this.scene.time.delayedCall(i * 50, () => this.emitSparkle());
        }
    }

    /**
     * Destroy the friend entity
     */
    destroy() {
        if (this.sparkleTimer) {
            this.sparkleTimer.destroy();
        }
        if (this.glow) {
            this.glow.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

