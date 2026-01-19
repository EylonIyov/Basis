export class IntroVideo extends Phaser.Scene {
    constructor() {
        super('IntroVideo');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Ensure screen starts black
        this.cameras.main.setBackgroundColor('#000000');
        
        // Add video
        const video = this.add.video(width / 2, height / 2, 'starting_video');
        
        // Scale video to fit screen while maintaining aspect ratio
        const scaleX = width / video.width;
        const scaleY = height / video.height;
        const scale = Math.min(scaleX, scaleY);
        video.setScale(scale);
        
        // Play video
        video.play();

        // Play intro music when video starts playing
        this.bgm = this.sound.add('bgm_intro', { volume: 0.5 });
        video.on('play', () => {
            if (!this.bgm.isPlaying) {
                this.bgm.play();
            }
        });
        
        // Handle video completion
        video.on('complete', () => {
            this.finishIntro();
        });

        // Optional: Allow skipping with Space or Enter
        this.input.keyboard.on('keydown-SPACE', () => this.finishIntro());
        this.input.keyboard.on('keydown-ENTER', () => this.finishIntro());

        // Prevent multiple calls to finishIntro
        this.isFinishing = false;
    }

    finishIntro() {
        if (this.isFinishing) return;
        this.isFinishing = true;

        // Stop music
        if (this.bgm) {
            this.bgm.stop();
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game');
        });
    }
}
