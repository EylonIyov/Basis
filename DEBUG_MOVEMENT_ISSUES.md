# Debug: Movement and Win Detection Issues

## Issues Reported
1. **Can't complete level** - Win condition not triggering when reaching friend
2. **Can't move down** - Movement restricted to top rows

## Debug Features Added

### Console Logging
I've added console.log statements to help diagnose the issues:

**In Game.js:**
- Grid configuration values (width, height, tileSize, offsets)
- Player and Friend positions when they're close
- "WIN DETECTED!" message when win condition triggers

**In Player.js:**
- Every movement attempt shows: from position → to position
- Movement result (allowed/blocked and why)

### How to Test

1. **Hard refresh** browser: `Cmd+Shift+R` / `Ctrl+F5`
2. **Open Developer Console**: `F12` or right-click → Inspect → Console
3. **Watch the console** as you play

### What to Look For

#### Movement Issue
When you press DOWN arrow, you should see:
```
Trying to move from (1, 1) to (1, 2)
Move result: {allowed: true, action: "move"}
```

If you see:
```
Move result: {allowed: false, action: "blocked", reason: "out_of_bounds"}
```
Then **gridHeight is wrong** (not set to 15)

If you see:
```
Move result: {allowed: false, action: "blocked", reason: "wall"}
```
Then there's a **wall at that position** in the level data

#### Win Detection Issue
When you reach the friend, you should see:
```
Player: (13, 13), Friend: (13, 13)
WIN DETECTED!
```

If you DON'T see these messages when standing on the friend, then the position comparison is failing.

## Potential Causes & Fixes

### Cause 1: Grid Not Configured
**Symptom:** Can only move 1-2 rows down
**Solution:** Check console for "Configuring grid: 20x15"
- If it shows a different number, the level data is wrong
- If gridHeight < 15, that's the problem

### Cause 2: Walls Blocking Movement
**Symptom:** Can't move down at specific positions
**Solution:** Check console for "reason: wall"
- Level might have unexpected walls in row 2+
- Check Level1.js matrix - ensure rows 2-14 have walkable paths (0s)

### Cause 3: Friend Position Offset
**Symptom:** Win doesn't trigger even when visibly on friend
**Solution:** Check console for player/friend positions
- They should match when you're visually on the same tile
- If they're off by 1, the friend's grid position isn't being set correctly

### Cause 4: Win Condition Not Running
**Symptom:** No console logs at all about win
**Solution:** The update loop might not be running
- Check browser console for errors
- Any crash would stop the update loop

## Immediate Fixes Applied

1. ✅ Added `hasWon` flag to prevent multiple win triggers
2. ✅ Added debug logging for movement validation
3. ✅ Added debug logging for win detection
4. ✅ Prevented win check from running after win

## Next Steps

**After testing with console open, report back with:**
1. What does console show for grid configuration?
2. What happens when you press DOWN arrow?
3. What positions show when you reach the friend?

This will tell us exactly what's wrong!

