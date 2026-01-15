/**
 * UIManager - Handles all UI elements including riddle modals and HUD
 * Decoupled from scene logic for better modularity
 */
export class UIManager {
    constructor(scene, riddleManager, ruleManager) {
        this.scene = scene;
        this.riddleManager = riddleManager;
        this.ruleManager = ruleManager;
        
        // UI state
        this.isModalOpen = false;
        this.isPaused = false;
        this.currentGate = null;
        this.currentRiddle = null;
        
        // UI elements
        this.modalContainer = null;
        this.pauseContainer = null;
        this.hudContainer = null;
        this.answerButtons = [];
        this.answerMapping = [];
        
        // Callbacks
        this.onGateOpened = null;
        this.onRuleApplied = null;
        this.onRestart = null;
        
        this.createUI();
    }

    /**
     * Create all UI elements
     */
    createUI() {
        this.createRiddleModal();
        this.createHUD();
        this.createRuleEffectDisplay();
        this.createPauseModal();
    }

    /**
     * Create the riddle modal (initially hidden)
     */
    createRiddleModal() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.modalContainer = this.scene.add.container(0, 0);
        this.modalContainer.setVisible(false);
        this.modalContainer.setDepth(100);

        // Dark overlay
        const overlay = this.scene.add.rectangle(
            width / 2, height / 2,
            width, height,
            0x000000, 0.8
        );
        overlay.setInteractive(); // Block clicks through overlay
        this.modalContainer.add(overlay);

        // Modal box
        const modalWidth = 520;
        const modalHeight = 420;
        const modalX = width / 2;
        const modalY = height / 2;

        // Modal background with gradient effect
        const modalBg = this.scene.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x1A1A2E);
        modalBg.setStrokeStyle(3, 0xF1C40F);
        this.modalContainer.add(modalBg);

        // Inner border for style
        const innerBorder = this.scene.add.rectangle(modalX, modalY, modalWidth - 8, modalHeight - 8);
        innerBorder.setStrokeStyle(1, 0x34495E);
        this.modalContainer.add(innerBorder);

        // Title with question mark icon
        this.modalTitle = this.scene.add.text(modalX, modalY - 170, '? RIDDLE ?', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.modalContainer.add(this.modalTitle);

        // Riddle text area
        this.riddleText = this.scene.add.text(modalX, modalY - 80, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ECF0F1',
            align: 'center',
            wordWrap: { width: modalWidth - 60 },
            lineSpacing: 8
        }).setOrigin(0.5);
        this.modalContainer.add(this.riddleText);

        // Feedback text
        this.feedbackText = this.scene.add.text(modalX, modalY + 170, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#2ECC71',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.feedbackText.setVisible(false);
        this.modalContainer.add(this.feedbackText);

        // Close hint
        this.closeHint = this.scene.add.text(modalX, modalY + 195, 'Press ESC to close', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#7F8C8D'
        }).setOrigin(0.5);
        this.modalContainer.add(this.closeHint);
    }

    /**
     * Create HUD elements (level info, active rules)
     */
    createHUD() {
        const width = this.scene.cameras.main.width;
        
        this.hudContainer = this.scene.add.container(10, 10);
        this.hudContainer.setDepth(50);
        this.hudContainer.setScrollFactor(0); // Fixed position

        // Level name
        this.levelText = this.scene.add.text(0, 0, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        });
        this.hudContainer.add(this.levelText);

        // Active rules display (initially empty)
        this.activeRulesText = this.scene.add.text(0, 24, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#3498DB'
        });
        this.hudContainer.add(this.activeRulesText);

        // Pause button (top right)
        const pauseBtn = this.scene.add.rectangle(width - 50, 15, 70, 30, 0x34495E);
        pauseBtn.setStrokeStyle(2, 0xF1C40F);
        pauseBtn.setInteractive({ useHandCursor: true });
        pauseBtn.setScrollFactor(0);
        pauseBtn.setDepth(50);

        const pauseText = this.scene.add.text(width - 50, 15, 'PAUSE', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        pauseText.setScrollFactor(0);
        pauseText.setDepth(51);

        // Hover effects
        pauseBtn.on('pointerover', () => {
            pauseBtn.setFillStyle(0x4A6278);
        });
        pauseBtn.on('pointerout', () => {
            pauseBtn.setFillStyle(0x34495E);
        });

        // Click handler
        pauseBtn.on('pointerdown', () => {
            this.showPauseMenu();
        });

        this.pauseButton = pauseBtn;
        this.pauseButtonText = pauseText;

        // ESC key also opens pause menu
        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (!this.isModalOpen && !this.isPaused) {
                this.showPauseMenu();
            } else if (this.isPaused) {
                this.hidePauseMenu();
            }
        });
    }

    /**
     * Create rule effect display (center screen notification)
     */
    createRuleEffectDisplay() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.ruleEffectContainer = this.scene.add.container(width / 2, height / 2 - 100);
        this.ruleEffectContainer.setDepth(90);
        this.ruleEffectContainer.setAlpha(0);

        // Effect background
        const effectBg = this.scene.add.rectangle(0, 0, 400, 60, 0x9B59B6, 0.9);
        effectBg.setStrokeStyle(2, 0x8E44AD);
        this.ruleEffectContainer.add(effectBg);

        // Effect text
        this.ruleEffectText = this.scene.add.text(0, 0, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.ruleEffectContainer.add(this.ruleEffectText);
    }

    /**
     * Create the pause modal (initially hidden)
     */
    createPauseModal() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.pauseContainer = this.scene.add.container(0, 0);
        this.pauseContainer.setVisible(false);
        this.pauseContainer.setDepth(150);

        // Dark overlay
        const overlay = this.scene.add.rectangle(
            width / 2, height / 2,
            width, height,
            0x000000, 0.85
        );
        overlay.setInteractive(); // Block clicks through
        this.pauseContainer.add(overlay);

        // Modal box
        const modalWidth = 320;
        const modalHeight = 280;
        const modalX = width / 2;
        const modalY = height / 2;

        const modalBg = this.scene.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x1A1A2E);
        modalBg.setStrokeStyle(3, 0xF1C40F);
        this.pauseContainer.add(modalBg);

        // Title
        const title = this.scene.add.text(modalX, modalY - 90, 'PAUSED', {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.pauseContainer.add(title);

        // Continue button
        const continueBtn = this.scene.add.rectangle(modalX, modalY - 10, 200, 50, 0x2ECC71);
        continueBtn.setStrokeStyle(2, 0x27AE60);
        continueBtn.setInteractive({ useHandCursor: true });
        this.pauseContainer.add(continueBtn);

        const continueText = this.scene.add.text(modalX, modalY - 10, 'CONTINUE', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.pauseContainer.add(continueText);

        // Continue button hover effects
        continueBtn.on('pointerover', () => {
            continueBtn.setFillStyle(0x27AE60);
            continueBtn.setScale(1.05);
            continueText.setScale(1.05);
        });
        continueBtn.on('pointerout', () => {
            continueBtn.setFillStyle(0x2ECC71);
            continueBtn.setScale(1);
            continueText.setScale(1);
        });
        continueBtn.on('pointerdown', () => {
            this.hidePauseMenu();
        });

        // Restart button
        const restartBtn = this.scene.add.rectangle(modalX, modalY + 60, 200, 50, 0xE74C3C);
        restartBtn.setStrokeStyle(2, 0xC0392B);
        restartBtn.setInteractive({ useHandCursor: true });
        this.pauseContainer.add(restartBtn);

        const restartText = this.scene.add.text(modalX, modalY + 60, 'RESTART', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.pauseContainer.add(restartText);

        // Restart button hover effects
        restartBtn.on('pointerover', () => {
            restartBtn.setFillStyle(0xC0392B);
            restartBtn.setScale(1.05);
            restartText.setScale(1.05);
        });
        restartBtn.on('pointerout', () => {
            restartBtn.setFillStyle(0xE74C3C);
            restartBtn.setScale(1);
            restartText.setScale(1);
        });
        restartBtn.on('pointerdown', () => {
            this.hidePauseMenu();
            if (this.onRestart) {
                this.onRestart();
            }
        });

        // Hint text
        const hintText = this.scene.add.text(modalX, modalY + 120, 'Press ESC to continue', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#7F8C8D'
        }).setOrigin(0.5);
        this.pauseContainer.add(hintText);
    }

    /**
     * Show the pause menu
     */
    showPauseMenu() {
        if (this.isModalOpen) return; // Don't pause if riddle is open
        
        this.isPaused = true;
        this.pauseContainer.setVisible(true);
        this.pauseContainer.setAlpha(0);

        // Animate in
        this.scene.tweens.add({
            targets: this.pauseContainer,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
        });
    }

    /**
     * Hide the pause menu
     */
    hidePauseMenu() {
        // Animate out - keep isPaused true until animation completes
        this.scene.tweens.add({
            targets: this.pauseContainer,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                this.pauseContainer.setVisible(false);
                
                // Small delay before re-enabling input to prevent accidental key capture
                this.scene.time.delayedCall(50, () => {
                    this.isPaused = false;
                });
            }
        });
    }

    /**
     * Show riddle modal for a gate
     */
    showRiddle(gate) {
        if (!gate) return;
        
        this.currentGate = gate;
        this.isModalOpen = true;

        // Use already-set riddle if available (set by Game.handleGateCollision for rule gates)
        // Otherwise fall back to a random riddle
        const riddle = this.currentRiddle || this.riddleManager.getRandomRiddle();
        
        if (!riddle) {
            console.error('[UIManager] No riddle available');
            this.riddleText.setText('No riddle available!');
            this.modalContainer.setVisible(true);
            return;
        }

        this.currentRiddle = riddle;

        // Update modal title based on riddle type
        if (riddle.type === 'rule') {
            this.modalTitle.setText('⚡ RULE RIDDLE ⚡');
            this.modalTitle.setColor('#9B59B6');
        } else {
            this.modalTitle.setText('? RIDDLE ?');
            this.modalTitle.setColor('#F1C40F');
        }

        // Set riddle text
        this.riddleText.setText(riddle.question);

        // Clear previous answer buttons
        this.clearAnswerButtons();

        // Create new answer buttons
        this.createAnswerButtons(riddle);

        // Hide feedback
        this.feedbackText.setVisible(false);

        // Show modal with animation
        this.modalContainer.setVisible(true);
        this.modalContainer.setAlpha(0);
        this.scene.tweens.add({
            targets: this.modalContainer,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });

        // Setup ESC key to close
        this.escKey = this.scene.input.keyboard.addKey('ESC');
        this.escKey.once('down', () => this.hideModal(false));
    }

    /**
     * Clear existing answer buttons
     */
    clearAnswerButtons() {
        this.answerButtons.forEach(btn => {
            if (btn.rect) btn.rect.destroy();
            if (btn.text) btn.text.destroy();
        });
        this.answerButtons = [];
        this.answerMapping = [];
    }

    /**
     * Create answer buttons for a riddle
     */
    createAnswerButtons(riddle) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const modalX = width / 2;
        const modalY = height / 2;

        const buttonWidth = 200;
        const buttonHeight = 45;
        const startY = modalY + 30;

        // Shuffle answers
        const shuffledAnswers = [...riddle.answers];
        const correctAnswer = riddle.answers[riddle.correctAnswer];

        for (let i = shuffledAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
        }

        const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);

        // Store mapping
        this.answerMapping = shuffledAnswers.map((answer, index) => ({
            answer,
            isCorrect: index === newCorrectIndex
        }));

        // Create buttons in 2x2 grid
        const maxAnswers = Math.min(shuffledAnswers.length, 4);
        
        shuffledAnswers.slice(0, maxAnswers).forEach((answer, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            
            const buttonX = modalX + (col - 0.5) * (buttonWidth + 15);
            const buttonY = startY + row * 55;

            // Button rectangle
            const buttonRect = this.scene.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x3498DB);
            buttonRect.setStrokeStyle(2, 0x2980B9);
            buttonRect.setInteractive({ useHandCursor: true });
            this.modalContainer.add(buttonRect);

            // Button text
            const buttonText = this.scene.add.text(buttonX, buttonY, answer, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#FFFFFF',
                align: 'center',
                wordWrap: { width: buttonWidth - 20 }
            }).setOrigin(0.5);
            this.modalContainer.add(buttonText);

            // Hover effects
            buttonRect.on('pointerover', () => {
                buttonRect.setFillStyle(0x2980B9);
                buttonRect.setScale(1.02);
            });

            buttonRect.on('pointerout', () => {
                buttonRect.setFillStyle(0x3498DB);
                buttonRect.setScale(1);
            });

            const buttonInfo = {
                rect: buttonRect,
                text: buttonText,
                isCorrect: this.answerMapping[index].isCorrect
            };

            this.answerButtons.push(buttonInfo);

            // Click handler
            buttonRect.on('pointerdown', () => this.handleAnswerClick(buttonInfo));
        });
    }

    /**
     * Handle answer button click
     */
    handleAnswerClick(buttonInfo) {
        // Disable all buttons
        this.answerButtons.forEach(btn => {
            btn.rect.disableInteractive();
            btn.rect.setAlpha(0.6);
        });

        if (buttonInfo.isCorrect) {
            // Correct answer
            buttonInfo.rect.setFillStyle(0x2ECC71);
            buttonInfo.rect.setStrokeStyle(2, 0x27AE60);
            buttonInfo.rect.setAlpha(1);
            
            this.feedbackText.setText('✓ Correct!');
            this.feedbackText.setColor('#2ECC71');
            this.feedbackText.setVisible(true);

            // Check if this is a rule riddle
            if (this.currentRiddle.type === 'rule' && this.currentRiddle.effect) {
                this.scene.time.delayedCall(500, () => {
                    this.applyRuleEffect(this.currentRiddle.effect);
                });
            }

            // Close modal and open gate
            this.scene.time.delayedCall(1000, () => {
                this.hideModal(true);
            });

        } else {
            // Wrong answer
            buttonInfo.rect.setFillStyle(0xE74C3C);
            buttonInfo.rect.setStrokeStyle(2, 0xC0392B);
            buttonInfo.rect.setAlpha(1);

            this.feedbackText.setText('✗ Try again!');
            this.feedbackText.setColor('#E74C3C');
            this.feedbackText.setVisible(true);

            // Re-enable buttons after delay
            this.scene.time.delayedCall(1200, () => {
                this.answerButtons.forEach(btn => {
                    btn.rect.setInteractive({ useHandCursor: true });
                    btn.rect.setAlpha(1);
                    if (!btn.isCorrect) {
                        btn.rect.setFillStyle(0x3498DB);
                        btn.rect.setStrokeStyle(2, 0x2980B9);
                    }
                });
                this.feedbackText.setVisible(false);
            });
        }
    }

    /**
     * Apply a rule effect from a rule riddle
     */
    applyRuleEffect(effect) {
        if (!this.ruleManager) return;

        this.ruleManager.applyRiddleEffect(effect);

        // Show rule effect notification
        this.showRuleEffectNotification(effect.description || this.ruleManager.getRuleDescription(effect.ruleId));

        if (this.onRuleApplied) {
            this.onRuleApplied(effect);
        }
    }

    /**
     * Show rule effect notification
     */
    showRuleEffectNotification(message) {
        this.ruleEffectText.setText(message);
        
        // Animate in
        this.scene.tweens.add({
            targets: this.ruleEffectContainer,
            alpha: 1,
            y: this.scene.cameras.main.height / 2 - 120,
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                // Animate out after delay
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: this.ruleEffectContainer,
                        alpha: 0,
                        y: this.scene.cameras.main.height / 2 - 80,
                        duration: 300,
                        ease: 'Power2'
                    });
                });
            }
        });
    }

    /**
     * Hide the riddle modal
     */
    hideModal(answeredCorrectly = false) {
        // Keep modal state as "open" until animation completes
        // This prevents input from being processed during the close animation
        
        // Clean up ESC key listener if it exists
        if (this.escKey) {
            this.escKey.removeAllListeners();
            this.escKey = null;
        }
        
        // Animate out
        this.scene.tweens.add({
            targets: this.modalContainer,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.modalContainer.setVisible(false);
                
                // Open gate if answered correctly
                if (answeredCorrectly && this.currentGate) {
                    this.openGate(this.currentGate);
                }

                this.currentGate = null;
                this.currentRiddle = null;
                
                // Small delay before re-enabling input to prevent accidental key capture
                this.scene.time.delayedCall(50, () => {
                    this.isModalOpen = false;
                });
            }
        });
    }

    /**
     * Open a gate with visual effect
     */
    openGate(gate) {
        gate.isOpen = true;

        // Visual effect
        if (gate.sprite) {
            this.scene.tweens.add({
                targets: gate.sprite,
                alpha: 0.3,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 500,
                ease: 'Power2'
            });
        }

        if (this.onGateOpened) {
            this.onGateOpened(gate);
        }
    }

    /**
     * Update HUD with level info
     */
    updateLevelInfo(levelName) {
        this.levelText.setText(levelName);
    }

    /**
     * Update active rules display
     */
    updateActiveRules() {
        if (!this.ruleManager) return;

        const activeRules = this.ruleManager.getActiveRules();
        
        if (activeRules.length === 0) {
            this.activeRulesText.setText('');
        } else {
            const ruleTexts = activeRules.map(rule => `• ${rule.id.replace(/_/g, ' ')}`);
            this.activeRulesText.setText('Active Rules:\n' + ruleTexts.join('\n'));
        }
    }

    /**
     * Show win screen
     */
    showWinScreen(levelName, hasNextLevel, isLastLevel = false, callbacks = {}) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const winContainer = this.scene.add.container(0, 0);
        winContainer.setDepth(200);

        // Overlay
        const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        winContainer.add(overlay);

        // Win text - special message for completing all levels
        const winMessage = isLastLevel ? '★ GAME COMPLETE! ★' : '★ LEVEL COMPLETE ★';
        const winText = this.scene.add.text(width / 2, height / 2 - 40, winMessage, {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        winContainer.add(winText);

        // Level name
        const levelText = this.scene.add.text(width / 2, height / 2 + 20, levelName, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#2ECC71'
        }).setOrigin(0.5);
        winContainer.add(levelText);

        // Instructions - different text for last level
        let instructions;
        if (isLastLevel) {
            instructions = 'Congratulations! Press R to play again from Level 1';
        } else if (hasNextLevel) {
            instructions = 'Press N for next level | Press R to restart';
        } else {
            instructions = 'Press R to restart';
        }

        const instructionText = this.scene.add.text(width / 2, height / 2 + 80, instructions, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ECF0F1'
        }).setOrigin(0.5);
        winContainer.add(instructionText);

        // Animate in
        winContainer.setAlpha(0);
        this.scene.tweens.add({
            targets: winContainer,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });

        // Re-enable keyboard for win screen input
        this.scene.input.keyboard.enabled = true;

        // Key handlers
        if (hasNextLevel) {
            this.scene.input.keyboard.once('keydown-N', () => {
                if (callbacks.onNextLevel) callbacks.onNextLevel();
            });
        }

        this.scene.input.keyboard.once('keydown-R', () => {
            if (callbacks.onRestart) callbacks.onRestart();
        });
    }

    /**
     * Check if modal is currently open (including pause menu)
     */
    isOpen() {
        return this.isModalOpen || this.isPaused;
    }

    /**
     * Destroy all UI elements
     */
    destroy() {
        if (this.modalContainer) this.modalContainer.destroy();
        if (this.pauseContainer) this.pauseContainer.destroy();
        if (this.hudContainer) this.hudContainer.destroy();
        if (this.ruleEffectContainer) this.ruleEffectContainer.destroy();
        if (this.pauseButton) this.pauseButton.destroy();
        if (this.pauseButtonText) this.pauseButtonText.destroy();
    }
}

