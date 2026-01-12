import { LevelManager } from '../levels/LevelManager.js';
import { RiddleManager } from '../riddles/RiddleManager.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
        // Initialize level manager early (before init/preload)
        this.levelManager = new LevelManager();
    }

    init(data) {
        // Allow level to be passed in via scene data
        // If no level specified, use current level from manager
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
        // Initialize riddle manager and load riddles
        this.riddleManager = new RiddleManager();
        // Load riddles - path is relative to index.html
        await this.riddleManager.loadRiddles('src/riddles/riddles.json');
    }

    create() {
        // Load level data from level manager
        this.level = this.levelManager.getCurrentLevel();
        
        if (!this.level) {
            console.error('No level loaded!');
            console.error(`Current level index: ${this.levelManager.currentLevelIndex}`);
            console.error(`Total levels: ${this.levelManager.getLevelCount()}`);
            console.error(`Levels array:`, this.levelManager.levels);
            return;
        }
        
        // Grid configuration from level
        this.gridWidth = this.level.gridWidth;
        this.gridHeight = this.level.gridHeight;
        
        console.log(`Loading level: ${this.level.name} (index ${this.levelManager.currentLevelIndex})`);
        console.log(`Start: (${this.level.start.x}, ${this.level.start.y}), Goal: (${this.level.goal.x}, ${this.level.goal.y})`);
        console.log(`Gates: ${this.level.gates.length}, Walls: ${this.level.walls.length}`);
        
        // Calculate tile size to fit the screen with padding
        // Leave some padding (20px on each side) to ensure nothing is cut off
        const padding = 40; // 20px top + 20px bottom
        const availableHeight = this.cameras.main.height - padding;
        const availableWidth = this.cameras.main.width - padding;
        
        // Calculate tile size based on both dimensions, use the smaller one to ensure everything fits
        const tileSizeByHeight = Math.floor(availableHeight / this.gridHeight);
        const tileSizeByWidth = Math.floor(availableWidth / this.gridWidth);
        this.tileSize = Math.min(tileSizeByHeight, tileSizeByWidth);
        
        // Calculate offset to center the grid with padding
        const gridPixelWidth = this.gridWidth * this.tileSize;
        const gridPixelHeight = this.gridHeight * this.tileSize;
        this.gridOffsetX = (this.cameras.main.width - gridPixelWidth) / 2;
        this.gridOffsetY = (this.cameras.main.height - gridPixelHeight) / 2;

        // Game state
        this.isMoving = false;
        this.currentRiddleGate = null;
        this.currentRiddle = null;

        // Create visual grid (optional, for debugging)
        this.createGrid();

        // Create walls/obstacles
        this.createWalls();

        // Create Babi character at level start position
        this.createBabi();

        // Create gates from level data
        this.createGates();

        // Create food goal at level goal position
        this.createFood();

        // Create path indicators (visual guides)
        this.createPathIndicators();

        // Create riddle UI (initially hidden)
        this.createRiddleUI();

        // Set up input
        this.setupInput();
    }

    createGrid() {
        // Optional: Draw grid lines for debugging
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x34495e, 0.3);

        for (let x = 0; x <= this.gridWidth; x++) {
            graphics.moveTo(this.gridOffsetX + x * this.tileSize, this.gridOffsetY);
            graphics.lineTo(this.gridOffsetX + x * this.tileSize, this.gridOffsetY + this.gridHeight * this.tileSize);
        }

        for (let y = 0; y <= this.gridHeight; y++) {
            graphics.moveTo(this.gridOffsetX, this.gridOffsetY + y * this.tileSize);
            graphics.lineTo(this.gridOffsetX + this.gridWidth * this.tileSize, this.gridOffsetY + y * this.tileSize);
        }

        graphics.strokePath();
    }

    createWalls() {
        // Initialize walls array
        this.walls = [];
        
        // Create walls/obstacles from level data
        if (this.level.walls) {
            this.level.walls.forEach(wall => {
                // Create wall rectangles
                for (let wx = 0; wx < wall.width; wx++) {
                    for (let wy = 0; wy < wall.height; wy++) {
                        const wallX = wall.x + wx;
                        const wallY = wall.y + wy;
                        
                        if (wallX >= 0 && wallX < this.gridWidth && wallY >= 0 && wallY < this.gridHeight) {
                            const x = this.gridOffsetX + wallX * this.tileSize + this.tileSize / 2;
                            const y = this.gridOffsetY + wallY * this.tileSize + this.tileSize / 2;
                            
                            const wallRect = this.add.rectangle(x, y, this.tileSize - 4, this.tileSize - 4, 0x34495e);
                            wallRect.setStrokeStyle(2, 0x2c3e50);
                            wallRect.setDepth(3);
                            wallRect.gridX = wallX;
                            wallRect.gridY = wallY;
                            
                            this.walls.push(wallRect);
                        }
                    }
                }
            });
        }
    }

    createBabi() {
        // Starting position from level data
        this.babiGridX = this.level.start.x;
        this.babiGridY = this.level.start.y;

        // Create placeholder sprite (pink circle)
        const x = this.gridOffsetX + this.babiGridX * this.tileSize + this.tileSize / 2;
        const y = this.gridOffsetY + this.babiGridY * this.tileSize + this.tileSize / 2;

        this.babi = this.add.circle(x, y, this.tileSize / 2 - 4, 0xff69b4);
        this.babi.setStrokeStyle(3, 0xff1493);
        this.babi.setDepth(10);

        // Add label
        this.babiLabel = this.add.text(x, y, 'BABI', {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    createGates() {
        this.gates = [];

        // Create gates from level data
        this.level.gates.forEach(gateData => {
            const x = this.gridOffsetX + gateData.x * this.tileSize + this.tileSize / 2;
            const y = this.gridOffsetY + gateData.y * this.tileSize + this.tileSize / 2;

            // Different colors for different paths
            let gateColor = 0xff6b6b; // Default red
            let strokeColor = 0xff4757;
            
            if (gateData.path === 'top') {
                gateColor = 0xff6b6b; // Red for top path
                strokeColor = 0xff4757;
            } else if (gateData.path === 'middle') {
                gateColor = 0xffa500; // Orange for middle path
                strokeColor = 0xff8c00;
            } else if (gateData.path === 'bottom') {
                gateColor = 0x9b59b6; // Purple for bottom path
                strokeColor = 0x8e44ad;
            }

            const gate = this.add.rectangle(x, y, this.tileSize - 8, this.tileSize - 8, gateColor);
            gate.setStrokeStyle(3, strokeColor);
            gate.setDepth(5);
            gate.gridX = gateData.x;
            gate.gridY = gateData.y;
            gate.isOpen = false;
            gate.id = gateData.id;
            gate.path = gateData.path;
            gate.riddleId = gateData.riddleId;

            // Add label with gate ID
            const label = this.add.text(x, y, gateData.id.toUpperCase().replace('GATE', ''), {
                fontSize: '10px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6);

            gate.label = label;
            this.gates.push(gate);
        });
    }

    createFood() {
        // Food position from level data
        this.foodGridX = this.level.goal.x;
        this.foodGridY = this.level.goal.y;

        const x = this.gridOffsetX + this.foodGridX * this.tileSize + this.tileSize / 2;
        const y = this.gridOffsetY + this.foodGridY * this.tileSize + this.tileSize / 2;

        this.food = this.add.circle(x, y, this.tileSize / 2 - 4, 0x2ecc71);
        this.food.setStrokeStyle(3, 0x27ae60);
        this.food.setDepth(5);

        // Add label
        this.add.text(x, y, 'FOOD', {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);
    }

    createPathIndicators() {
        // Add visual indicators showing different paths
        // Top path indicator
        const topGates = this.gates.filter(g => g.path === 'top');
        if (topGates.length > 0) {
            const topGate = topGates[0];
            this.add.text(
                topGate.x - 60,
                topGate.y - 30,
                'TOP PATH',
                {
                    fontSize: '10px',
                    color: '#ff6b6b',
                    fontStyle: 'bold'
                }
            ).setDepth(7);
        }

        // Middle path indicator
        const middleGates = this.gates.filter(g => g.path === 'middle');
        if (middleGates.length > 0) {
            const middleGate = middleGates[0];
            this.add.text(
                middleGate.x - 60,
                middleGate.y - 30,
                'MIDDLE PATH',
                {
                    fontSize: '10px',
                    color: '#ffa500',
                    fontStyle: 'bold'
                }
            ).setDepth(7);
        }

        // Bottom path indicator
        const bottomGates = this.gates.filter(g => g.path === 'bottom');
        if (bottomGates.length > 0) {
            const bottomGate = bottomGates[0];
            this.add.text(
                bottomGate.x - 60,
                bottomGate.y - 30,
                'BOTTOM PATH',
                {
                    fontSize: '10px',
                    color: '#9b59b6',
                    fontStyle: 'bold'
                }
            ).setDepth(7);
        }
    }

    createRiddleUI() {
        // Create modal background (initially hidden)
        this.riddleModal = this.add.container(0, 0);
        this.riddleModal.setVisible(false);
        this.riddleModal.setDepth(100);

        // Dark overlay
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        );
        this.riddleModal.add(overlay);

        // Modal box - make it taller to accommodate more answers
        const modalWidth = 500;
        const modalHeight = 400;
        const modalX = this.cameras.main.width / 2;
        const modalY = this.cameras.main.height / 2;

        const modalBg = this.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x34495e);
        modalBg.setStrokeStyle(3, 0x2c3e50);
        this.riddleModal.add(modalBg);

        // Title
        const title = this.add.text(modalX, modalY - 150, 'RIDDLE', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.riddleModal.add(title);

        // Riddle text (will be updated when showing riddle)
        this.riddleText = this.add.text(modalX, modalY - 60, '', {
            fontSize: '18px',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: modalWidth - 40 }
        }).setOrigin(0.5);
        this.riddleModal.add(this.riddleText);

        // Answer buttons container (will be created dynamically)
        this.answerButtons = [];
        this.answerButtonTexts = [];

        // Feedback text (for correct/incorrect answers)
        this.feedbackText = this.add.text(modalX, modalY + 160, '', {
            fontSize: '16px',
            color: '#2ecc71',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.riddleModal.add(this.feedbackText);
        this.feedbackText.setVisible(false);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        // Only process movement if not currently moving and no riddle modal is open
        if (!this.isMoving && !this.riddleModal.visible) {
            let newX = this.babiGridX;
            let newY = this.babiGridY;

            if (this.cursors.left.isDown) {
                newX = Math.max(0, this.babiGridX - 1);
            } else if (this.cursors.right.isDown) {
                newX = Math.min(this.gridWidth - 1, this.babiGridX + 1);
            } else if (this.cursors.up.isDown) {
                newY = Math.max(0, this.babiGridY - 1);
            } else if (this.cursors.down.isDown) {
                newY = Math.min(this.gridHeight - 1, this.babiGridY + 1);
            }

            // Check if position changed
            if (newX !== this.babiGridX || newY !== this.babiGridY) {
                // Check for wall collision
                if (this.isWallAt(newX, newY)) {
                    // Can't move through walls
                    return;
                }
                
                // Check for gate collision
                const gate = this.getGateAt(newX, newY);
                if (gate && !gate.isOpen) {
                    // Show riddle modal
                    this.showRiddleModal(gate);
                } else {
                    // Move to new position
                    this.moveBabi(newX, newY);
                }
            }
        }

        // Check win condition
        if (this.babiGridX === this.foodGridX && this.babiGridY === this.foodGridY) {
            this.handleWin();
        }
    }

    isWallAt(gridX, gridY) {
        if (!this.walls) return false;
        return this.walls.some(wall => wall.gridX === gridX && wall.gridY === gridY);
    }

    getGateAt(gridX, gridY) {
        return this.gates.find(gate => gate.gridX === gridX && gate.gridY === gridY && !gate.isOpen);
    }

    moveBabi(newGridX, newGridY) {
        this.isMoving = true;

        const targetX = this.gridOffsetX + newGridX * this.tileSize + this.tileSize / 2;
        const targetY = this.gridOffsetY + newGridY * this.tileSize + this.tileSize / 2;

        this.tweens.add({
            targets: this.babi,
            x: targetX,
            y: targetY,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.babiGridX = newGridX;
                this.babiGridY = newGridY;
                this.isMoving = false;
            }
        });

        // Move label with Babi
        this.tweens.add({
            targets: this.babiLabel,
            x: targetX,
            y: targetY,
            duration: 200,
            ease: 'Power2'
        });
    }

    showRiddleModal(gate) {
        this.currentRiddleGate = gate;
        
        // Get a random riddle
        const riddle = this.riddleManager.getRandomRiddle();
        
        if (!riddle) {
            console.error('No riddle available');
            // Fallback to placeholder
            const pathName = gate.path.charAt(0).toUpperCase() + gate.path.slice(1);
            this.riddleText.setText(`Gate ${gate.id.toUpperCase()}\n${pathName} Path\n\n[No riddle available]`);
            this.riddleModal.setVisible(true);
            return;
        }

        this.currentRiddle = riddle;
        
        // Update riddle text
        const pathName = gate.path.charAt(0).toUpperCase() + gate.path.slice(1);
        this.riddleText.setText(`${pathName} Path\n\n${riddle.question}`);
        
        // Clear previous answer buttons
        this.clearAnswerButtons();
        
        // Create answer buttons dynamically
        this.createAnswerButtons(riddle);
        
        // Hide feedback
        this.feedbackText.setVisible(false);
        
        this.riddleModal.setVisible(true);
    }

    clearAnswerButtons() {
        // Remove existing answer buttons
        this.answerButtons.forEach(button => {
            if (button.rect) button.rect.destroy();
            if (button.text) button.text.destroy();
        });
        this.answerButtons = [];
        this.answerButtonTexts = [];
    }

    createAnswerButtons(riddle) {
        const modalX = this.cameras.main.width / 2;
        const modalY = this.cameras.main.height / 2;
        const buttonWidth = 200;
        const buttonHeight = 45;
        const buttonSpacing = 55;
        const startY = modalY + 40;
        
        // Shuffle answers for variety (but keep track of correct index)
        const shuffledAnswers = [...riddle.answers];
        const correctAnswer = riddle.answers[riddle.correctAnswer];
        
        // Simple shuffle
        for (let i = shuffledAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
        }
        
        // Find the new index of the correct answer
        const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);
        
        // Store the mapping
        this.answerMapping = shuffledAnswers.map((answer, index) => ({
            answer: answer,
            originalIndex: riddle.answers.indexOf(answer),
            isCorrect: index === newCorrectIndex
        }));

        // Create buttons (limit to 4 answers, arranged in 2x2 grid)
        const maxAnswers = Math.min(shuffledAnswers.length, 4);
        const buttonsPerRow = 2;
        
        shuffledAnswers.slice(0, maxAnswers).forEach((answer, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;
            
            const buttonX = modalX + (col - 0.5) * (buttonWidth + 20);
            const buttonY = startY + row * buttonSpacing;
            
            // Create button rectangle
            const buttonRect = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x3498db);
            buttonRect.setStrokeStyle(2, 0x2980b9);
            buttonRect.setInteractive({ useHandCursor: true });
            this.riddleModal.add(buttonRect);
            
            // Create button text
            const buttonText = this.add.text(buttonX, buttonY, answer, {
                fontSize: '14px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: buttonWidth - 20 }
            }).setOrigin(0.5);
            this.riddleModal.add(buttonText);
            
            // Store button info
            const buttonInfo = {
                rect: buttonRect,
                text: buttonText,
                answerIndex: index,
                isCorrect: this.answerMapping[index].isCorrect
            };
            
            this.answerButtons.push(buttonInfo);
            
            // Add click handler
            buttonRect.on('pointerdown', () => {
                this.handleAnswerClick(buttonInfo);
            });
        });
    }

    handleAnswerClick(buttonInfo) {
        // Disable all buttons
        this.answerButtons.forEach(btn => {
            btn.rect.setInteractive(false);
            btn.rect.setAlpha(0.5);
        });
        
        if (buttonInfo.isCorrect) {
            // Correct answer
            buttonInfo.rect.setFillStyle(0x2ecc71);
            buttonInfo.rect.setStrokeStyle(2, 0x27ae60);
            this.feedbackText.setText('Correct! Gate opens...');
            this.feedbackText.setColor('#2ecc71');
            this.feedbackText.setVisible(true);
            
            // Close modal and open gate after a short delay
            this.time.delayedCall(1000, () => {
                this.closeRiddleModal(true);
            });
        } else {
            // Wrong answer
            buttonInfo.rect.setFillStyle(0xe74c3c);
            buttonInfo.rect.setStrokeStyle(2, 0xc0392b);
            this.feedbackText.setText('Wrong answer! Try again.');
            this.feedbackText.setColor('#e74c3c');
            this.feedbackText.setVisible(true);
            
            // Re-enable buttons after a short delay
            this.time.delayedCall(1500, () => {
                this.answerButtons.forEach(btn => {
                    btn.rect.setInteractive({ useHandCursor: true });
                    btn.rect.setAlpha(1);
                    // Reset colors
                    if (!btn.isCorrect) {
                        btn.rect.setFillStyle(0x3498db);
                        btn.rect.setStrokeStyle(2, 0x2980b9);
                    }
                });
                this.feedbackText.setVisible(false);
            });
        }
    }

    closeRiddleModal(answeredCorrectly = false) {
        this.riddleModal.setVisible(false);
        
        // Only open gate if answer was correct
        if (answeredCorrectly && this.currentRiddleGate) {
            this.currentRiddleGate.isOpen = true;
            this.currentRiddleGate.setAlpha(0.3);
            this.currentRiddleGate.label.setAlpha(0.3);
            this.currentRiddleGate = null;
        }
        
        // Clear current riddle
        this.currentRiddle = null;
        this.answerMapping = null;
    }

    handleWin() {
        const hasNextLevel = this.levelManager.hasNextLevel();
        
        // Win message
        const winText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `YOU WIN!\n\n${this.level.name} Complete!`,
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
                const currentIndex = this.levelManager.currentLevelIndex;
                const nextLevel = this.levelManager.nextLevel();
                if (nextLevel) {
                    console.log(`Advancing from level ${currentIndex} to ${this.levelManager.currentLevelIndex}: ${nextLevel.name}`);
                    this.scene.restart({ levelIndex: this.levelManager.currentLevelIndex });
                } else {
                    console.error('Failed to advance to next level');
                }
            });
        }

        // Restart on R key
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart({ levelIndex: this.levelManager.currentLevelIndex });
        });
    }
}
