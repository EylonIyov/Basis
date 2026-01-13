/**
 * PushableObject - Sokoban-style pushable objects (boxes, crates, boulders)
 * Can be pushed by the player to solve puzzles
 */
export class PushableObject {
    constructor(scene, gridX, gridY, type = 'box') {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;
        
        // Grid physics reference (will be set by scene)
        this.gridPhysics = null;
        
        // Create sprite
        this.createSprite();
    }

    /**
     * Create pushable object sprite
     */
    createSprite() {
        const pixelPos = this.getPixelPosition();
        
        // Try to use sprite if available
        const spriteKey = this.getSpriteKey();
        if (this.scene.textures.exists(spriteKey)) {
            this.sprite = this.scene.add.sprite(pixelPos.x, pixelPos.y, spriteKey);
            this.sprite.setOrigin(0.5);
        } else {
            // Fallback to placeholder shapes
            this.sprite = this.createPlaceholderSprite(pixelPos);
        }
        
        this.sprite.setDepth(7); // Pushables depth
        
        // Store reference to this object on the sprite
        this.sprite.pushableObject = this;
    }

    /**
     * Get sprite key based on type
     */
    getSpriteKey() {
        const keyMap = {
            box: 'box',
            crate: 'crate',
            boulder: 'boulder'
        };
        return keyMap[this.type] || 'box';
    }

    /**
     * Create placeholder sprite based on type
     */
    createPlaceholderSprite(pixelPos) {
        const tileSize = this.gridPhysics ? this.gridPhysics.tileSize : 32;
        const size = tileSize - 10;
        
        // Create container
        const container = this.scene.add.container(pixelPos.x, pixelPos.y);
        
        let mainShape;
        
        switch (this.type) {
            case 'box':
                // Brown wooden box with planks
                mainShape = this.scene.add.rectangle(0, 0, size, size, 0xd2691e);
                mainShape.setStrokeStyle(3, 0x8b4513);
                container.add(mainShape);
                
                // Wood planks (horizontal lines)
                const plank1 = this.scene.add.rectangle(0, -size/3, size - 4, 2, 0x8b4513);
                const plank2 = this.scene.add.rectangle(0, size/3, size - 4, 2, 0x8b4513);
                container.add(plank1);
                container.add(plank2);
                
                // Nails (small dots)
                [-size/3, size/3].forEach(x => {
                    [-size/3, size/3].forEach(y => {
                        const nail = this.scene.add.circle(x, y, 1, 0x2f2f2f);
                        container.add(nail);
                    });
                });
                break;
                
            case 'crate':
                // Gray stone crate with crossed planks
                mainShape = this.scene.add.rectangle(0, 0, size, size, 0x808080);
                mainShape.setStrokeStyle(3, 0x505050);
                container.add(mainShape);
                
                // Diagonal cross
                const cross1 = this.scene.add.rectangle(0, 0, size * 1.2, 3, 0x606060);
                cross1.setRotation(Math.PI / 4);
                const cross2 = this.scene.add.rectangle(0, 0, size * 1.2, 3, 0x606060);
                cross2.setRotation(-Math.PI / 4);
                container.add(cross1);
                container.add(cross2);
                break;
                
            case 'boulder':
                // Dark gray boulder (circle with cracks)
                mainShape = this.scene.add.circle(0, 0, size / 2, 0x4a4a4a);
                mainShape.setStrokeStyle(3, 0x2a2a2a);
                container.add(mainShape);
                
                // Cracks on boulder
                const crack1 = this.scene.add.line(0, 0, -size/4, -size/4, size/4, size/4, 0x2a2a2a);
                crack1.setLineWidth(2);
                const crack2 = this.scene.add.line(0, 0, size/4, -size/4, -size/4, size/4, 0x2a2a2a);
                crack2.setLineWidth(2);
                container.add(crack1);
                container.add(crack2);
                
                // Highlight
                const highlight = this.scene.add.circle(-size/4, -size/4, 3, 0x6a6a6a);
                container.add(highlight);
                break;
                
            default:
                // Default box
                mainShape = this.scene.add.rectangle(0, 0, size, size, 0xd2691e);
                mainShape.setStrokeStyle(3, 0x8b4513);
                container.add(mainShape);
        }
        
        return container;
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
     * Push object to new grid position
     * @returns {Promise} Resolves when push animation completes
     */
    push(newGridX, newGridY, duration = 200) {
        return new Promise((resolve, reject) => {
            // Validate new position
            if (!this.gridPhysics) {
                reject('GridPhysics not set');
                return;
            }

            // Get target pixel position
            const targetPixel = this.gridPhysics.gridToPixel(newGridX, newGridY);

            // Animate push
            this.scene.tweens.add({
                targets: this.sprite,
                x: targetPixel.x,
                y: targetPixel.y,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    // Update grid position
                    this.gridX = newGridX;
                    this.gridY = newGridY;
                    
                    // Add a little bounce effect
                    this.bounceEffect();
                    
                    resolve();
                }
            });
        });
    }

    /**
     * Add a small bounce effect when pushed
     */
    bounceEffect() {
        const originalScale = this.sprite.scale;
        
        this.scene.tweens.add({
            targets: this.sprite,
            scale: originalScale * 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    /**
     * Get current grid position
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Check if object is at a specific position
     */
    isAt(gridX, gridY) {
        return this.gridX === gridX && this.gridY === gridY;
    }

    /**
     * Get object type
     */
    getType() {
        return this.type;
    }

    /**
     * Destroy pushable object
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

