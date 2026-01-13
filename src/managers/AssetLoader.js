/**
 * AssetLoader - Centralized asset management and preloading
 * Handles sprite sheets, backgrounds, and UI elements
 */
export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
        this.assetManifest = {
            sprites: {
                player: {
                    key: 'player',
                    path: 'assets/player_sheet.png',
                    frameWidth: 32,
                    frameHeight: 32,
                    frames: 12
                },
                friend: {
                    key: 'friend',
                    path: 'assets/friend_sheet.png',
                    frameWidth: 32,
                    frameHeight: 32,
                    frames: 4
                },
                box: {
                    key: 'box',
                    path: 'assets/box.png'
                }
            },
            backgrounds: {
                forest: 'assets/bg_forest.png',
                cave: 'assets/bg_cave.png',
                default: 'assets/space.png' // Fallback to existing asset
            }
        };
    }

    /**
     * Preload all assets defined in the manifest
     */
    preloadAll() {
        // Load sprite sheets
        Object.values(this.assetManifest.sprites).forEach(sprite => {
            if (sprite.frameWidth) {
                // It's a sprite sheet
                this.loadSpriteSheet(sprite.key, sprite.path, sprite.frameWidth, sprite.frameHeight);
            } else {
                // It's a single image
                this.loadImage(sprite.key, sprite.path);
            }
        });

        // Load backgrounds
        Object.entries(this.assetManifest.backgrounds).forEach(([key, path]) => {
            this.loadImage(`bg_${key}`, path);
        });
    }

    /**
     * Load a sprite sheet with error handling
     */
    loadSpriteSheet(key, path, frameWidth, frameHeight) {
        try {
            this.scene.load.spritesheet(key, path, {
                frameWidth: frameWidth,
                frameHeight: frameHeight
            });
        } catch (error) {
            console.warn(`Failed to load sprite sheet: ${key} at ${path}`, error);
        }
    }

    /**
     * Load a single image with error handling
     */
    loadImage(key, path) {
        try {
            this.scene.load.image(key, path);
        } catch (error) {
            console.warn(`Failed to load image: ${key} at ${path}`, error);
        }
    }

    /**
     * Create animations after assets are loaded
     */
    createAnimations() {
        this.createPlayerAnimations();
        this.createFriendAnimations();
    }

    /**
     * Create player animations (idle, run, jump)
     */
    createPlayerAnimations() {
        const anims = this.scene.anims;

        // Check if player sprite is loaded
        if (!this.scene.textures.exists('player')) {
            console.warn('Player sprite not loaded, skipping animations');
            return;
        }

        // Idle animation (frames 0-1)
        if (!anims.exists('player_idle')) {
            anims.create({
                key: 'player_idle',
                frames: anims.generateFrameNumbers('player', { start: 0, end: 1 }),
                frameRate: 2,
                repeat: -1
            });
        }

        // Run right animation (frames 2-5)
        if (!anims.exists('player_run_right')) {
            anims.create({
                key: 'player_run_right',
                frames: anims.generateFrameNumbers('player', { start: 2, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Run left animation (frames 6-9)
        if (!anims.exists('player_run_left')) {
            anims.create({
                key: 'player_run_left',
                frames: anims.generateFrameNumbers('player', { start: 6, end: 9 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Jump animation (frames 10-11)
        if (!anims.exists('player_jump')) {
            anims.create({
                key: 'player_jump',
                frames: anims.generateFrameNumbers('player', { start: 10, end: 11 }),
                frameRate: 6,
                repeat: 0
            });
        }
    }

    /**
     * Create friend NPC animations
     */
    createFriendAnimations() {
        const anims = this.scene.anims;

        // Check if friend sprite is loaded
        if (!this.scene.textures.exists('friend')) {
            console.warn('Friend sprite not loaded, skipping animations');
            return;
        }

        // Idle wave animation
        if (!anims.exists('friend_wave')) {
            anims.create({
                key: 'friend_wave',
                frames: anims.generateFrameNumbers('friend', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }

        // Happy celebration animation
        if (!anims.exists('friend_celebrate')) {
            anims.create({
                key: 'friend_celebrate',
                frames: anims.generateFrameNumbers('friend', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: 2
            });
        }
    }

    /**
     * Get background key for a theme
     */
    getBackgroundKey(theme) {
        return `bg_${theme || 'default'}`;
    }

    /**
     * Check if a specific asset is loaded
     */
    isAssetLoaded(key) {
        return this.scene.textures.exists(key);
    }
}

