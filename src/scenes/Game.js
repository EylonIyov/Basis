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
        // Reset game state
        this.hasWon = false;
        
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
        // Re-enable input (may have been disabled from previous win)
        this.input.keyboard.enabled = true;
        
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
        this.createSockets();      // Create sockets first (floor level)
        this.createWalls();
        this.createSpecialWalls(); // Create special walls
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
        // Check if level has a video background
        if (this.level.backgroundVideo && this.cache.video.exists(this.level.backgroundVideo)) {
            this.createVideoBackground(this.level.backgroundVideo);
            return;
        }

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
     * Create a video background that fills the screen
     */
    createVideoBackground(videoKey) {
        const video = this.add.video(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            videoKey
        );

        // Scale video to cover the entire screen
        const scaleX = this.cameras.main.width / video.width;
        const scaleY = this.cameras.main.height / video.height;
        const scale = Math.max(scaleX, scaleY);
        video.setScale(scale);

        video.setDepth(0);
        video.setLoop(true);
        video.setMute(true);
        video.play();

        // Store reference for cleanup
        this.backgroundVideo = video;
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

        // Fallback colors for each wall type
        const fallbackColors = {
            brick: { fill: 0x8B4513, stroke: 0x5D2E0C },
            wood: { fill: 0xDEB887, stroke: 0x8B4513 },
            iron: { fill: 0x4A4A5A, stroke: 0x2A2A3A },
            steel: { fill: 0x4A5568, stroke: 0x1A202C },
            emerald: { fill: 0x2ECC71, stroke: 0x1E8449 },
            gold: { fill: 0xF1C40F, stroke: 0xB7950B },
            diamond: { fill: 0x85C1E9, stroke: 0x3498DB },
            lapis: { fill: 0x1A5276, stroke: 0x0E2F44 },
            quartz: { fill: 0xFADBD8, stroke: 0xE6B0AA }
        };

        this.level.walls.forEach(wallData => {
            const pixelPos = this.gridPhysics.gridToPixel(wallData.x, wallData.y);
            const wallType = wallData.type || 'brick';
            const textureKey = `wall_${wallType}`;

            let sprite;
            if (this.textures.exists(textureKey)) {
                // Use specific texture for this wall type
                sprite = this.add.image(pixelPos.x, pixelPos.y, textureKey);
                sprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
            } else if (wallType === 'brick' && this.textures.exists('wall')) {
                // Only use generic 'wall' texture for brick type
                sprite = this.add.image(pixelPos.x, pixelPos.y, 'wall');
                sprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
            } else {
                // Fallback placeholder with type-specific color
                const colors = fallbackColors[wallType] || fallbackColors.brick;
                sprite = this.add.rectangle(
                    pixelPos.x, pixelPos.y,
                    this.tileSize - 4, this.tileSize - 4,
                    colors.fill
                );
                sprite.setStrokeStyle(2, colors.stroke);
            }

            sprite.setDepth(3);

            const wall = {
                gridX: wallData.x,
                gridY: wallData.y,
                type: wallType,
                originalX: wallData.x,  // Store original position for shuffle
                originalY: wallData.y,
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
                riddleId: gateData.riddleId,  // Specific riddle ID to use
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
            // Pass the block type from level data (defaults to 'default')
            const blockType = pushData.type || 'default';
            const pushable = new Pushable(this, pushData.x, pushData.y, this.gridPhysics, blockType);
            // Add callback for when pushable moves
            pushable.onMoved = (newX, newY) => this.checkSocketActivation(pushable, newX, newY);
            this.pushables.push(pushable);
        });
    }

    /**
     * Create socket entities (pressure plates for blocks)
     */
    createSockets() {
        this.sockets = [];

        if (!this.level.sockets) return;

        this.level.sockets.forEach(socketData => {
            const pixelPos = this.gridPhysics.gridToPixel(socketData.x, socketData.y);

            let sprite;
            if (this.textures.exists('socket')) {
                sprite = this.add.image(pixelPos.x, pixelPos.y, 'socket');
                sprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
            } else {
                // Fallback placeholder - sunken square
                sprite = this.add.rectangle(
                    pixelPos.x, pixelPos.y,
                    this.tileSize - 4, this.tileSize - 4,
                    0x0D0D1A
                );
                sprite.setStrokeStyle(2, 0xF39C12);
            }

            sprite.setDepth(1); // Below everything, on floor level

            const socket = {
                gridX: socketData.x,
                gridY: socketData.y,
                id: socketData.id,
                isFilled: false,
                unlocksWall: socketData.unlocksWall || null,  // Link to specific wall
                sprite: sprite
            };

            this.sockets.push(socket);
        });
    }

    /**
     * Create special wall entities (unlockable walls)
     */
    createSpecialWalls() {
        this.specialWalls = [];

        if (!this.level.specialWalls) return;

        this.level.specialWalls.forEach(wallData => {
            const pixelPos = this.gridPhysics.gridToPixel(wallData.x, wallData.y);

            let sprite;
            if (this.textures.exists('special_wall_locked')) {
                sprite = this.add.image(pixelPos.x, pixelPos.y, 'special_wall_locked');
                sprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
            } else {
                // Fallback placeholder - purple glowing wall
                sprite = this.add.rectangle(
                    pixelPos.x, pixelPos.y,
                    this.tileSize - 4, this.tileSize - 4,
                    0x5B2C6F
                );
                sprite.setStrokeStyle(3, 0xF39C12);
            }

            sprite.setDepth(3); // Same as walls

            // Add pulsing glow effect
            this.tweens.add({
                targets: sprite,
                alpha: 0.7,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const specialWall = {
                gridX: wallData.x,
                gridY: wallData.y,
                id: wallData.id,
                isUnlocked: false,
                sprite: sprite
            };

            this.specialWalls.push(specialWall);
        });
    }

    /**
     * Check if a pushable has landed on a socket
     */
    checkSocketActivation(pushable, newX, newY) {
        const socket = this.sockets.find(s => s.gridX === newX && s.gridY === newY && !s.isFilled);
        
        if (socket) {
            this.activateSocket(socket, pushable);
        }
    }

    /**
     * Activate a socket when a block is placed on it
     */
    activateSocket(socket, pushable) {
        socket.isFilled = true;

        // Visual feedback - socket glows
        this.tweens.add({
            targets: socket.sprite,
            alpha: 0.5,
            duration: 300,
            ease: 'Power2'
        });

        // Check if this socket has a linked wall to unlock
        if (socket.unlocksWall) {
            console.log(`[Game] Socket at (${socket.gridX}, ${socket.gridY}) activated, looking for wall at row=${socket.unlocksWall.row}, col=${socket.unlocksWall.col}`);
            // Find and unlock the specific linked wall
            const linkedWall = this.specialWalls.find(
                w => w.gridY === socket.unlocksWall.row && w.gridX === socket.unlocksWall.col
            );
            if (linkedWall && !linkedWall.isUnlocked) {
                console.log(`[Game] Found linked wall, unlocking it!`);
                this.unlockSpecialWall(linkedWall);
            } else {
                console.log(`[Game] No matching wall found. Available walls:`, this.specialWalls.map(w => `(${w.gridX}, ${w.gridY})`));
            }
        } else {
            console.log(`[Game] Socket at (${socket.gridX}, ${socket.gridY}) has no linked wall, using fallback logic`);
            // Fallback: Check if all sockets are filled (for levels without specific linking)
            const allSocketsFilled = this.sockets.every(s => s.isFilled);
            if (allSocketsFilled) {
                this.unlockSpecialWalls();
            }
        }
    }

    /**
     * Unlock a single special wall with visual effect
     */
    unlockSpecialWall(wall) {
        if (wall.isUnlocked) return;
        
        wall.isUnlocked = true;
        console.log(`[Game] Unlocking special wall at (${wall.gridX}, ${wall.gridY})`);

        // Stop the pulsing animation
        this.tweens.killTweensOf(wall.sprite);

        // Create particle burst
        const pixelPos = { x: wall.sprite.x, y: wall.sprite.y };
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                pixelPos.x + (Math.random() - 0.5) * this.tileSize,
                pixelPos.y + (Math.random() - 0.5) * this.tileSize,
                3 + Math.random() * 3,
                0xF1C40F,
                0.8
            );
            particle.setDepth(20);

            this.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 60,
                y: particle.y - 20 - Math.random() * 40,
                alpha: 0,
                scale: 0,
                duration: 600 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Fade out and shrink the wall
        this.tweens.add({
            targets: wall.sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            ease: 'Back.in',
            onComplete: () => {
                wall.sprite.setVisible(false);
            }
        });

        // Remove from physics collision
        this.gridPhysics.removeSpecialWall(wall);
    }

    /**
     * Unlock all special walls with visual effect
     */
    unlockSpecialWalls() {
        this.specialWalls.forEach(wall => {
            this.unlockSpecialWall(wall);
        });

        console.log('[Game] All special walls unlocked!');
    }

    /**
     * Create the Friend NPC (win condition)
     */
    createFriend() {
        if (!this.level.friend) return;

        // Get current level index (1-based for asset naming)
        const levelIndex = this.levelManager.currentLevelIndex + 1;

        this.friend = new Friend(
            this,
            this.level.friend.x,
            this.level.friend.y,
            this.gridPhysics,
            levelIndex
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
        this.gridPhysics.registerSpecialWalls(this.specialWalls);
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

        this.uiManager.onRestart = () => {
            this.scene.restart({ levelIndex: this.levelManager.currentLevelIndex });
        };
        
        // Start the level timer
        this.uiManager.startTimer();
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

        // DEBUG: Press Q to jump to level 1, W to jump to level 2, E to jump to level 3
        this.input.keyboard.on('keydown-Q', () => {
            console.log('[DEBUG] Jumping to Level 1');
            this.scene.restart({ levelIndex: 1 });
        });
        this.input.keyboard.on('keydown-W', () => {
            console.log('[DEBUG] Jumping to Level 2');
            this.scene.restart({ levelIndex: 2 });
        });
        this.input.keyboard.on('keydown-E', () => {
            console.log('[DEBUG] Jumping to Level 3');
            this.scene.restart({ levelIndex: 3 });
        });
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
        // Handle wall type IS_AIR rules (including gem walls)
        const wallTypeMatch = ruleId.match(/^(BRICK|WOOD|IRON|STEEL|EMERALD|GOLD|DIAMOND|LAPIS|QUARTZ)_IS_AIR$/);
        if (wallTypeMatch) {
            const wallType = wallTypeMatch[1].toLowerCase();
            this.applyWallTypeAirEffect(wallType, this.ruleManager.isRuleActive(ruleId));
            return;
        }

        // Handle wall type SHUFFLE rules
        const shuffleMatch = ruleId.match(/^(BRICK|WOOD|IRON|STEEL)_SHUFFLE$/);
        if (shuffleMatch) {
            const wallType = shuffleMatch[1].toLowerCase();
            if (this.ruleManager.isRuleActive(ruleId)) {
                this.shuffleWallsOfType(wallType);
            }
            return;
        }

        // Handle wall transformation rules (WALLTYPE_TO_WALLTYPE)
        const transformMatch = ruleId.match(/^(STEEL|IRON|WOOD|LAPIS|GOLD)_TO_(EMERALD|STEEL|IRON|WOOD|DIAMOND|LAPIS)$/);
        if (transformMatch) {
            const fromType = transformMatch[1].toLowerCase();
            const toType = transformMatch[2].toLowerCase();
            if (this.ruleManager.isRuleActive(ruleId)) {
                this.transformWallType(fromType, toType);
            }
            return;
        }

        switch (ruleId) {
            case 'WALL_IS_AIR':
                // Affects ALL walls
                if (this.ruleManager.isRuleActive('WALL_IS_AIR')) {
                    this.walls.forEach(wall => {
                        this.tweens.add({
                            targets: wall.sprite,
                            alpha: 0.2,
                            duration: 500,
                            ease: 'Power2'
                        });
                    });
                    this.createEvaporationEffect();
                } else {
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
     * Apply air effect to a specific wall type
     */
    applyWallTypeAirEffect(wallType, isActive) {
        const wallsOfType = this.walls.filter(w => (w.type || 'brick') === wallType);
        
        if (isActive) {
            // Fade out walls of this type with type-specific particle effect
            wallsOfType.forEach(wall => {
                this.createWallDissolveEffect(wall, wallType);
                this.tweens.add({
                    targets: wall.sprite,
                    alpha: 0.15,
                    duration: 600,
                    ease: 'Power2'
                });
            });
        } else {
            // Restore walls
            wallsOfType.forEach(wall => {
                this.tweens.add({
                    targets: wall.sprite,
                    alpha: 1,
                    duration: 500,
                    ease: 'Power2'
                });
            });
        }
    }

    /**
     * Create wall dissolve effect based on type
     */
    createWallDissolveEffect(wall, wallType) {
        const pixelPos = { x: wall.sprite.x, y: wall.sprite.y };
        
        // Type-specific particle colors
        const particleColors = {
            brick: [0x8B4513, 0xA0522D, 0xCD853F],
            wood: [0xDEB887, 0xD2691E, 0x8B4513],
            iron: [0x4A4A5A, 0x6A6A7A, 0x8B4513], // With rust
            steel: [0x4A5568, 0x718096, 0x3498DB]  // Blue sparks
        };

        const colors = particleColors[wallType] || particleColors.brick;

        for (let i = 0; i < 8; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.add.circle(
                pixelPos.x + (Math.random() - 0.5) * this.tileSize,
                pixelPos.y + (Math.random() - 0.5) * this.tileSize,
                2 + Math.random() * 3,
                color,
                0.9
            );
            particle.setDepth(20);

            // Different animations based on type
            const targetY = wallType === 'wood' 
                ? pixelPos.y + 30  // Wood falls down
                : pixelPos.y - 25; // Others float up

            this.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 40,
                y: targetY + (Math.random() - 0.5) * 20,
                alpha: 0,
                scale: 0,
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Transform walls of one type into another type with visual effect
     */
    transformWallType(fromType, toType) {
        const wallsOfType = this.walls.filter(w => (w.type || 'brick') === fromType);
        
        if (wallsOfType.length === 0) return;

        // Colors for the transformation particles
        const typeColors = {
            brick: 0x8B4513,
            wood: 0xDEB887,
            iron: 0x4A4A5A,
            steel: 0x4A5568,
            emerald: 0x2ECC71,
            gold: 0xF1C40F,
            diamond: 0x85C1E9,
            lapis: 0x1A5276,
            quartz: 0xFADBD8
        };

        // Fallback colors for wall rendering
        const fallbackColors = {
            brick: { fill: 0x8B4513, stroke: 0x5D2E0C },
            wood: { fill: 0xDEB887, stroke: 0x8B4513 },
            iron: { fill: 0x4A4A5A, stroke: 0x2A2A3A },
            steel: { fill: 0x4A5568, stroke: 0x1A202C },
            emerald: { fill: 0x2ECC71, stroke: 0x1E8449 },
            gold: { fill: 0xF1C40F, stroke: 0xB7950B },
            diamond: { fill: 0x85C1E9, stroke: 0x3498DB },
            lapis: { fill: 0x1A5276, stroke: 0x0E2F44 },
            quartz: { fill: 0xFADBD8, stroke: 0xE6B0AA }
        };

        const fromColor = typeColors[fromType] || 0x888888;
        const toColor = typeColors[toType] || 0x888888;

        wallsOfType.forEach((wall, index) => {
            const pixelPos = { x: wall.sprite.x, y: wall.sprite.y };
            
            // Create swirling transformation particles
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const radius = 15 + Math.random() * 10;
                const startX = pixelPos.x + Math.cos(angle) * radius;
                const startY = pixelPos.y + Math.sin(angle) * radius;
                
                // Mix of old and new colors
                const particleColor = Math.random() > 0.5 ? fromColor : toColor;
                const particle = this.add.circle(startX, startY, 3, particleColor, 0.9);
                particle.setDepth(25);

                // Spiral inward animation
                this.tweens.add({
                    targets: particle,
                    x: pixelPos.x,
                    y: pixelPos.y,
                    scale: 0.5,
                    alpha: 0,
                    duration: 400 + Math.random() * 200,
                    ease: 'Cubic.in',
                    delay: i * 30,
                    onComplete: () => particle.destroy()
                });
            }

            // Flash effect on the wall
            this.tweens.add({
                targets: wall.sprite,
                alpha: 0.3,
                duration: 300,
                ease: 'Power2',
                delay: index * 50,
                onComplete: () => {
                    // Update wall type
                    wall.type = toType;

                    // Create new sprite with new color
                    const newColors = fallbackColors[toType] || fallbackColors.brick;
                    
                    // Destroy old sprite
                    wall.sprite.destroy();
                    
                    // Create new sprite
                    const textureKey = `wall_${toType}`;
                    let newSprite;
                    
                    if (this.textures.exists(textureKey)) {
                        newSprite = this.add.image(pixelPos.x, pixelPos.y, textureKey);
                        newSprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
                    } else if (toType === 'brick' && this.textures.exists('wall')) {
                        newSprite = this.add.image(pixelPos.x, pixelPos.y, 'wall');
                        newSprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2);
                    } else {
                        newSprite = this.add.rectangle(
                            pixelPos.x, pixelPos.y,
                            this.tileSize - 4, this.tileSize - 4,
                            newColors.fill
                        );
                        newSprite.setStrokeStyle(2, newColors.stroke);
                    }
                    
                    newSprite.setDepth(3);
                    newSprite.setAlpha(0);
                    wall.sprite = newSprite;

                    // Burst effect with new color
                    for (let j = 0; j < 8; j++) {
                        const burstAngle = (j / 8) * Math.PI * 2;
                        const burstParticle = this.add.circle(
                            pixelPos.x,
                            pixelPos.y,
                            4,
                            toColor,
                            0.9
                        );
                        burstParticle.setDepth(26);

                        this.tweens.add({
                            targets: burstParticle,
                            x: pixelPos.x + Math.cos(burstAngle) * 25,
                            y: pixelPos.y + Math.sin(burstAngle) * 25,
                            alpha: 0,
                            scale: 0.2,
                            duration: 400,
                            ease: 'Power2',
                            onComplete: () => burstParticle.destroy()
                        });
                    }

                    // Fade in new wall
                    this.tweens.add({
                        targets: newSprite,
                        alpha: 1,
                        duration: 400,
                        ease: 'Power2'
                    });
                }
            });
        });

        console.log(`[Game] Transformed ${wallsOfType.length} ${fromType} walls into ${toType}`);
    }

    /**
     * Shuffle walls of a specific type to new positions
     */
    shuffleWallsOfType(wallType) {
        const wallsOfType = this.walls.filter(w => (w.type || 'brick') === wallType);
        
        if (wallsOfType.length < 2) return;

        // Find empty spaces that could receive walls
        const emptySpaces = [];
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (this.isPositionEmpty(x, y)) {
                    emptySpaces.push({ x, y });
                }
            }
        }

        // Shuffle the empty spaces
        for (let i = emptySpaces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [emptySpaces[i], emptySpaces[j]] = [emptySpaces[j], emptySpaces[i]];
        }

        // Move walls to new positions with animation
        wallsOfType.forEach((wall, index) => {
            if (index >= emptySpaces.length) return;

            const newPos = emptySpaces[index];
            const oldX = wall.gridX;
            const oldY = wall.gridY;

            // Update grid position
            wall.gridX = newPos.x;
            wall.gridY = newPos.y;

            // Get pixel position
            const targetPixel = this.gridPhysics.gridToPixel(newPos.x, newPos.y);

            // Create trail effect
            this.createShuffleTrail(wall.sprite.x, wall.sprite.y, targetPixel.x, targetPixel.y, wallType);

            // Animate the wall moving
            this.tweens.add({
                targets: wall.sprite,
                x: targetPixel.x,
                y: targetPixel.y,
                duration: 800,
                ease: 'Back.inOut',
                delay: index * 100 // Stagger the animations
            });
        });

        // Play a whoosh sound effect (visual feedback)
        console.log(`[Game] Shuffled ${wallsOfType.length} ${wallType} walls!`);
    }

    /**
     * Create a trail effect for shuffling walls
     */
    createShuffleTrail(fromX, fromY, toX, toY, wallType) {
        const trailColors = {
            brick: 0x8B4513,
            wood: 0xDEB887,
            iron: 0x4A4A5A,
            steel: 0x3498DB
        };

        const color = trailColors[wallType] || 0xFFFFFF;
        const steps = 5;

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const x = fromX + (toX - fromX) * t;
            const y = fromY + (toY - fromY) * t;

            const trail = this.add.circle(x, y, 4, color, 0.6);
            trail.setDepth(15);

            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0,
                duration: 600,
                delay: i * 80,
                ease: 'Power2',
                onComplete: () => trail.destroy()
            });
        }
    }

    /**
     * Check if a grid position is empty (no walls, gates, player, friend, pushables)
     */
    isPositionEmpty(gridX, gridY) {
        // Check bounds
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }

        // Check walls
        if (this.walls.some(w => w.gridX === gridX && w.gridY === gridY)) {
            return false;
        }

        // Check special walls
        if (this.specialWalls && this.specialWalls.some(w => w.gridX === gridX && w.gridY === gridY)) {
            return false;
        }

        // Check gates
        if (this.gates.some(g => g.gridX === gridX && g.gridY === gridY)) {
            return false;
        }

        // Check player
        if (this.player && this.player.gridX === gridX && this.player.gridY === gridY) {
            return false;
        }

        // Check friend
        if (this.friend && this.friend.gridX === gridX && this.friend.gridY === gridY) {
            return false;
        }

        // Check pushables
        if (this.pushables.some(p => p.gridX === gridX && p.gridY === gridY)) {
            return false;
        }

        // Check sockets
        if (this.sockets && this.sockets.some(s => s.gridX === gridX && s.gridY === gridY)) {
            return false;
        }

        return true;
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

        console.log(`[Game] Gate collision: id=${gate.id}, type=${gate.type}, riddleId=${gate.riddleId}, ruleEffect=`, gate.ruleEffect);

        // Get appropriate riddle based on gate configuration
        let riddle;
        
        // Priority 1: Specific riddle ID linked to this gate
        if (gate.riddleId) {
            console.log(`[Game] Gate has specific riddleId: ${gate.riddleId}`);
            riddle = this.riddleManager.getRiddleById(gate.riddleId);
            if (riddle) {
                console.log(`[Game] Found linked riddle: ${riddle.id}`);
                // If gate also has a ruleEffect, override the riddle's effect
                if (gate.ruleEffect) {
                    riddle = { ...riddle, effect: gate.ruleEffect };
                }
            } else {
                console.warn(`[Game] Riddle '${gate.riddleId}' not found, falling back to random`);
            }
        }
        
        // Priority 2: Choice gate - get a choice riddle (each answer triggers different rule)
        if (!riddle && gate.type === 'choice') {
            console.log(`[Game] Gate is choice type, getting choice riddle`);
            riddle = this.riddleManager.getChoiceRiddle();
            if (riddle) {
                console.log(`[Game] Found choice riddle: ${riddle.id}`);
            }
        }
        
        // Priority 3: Rule gate - find matching riddle by ruleId
        if (!riddle && gate.type === 'rule' && gate.ruleEffect) {
            console.log(`[Game] Looking for riddle matching rule: ${gate.ruleEffect.ruleId}`);
            riddle = this.riddleManager.getRiddleForRule(gate.ruleEffect.ruleId);
            if (riddle) {
                console.log(`[Game] Found riddle: ${riddle.id}, question: ${riddle.question.substring(0, 50)}...`);
                // Override the riddle's effect with the gate's specific effect
                riddle = { ...riddle, effect: gate.ruleEffect };
            }
        }
        
        // Priority 4: Fallback to random barrier riddle
        if (!riddle) {
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
        // Don't process input if level is won
        if (this.hasWon) {
            return;
        }

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
        if (!this.friend || this.hasWon) return;

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
        // Prevent multiple calls
        if (this.hasWon) return;
        this.hasWon = true;

        // Stop the timer
        this.uiManager.stopTimer();

        // Disable input
        this.input.keyboard.enabled = false;

        // Friend celebration
        if (this.friend) {
            this.friend.celebrate();
        }

        // Show win screen after short delay
        this.time.delayedCall(500, () => {
            const hasNextLevel = this.levelManager.hasNextLevel();
            const nextLevelIndex = this.levelManager.currentLevelIndex + 1;
            const isLastLevel = !hasNextLevel;
            
            this.uiManager.showWinScreen(this.level.name, hasNextLevel, isLastLevel, {
                onNextLevel: () => {
                    // Check if we are transitioning from Level 1 (index 0) to Level 2 (index 1)
                    if (this.levelManager.currentLevelIndex === 0) {
                        this.playTransitionVideo('transition_l1_l2', nextLevelIndex);
                    } else {
                        // Pass the next level index directly
                        this.scene.restart({ levelIndex: nextLevelIndex });
                    }
                },
                onRestart: () => {
                    // On last level, R goes back to level 1; otherwise restart current
                    const restartIndex = isLastLevel ? 0 : this.levelManager.currentLevelIndex;
                    this.scene.restart({ levelIndex: restartIndex });
                }
            });
        });
    }

    /**
     * Play a transition video before moving to the next level
     */
    playTransitionVideo(videoKey, nextLevelIndex) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create video
        const video = this.add.video(width / 2, height / 2, videoKey);
        
        // Function to update scale - called immediately and on play
        const updateScale = () => {
            if (!video.width || !video.height) return;
            
            // User requested to scale to current size of window.
            // "Too large" (cover) and "too small" (contain) suggests they want exact fit.
            video.setDisplaySize(width, height);
        };
        
        // Initial scale attempt
        updateScale();
        
        video.setDepth(1000); // Ensure it's on top of everything including UI
        
        // Play video
        video.play();
        
        // Re-scale when playback starts (metadata definitely available)
        video.on('play', () => {
            updateScale();
            // Double check after a frame just in case
            this.time.delayedCall(50, updateScale);
        });
        
        // When video completes, restart scene with next level
        video.on('complete', () => {
            this.scene.restart({ levelIndex: nextLevelIndex });
        });

        // Also handle if video fails to load or play
        video.on('error', () => {
            console.error(`[Game] Failed to play video: ${videoKey}`);
            this.scene.restart({ levelIndex: nextLevelIndex });
        });
    }

    /**
     * Clean up when leaving scene
     */
    shutdown() {
        // Clean up video background
        if (this.backgroundVideo) {
            this.backgroundVideo.stop();
            this.backgroundVideo.destroy();
            this.backgroundVideo = null;
        }

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
