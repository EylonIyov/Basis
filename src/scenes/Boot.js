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
        this.load.video('starting_video', 'assets/starting_video.mp4', true);
        this.load.video('bg_video_level1', 'assets/level1Background.mp4', true);
        this.load.video('bg_video_level2', 'assets/level2Background.mp4', true);
        this.load.video('bg_video_level3', 'assets/Level3Background.mp4', true);
        this.load.video('transition_l1_l2', 'assets/transitionLevel1Level2.mp4', true);
        this.load.video('level1_evil_friend', 'assets/level1EvilFriend.mp4', true);
        this.load.video('transition_l2_l3', 'assets/transitionLevel2Level3.mp4', true);
        this.load.video('level2_friend_dance', 'assets/Level2FriendDance.mp4', true);

        // Load player animation assets
        this.load.image('player_idle', 'assets/idle.png');
        this.load.image('player_moving1', 'assets/moving1.png');
        this.load.image('player_moving2', 'assets/moving2.png');
        this.load.image('player_moving4', 'assets/moving4.png');
        this.load.image('player_moving5', 'assets/moving5.png');

        // Load Friend assets for each level
        this.load.image('friend_level1', 'assets/Level1Friend.png');
        this.load.image('friend_level2', 'assets/Level2Friend.png');
        this.load.image('friend_level3', 'assets/Level3Friend.png');

        // Load Main Menu background
        this.load.image('main_menu_bg', 'assets/MainMenu.png');

        // Load special wall textures
        this.load.image('wall_ladder', 'assets/ladder.png');
        this.load.image('gate_closed', 'assets/gate/gate_closed.png');
        this.load.image('gate_open1', 'assets/gate/gate_open1.png');
        this.load.image('gate_open2', 'assets/gate/gate_open2.png');
        this.load.image('gate_open3', 'assets/gate/gate_open3.png');
        this.load.image('gate_open4', 'assets/gate/gate_open4.png');
        this.load.image('gate_open5', 'assets/gate/gate_open5.png');

        // Load background music
        this.load.audio('bgm_main_menu', 'assets/Green Pixel Plains.mp3');
        this.load.audio('bgm_intro', 'assets/Wake_upBabi.mp3');
        this.load.audio('sfx_evil_friend', 'assets/evil_friend_voice.mp3');
        this.load.audio('sfx_friend_voice', 'assets/Level2FriendVoice.mp3');
        this.load.audio('bgm_level1', 'assets/Level1BGM.mp3');
        this.load.audio('bgm_level2', 'assets/Level2BGM.mp3');
        this.load.audio('bgm_level3', 'assets/Level3BGM.mp3');

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
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        // Create player animations
        this.createPlayerAnimations();
        this.createGateAnimations();

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
                                            // Debug: show that Boot completed and is about to start MainMenu
                                            const dbg = this.add.text(width / 2, height / 2 + 140, 'Boot complete - starting MainMenu...', {
                                                fontSize: '14px',
                                                fontFamily: 'monospace',
                                                color: '#ffffff'
                                            }).setOrigin(0.5);
                                            this.time.delayedCall(400, () => {
                                                dbg.destroy();
                                                this.startGame();
                                            });
                        });
                    });
                });
            });
        });
    }

    createGateAnimations() {
        this.anims.create({
            key: 'gate_open_anim',
            frames: [
                { key: 'gate_open1' },
                { key: 'gate_open2' },
                { key: 'gate_open3' },
                { key: 'gate_open4' },
                { key: 'gate_open5' }
            ],
            frameRate: 10,
            repeat: 0
        });
    }

    createPlayerAnimations() {
        // Create idle animation
        this.anims.create({
            key: 'player_idle',
            frames: [{ key: 'player_idle' }],
            frameRate: 1,
            repeat: -1
        });

        // Create movement animation using moving1-2,4-5
        this.anims.create({
            key: 'player_move',
            frames: [
                { key: 'player_moving1' },
                { key: 'player_moving2' },
                { key: 'player_moving4' },
                { key: 'player_moving5' },
                { key: 'player_moving5' }
            ],
            frameRate: 10,
            repeat: -1
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
            this.scene.start('MainMenu');
        });
    }
}
