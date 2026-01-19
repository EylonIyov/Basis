export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Fallback solid background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1A1A2E);

        // Try to display background image if loaded
        if (this.textures.exists('main_menu_bg')) {
            const bg = this.add.image(width / 2, height / 2, 'main_menu_bg');
            bg.setDisplaySize(width, height);
        } else {
            console.log('[MainMenu] main_menu_bg texture not available');
        }

        // Debug label to confirm MainMenu loaded
        this.add.text(10, 10, 'MainMenu loaded', { fontSize: '14px', fontFamily: 'monospace', color: '#FFFFFF' }).setDepth(2000);

        // Create "START GAME" button container
        const buttonWidth = 300;
        const buttonHeight = 80;
        const buttonX = width / 2;
        const buttonY = height / 2 + 50;

        const buttonContainer = this.add.container(buttonX, buttonY);

        // Button background
        const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x2ecc71)
            .setStrokeStyle(4, 0x27ae60)
            .setInteractive({ useHandCursor: true });

        // Button text
        const buttonText = this.add.text(0, 0, 'START GAME', {
            fontSize: '32px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        buttonContainer.add([buttonBg, buttonText]);

        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x27ae60);
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power1'
            });
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x2ecc71);
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power1'
            });
        });

        // Click handler
        buttonBg.on('pointerdown', () => {
            // Animate press
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    this.startGame();
                }
            });
        });
        
        // Add Title Text (optional, if not in image)
        // this.add.text(width / 2, height / 2 - 150, 'BASIS', {
        //     fontSize: '84px',
        //     fontFamily: 'monospace',
        //     fontStyle: 'bold',
        //     color: '#ffffff',
        //     stroke: '#2c3e50',
        //     strokeThickness: 8
        // }).setOrigin(0.5);
    }

    startGame() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('IntroVideo');
        });
    }
}
