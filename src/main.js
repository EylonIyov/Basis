import { Game } from './scenes/Game.js';

const config = {
    type: Phaser.AUTO,
    title: 'Basis',
    description: 'A puzzle-adventure where rules can change',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#2c3e50',
    pixelArt: true,
    scene: [
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            