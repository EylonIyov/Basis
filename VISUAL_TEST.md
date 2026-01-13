// Quick Test: Change player to a different shape temporarily
// Add this to Player.js createSprite() around line 40:

// Temporary: Make player more visible
this.sprite = this.scene.add.rectangle(pixelPos.x, pixelPos.y, 28, 28, 0x00ff00); // Bright green square
this.sprite.setStrokeStyle(3, 0x00aa00);

// Add a sword indicator (cosmetic)
const sword = this.scene.add.rectangle(pixelPos.x + 12, pixelPos.y + 8, 10, 3, 0xcccccc);
sword.setDepth(11);
this.swordSprite = sword;

// Update sword position in moveTo() method

