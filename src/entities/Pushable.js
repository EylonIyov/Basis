/**
 * Pushable - A block that can be pushed by the player
 * Implements Sokoban-style push mechanics
 */
export class Pushable {
    constructor(scene, gridX, gridY, gridPhysics) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridPhysics = gridPhysics;
        
        this.sprite = null;
        this.isMoving = false;
        this.onMoved = null; // Callback when pushable finishes moving
        
        this.createSprite();
    }

    /**
     * Create the pushable block sprite
     */
    createSprite() {
        const pixelPos = this.getPixelPosition();
        const size = this.gridPhysics ? this.gridPhysics.tileSize - 4 : 28;

        // Try to use generated sprite
        if (this.scene.textures.exists('pushable')) {
            this.sprite = this.scene.add.image(pixelPos.x, pixelPos.y, 'pushable');
            this.sprite.setDisplaySize(size, size);
        } else {
            // Fallback to placeholder
            this.createPlaceholderSprite(pixelPos, size);
        }

        this.sprite.setDepth(9); // Above floor, below player
        
        // Store reference to this entity on sprite
        this.sprite.setData('entity', this);
    }

    /**
     * Create placeholder sprite if texture not available
     */
    createPlaceholderSprite(pixelPos, size) {
        this.sprite = this.scene.add.container(pixelPos.x, pixelPos.y);
        
        // Main box
        const box = this.scene.add.rectangle(0, 0, size, size, 0xF39C12);
        box.setStrokeStyle(2, 0x7E5109);
        this.sprite.add(box);
        
        // 3D effect - lighter top edge
        const topEdge = this.scene.add.rectangle(0, -size / 2 + 2, size - 4, 4, 0xF5B041);
        this.sprite.add(topEdge);
        
        // 3D effect - lighter left edge
        const leftEdge = this.scene.add.rectangle(-size / 2 + 2, 0, 4, size - 4, 0xF5B041);
        this.sprite.add(leftEdge);
        
        // 3D effect - darker right edge
        const rightEdge = this.scene.add.rectangle(size / 2 - 2, 0, 4, size - 4, 0xD68910);
        this.sprite.add(rightEdge);
        
        // 3D effect - darker bottom edge
        const bottomEdge = this.scene.add.rectangle(0, size / 2 - 2, size - 4, 4, 0xD68910);
        this.sprite.add(bottomEdge);
        
        // Cross pattern
        const crossH = this.scene.add.rectangle(0, 0, size - 8, 2, 0x935116);
        const crossV = this.scene.add.rectangle(0, 0, 2, size - 8, 0x935116);
        this.sprite.add(crossH);
        this.sprite.add(crossV);
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
     * Push the block to a new position
     * @param {number} targetX - Target grid X
     * @param {number} targetY - Target grid Y
     * @param {number} duration - Animation duration in ms
     * @returns {Promise} Resolves when push animation completes
     */
    push(targetX, targetY, duration = 200) {
        return new Promise((resolve, reject) => {
            if (this.isMoving) {
                reject('Already moving');
                return;
            }

            this.isMoving = true;

            const targetPixel = this.gridPhysics 
                ? this.gridPhysics.gridToPixel(targetX, targetY)
                : { x: targetX * 32 + 16, y: targetY * 32 + 16 };

            // Visual feedback - slight scale
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: duration / 4,
                yoyo: true,
                ease: 'Power1'
            });

            // Move animation
            this.scene.tweens.add({
                targets: this.sprite,
                x: targetPixel.x,
                y: targetPixel.y,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    // Update grid position
                    this.gridX = targetX;
                    this.gridY = targetY;
                    this.isMoving = false;
                    
                    // Slight bounce at end
                    this.scene.tweens.add({
                        targets: this.sprite,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 100,
                        yoyo: true,
                        ease: 'Bounce'
                    });
                    
                    // Call onMoved callback if set
                    if (this.onMoved) {
                        this.onMoved(targetX, targetY);
                    }
                    
                    resolve();
                }
            });
        });
    }

    /**
     * Check if pushable is at a specific grid position
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
     * Destroy the pushable entity
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

