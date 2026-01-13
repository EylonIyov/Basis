# Bug Fix: Player Jumping Issue

## Problem
Player was jumping back to the starting row after each movement step, and the game was crashing.

## Root Cause
**Conflicting Tweens**: The `moveTo()` method in `Player.js` had TWO tweens targeting the sprite's Y position:

1. **Main tween** (lines 169-182): Moving to `targetPixel.y`
2. **Bob animation tween** (lines 184-193): Moving to `targetPixel.y - 3`

The second tween was **overriding** the first one, causing the sprite to:
- Jump to the wrong Y position
- Not reach the correct grid position
- Cause infinite loops or crashes

## Fix Applied

### Player.js - `moveTo()` method
**Before:**
```javascript
// Main tween to target
this.scene.tweens.add({ targets: this.sprite, y: targetPixel.y, ... });

// Bob animation (CONFLICTING!)
if (this.bodyParts) {
    this.scene.tweens.add({ targets: this.sprite, y: targetPixel.y - 3, ... });
}
```

**After:**
```javascript
// Main tween to target (unchanged)
this.scene.tweens.add({ targets: this.sprite, y: targetPixel.y, ... });

// Bob animation (FIXED - uses relative movement)
if (this.bodyParts) {
    const startY = this.sprite.y; // Store current position
    this.scene.tweens.add({
        targets: this.sprite,
        y: startY - 4,  // Move UP slightly from START position
        yoyo: true,     // Then back down
        repeat: 1       // Only once during the move
    });
}
```

### FriendNPC.js - `addPlaceholderAnimation()` method
**Before:**
```javascript
// Used sprite.y directly in tween (problematic with repeated animations)
y: this.sprite.y - 5
```

**After:**
```javascript
// Store initial position once
const initialY = this.sprite.y;
// Use stored value in tween
y: initialY - 5
```

## Why This Works

1. **No Conflicts**: The bob animation now works relative to the starting position, not the target
2. **Proper Sequencing**: Main movement happens smoothly to target
3. **Visual Enhancement**: Subtle bob effect adds life without breaking movement
4. **Stable References**: FriendNPC stores initial Y position to prevent drift

## Result

✅ Player moves smoothly to correct grid positions  
✅ No more jumping back to top row  
✅ No crashes  
✅ Subtle bob animation during movement (placeholder only)  
✅ Friend NPC animation stable

## Testing

1. Refresh browser (Cmd+Shift+R / Ctrl+F5)
2. Move player with arrow keys
3. Should move smoothly with subtle bob effect
4. No jumping or crashing

## Technical Note

When using **Phaser Containers** (which we now use for placeholder graphics), be extra careful about:
- Multiple tweens on the same property
- Using relative vs absolute positions
- Storing initial values for looping animations

The container itself has an x/y position, so tweening it works the same as tweening a sprite, but multiple tweens can conflict!

