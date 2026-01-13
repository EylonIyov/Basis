import { LevelManager } from '../levels/LevelManager.js';
import { RiddleManager } from '../riddles/RiddleManager.js';
import { AssetLoader } from '../managers/AssetLoader.js';
import { LevelRenderer } from '../managers/LevelRenderer.js';
import { RiddleUIManager } from '../managers/RiddleUIManager.js';
import { GridPhysics } from '../systems/GridPhysics.js';
import { RuleManager } from '../systems/RuleManager.js';
import { Player } from '../entities/Player.js';
import { FriendNPC } from '../entities/FriendNPC.js';
import { PushableObject } from '../entities/PushableObject.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
        // Initialize level manager early (before init/preload)
        this.levelManager = new LevelManager();
    }

    init(data) {
        // Allow level to be passed in via scene data
        if (data && data.levelIndex !== undefined) {
            const success = this.levelManager.setLevel(data.levelIndex);
            if (!success) {
                console.error(`Failed to set level index ${data.levelIndex}`);
            } else {
                console.log(`Setting level to index ${data.levelIndex}: ${this.levelManager.getCurrentLevel().name}`);
            }
        } else {
            console.log(`Starting with default level: ${this.levelManager.getCurrentLevel().name}`);
        }
    }

    async preload() {
        // Initialize asset loader and preload assets
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.preloadAll();
        
        // Initialize riddle manager and load riddles
        this.riddleManager = new RiddleManager();
        await this.riddleManager.loadRiddles('src/riddles/riddles.json');
    }

    create() {
        // Load level data from level manager
        this.level = this.levelManager.getCurrentLevel();
        
        if (!this.level) {
            console.error('No level loaded!');
            return;
        }
        
        console.log(`Loading level: ${this.level.name} (index ${this.levelManager.currentLevelIndex})`);
        
        // Initialize core systems
        this.initializeSystems();
        
        // Create animations
        this.assetLoader.createAnimations();
        
        // Calculate grid configuration
        this.calculateGridLayout();
        
        // Configure systems with grid layout
        this.configureSystems();
        
        // Render level
        this.renderLevel();
        
        // Create entities
        this.createEntities();
        
        // Set up input
        this.setupInput();
        
        // Game state
        this.isMoving = false;
        this.hasWon = false;
    }

    /**
     * Initialize all game systems
     */
    initializeSystems() {
        this.ruleManager = new RuleManager();
        this.ruleManager.setScene(this);
        
        this.gridPhysics = new GridPhysics(this, this.ruleManager);
        this.levelRenderer = new LevelRenderer(this);
        this.riddleUI = new RiddleUIManager(this, this.riddleManager, this.ruleManager);
    }

    /**
     * Calculate grid layout and tile size
     */
    calculateGridLayout() {
        this.gridWidth = this.level.gridWidth;
        this.gridHeight = this.level.gridHeight;
        
        // Calculate tile size to fit the screen with padding
        const padding = 40;
        const availableHeight = this.cameras.main.height - padding;
        const availableWidth = this.cameras.main.width - padding;
        
        const tileSizeByHeight = Math.floor(availableHeight / this.gridHeight);
        const tileSizeByWidth = Math.floor(availableWidth / this.gridWidth);
        this.tileSize = Math.min(tileSizeByHeight, tileSizeByWidth);
        
        // Calculate offset to center the grid
        const gridPixelWidth = this.gridWidth * this.tileSize;
        const gridPixelHeight = this.gridHeight * this.tileSize;
        this.gridOffsetX = (this.cameras.main.width - gridPixelWidth) / 2;
        this.gridOffsetY = (this.cameras.main.height - gridPixelHeight) / 2;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Game.js:114',message:'Grid Layout Calculated',data:{gridWidth:this.gridWidth,gridHeight:this.gridHeight,tileSize:this.tileSize,gridOffsetX:this.gridOffsetX,gridOffsetY:this.gridOffsetY,cameraWidth:this.cameras.main.width,cameraHeight:this.cameras.main.height},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
    }

    /**
     * Configure systems with grid layout
     */
    configureSystems() {
        this.gridPhysics.configure(
            this.gridWidth,
            this.gridHeight,
            this.tileSize,
            this.gridOffsetX,
            this.gridOffsetY
        );
        
        this.levelRenderer.configure(
            this.gridWidth,
            this.gridHeight,
            this.tileSize,
            this.gridOffsetX,
            this.gridOffsetY
        );
    }

    /**
     * Render level using LevelRenderer
     */
    renderLevel() {
        // Render background with theme
        this.levelRenderer.renderBackground(this.level.theme);
        
        // Render grid overlay
        this.levelRenderer.renderGridOverlay();
        
        // Render walls
        this.walls = this.levelRenderer.renderWalls(this.level.walls);
        
        // Render gates
        this.gates = this.levelRenderer.renderGates(this.level.gates);
        
        // Register entities with physics system
        this.gridPhysics.registerWalls(this.walls);
        this.gridPhysics.registerGates(this.gates);
    }

    /**
     * Create all game entities
     */
    createEntities() {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Game.js:154',message:'createEntities - level data',data:{startX:this.level.start.x,startY:this.level.start.y,goalX:this.level.goal.x,goalY:this.level.goal.y},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        // Create player
        this.player = new Player(this, this.level.start.x, this.level.start.y);
        this.player.setGridPhysics(this.gridPhysics);
        
        // #region agent log
        // Check surrounding tiles
        const startX = this.level.start.x;
        const startY = this.level.start.y;
        const surrounding = {
            up: this.gridPhysics.isWallAt(startX, startY - 1),
            down: this.gridPhysics.isWallAt(startX, startY + 1),
            left: this.gridPhysics.isWallAt(startX - 1, startY),
            right: this.gridPhysics.isWallAt(startX + 1, startY),
            current: this.gridPhysics.isWallAt(startX, startY)
        };
        fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Game.js:170',message:'player surroundings',data:{startX,startY,surrounding},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // Create friend NPC
        this.friend = new FriendNPC(this, this.level.goal.x, this.level.goal.y);
        this.friend.setGridPhysics(this.gridPhysics);
        
        // Create pushable objects
        this.pushables = [];
        if (this.level.pushables && this.level.pushables.length > 0) {
            this.level.pushables.forEach(pushableData => {
                const pushable = new PushableObject(
                    this,
                    pushableData.x,
                    pushableData.y,
                    pushableData.type
                );
                pushable.setGridPhysics(this.gridPhysics);
                this.pushables.push(pushable);
            });
        }
        
        // Register pushables with physics
        this.gridPhysics.registerPushables(this.pushables);
    }

    /**
     * Set up input handling
     */
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Track which keys were down last frame to prevent key repeat
        this.lastKeysDown = {
            left: false,
            right: false,
            up: false,
            down: false
        };
    }

    /**
     * Main update loop
     */
    update() {
        // Only process input if not moving and no riddle modal is open
        if (!this.player.isMoving && !this.riddleUI.isModalVisible()) {
            this.handleInput();
        }
        
        // Check win condition
        this.checkWinCondition();
    }

    /**
     * Handle keyboard input with debouncing to prevent key repeat spam
     */
    handleInput() {
        let direction = null;
        let keyPressed = null;

        // Check for key press (only trigger on initial press, not on hold/repeat)
        if (this.cursors.left.isDown && !this.lastKeysDown.left) {
            direction = { x: -1, y: 0 };
            keyPressed = 'left';
        } else if (this.cursors.right.isDown && !this.lastKeysDown.right) {
            direction = { x: 1, y: 0 };
            keyPressed = 'right';
        } else if (this.cursors.up.isDown && !this.lastKeysDown.up) {
            direction = { x: 0, y: -1 };
            keyPressed = 'up';
        } else if (this.cursors.down.isDown && !this.lastKeysDown.down) {
            direction = { x: 0, y: 1 };
            keyPressed = 'down';
        }

        // Update last keys state
        this.lastKeysDown.left = this.cursors.left.isDown;
        this.lastKeysDown.right = this.cursors.right.isDown;
        this.lastKeysDown.up = this.cursors.up.isDown;
        this.lastKeysDown.down = this.cursors.down.isDown;

        if (direction) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/b64dcfbd-fc89-43c6-a30c-2dbecccfe5d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Game.js:245',message:'KEY PRESSED - tryMove called',data:{key:keyPressed,direction,playerPos:{x:this.player.gridX,y:this.player.gridY},targetPos:{x:this.player.gridX+direction.x,y:this.player.gridY+direction.y}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            this.player.tryMove(direction);
        }
    }

    /**
     * Handle gate collision (called by Player when hitting closed gate)
     */
    handleGateCollision(gate) {
        this.riddleUI.showGateRiddle(gate);
    }

    /**
     * Check if player reached friend (win condition)
     */
    checkWinCondition() {
        if (this.player && this.friend && !this.hasWon) {
            const playerPos = this.player.getGridPosition();
            
            if (this.friend.checkReached(playerPos.x, playerPos.y)) {
                this.hasWon = true; // Prevent multiple triggers
                this.handleWin();
            }
        }
    }

    /**
     * Handle level win
     */
    handleWin() {
        // Celebrate!
        this.friend.celebrate();
        
        const hasNextLevel = this.levelManager.hasNextLevel();
        
        // Win message
        const winText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `YOU FOUND YOUR FRIEND!\n\n${this.level.name} Complete!`,
            {
                fontSize: '48px',
                color: '#2ecc71',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);

        // Instructions
        let instructionText = '';
        if (hasNextLevel) {
            instructionText = 'Press N for next level\nPress R to restart';
        } else {
            instructionText = 'All levels complete!\nPress R to restart';
        }
        
        const instructionDisplay = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            instructionText,
            {
                fontSize: '24px',
                color: '#ecf0f1',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);

        // Next level on N key
        if (hasNextLevel) {
            this.input.keyboard.once('keydown-N', () => {
                const nextLevel = this.levelManager.nextLevel();
                const newIndex = this.levelManager.currentLevelIndex;
                
                if (nextLevel) {
                    console.log(`Advancing to level ${newIndex}: ${nextLevel.name}`);
                    this.scene.restart({ levelIndex: newIndex });
                }
            });
        }

        // Restart on R key
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart({ levelIndex: this.levelManager.currentLevelIndex });
        });
        
        // Disable further movement
        this.player.isMoving = true;
    }
}
