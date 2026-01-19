import { Boot } from './scenes/Boot.js';
import { MainMenu } from './scenes/MainMenu.js';
import { IntroVideo } from './scenes/IntroVideo.js';
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
        IntroVideo,
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

// Global error overlay: show runtime errors on-screen for easier debugging
window.addEventListener('error', (e) => {
    try {
        const existing = document.getElementById('phaser-error-overlay');
        if (existing) return;
        const overlay = document.createElement('div');
        overlay.id = 'phaser-error-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = '10px';
        overlay.style.top = '10px';
        overlay.style.zIndex = '99999';
        overlay.style.maxWidth = '95%';
        overlay.style.padding = '10px';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.color = 'white';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '12px';
        overlay.style.border = '2px solid #ff4d4f';
        overlay.innerText = 'Runtime Error: ' + (e && e.message ? e.message : String(e));
        document.body.appendChild(overlay);
    } catch (err) {
        console.error('Failed to show error overlay', err);
    }
});
