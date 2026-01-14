/**
 * AssetGenerator - Programmatically generates 16-bit style placeholder sprites
 * Creates sprite sheets for Hero, Friend, Tiles using Phaser Graphics
 */
export class AssetGenerator {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32; // Base tile size for sprites
    }

    /**
     * Generate all game assets
     */
    generateAll() {
        this.generatePlayerSprites();
        this.generateFriendSprite();
        this.generateTileSprites();
        this.generatePushableSprite();
        console.log('[AssetGenerator] All placeholder assets generated');
    }

    /**
     * Generate player sprite sheet with idle, run, and directional frames
     * "Brown Box" character with green shirt and cosmetic sword
     */
    generatePlayerSprites() {
        const frameSize = this.tileSize;
        const frames = 4; // idle, run1, run2, run3
        const directions = 2; // right, left (we'll flip for left)
        
        // Create canvas for sprite sheet
        const canvas = document.createElement('canvas');
        canvas.width = frameSize * frames;
        canvas.height = frameSize;
        const ctx = canvas.getContext('2d');

        // Draw frames
        for (let i = 0; i < frames; i++) {
            const x = i * frameSize;
            this.drawPlayerFrame(ctx, x, 0, frameSize, i);
        }

        // Add texture to Phaser
        this.scene.textures.addCanvas('player', canvas);
        
        // Create animations
        this.scene.anims.create({
            key: 'player_idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 1,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'player_run_right',
            frames: [
                { key: 'player', frame: 1 },
                { key: 'player', frame: 2 },
                { key: 'player', frame: 3 },
                { key: 'player', frame: 2 }
            ],
            frameRate: 8,
            repeat: -1
        });

        // Generate frame data for Phaser
        const texture = this.scene.textures.get('player');
        texture.add(0, 0, 0, 0, frameSize, frameSize);
        texture.add(1, 0, frameSize, 0, frameSize, frameSize);
        texture.add(2, 0, frameSize * 2, 0, frameSize, frameSize);
        texture.add(3, 0, frameSize * 3, 0, frameSize, frameSize);

        console.log('[AssetGenerator] Player sprites generated');
    }

    /**
     * Draw a single player frame
     */
    drawPlayerFrame(ctx, x, y, size, frameIndex) {
        const padding = 4;
        const bodySize = size - padding * 2;
        const centerX = x + size / 2;
        const centerY = y + size / 2;

        // Animation offset based on frame
        const bobOffset = frameIndex === 0 ? 0 : (frameIndex % 2 === 0 ? -1 : 1);
        const legOffset = frameIndex === 0 ? 0 : (frameIndex % 2 === 0 ? 2 : -2);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, y + size - 4, bodySize / 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (simple rectangles)
        ctx.fillStyle = '#654321'; // Dark brown
        ctx.fillRect(centerX - 6 + legOffset, centerY + 4, 4, 8);
        ctx.fillRect(centerX + 2 - legOffset, centerY + 4, 4, 8);

        // Body - brown box
        ctx.fillStyle = '#8B4513'; // Saddle brown
        ctx.fillRect(x + padding, y + padding + bobOffset, bodySize, bodySize - 8);

        // Body outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + padding, y + padding + bobOffset, bodySize, bodySize - 8);

        // Green shirt (horizontal band)
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(x + padding + 2, centerY - 2 + bobOffset, bodySize - 4, 6);

        // Face - eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 6 + bobOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 5, centerY - 6 + bobOffset, 2, 0, Math.PI * 2);
        ctx.fill();

        // Cosmetic sword (right side)
        const swordX = x + size - padding - 2;
        const swordY = centerY + bobOffset;
        
        // Sword handle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(swordX - 6, swordY - 3, 4, 6);
        
        // Sword blade
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(swordX - 2, swordY - 1, 10, 2);
        
        // Sword tip
        ctx.fillStyle = '#DCDCDC';
        ctx.beginPath();
        ctx.moveTo(swordX + 8, swordY - 2);
        ctx.lineTo(swordX + 12, swordY);
        ctx.lineTo(swordX + 8, swordY + 2);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Generate Friend NPC sprite (the goal)
     */
    generateFriendSprite() {
        const size = this.tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size * 2; // 2 frames for idle animation
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw two frames (slight bobbing)
        for (let i = 0; i < 2; i++) {
            const x = i * size;
            const bobOffset = i === 0 ? 0 : -2;
            this.drawFriendFrame(ctx, x, 0, size, bobOffset);
        }

        // Add texture
        this.scene.textures.addCanvas('friend', canvas);
        
        const texture = this.scene.textures.get('friend');
        texture.add(0, 0, 0, 0, size, size);
        texture.add(1, 0, size, 0, size, size);

        // Create animation
        this.scene.anims.create({
            key: 'friend_idle',
            frames: [
                { key: 'friend', frame: 0 },
                { key: 'friend', frame: 1 }
            ],
            frameRate: 2,
            repeat: -1
        });

        console.log('[AssetGenerator] Friend sprite generated');
    }

    /**
     * Draw Friend NPC frame - friendly character with distinct look
     */
    drawFriendFrame(ctx, x, y, size, bobOffset) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const padding = 4;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, y + size - 4, size / 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - friendly blue/purple color
        ctx.fillStyle = '#9B59B6'; // Purple
        ctx.beginPath();
        ctx.arc(centerX, centerY + bobOffset, size / 2 - padding, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#8E44AD';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + bobOffset, size / 2 - padding, 0, Math.PI * 2);
        ctx.stroke();

        // Happy eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 4 + bobOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 5, centerY - 4 + bobOffset, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 4 + bobOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 6, centerY - 4 + bobOffset, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 2 + bobOffset, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Star sparkle (to indicate goal)
        ctx.fillStyle = '#F1C40F';
        this.drawStar(ctx, centerX + 8, centerY - 10 + bobOffset, 4, 5, 2);
    }

    /**
     * Draw a star shape
     */
    drawStar(ctx, cx, cy, outerRadius, points, innerRadius) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Generate tile sprites (wall, floor, gate)
     */
    generateTileSprites() {
        const size = this.tileSize;
        
        // Wall tile
        this.generateWallSprite(size);
        
        // Floor tile
        this.generateFloorSprite(size);
        
        // Gate tile (open and closed states)
        this.generateGateSprite(size);

        console.log('[AssetGenerator] Tile sprites generated');
    }

    /**
     * Generate wall sprite - stone/brick texture
     */
    generateWallSprite(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = '#34495E';
        ctx.fillRect(0, 0, size, size);

        // Brick pattern
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let y = 0; y < size; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y);
            ctx.stroke();
        }

        // Vertical lines (offset every other row)
        for (let y = 0; y < size; y += 8) {
            const offset = (Math.floor(y / 8) % 2) * 8;
            for (let x = offset; x < size; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 8);
                ctx.stroke();
            }
        }

        // Add some noise/texture
        for (let i = 0; i < 10; i++) {
            const px = Math.random() * size;
            const py = Math.random() * size;
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
            ctx.fillRect(px, py, 2, 2);
        }

        // Border
        ctx.strokeStyle = '#1A252F';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, size - 2, size - 2);

        this.scene.textures.addCanvas('wall', canvas);
    }

    /**
     * Generate floor sprite - subtle grid pattern
     */
    generateFloorSprite(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base color - darker for contrast
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, size, size);

        // Subtle grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Cross pattern
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();

        // Corner accents
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(0, 0, 4, 4);
        ctx.fillRect(size - 4, 0, 4, 4);
        ctx.fillRect(0, size - 4, 4, 4);
        ctx.fillRect(size - 4, size - 4, 4, 4);

        this.scene.textures.addCanvas('floor', canvas);
    }

    /**
     * Generate gate sprite - with closed and open states
     */
    generateGateSprite(size) {
        // Closed gate
        const closedCanvas = document.createElement('canvas');
        closedCanvas.width = size;
        closedCanvas.height = size;
        const closedCtx = closedCanvas.getContext('2d');

        // Gate frame
        closedCtx.fillStyle = '#E74C3C'; // Red
        closedCtx.fillRect(2, 2, size - 4, size - 4);

        // Gate bars
        closedCtx.strokeStyle = '#C0392B';
        closedCtx.lineWidth = 3;
        for (let x = 8; x < size - 4; x += 8) {
            closedCtx.beginPath();
            closedCtx.moveTo(x, 4);
            closedCtx.lineTo(x, size - 4);
            closedCtx.stroke();
        }

        // Question mark symbol
        closedCtx.fillStyle = '#FFFFFF';
        closedCtx.font = 'bold 16px Arial';
        closedCtx.textAlign = 'center';
        closedCtx.textBaseline = 'middle';
        closedCtx.fillText('?', size / 2, size / 2);

        // Border
        closedCtx.strokeStyle = '#922B21';
        closedCtx.lineWidth = 2;
        closedCtx.strokeRect(2, 2, size - 4, size - 4);

        this.scene.textures.addCanvas('gate_closed', closedCanvas);

        // Open gate
        const openCanvas = document.createElement('canvas');
        openCanvas.width = size;
        openCanvas.height = size;
        const openCtx = openCanvas.getContext('2d');

        // Transparent/faded gate
        openCtx.fillStyle = 'rgba(46, 204, 113, 0.3)'; // Green, transparent
        openCtx.fillRect(2, 2, size - 4, size - 4);

        // Checkmark
        openCtx.strokeStyle = '#27AE60';
        openCtx.lineWidth = 3;
        openCtx.beginPath();
        openCtx.moveTo(8, size / 2);
        openCtx.lineTo(size / 3, size - 8);
        openCtx.lineTo(size - 8, 8);
        openCtx.stroke();

        this.scene.textures.addCanvas('gate_open', openCanvas);
    }

    /**
     * Generate pushable block sprite
     */
    generatePushableSprite() {
        const size = this.tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Box base
        ctx.fillStyle = '#F39C12'; // Orange
        ctx.fillRect(4, 4, size - 8, size - 8);

        // 3D effect - lighter top/left
        ctx.fillStyle = '#F5B041';
        ctx.fillRect(4, 4, size - 8, 4);
        ctx.fillRect(4, 4, 4, size - 8);

        // 3D effect - darker bottom/right
        ctx.fillStyle = '#D68910';
        ctx.fillRect(4, size - 8, size - 8, 4);
        ctx.fillRect(size - 8, 4, 4, size - 8);

        // Cross pattern on top
        ctx.strokeStyle = '#935116';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size / 2, 6);
        ctx.lineTo(size / 2, size - 6);
        ctx.moveTo(6, size / 2);
        ctx.lineTo(size - 6, size / 2);
        ctx.stroke();

        // Border
        ctx.strokeStyle = '#7E5109';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, size - 8, size - 8);

        this.scene.textures.addCanvas('pushable', canvas);

        console.log('[AssetGenerator] Pushable sprite generated');
    }

    /**
     * Generate background textures for different level themes
     */
    generateBackgrounds() {
        // Forest background
        this.generateForestBackground();
        
        // Cave background
        this.generateCaveBackground();

        console.log('[AssetGenerator] Background textures generated');
    }

    /**
     * Generate a forest-themed background tile
     */
    generateForestBackground() {
        const size = 64; // Larger tile for backgrounds
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base grass color
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#1D4E3E');
        gradient.addColorStop(1, '#16A085');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Grass blades
        ctx.strokeStyle = '#1ABC9C';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const height = 4 + Math.random() * 6;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.random() * 4 - 2, y - height);
            ctx.stroke();
        }

        this.scene.textures.addCanvas('bg_forest', canvas);
    }

    /**
     * Generate a cave-themed background tile
     */
    generateCaveBackground() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Dark base
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, size, size);

        // Rocky texture
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const shade = Math.random() * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${shade})`;
            ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }

        this.scene.textures.addCanvas('bg_cave', canvas);
    }
}
