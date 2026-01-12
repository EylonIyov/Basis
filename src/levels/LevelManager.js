/**
 * LevelManager - Manages multiple levels and level progression
 */
import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level3 } from './Level3.js';

export class LevelManager {
    constructor() {
        // Register all available levels
        this.levels = [
            Level1,
            Level2,
            Level3
            // Add more levels here as you create them
        ];
        
        // Validate levels
        this.levels.forEach((level, index) => {
            if (!level) {
                console.error(`Level at index ${index} is null or undefined!`);
            } else if (!level.name) {
                console.error(`Level at index ${index} is missing name property!`);
            } else {
                console.log(`Registered level ${index}: ${level.name}`);
            }
        });
        
        this.currentLevelIndex = 0;
    }

    /**
     * Get the current level
     * @returns {Object} Current level data
     */
    getCurrentLevel() {
        return this.levels[this.currentLevelIndex];
    }

    /**
     * Get a specific level by index
     * @param {number} index - Level index (0-based)
     * @returns {Object|null} Level data or null if index is invalid
     */
    getLevel(index) {
        if (index >= 0 && index < this.levels.length) {
            return this.levels[index];
        }
        return null;
    }

    /**
     * Set the current level by index
     * @param {number} index - Level index (0-based)
     * @returns {boolean} True if level was set successfully
     */
    setLevel(index) {
        if (index >= 0 && index < this.levels.length) {
            this.currentLevelIndex = index;
            return true;
        }
        return false;
    }

    /**
     * Advance to the next level
     * @returns {Object|null} Next level data or null if no more levels
     */
    nextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            return this.getCurrentLevel();
        }
        return null; // No more levels
    }

    /**
     * Go back to the previous level
     * @returns {Object|null} Previous level data or null if already at first level
     */
    previousLevel() {
        if (this.currentLevelIndex > 0) {
            this.currentLevelIndex--;
            return this.getCurrentLevel();
        }
        return null;
    }

    /**
     * Get total number of levels
     * @returns {number}
     */
    getLevelCount() {
        return this.levels.length;
    }

    /**
     * Check if there are more levels after the current one
     * @returns {boolean}
     */
    hasNextLevel() {
        return this.currentLevelIndex < this.levels.length - 1;
    }

    /**
     * Reset to the first level
     */
    reset() {
        this.currentLevelIndex = 0;
    }
}
