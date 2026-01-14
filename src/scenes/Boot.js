/**
 * Boot Scene - Initializes game assets and transitions to Game scene
 * Generates placeholder sprites using AssetGenerator
 */
import { AssetGenerator } from '../utils/AssetGenerator.js';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load video assets
        this.load.video('bg_video_level1', 'assets/background video.mp4', true);
        this.load.video('bg_video_level2', 'assets/video level 2.mp4', true);

        // Display loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Loading background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1A1A2E);

        // Title
        this.add.text(width / 2, height / 2 - 80, 'BASIS', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#F1C40F',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 - 20, 'A Puzzle Adventure', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ECF0F1'
        }).setOrigin(0.5);

        // Loading text
        this.loadingText = this.add.text(width / 2, height / 2 + 60, 'Generating Assets...', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#3498DB'
        }).setOrigin(0.5);

        // Progress bar background
        this.progressBarBg = this.add.rectangle(width / 2, height / 2 + 100, 300, 20, 0x34495E);
        this.progressBarBg.setStrokeStyle(2, 0x2C3E50);

        // Progress bar fill
        this.progressBar = this.add.rectangle(width / 2 - 148, height / 2 + 100, 0, 16, 0x2ECC71);
        this.progressBar.setOrigin(0, 0.5);
    }

    create() {
        // Generate all game assets
        const assetGenerator = new AssetGenerator(this);
        
        // Simulate loading progress
        this.updateProgress(0.2, 'Generating Player...');
        
        this.time.delayedCall(100, () => {
            assetGenerator.generatePlayerSprites();
            this.updateProgress(0.4, 'Generating Friend...');
            
            this.time.delayedCall(100, () => {
                assetGenerator.generateFriendSprite();
                this.updateProgress(0.6, 'Generating Tiles...');
                
                this.time.delayedCall(100, () => {
                    assetGenerator.generateTileSprites();
                    assetGenerator.generatePushableSprite();
                    this.updateProgress(0.8, 'Generating Backgrounds...');
                    
                    this.time.delayedCall(100, () => {
                        assetGenerator.generateBackgrounds();
                        this.updateProgress(1.0, 'Ready!');
                        
                        // Transition to game after a short delay
                        this.time.delayedCall(500, () => {
                            this.startGame();
                        });
                    });
                });
            });
        });
    }

    updateProgress(progress, text) {
        this.progressBar.width = 296 * progress;
        this.loadingText.setText(text);
    }

    startGame() {
        // Add a fade transition
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game');
        });
    }
}
