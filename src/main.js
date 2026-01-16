import { Boot } from './scenes/Boot.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Game } from './scenes/Game.js';

const config = {
    type: Phaser.AUTO,
    title: 'Basis',
    description: 'A puzzle-adventure game about changing the rules.',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#2c3e50',
    pixelArt: true,
    transparent: false,
    antialias: false,
    scene: [
        Boot,
        MainMenu,
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false,
        roundPixels: true
    }
}

new Phaser.Game(config);
