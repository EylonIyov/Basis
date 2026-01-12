export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        // Grid configuration
        this.tileSize = 64;
        this.gridWidth = 20;  // tiles
        this.gridHeight = 15; // tiles
        
        // Calculate offset to center the grid
        this.gridOffsetX = (this.cameras.main.width - (this.gridWidth * this.tileSize)) / 2;
        this.gridOffsetY = (this.cameras.main.height - (this.gridHeight * this.tileSize)) / 2;

        // Game state
        this.isMoving = false;
        this.currentRiddleGate = null;

        // Create visual grid (optional, for debugging)
        this.createGrid();

        // Create Babi character
        this.createBabi();

        // Create gates
        this.createGates();

        // Create food goal
        this.createFood();

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

    createBabi() {
        // Starting position (top-left)
        this.babiGridX = 1;
        this.babiGridY = 1;

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

        // Create a few placeholder gates at different positions
        const gatePositions = [
            { x: 5, y: 3 },
            { x: 10, y: 7 },
            { x: 15, y: 5 }
        ];

        gatePositions.forEach(pos => {
            const x = this.gridOffsetX + pos.x * this.tileSize + this.tileSize / 2;
            const y = this.gridOffsetY + pos.y * this.tileSize + this.tileSize / 2;

            const gate = this.add.rectangle(x, y, this.tileSize - 8, this.tileSize - 8, 0xff6b6b);
            gate.setStrokeStyle(3, 0xff4757);
            gate.setDepth(5);
            gate.gridX = pos.x;
            gate.gridY = pos.y;
            gate.isOpen = false;

            // Add label
            const label = this.add.text(x, y, 'GATE', {
                fontSize: '10px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6);

            gate.label = label;
            this.gates.push(gate);
        });
    }

    createFood() {
        // Food position (bottom-right)
        this.foodGridX = this.gridWidth - 2;
        this.foodGridY = this.gridHeight - 2;

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

        // Modal box
        const modalWidth = 400;
        const modalHeight = 300;
        const modalX = this.cameras.main.width / 2;
        const modalY = this.cameras.main.height / 2;

        const modalBg = this.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x34495e);
        modalBg.setStrokeStyle(3, 0x2c3e50);
        this.riddleModal.add(modalBg);

        // Title
        const title = this.add.text(modalX, modalY - 100, 'RIDDLE', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.riddleModal.add(title);

        // Placeholder riddle text
        this.riddleText = this.add.text(modalX, modalY - 20, 'Placeholder Riddle\n\n[This is where the riddle will appear]', {
            fontSize: '16px',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: modalWidth - 40 }
        }).setOrigin(0.5);
        this.riddleModal.add(this.riddleText);

        // Placeholder answer buttons
        const buttonY = modalY + 80;
        const buttonSpacing = 60;

        this.answerButton1 = this.add.rectangle(modalX - 100, buttonY, 150, 40, 0x3498db);
        this.answerButton1.setStrokeStyle(2, 0x2980b9);
        this.answerButton1.setInteractive({ useHandCursor: true });
        this.riddleModal.add(this.answerButton1);

        const button1Text = this.add.text(modalX - 100, buttonY, 'Answer 1', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.riddleModal.add(button1Text);

        this.answerButton2 = this.add.rectangle(modalX + 100, buttonY, 150, 40, 0x3498db);
        this.answerButton2.setStrokeStyle(2, 0x2980b9);
        this.answerButton2.setInteractive({ useHandCursor: true });
        this.riddleModal.add(this.answerButton2);

        const button2Text = this.add.text(modalX + 100, buttonY, 'Answer 2', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.riddleModal.add(button2Text);

        // Close button
        const closeButton = this.add.rectangle(modalX, modalY + 120, 100, 35, 0xe74c3c);
        closeButton.setStrokeStyle(2, 0xc0392b);
        closeButton.setInteractive({ useHandCursor: true });
        this.riddleModal.add(closeButton);

        const closeButtonText = this.add.text(modalX, modalY + 120, 'Close', {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.riddleModal.add(closeButtonText);

        // Button interactions
        closeButton.on('pointerdown', () => {
            this.closeRiddleModal();
        });

        this.answerButton1.on('pointerdown', () => {
            // Placeholder: for now, just close the modal
            this.closeRiddleModal();
        });

        this.answerButton2.on('pointerdown', () => {
            // Placeholder: for now, just close the modal
            this.closeRiddleModal();
        });
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
        this.riddleModal.setVisible(true);
    }

    closeRiddleModal() {
        this.riddleModal.setVisible(false);
        
        // For now, open the gate when modal is closed (placeholder behavior)
        if (this.currentRiddleGate) {
            this.currentRiddleGate.isOpen = true;
            this.currentRiddleGate.setAlpha(0.3);
            this.currentRiddleGate.label.setAlpha(0.3);
            this.currentRiddleGate = null;
        }
    }

    handleWin() {
        // Simple win message
        const winText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'YOU WIN!\n\nBabi reached the food!',
            {
                fontSize: '48px',
                color: '#2ecc71',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);

        // Restart instruction
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            'Press R to restart',
            {
                fontSize: '24px',
                color: '#ecf0f1'
            }
        ).setOrigin(0.5).setDepth(200);

        // Restart on R key
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart();
        });
    }
}
