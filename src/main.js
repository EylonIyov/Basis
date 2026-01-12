import { Game } from './scenes/Game.js';

const config = {
    type: Phaser.AUTO,
    title: 'Babi is Hungry',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#2c3e50',
    pixelArt: false,
    scene: [
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            