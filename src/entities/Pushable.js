/**
 * Pushable - A block that can be pushed by the player
 * Implements Sokoban-style push mechanics
 * 
 * Block Types:
 * - default: Yellow/gold pushable block
 */
export class Pushable {
    // Color palettes for pushable block types
    static BLOCK_COLORS = {
        default: {
            primary: 0xF1C40F,    // Gold/yellow
            secondary: 0xD4AC0D,  // Darker gold
            highlight: 0xF4D03F,  // Light gold
            stroke: 0xB7950B,     // Deep gold/bronze
            sparkle: 0xFCF3CF    // Pale gold sparkle
        }
    };

    constructor(scene, gridX, gridY, gridPhysics, type = 'default') {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridPhysics = gridPhysics;
        this.type = type;
        
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

        // Try to use generated sprite for this specific block type
        const textureKey = `pushable_${this.type}`;
        if (this.scene.textures.exists(textureKey)) {
            this.sprite = this.scene.add.image(pixelPos.x, pixelPos.y, textureKey);
            this.sprite.setDisplaySize(size, size);
        } else {
            // Use procedural block sprite
            this.createBlockSprite(pixelPos, size);
        }

        this.sprite.setDepth(9); // Above floor, below player
        
        // Store reference to this entity on sprite
        this.sprite.setData('entity', this);
        this.sprite.setData('blockType', this.type);
    }

    /**
     * Create block sprite based on block type
     */
    createBlockSprite(pixelPos, size) {
        const colors = Pushable.BLOCK_COLORS[this.type] || Pushable.BLOCK_COLORS.default;
        this.sprite = this.scene.add.container(pixelPos.x, pixelPos.y);
        
        // Main block body
        const body = this.scene.add.rectangle(0, 0, size, size, colors.primary);
        body.setStrokeStyle(2, colors.stroke);
        this.sprite.add(body);
        
        // 3D effect - lighter top edge (highlight)
        const topEdge = this.scene.add.rectangle(0, -size / 2 + 3, size - 6, 5, colors.highlight);
        this.sprite.add(topEdge);
        
        // 3D effect - lighter left edge (highlight)
        const leftEdge = this.scene.add.rectangle(-size / 2 + 3, 0, 5, size - 6, colors.highlight);
        this.sprite.add(leftEdge);
        
        // 3D effect - darker right edge (shadow)
        const rightEdge = this.scene.add.rectangle(size / 2 - 3, 0, 5, size - 6, colors.secondary);
        this.sprite.add(rightEdge);
        
        // 3D effect - darker bottom edge (shadow)
        const bottomEdge = this.scene.add.rectangle(0, size / 2 - 3, size - 6, 5, colors.secondary);
        this.sprite.add(bottomEdge);

        // Add rough texture
        this.addBlockDecorations(size, colors);
    }

    /**
     * Add decorations to the block (rough texture)
     */
    addBlockDecorations(size, colors) {
        // Horizontal grooves for texture
        const groove1 = this.scene.add.rectangle(0, -size/4, size - 10, 2, colors.secondary);
        const groove2 = this.scene.add.rectangle(0, size/4, size - 10, 2, colors.secondary);
        this.sprite.add(groove1);
        this.sprite.add(groove2);
        
        // Vertical divider
        const divider = this.scene.add.rectangle(0, 0, 2, size - 10, colors.secondary);
        this.sprite.add(divider);
        
        // Rough surface texture - scattered darker spots
        for (let i = 0; i < 8; i++) {
            const spotX = (Math.random() - 0.5) * (size - 14);
            const spotY = (Math.random() - 0.5) * (size - 14);
            const spotSize = 1 + Math.random() * 2;
            const spot = this.scene.add.circle(spotX, spotY, spotSize, colors.stroke, 0.3);
            this.sprite.add(spot);
        }
        
        // Corner wear marks
        const wear1 = this.scene.add.rectangle(-size/3, -size/3, 4, 4, colors.secondary, 0.5);
        const wear2 = this.scene.add.rectangle(size/3, size/3, 3, 3, colors.secondary, 0.4);
        this.sprite.add(wear1);
        this.sprite.add(wear2);
    }

    /**
     * Create placeholder sprite if texture not available (legacy fallback)
     */
    createPlaceholderSprite(pixelPos, size) {
        this.createBlockSprite(pixelPos, size);
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

