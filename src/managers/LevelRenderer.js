/**
 * LevelRenderer - Handles layered rendering for backgrounds, grid, and gameplay
 * Manages Z-depth and visual presentation of the game world
 */
export class LevelRenderer {
    constructor(scene) {
        this.scene = scene;
        
        // Rendering configuration
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.tileSize = 32;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        
        // Rendered objects (for cleanup)
        this.backgroundSprite = null;
        this.gridGraphics = null;
        this.wallObjects = [];
        this.gateObjects = [];
        
        // Z-depth layers
        this.DEPTH = {
            BACKGROUND: 0,
            GRID_OVERLAY: 2,
            WALLS: 3,
            GATES: 5,
            PUSHABLES: 7,
            PLAYER: 10,
            FRIEND: 8,
            UI: 100
        };
    }

    /**
     * Configure grid dimensions and offsets
     */
    configure(gridWidth, gridHeight, tileSize, offsetX, offsetY) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.tileSize = tileSize;
        this.gridOffsetX = offsetX;
        this.gridOffsetY = offsetY;
    }

    /**
     * Render background layer based on theme
     */
    renderBackground(theme = 'default') {
        const bgKey = `bg_${theme}`;
        
        // Check if background exists, fallback to default
        if (!this.scene.textures.exists(bgKey)) {
            console.warn(`Background ${bgKey} not found, using default`);
            if (this.scene.textures.exists('bg_default')) {
                return this.renderBackground('default');
            } else {
                // Create colored background as ultimate fallback
                this.renderColoredBackground(theme);
                return;
            }
        }

        // Remove existing background
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
        }

        // Create background sprite
        this.backgroundSprite = this.scene.add.image(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            bgKey
        );
        
        // Scale to cover screen
        const scaleX = this.scene.cameras.main.width / this.backgroundSprite.width;
        const scaleY = this.scene.cameras.main.height / this.backgroundSprite.height;
        const scale = Math.max(scaleX, scaleY);
        this.backgroundSprite.setScale(scale);
        
        this.backgroundSprite.setDepth(this.DEPTH.BACKGROUND);
        
        console.log(`Rendered background: ${theme}`);
    }

    /**
     * Render colored background as fallback
     */
    renderColoredBackground(theme) {
        const colors = {
            forest: 0x2d5016,
            cave: 0x1a1a2e,
            default: 0x2c3e50
        };
        
        const color = colors[theme] || colors.default;
        
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
        }
        
        this.backgroundSprite = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            color
        );
        
        this.backgroundSprite.setDepth(this.DEPTH.BACKGROUND);
        
        console.log(`Rendered colored background: ${theme}`);
    }

    /**
     * Render semi-transparent grid overlay
     */
    renderGridOverlay() {
        // Remove existing grid
        if (this.gridGraphics) {
            this.gridGraphics.destroy();
        }

        this.gridGraphics = this.scene.add.graphics();
        this.gridGraphics.lineStyle(1, 0xffffff, 0.3); // White, 30% opacity
        this.gridGraphics.setDepth(this.DEPTH.GRID_OVERLAY);

        // Draw vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            const pixelX = this.gridOffsetX + x * this.tileSize;
            this.gridGraphics.moveTo(pixelX, this.gridOffsetY);
            this.gridGraphics.lineTo(pixelX, this.gridOffsetY + this.gridHeight * this.tileSize);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            const pixelY = this.gridOffsetY + y * this.tileSize;
            this.gridGraphics.moveTo(this.gridOffsetX, pixelY);
            this.gridGraphics.lineTo(this.gridOffsetX + this.gridWidth * this.tileSize, pixelY);
        }

        this.gridGraphics.strokePath();
        
        console.log('Rendered grid overlay');
    }

    /**
     * Render walls from level data
     */
    renderWalls(wallsData) {
        // Clear existing walls
        this.clearWalls();

        if (!wallsData || wallsData.length === 0) {
            return [];
        }

        wallsData.forEach(wallData => {
            // Create wall rectangles
            for (let wx = 0; wx < (wallData.width || 1); wx++) {
                for (let wy = 0; wy < (wallData.height || 1); wy++) {
                    const gridX = wallData.x + wx;
                    const gridY = wallData.y + wy;
                    
                    if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
                        const wall = this.createWall(gridX, gridY);
                        this.wallObjects.push(wall);
                    }
                }
            }
        });

        return this.wallObjects;
    }

    /**
     * Create a single wall sprite/shape
     */
    createWall(gridX, gridY) {
        const x = this.gridOffsetX + gridX * this.tileSize + this.tileSize / 2;
        const y = this.gridOffsetY + gridY * this.tileSize + this.tileSize / 2;
        
        const size = this.tileSize - 4;
        
        // Create container for wall
        const wallContainer = this.scene.add.container(x, y);
        
        // Main wall block
        const wall = this.scene.add.rectangle(0, 0, size, size, 0x34495e);
        wall.setStrokeStyle(2, 0x2c3e50);
        wallContainer.add(wall);
        
        // Add brick texture (lines)
        const lineColor = 0x2c3e50;
        
        // Horizontal lines (brick rows)
        for (let i = -1; i <= 1; i++) {
            const line = this.scene.add.rectangle(0, i * size/3, size, 1, lineColor);
            wallContainer.add(line);
        }
        
        // Vertical lines (brick columns) - offset for each row
        for (let row = -1; row <= 0; row++) {
            for (let col = -1; col <= 1; col++) {
                const offsetX = col * size/3 + (row % 2 === 0 ? size/6 : 0);
                const offsetY = row * size/3 + size/6;
                if (Math.abs(offsetX) < size/2) {
                    const line = this.scene.add.rectangle(offsetX, offsetY, 1, size/3, lineColor);
                    wallContainer.add(line);
                }
            }
        }
        
        wallContainer.setDepth(this.DEPTH.WALLS);
        wallContainer.gridX = gridX;
        wallContainer.gridY = gridY;
        
        return wallContainer;
    }

    /**
     * Render gates from level data
     */
    renderGates(gatesData) {
        // Clear existing gates
        this.clearGates();

        if (!gatesData || gatesData.length === 0) {
            return [];
        }

        gatesData.forEach(gateData => {
            const gate = this.createGate(gateData);
            this.gateObjects.push(gate);
        });

        return this.gateObjects;
    }

    /**
     * Create a single gate sprite/shape
     */
    createGate(gateData) {
        const x = this.gridOffsetX + gateData.x * this.tileSize + this.tileSize / 2;
        const y = this.gridOffsetY + gateData.y * this.tileSize + this.tileSize / 2;

        // Different colors for different paths
        let gateColor = 0xff6b6b; // Default red
        let strokeColor = 0xff4757;
        let glowColor = 0xff9999;
        
        if (gateData.path === 'top') {
            gateColor = 0xff6b6b;
            strokeColor = 0xff4757;
            glowColor = 0xff9999;
        } else if (gateData.path === 'middle') {
            gateColor = 0xffa500;
            strokeColor = 0xff8c00;
            glowColor = 0xffcc66;
        } else if (gateData.path === 'bottom') {
            gateColor = 0x9b59b6;
            strokeColor = 0x8e44ad;
            glowColor = 0xbb88dd;
        }

        const size = this.tileSize - 8;
        
        // Create container for gate
        const gateContainer = this.scene.add.container(x, y);
        
        // Outer glow
        const glow = this.scene.add.rectangle(0, 0, size + 6, size + 6, glowColor, 0.3);
        gateContainer.add(glow);
        
        // Main gate
        const gate = this.scene.add.rectangle(0, 0, size, size, gateColor);
        gate.setStrokeStyle(3, strokeColor);
        gateContainer.add(gate);
        
        // Gate pattern (vertical bars)
        for (let i = -1; i <= 1; i++) {
            const bar = this.scene.add.rectangle(i * size/4, 0, 3, size - 8, strokeColor);
            gateContainer.add(bar);
        }
        
        // Lock symbol (circle with keyhole)
        const lock = this.scene.add.circle(0, 0, 8, strokeColor);
        gateContainer.add(lock);
        const keyhole = this.scene.add.rectangle(0, 2, 3, 8, gateColor);
        gateContainer.add(keyhole);
        
        gateContainer.setDepth(this.DEPTH.GATES);
        gateContainer.gridX = gateData.x;
        gateContainer.gridY = gateData.y;
        gateContainer.isOpen = false;
        gateContainer.id = gateData.id;
        gateContainer.path = gateData.path;
        gateContainer.riddleId = gateData.riddleId;

        // Add label
        const label = this.scene.add.text(x, y + size/2 + 12, gateData.id.toUpperCase().replace('GATE', 'G'), {
            fontSize: '10px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(this.DEPTH.GATES + 1);

        gateContainer.label = label;
        
        // Pulse animation for gates
        this.scene.tweens.add({
            targets: glow,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        return gateContainer;
    }

    /**
     * Clear all walls
     */
    clearWalls() {
        this.wallObjects.forEach(wall => {
            if (wall && wall.destroy) {
                wall.destroy();
            }
        });
        this.wallObjects = [];
    }

    /**
     * Clear all gates
     */
    clearGates() {
        this.gateObjects.forEach(gate => {
            if (gate) {
                if (gate.label && gate.label.destroy) {
                    gate.label.destroy();
                }
                if (gate.destroy) {
                    gate.destroy();
                }
            }
        });
        this.gateObjects = [];
    }

    /**
     * Clear gameplay layer (walls, gates, etc.)
     */
    clearGameplayLayer() {
        this.clearWalls();
        this.clearGates();
    }

    /**
     * Clear all rendered objects
     */
    clearAll() {
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
            this.backgroundSprite = null;
        }
        
        if (this.gridGraphics) {
            this.gridGraphics.destroy();
            this.gridGraphics = null;
        }
        
        this.clearGameplayLayer();
    }

    /**
     * Get depth value for entity type
     */
    getDepth(entityType) {
        return this.DEPTH[entityType.toUpperCase()] || this.DEPTH.WALLS;
    }
}

