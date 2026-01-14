/**
 * Game Scene - Main gameplay scene
 * Uses modular architecture with separate managers for rules, physics, UI, and levels
 */
import { LevelManager } from '../levels/LevelManager.js';
import { RiddleManager } from '../managers/RiddleManager.js';
import { UIManager } from '../managers/UIManager.js';
import { RuleManager } from '../systems/RuleManager.js';
import { GridPhysics } from '../systems/GridPhysics.js';
import { Player } from '../entities/Player.js';
import { Friend } from '../entities/Friend.js';
import { Pushable } from '../entities/Pushable.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.levelManager = new LevelManager();
    }

    init(data) {
        // Set level from passed data or use default
        if (data && data.levelIndex !== undefined) {
            this.levelManager.setLevel(data.levelIndex);
        }
        console.log(`[Game] Starting level: ${this.levelManager.getCurrentLevel().name}`);
    }

    async preload() {
        // Initialize managers
        this.riddleManager = new RiddleManager();
        await this.riddleManager.loadRiddles('src/riddles/riddles.json');
    }

    create() {
        // Fade in from Boot scene
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Load level data
        this.level = this.levelManager.getCurrentLevel();
        if (!this.level) {
            console.error('[Game] No level loaded!');
            return;
        }

        // Grid configuration
        this.gridWidth = this.level.gridWidth;
        this.gridHeight = this.level.gridHeight;
        this.calculateGridDimensions();

        // Initialize core systems
        this.initializeSystems();

        // Create game world
        this.createBackground();
        this.createGridOverlay();
        this.createWalls();
        this.createGates();
        this.createPushables();
        this.createFriend();
        this.createPlayer();

        // Register entities with physics
        this.registerEntitiesWithPhysics();

        // Initialize UI
        this.initializeUI();

        // Setup input
        this.setupInput();

        // Listen for rule changes
        this.setupRuleListeners();

        console.log(`[Game] Level loaded: ${this.level.name}`);
    }

    /**
     * Calculate grid dimensions and offsets
     */
    calculateGridDimensions() {
        const padding = 40;
        const availableHeight = this.cameras.main.height - padding;
        const availableWidth = this.cameras.main.width - padding;

        const tileSizeByHeight = Math.floor(availableHeight / this.gridHeight);
        const tileSizeByWidth = Math.floor(availableWidth / this.gridWidth);
        this.tileSize = Math.min(tileSizeByHeight, tileSizeByWidth);

        const gridPixelWidth = this.gridWidth * this.tileSize;
        const gridPixelHeight = this.gridHeight * this.tileSize;
        this.gridOffsetX = (this.cameras.main.width - gridPixelWidth) / 2;
        this.gridOffsetY = (this.cameras.main.height - gridPixelHeight) / 2;
    }

    /**
     * Initialize core game systems
     */
    initializeSystems() {
        // Rule Manager
        this.ruleManager = new RuleManager();

        // Grid Physics
        this.gridPhysics = new GridPhysics(this, this.ruleManager);
        this.gridPhysics.configure(
            this.gridWidth,
            this.gridHeight,
            this.tileSize,
            this.gridOffsetX,
            this.gridOffsetY
        );
    }

    /**
     * Create background layer
     */
    createBackground() {
        const bgTexture = this.level.theme === 'forest' ? 'bg_forest' : 'bg_cave';

        // Tile the background
        if (this.textures.exists(bgTexture)) {
            const bgTileSize = 64;
            for (let y = 0; y < this.cameras.main.height; y += bgTileSize) {
                for (let x = 0; x < this.cameras.main.width; x += bgTileSize) {
                    const tile = this.add.image(x + bgTileSize / 2, y + bgTileSize / 2, bgTexture);
                    tile.setDepth(0);
                }
            }
        } else {
            // Fallback solid background
            this.add.rectangle(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                this.cameras.main.width,
                this.cameras.main.height,
                0x1A1A2E
            ).setDepth(0);
        }
    }

    /**
     * Create semi-transparent grid overlay
     */
    createGridOverlay() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xFFFFFF, 0.1);
        graphics.setDepth(1);

        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            graphics.moveTo(this.gridOffsetX + x * this.tileSize, this.gridOffsetY);
            graphics.lineTo(this.gridOffsetX + x * this.tileSize, this.gridOffsetY + this.gridHeight * this.tileSize);
        }

        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            graphics.moveTo(this.gridOffsetX, this.gridOffsetY + y * this.tileSize);
            graphics.lineTo(this.gridOffsetX + this.gridWidth * this.tileSize, this.gridOffsetY + y * this.tileSize);
        }

        graphics.strokePath();

        // Grid border
        graphics.lineStyle(2, 0xF1C40F, 0.5);
        graphics.strokeRect(
            this.gridOffsetX,
            this.gridOffsetY,
            this.gridWidth * this.tileSize,
            this.gridHeight * this.tileSize
        );
    }

    /**
     * Create wall entities
     */
    createWalls() {
        this.walls = [];

        if (!this.level.walls) return;

        this.level.walls.forEach(wallData => {
            const pixelPos = this.gridPhysics.gridToPixel(wallData.x, wallData.y);

            let sprite;
            if (this.textures.exists('wall')) {
                sprite = this.add.image(pixelPos.x, pixelPos.y, 'wall');
                sprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
            } else {
                // Fallback placeholder
                sprite = this.add.rectangle(
                    pixelPos.x, pixelPos.y,
                    this.tileSize - 4, this.tileSize - 4,
                    0x34495E
                );
                sprite.setStrokeStyle(2, 0x2C3E50);
            }

            sprite.setDepth(3);

            const wall = {
                gridX: wallData.x,
                gridY: wallData.y,
                sprite: sprite
            };

            this.walls.push(wall);
        });
    }

    /**
     * Create gate entities
     */
    createGates() {
        this.gates = [];

        if (!this.level.gates) return;

        this.level.gates.forEach(gateData => {
            const pixelPos = this.gridPhysics.gridToPixel(gateData.x, gateData.y);

            let sprite;
            if (this.textures.exists('gate_closed')) {
                sprite = this.add.image(pixelPos.x, pixelPos.y, 'gate_closed');
                sprite.setDisplaySize(this.tileSize - 4, this.tileSize - 4);
            } else {
                // Fallback placeholder
                const color = gateData.type === 'rule' ? 0x9B59B6 : 0xE74C3C;
                sprite = this.add.rectangle(
                    pixelPos.x, pixelPos.y,
                    this.tileSize - 8, this.tileSize - 8,
                    color
                );
                sprite.setStrokeStyle(3, gateData.type === 'rule' ? 0x8E44AD : 0xC0392B);
            }

            sprite.setDepth(5);

            // Add label
            const labelText = gateData.type === 'rule' ? '⚡' : '?';
            const label = this.add.text(pixelPos.x, pixelPos.y, labelText, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#FFFFFF'
            }).setOrigin(0.5).setDepth(6);

            const gate = {
                gridX: gateData.x,
                gridY: gateData.y,
                id: gateData.id,
                path: gateData.path,
                type: gateData.type || 'barrier',
                ruleEffect: gateData.ruleEffect,
                isOpen: false,
                sprite: sprite,
                label: label
            };

            this.gates.push(gate);
        });
    }

    /**
     * Create pushable block entities
     */
    createPushables() {
        this.pushables = [];

        if (!this.level.pushables) return;

        this.level.pushables.forEach(pushData => {
            const pushable = new Pushable(this, pushData.x, pushData.y, this.gridPhysics);
            this.pushables.push(pushable);
        });
    }

    /**
     * Create the Friend NPC (win condition)
     */
    createFriend() {
        if (!this.level.friend) return;

        this.friend = new Friend(
            this,
            this.level.friend.x,
            this.level.friend.y,
            this.gridPhysics
        );
    }

    /**
     * Create the player entity
     */
    createPlayer() {
        this.player = new Player(
            this,
            this.level.start.x,
            this.level.start.y
        );
        this.player.setGridPhysics(this.gridPhysics);
    }

    /**
     * Register all entities with physics system
     */
    registerEntitiesWithPhysics() {
        this.gridPhysics.registerWalls(this.walls);
        this.gridPhysics.registerGates(this.gates);
        this.gridPhysics.registerPushables(this.pushables);
        if (this.friend) {
            this.gridPhysics.registerFriend(this.friend);
        }
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        this.uiManager = new UIManager(this, this.riddleManager, this.ruleManager);
        this.uiManager.updateLevelInfo(this.level.name);

        // Set callbacks
        this.uiManager.onGateOpened = (gate) => {
            console.log(`[Game] Gate ${gate.id} opened`);
        };

        this.uiManager.onRuleApplied = (effect) => {
            console.log(`[Game] Rule applied: ${effect.ruleId}`);
            this.applyRuleVisuals(effect.ruleId);
        };
    }

    /**
     * Setup input handling
     */
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // WASD support
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D')
        };

        // Track last input time to prevent rapid movement
        this.lastInputTime = 0;
        this.inputDelay = 150; // ms between inputs
    }

    /**
     * Setup listeners for rule changes
     */
    setupRuleListeners() {
        this.ruleManager.on('ruleChanged', (data) => {
            this.uiManager.updateActiveRules();
            this.applyRuleVisuals(data.ruleId);
        });
    }

    /**
     * Apply visual effects when rules change
     */
    applyRuleVisuals(ruleId) {
        switch (ruleId) {
            case 'WALL_IS_AIR':
                if (this.ruleManager.isRuleActive('WALL_IS_AIR')) {
                    // Fade out walls
                    this.walls.forEach(wall => {
                        this.tweens.add({
                            targets: wall.sprite,
                            alpha: 0.2,
                            duration: 500,
                            ease: 'Power2'
                        });
                    });
                    // Create particle effect
                    this.createEvaporationEffect();
                } else {
                    // Restore walls
                    this.walls.forEach(wall => {
                        this.tweens.add({
                            targets: wall.sprite,
                            alpha: 1,
                            duration: 500,
                            ease: 'Power2'
                        });
                    });
                }
                break;

            case 'GATE_IS_OPEN':
                if (this.ruleManager.isRuleActive('GATE_IS_OPEN')) {
                    this.gates.forEach(gate => {
                        gate.isOpen = true;
                        this.tweens.add({
                            targets: [gate.sprite, gate.label],
                            alpha: 0.3,
                            duration: 500,
                            ease: 'Power2'
                        });
                    });
                }
                break;
        }
    }

    /**
     * Create particle evaporation effect for walls
     */
    createEvaporationEffect() {
        this.walls.forEach(wall => {
            const pixelPos = { x: wall.sprite.x, y: wall.sprite.y };
            
            for (let i = 0; i < 5; i++) {
                const particle = this.add.circle(
                    pixelPos.x + (Math.random() - 0.5) * this.tileSize,
                    pixelPos.y + (Math.random() - 0.5) * this.tileSize,
                    3,
                    0x3498DB,
                    0.8
                );
                particle.setDepth(20);

                this.tweens.add({
                    targets: particle,
                    y: particle.y - 30,
                    alpha: 0,
                    scale: 0,
                    duration: 800 + Math.random() * 400,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }
        });
    }

    /**
     * Handle gate collision - show riddle
     */
    handleGateCollision(gate) {
        if (!gate || gate.isOpen) return;

        // Get appropriate riddle based on gate type
        let riddle;
        if (gate.type === 'rule' && gate.ruleEffect) {
            // Use a rule riddle and attach the gate's effect
            riddle = this.riddleManager.getRuleRiddle();
            if (riddle) {
                riddle = { ...riddle, effect: gate.ruleEffect };
            }
        } else {
            riddle = this.riddleManager.getBarrierRiddle();
        }

        if (riddle) {
            this.uiManager.currentRiddle = riddle;
        }

        this.uiManager.showRiddle(gate);
    }

    /**
     * Main update loop
     */
    update(time) {
        // Don't process input if UI is open
        if (this.uiManager && this.uiManager.isOpen()) {
            return;
        }

        // Don't process if player is moving
        if (this.player && this.player.isMoving) {
            return;
        }

        // Rate limit input
        if (time - this.lastInputTime < this.inputDelay) {
            return;
        }

        // Get movement direction
        const direction = this.getInputDirection();

        if (direction.x !== 0 || direction.y !== 0) {
            this.lastInputTime = time;
            const result = this.player.tryMove(direction);

            // Check for win condition after move
            if (result) {
                this.checkWinCondition();
            }
        }
    }

    /**
     * Get movement direction from input
     */
    getInputDirection() {
        const direction = { x: 0, y: 0 };

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            direction.x = -1;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            direction.x = 1;
        } else if (this.cursors.up.isDown || this.wasd.up.isDown) {
            direction.y = -1;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            direction.y = 1;
        }

        return direction;
    }

    /**
     * Check if player has reached the friend (win condition)
     */
    checkWinCondition() {
        if (!this.friend) return;

        const playerPos = this.player.getGridPosition();
        const friendPos = this.friend.getGridPosition();

        if (playerPos.x === friendPos.x && playerPos.y === friendPos.y) {
            this.handleWin();
        }
    }

    /**
     * Handle level win
     */
    handleWin() {
        // Disable input
        this.input.keyboard.enabled = false;

        // Friend celebration
        if (this.friend) {
            this.friend.celebrate();
        }

        // Show win screen after short delay
        this.time.delayedCall(500, () => {
            const hasNextLevel = this.levelManager.hasNextLevel();
            
            this.uiManager.showWinScreen(this.level.name, hasNextLevel, {
                onNextLevel: () => {
                    this.levelManager.nextLevel();
                    this.scene.restart({ levelIndex: this.levelManager.currentLevelIndex });
                },
                onRestart: () => {
                    this.scene.restart({ levelIndex: this.levelManager.currentLevelIndex });
                }
            });
        });
    }

    /**
     * Clean up when leaving scene
     */
    shutdown() {
        // Clean up entities
        if (this.player) this.player.destroy();
        if (this.friend) this.friend.destroy();
        this.pushables.forEach(p => p.destroy());
        
        // Clean up managers
        if (this.uiManager) this.uiManager.destroy();
        if (this.ruleManager) this.ruleManager.removeAllListeners();
        if (this.gridPhysics) this.gridPhysics.clear();
    }
}
