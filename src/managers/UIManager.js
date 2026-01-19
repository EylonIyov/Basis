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
        this.pendingRuleEffect = null;  // Store effect to apply after modal closes
        
        // Life system
        this.maxLives = 3;
        this.currentLives = 3;
        
        // Timer system
        this.maxTime = 60; // 60 seconds
        this.currentTime = 60;
        this.timerEvent = null;
        this.timerRunning = false;
        
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
        this.hudContainer.setDepth(1000);
        this.hudContainer.setScrollFactor(0); // Fixed position

        // Level name
        this.levelText = this.scene.add.text(0, 0, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        });
        this.hudContainer.add(this.levelText);

        // Lives display
        this.livesText = this.scene.add.text(0, 24, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#E74C3C',
            fontStyle: 'bold'
        });
        this.hudContainer.add(this.livesText);
        this.updateLivesDisplay();

        // Timer display
        this.timerText = this.scene.add.text(0, 48, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#3498DB',
            fontStyle: 'bold'
        });
        this.hudContainer.add(this.timerText);
        this.updateTimerDisplay();

        // Active rules display (initially empty)
        this.activeRulesText = this.scene.add.text(0, 72, '', {
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
     * Lose a life
     */
    loseLife() {
        this.currentLives = Math.max(0, this.currentLives - 1);
        this.updateLivesDisplay();
        
        // Flash animation on lives text
        this.scene.tweens.add({
            targets: this.livesText,
            scale: 1.3,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    /**
     * Update lives display
     */
    updateLivesDisplay() {
        const hearts = '♥'.repeat(this.currentLives) + '♡'.repeat(this.maxLives - this.currentLives);
        this.livesText.setText(`Lives: ${hearts}`);
        
        // Change color based on remaining lives
        if (this.currentLives <= 1) {
            this.livesText.setColor('#E74C3C'); // Red
        } else if (this.currentLives <= 2) {
            this.livesText.setColor('#E67E22'); // Orange
        } else {
            this.livesText.setColor('#2ECC71'); // Green
        }
    }

    /**
     * Reset lives to maximum
     */
    resetLives() {
        this.currentLives = this.maxLives;
        this.updateLivesDisplay();
    }

    /**
     * Start the level timer
     */
    startTimer() {
        this.currentTime = this.maxTime;
        this.timerRunning = true;
        this.updateTimerDisplay();
        
        // Create timer event that triggers every second
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Update timer countdown
     */
    updateTimer() {
        if (!this.timerRunning) return;
        
        this.currentTime--;
        this.updateTimerDisplay();
        
        // Check if time's up
        if (this.currentTime <= 0) {
            this.stopTimer();
            this.showTimesUpModal();
        }
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        this.timerRunning = false;
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText(`Time: ${timeString}`);
        
        // Change color based on remaining time
        if (this.currentTime <= 10) {
            this.timerText.setColor('#E74C3C'); // Red
            // Flash effect when low on time
            if (this.currentTime <= 10 && this.currentTime > 0) {
                this.scene.tweens.add({
                    targets: this.timerText,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        } else if (this.currentTime <= 20) {
            this.timerText.setColor('#E67E22'); // Orange
        } else {
            this.timerText.setColor('#3498DB'); // Blue
        }
    }

    /**
     * Reset timer to maximum
     */
    resetTimer() {
        this.stopTimer();
        this.currentTime = this.maxTime;
        this.updateTimerDisplay();
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
     * Create game over modal (initially not created, created on demand)
     */
    createGameOverModal() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.gameOverContainer = this.scene.add.container(0, 0);
        this.gameOverContainer.setVisible(false);
        this.gameOverContainer.setDepth(200);

        // Dark overlay
        const overlay = this.scene.add.rectangle(
            width / 2, height / 2,
            width, height,
            0x000000, 0.9
        );
        overlay.setInteractive(); // Block clicks through
        this.gameOverContainer.add(overlay);

        // Modal box
        const modalWidth = 360;
        const modalHeight = 320;
        const modalX = width / 2;
        const modalY = height / 2;

        const modalBg = this.scene.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x1A1A2E);
        modalBg.setStrokeStyle(3, 0xE74C3C);
        this.gameOverContainer.add(modalBg);

        // Title
        const title = this.scene.add.text(modalX, modalY - 100, 'GAME OVER', {
            fontSize: '42px',
            fontFamily: 'monospace',
            color: '#E74C3C',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(title);

        // Subtitle
        const subtitle = this.scene.add.text(modalX, modalY - 50, 'You ran out of lives!', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ECF0F1'
        }).setOrigin(0.5);
        this.gameOverContainer.add(subtitle);

        // Retry button
        const retryBtn = this.scene.add.rectangle(modalX, modalY + 20, 220, 50, 0xE67E22);
        retryBtn.setStrokeStyle(2, 0xD35400);
        retryBtn.setInteractive({ useHandCursor: true });
        this.gameOverContainer.add(retryBtn);

        const retryText = this.scene.add.text(modalX, modalY + 20, 'RETRY LEVEL', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(retryText);

        // Retry button hover effects
        retryBtn.on('pointerover', () => {
            retryBtn.setFillStyle(0xD35400);
            retryBtn.setScale(1.05);
            retryText.setScale(1.05);
        });
        retryBtn.on('pointerout', () => {
            retryBtn.setFillStyle(0xE67E22);
            retryBtn.setScale(1);
            retryText.setScale(1);
        });
        retryBtn.on('pointerdown', () => {
            this.hideGameOverModal();
            if (this.onRestart) {
                this.onRestart();
            }
        });

        // Main Menu button
        const menuBtn = this.scene.add.rectangle(modalX, modalY + 85, 220, 50, 0x34495E);
        menuBtn.setStrokeStyle(2, 0x2C3E50);
        menuBtn.setInteractive({ useHandCursor: true });
        this.gameOverContainer.add(menuBtn);

        const menuText = this.scene.add.text(modalX, modalY + 85, 'MAIN MENU', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverContainer.add(menuText);

        // Menu button hover effects
        menuBtn.on('pointerover', () => {
            menuBtn.setFillStyle(0x2C3E50);
            menuBtn.setScale(1.05);
            menuText.setScale(1.05);
        });
        menuBtn.on('pointerout', () => {
            menuBtn.setFillStyle(0x34495E);
            menuBtn.setScale(1);
            menuText.setScale(1);
        });
        menuBtn.on('pointerdown', () => {
            this.hideGameOverModal();
            this.scene.scene.start('Main');
        });
    }

    /**
     * Show the game over modal
     */
    showGameOverModal() {
        // Create modal if it doesn't exist
        if (!this.gameOverContainer) {
            this.createGameOverModal();
        }

        this.gameOverContainer.setVisible(true);
        this.gameOverContainer.setAlpha(0);

        // Animate in
        this.scene.tweens.add({
            targets: this.gameOverContainer,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    /**
     * Hide the game over modal
     */
    hideGameOverModal() {
        if (!this.gameOverContainer) return;

        this.scene.tweens.add({
            targets: this.gameOverContainer,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.gameOverContainer.setVisible(false);
            }
        });
    }

    /**
     * Create time's up modal (initially not created, created on demand)
     */
    createTimesUpModal() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.timesUpContainer = this.scene.add.container(0, 0);
        this.timesUpContainer.setVisible(false);
        this.timesUpContainer.setDepth(200);

        // Dark overlay
        const overlay = this.scene.add.rectangle(
            width / 2, height / 2,
            width, height,
            0x000000, 0.9
        );
        overlay.setInteractive(); // Block clicks through
        this.timesUpContainer.add(overlay);

        // Modal box
        const modalWidth = 360;
        const modalHeight = 320;
        const modalX = width / 2;
        const modalY = height / 2;

        const modalBg = this.scene.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x1A1A2E);
        modalBg.setStrokeStyle(3, 0xE67E22);
        this.timesUpContainer.add(modalBg);

        // Title
        const title = this.scene.add.text(modalX, modalY - 100, "TIME'S UP!", {
            fontSize: '42px',
            fontFamily: 'monospace',
            color: '#E67E22',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.timesUpContainer.add(title);

        // Subtitle
        const subtitle = this.scene.add.text(modalX, modalY - 50, 'You ran out of time!', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ECF0F1'
        }).setOrigin(0.5);
        this.timesUpContainer.add(subtitle);

        // Retry button
        const retryBtn = this.scene.add.rectangle(modalX, modalY + 20, 220, 50, 0x3498DB);
        retryBtn.setStrokeStyle(2, 0x2980B9);
        retryBtn.setInteractive({ useHandCursor: true });
        this.timesUpContainer.add(retryBtn);

        const retryText = this.scene.add.text(modalX, modalY + 20, 'RETRY LEVEL', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.timesUpContainer.add(retryText);

        // Retry button hover effects
        retryBtn.on('pointerover', () => {
            retryBtn.setFillStyle(0x2980B9);
            retryBtn.setScale(1.05);
            retryText.setScale(1.05);
        });
        retryBtn.on('pointerout', () => {
            retryBtn.setFillStyle(0x3498DB);
            retryBtn.setScale(1);
            retryText.setScale(1);
        });
        retryBtn.on('pointerdown', () => {
            this.hideTimesUpModal();
            if (this.onRestart) {
                this.onRestart();
            }
        });

        // Main Menu button
        const menuBtn = this.scene.add.rectangle(modalX, modalY + 85, 220, 50, 0x34495E);
        menuBtn.setStrokeStyle(2, 0x2C3E50);
        menuBtn.setInteractive({ useHandCursor: true });
        this.timesUpContainer.add(menuBtn);

        const menuText = this.scene.add.text(modalX, modalY + 85, 'MAIN MENU', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.timesUpContainer.add(menuText);

        // Menu button hover effects
        menuBtn.on('pointerover', () => {
            menuBtn.setFillStyle(0x2C3E50);
            menuBtn.setScale(1.05);
            menuText.setScale(1.05);
        });
        menuBtn.on('pointerout', () => {
            menuBtn.setFillStyle(0x34495E);
            menuBtn.setScale(1);
            menuText.setScale(1);
        });
        menuBtn.on('pointerdown', () => {
            this.hideTimesUpModal();
            this.scene.scene.start('Main');
        });
    }

    /**
     * Show the time's up modal
     */
    showTimesUpModal() {
        // Create modal if it doesn't exist
        if (!this.timesUpContainer) {
            this.createTimesUpModal();
        }

        this.timesUpContainer.setVisible(true);
        this.timesUpContainer.setAlpha(0);

        // Animate in
        this.scene.tweens.add({
            targets: this.timesUpContainer,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    /**
     * Hide the time's up modal
     */
    hideTimesUpModal() {
        if (!this.timesUpContainer) return;

        this.scene.tweens.add({
            targets: this.timesUpContainer,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.timesUpContainer.setVisible(false);
            }
        });
    }

    /**
     * Show the pause menu
     */
    showPauseMenu() {
        if (this.isModalOpen) return; // Don't pause if riddle is open
        
        this.isPaused = true;
        this.pauseContainer.setVisible(true);
        this.pauseContainer.setAlpha(0);
        
        // Pause the timer
        if (this.timerEvent) {
            this.timerEvent.paused = true;
        }

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
        // Resume the timer
        if (this.timerEvent) {
            this.timerEvent.paused = false;
        }
        
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
        
        // Pause the timer
        if (this.timerEvent) {
            this.timerEvent.paused = true;
        }

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
        if (riddle.type === 'choice') {
            this.modalTitle.setText('⚙ CHOOSE YOUR PATH ⚙');
            this.modalTitle.setColor('#E67E22');
        } else if (riddle.type === 'rule') {
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

        // For choice riddles, don't shuffle (each answer maps to a specific effect)
        const isChoiceRiddle = riddle.type === 'choice';
        
        let displayAnswers;
        let answerToOriginalIndex = {};
        
        if (isChoiceRiddle) {
            // Don't shuffle choice riddles - effects are tied to answer positions
            displayAnswers = [...riddle.answers];
            displayAnswers.forEach((answer, index) => {
                answerToOriginalIndex[answer] = index;
            });
        } else {
            // Shuffle regular riddles
            displayAnswers = [...riddle.answers];
            const correctAnswer = riddle.answers[riddle.correctAnswer];

            for (let i = displayAnswers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [displayAnswers[i], displayAnswers[j]] = [displayAnswers[j], displayAnswers[i]];
            }

            const newCorrectIndex = displayAnswers.indexOf(correctAnswer);

            // Store mapping for regular riddles
            this.answerMapping = displayAnswers.map((answer, index) => ({
                answer,
                isCorrect: index === newCorrectIndex
            }));
        }

        // Create buttons in 2x2 grid
        const maxAnswers = Math.min(displayAnswers.length, 4);
        
        // Different button colors for choice riddles
        const buttonColor = isChoiceRiddle ? 0xE67E22 : 0x3498DB;
        const buttonHoverColor = isChoiceRiddle ? 0xD35400 : 0x2980B9;
        const buttonStrokeColor = isChoiceRiddle ? 0xD35400 : 0x2980B9;
        
        displayAnswers.slice(0, maxAnswers).forEach((answer, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            
            const buttonX = modalX + (col - 0.5) * (buttonWidth + 15);
            const buttonY = startY + row * 55;

            // Button rectangle
            const buttonRect = this.scene.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, buttonColor);
            buttonRect.setStrokeStyle(2, buttonStrokeColor);
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
                buttonRect.setFillStyle(buttonHoverColor);
                buttonRect.setScale(1.02);
            });

            buttonRect.on('pointerout', () => {
                buttonRect.setFillStyle(buttonColor);
                buttonRect.setScale(1);
            });

            const buttonInfo = {
                rect: buttonRect,
                text: buttonText,
                isCorrect: isChoiceRiddle ? true : this.answerMapping[index].isCorrect,
                isChoiceRiddle: isChoiceRiddle,
                originalAnswerIndex: isChoiceRiddle ? answerToOriginalIndex[answer] : index,
                effect: isChoiceRiddle && riddle.effects ? riddle.effects[answerToOriginalIndex[answer]] : null
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

        // Handle choice riddles (all answers are valid, each triggers a different effect)
        if (buttonInfo.isChoiceRiddle) {
            // Highlight selected answer
            buttonInfo.rect.setFillStyle(0x27AE60);
            buttonInfo.rect.setStrokeStyle(2, 0x1E8449);
            buttonInfo.rect.setAlpha(1);
            
            this.feedbackText.setText('✓ Choice made!');
            this.feedbackText.setColor('#27AE60');
            this.feedbackText.setVisible(true);

            // Store the effect to apply AFTER modal closes (so user sees the animation)
            if (buttonInfo.effect) {
                this.pendingRuleEffect = buttonInfo.effect;
            }

            // Close modal and open gate
            this.scene.time.delayedCall(1000, () => {
                this.hideModal(true);
            });
            return;
        }

        // Handle regular riddles (barrier and rule types)
        if (buttonInfo.isCorrect) {
            // Correct answer
            buttonInfo.rect.setFillStyle(0x2ECC71);
            buttonInfo.rect.setStrokeStyle(2, 0x27AE60);
            buttonInfo.rect.setAlpha(1);
            
            this.feedbackText.setText('✓ Correct!');
            this.feedbackText.setColor('#2ECC71');
            this.feedbackText.setVisible(true);

            // Store rule effect to apply AFTER modal closes (so user sees the animation)
            if (this.currentRiddle.type === 'rule' && this.currentRiddle.effect) {
                this.pendingRuleEffect = this.currentRiddle.effect;
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

            // Highlight the correct answer
            const correctButton = this.answerButtons.find(btn => btn.isCorrect);
            if (correctButton) {
                correctButton.rect.setFillStyle(0x2ECC71);
                correctButton.rect.setStrokeStyle(2, 0x27AE60);
                correctButton.rect.setAlpha(1);
            }

            this.feedbackText.setText('✗ Wrong! Correct answer shown in green');
            this.feedbackText.setColor('#E74C3C');
            this.feedbackText.setVisible(true);

            // Lose a life
            this.loseLife();

            // Check if game over
            if (this.currentLives <= 0) {
                this.scene.time.delayedCall(2000, () => {
                    this.hideModal(false);
                    this.showGameOverModal();
                });
                return;
            }

            // Store rule effect to apply AFTER modal closes (if rule riddle)
            if (this.currentRiddle.type === 'rule' && this.currentRiddle.effect) {
                this.pendingRuleEffect = this.currentRiddle.effect;
            }

            // Treat as solved - close modal and open gate after showing correct answer
            this.scene.time.delayedCall(2500, () => {
                this.hideModal(true);
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
        
        // Resume the timer
        if (this.timerEvent) {
            this.timerEvent.paused = false;
        }
        
        // Clean up ESC key listener if it exists
        if (this.escKey) {
            this.escKey.removeAllListeners();
            this.escKey = null;
        }

        // Store pending effect before clearing state
        const effectToApply = this.pendingRuleEffect;
        this.pendingRuleEffect = null;
        
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

                // Apply rule effect AFTER modal is fully closed (so user sees the animation)
                if (effectToApply) {
                    this.scene.time.delayedCall(100, () => {
                        this.applyRuleEffect(effectToApply);
                    });
                }
            }
        });
    }

    /**
     * Open a gate with visual effect
     */
    openGate(gate) {
        if (gate.isOpen) return;
        gate.isOpen = true;

        // Visual effect
        if (gate.sprite && gate.sprite.play) {
            // Play animation
            gate.sprite.play('gate_open_anim');
            gate.sprite.setAlpha(1); // Ensure opaque
            
            // Fade out label if it exists
            if (gate.label) {
                this.scene.tweens.add({
                    targets: gate.label,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2'
                });
            }
        } else if (gate.sprite) {
            // Fallback for non-animated sprites
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

        // Add celebration animation to win text
        this.scene.tweens.add({
            targets: winText,
            scale: 1.2,
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: 'Back.out'
        });

        // Level name
        const levelText = this.scene.add.text(width / 2, height / 2 + 20, levelName, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#2ECC71'
        }).setOrigin(0.5);
        winContainer.add(levelText);

        // Instructions - auto-continue message
        const instructionText = this.scene.add.text(width / 2, height / 2 + 80, 'Continuing in 3 seconds...', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ECF0F1'
        }).setOrigin(0.5);
        winContainer.add(instructionText);

        // Add countdown animation
        let countdown = 3;
        const countdownInterval = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    instructionText.setText(`Continuing in ${countdown} seconds...`);
                }
            },
            repeat: 2
        });

        // Animate in
        winContainer.setAlpha(0);
        this.scene.tweens.add({
            targets: winContainer,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });

        // Auto-transition after 3 seconds
        const autoTransitionTimer = this.scene.time.delayedCall(3000, () => {
            // Animate out
            this.scene.tweens.add({
                targets: winContainer,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    winContainer.destroy();
                    
                    // Proceed to next level or show appropriate screen
                    if (isLastLevel) {
                        // Game complete - go back to main menu
                        if (callbacks.onRestart) callbacks.onRestart();
                    } else if (hasNextLevel) {
                        // Go to next level
                        if (callbacks.onNextLevel) callbacks.onNextLevel();
                    } else {
                        // Restart current level
                        if (callbacks.onRestart) callbacks.onRestart();
                    }
                }
            });
        });

        // Re-enable keyboard for win screen input (optional, for manual override)
        this.scene.input.keyboard.enabled = true;

        // Allow manual continuation with N or R keys
        if (hasNextLevel) {
            this.scene.input.keyboard.once('keydown-N', () => {
                countdownInterval.remove();
                autoTransitionTimer.remove();
                winContainer.destroy();
                if (callbacks.onNextLevel) callbacks.onNextLevel();
            });
        }

        this.scene.input.keyboard.once('keydown-R', () => {
            countdownInterval.remove();
            autoTransitionTimer.remove();
            winContainer.destroy();
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

