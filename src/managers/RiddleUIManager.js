/**
 * RiddleUIManager - Manages riddle modal UI and user interactions
 * Handles both barrier riddles (gates) and rule riddles (global state changes)
 * Extracted from Game.js for better modularity
 */
export class RiddleUIManager {
    constructor(scene, riddleManager, ruleManager) {
        this.scene = scene;
        this.riddleManager = riddleManager;
        this.ruleManager = ruleManager;
        
        // UI elements
        this.riddleModal = null;
        this.riddleText = null;
        this.feedbackText = null;
        this.answerButtons = [];
        this.answerMapping = null;
        
        // State
        this.currentRiddle = null;
        this.currentGate = null;
        this.isVisible = false;
        
        // Create UI
        this.createUI();
    }

    /**
     * Create the riddle modal UI
     */
    createUI() {
        // Create modal container (initially hidden)
        this.riddleModal = this.scene.add.container(0, 0);
        this.riddleModal.setVisible(false);
        this.riddleModal.setDepth(100);

        // Dark overlay
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.7
        );
        this.riddleModal.add(overlay);

        // Modal box
        const modalWidth = 500;
        const modalHeight = 400;
        const modalX = this.scene.cameras.main.width / 2;
        const modalY = this.scene.cameras.main.height / 2;

        const modalBg = this.scene.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x34495e);
        modalBg.setStrokeStyle(3, 0x2c3e50);
        this.riddleModal.add(modalBg);

        // Title
        this.titleText = this.scene.add.text(modalX, modalY - 150, 'RIDDLE', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.riddleModal.add(this.titleText);

        // Riddle text
        this.riddleText = this.scene.add.text(modalX, modalY - 60, '', {
            fontSize: '18px',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: modalWidth - 40 }
        }).setOrigin(0.5);
        this.riddleModal.add(this.riddleText);

        // Feedback text
        this.feedbackText = this.scene.add.text(modalX, modalY + 160, '', {
            fontSize: '16px',
            color: '#2ecc71',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.riddleModal.add(this.feedbackText);
        this.feedbackText.setVisible(false);
    }

    /**
     * Show riddle modal for a gate (barrier riddle)
     */
    showGateRiddle(gate) {
        this.currentGate = gate;
        
        // Get a random barrier riddle
        const riddle = this.riddleManager.getRandomRiddle();
        
        if (!riddle) {
            console.error('No riddle available');
            this.showFallbackRiddle(gate);
            return;
        }

        this.currentRiddle = riddle;
        this.isVisible = true;
        
        // Update title and text
        this.titleText.setText('GATE RIDDLE');
        const pathName = gate.path ? gate.path.charAt(0).toUpperCase() + gate.path.slice(1) : '';
        this.riddleText.setText(`${pathName} Path\n\n${riddle.question}`);
        
        // Create answer buttons
        this.clearAnswerButtons();
        this.createAnswerButtons(riddle);
        
        // Hide feedback
        this.feedbackText.setVisible(false);
        
        this.riddleModal.setVisible(true);
    }

    /**
     * Show riddle modal for a rule riddle
     */
    showRuleRiddle(riddle) {
        if (!riddle) {
            console.error('No rule riddle provided');
            return;
        }

        this.currentRiddle = riddle;
        this.currentGate = null; // No gate for rule riddles
        this.isVisible = true;
        
        // Update title and text
        this.titleText.setText('RULE RIDDLE');
        this.riddleText.setText(`${riddle.question}\n\n✨ Solve to change the world! ✨`);
        
        // Create answer buttons
        this.clearAnswerButtons();
        this.createAnswerButtons(riddle);
        
        // Hide feedback
        this.feedbackText.setVisible(false);
        
        this.riddleModal.setVisible(true);
    }

    /**
     * Show fallback riddle if none available
     */
    showFallbackRiddle(gate) {
        const pathName = gate.path ? gate.path.charAt(0).toUpperCase() + gate.path.slice(1) : '';
        this.riddleText.setText(`Gate ${gate.id.toUpperCase()}\n${pathName} Path\n\n[No riddle available]`);
        this.riddleModal.setVisible(true);
        this.isVisible = true;
    }

    /**
     * Create answer buttons dynamically
     */
    createAnswerButtons(riddle) {
        const modalX = this.scene.cameras.main.width / 2;
        const modalY = this.scene.cameras.main.height / 2;
        const buttonWidth = 200;
        const buttonHeight = 45;
        const buttonSpacing = 55;
        const startY = modalY + 40;
        
        // Shuffle answers for variety
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
            const buttonRect = this.scene.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x3498db);
            buttonRect.setStrokeStyle(2, 0x2980b9);
            buttonRect.setInteractive({ useHandCursor: true });
            this.riddleModal.add(buttonRect);
            
            // Create button text
            const buttonText = this.scene.add.text(buttonX, buttonY, answer, {
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

    /**
     * Clear existing answer buttons
     */
    clearAnswerButtons() {
        this.answerButtons.forEach(button => {
            if (button.rect) button.rect.destroy();
            if (button.text) button.text.destroy();
        });
        this.answerButtons = [];
        this.answerMapping = null;
    }

    /**
     * Handle answer button click
     */
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
            
            // Different feedback for rule riddles vs barrier riddles
            if (this.currentRiddle.type === 'rule') {
                this.feedbackText.setText('✨ Rule Activated! ✨');
            } else {
                this.feedbackText.setText('Correct! Gate opens...');
            }
            
            this.feedbackText.setColor('#2ecc71');
            this.feedbackText.setVisible(true);
            
            // Close modal and apply effects after delay
            this.scene.time.delayedCall(1000, () => {
                this.handleCorrectAnswer();
            });
        } else {
            // Wrong answer
            buttonInfo.rect.setFillStyle(0xe74c3c);
            buttonInfo.rect.setStrokeStyle(2, 0xc0392b);
            this.feedbackText.setText('Wrong answer! Try again.');
            this.feedbackText.setColor('#e74c3c');
            this.feedbackText.setVisible(true);
            
            // Re-enable buttons after delay
            this.scene.time.delayedCall(1500, () => {
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

    /**
     * Handle correct answer - open gate or activate rule
     */
    handleCorrectAnswer() {
        // Safety check - riddle might be null if modal was closed early
        if (!this.currentRiddle) {
            console.warn('handleCorrectAnswer called but currentRiddle is null');
            this.hide();
            return;
        }
        
        if (this.currentRiddle.type === 'rule' && this.currentRiddle.ruleEffect) {
            // Activate rule through RuleManager
            this.ruleManager.activateRule(this.currentRiddle.ruleEffect, this.scene);
            console.log(`Activated rule: ${this.currentRiddle.ruleEffect}`);
        } else if (this.currentGate) {
            // Open gate
            this.currentGate.isOpen = true;
            this.currentGate.setAlpha(0.3);
            if (this.currentGate.label) {
                this.currentGate.label.setAlpha(0.3);
            }
        }
        
        this.hide();
    }

    /**
     * Hide the riddle modal
     */
    hide() {
        this.riddleModal.setVisible(false);
        this.isVisible = false;
        this.currentRiddle = null;
        this.currentGate = null;
        this.answerMapping = null;
    }

    /**
     * Check if modal is currently visible
     */
    isModalVisible() {
        return this.isVisible;
    }

    /**
     * Destroy the UI
     */
    destroy() {
        if (this.riddleModal) {
            this.riddleModal.destroy();
        }
    }
}

