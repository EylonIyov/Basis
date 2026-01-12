/**
 * RiddleManager - Loads and manages riddles from JSON files
 * Supports random selection and riddle tracking
 */
export class RiddleManager {
    constructor() {
        this.riddles = [];
        this.usedRiddles = new Set(); // Track which riddles have been used
    }

    /**
     * Load riddles from a JSON file
     * @param {string} jsonPath - Path to the riddles JSON file
     * @returns {Promise<void>}
     */
    async loadRiddles(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            this.riddles = data.riddles || [];
            console.log(`Loaded ${this.riddles.length} riddles`);
        } catch (error) {
            console.error('Error loading riddles:', error);
            this.riddles = [];
        }
    }

    /**
     * Get a random riddle that hasn't been used yet
     * @returns {Object|null} A riddle object or null if no riddles available
     */
    getRandomRiddle() {
        if (this.riddles.length === 0) {
            console.warn('No riddles loaded');
            return null;
        }

        // If all riddles have been used, reset the used set
        if (this.usedRiddles.size >= this.riddles.length) {
            console.log('All riddles used, resetting...');
            this.usedRiddles.clear();
        }

        // Filter out used riddles
        const availableRiddles = this.riddles.filter(
            riddle => !this.usedRiddles.has(riddle.id)
        );

        if (availableRiddles.length === 0) {
            // Fallback: return any riddle if somehow all are marked as used
            const randomIndex = Math.floor(Math.random() * this.riddles.length);
            return this.riddles[randomIndex];
        }

        // Pick a random riddle from available ones
        const randomIndex = Math.floor(Math.random() * availableRiddles.length);
        const selectedRiddle = availableRiddles[randomIndex];

        // Mark as used
        this.usedRiddles.add(selectedRiddle.id);

        return selectedRiddle;
    }

    /**
     * Get a specific riddle by ID
     * @param {string} riddleId - The ID of the riddle to retrieve
     * @returns {Object|null} The riddle object or null if not found
     */
    getRiddleById(riddleId) {
        return this.riddles.find(riddle => riddle.id === riddleId) || null;
    }

    /**
     * Check if an answer is correct for a given riddle
     * @param {Object} riddle - The riddle object
     * @param {number} answerIndex - The index of the selected answer
     * @returns {boolean} True if the answer is correct
     */
    checkAnswer(riddle, answerIndex) {
        if (!riddle || answerIndex === undefined) {
            return false;
        }
        return riddle.correctAnswer === answerIndex;
    }

    /**
     * Reset the used riddles tracking
     */
    resetUsedRiddles() {
        this.usedRiddles.clear();
    }

    /**
     * Get the total number of loaded riddles
     * @returns {number}
     */
    getRiddleCount() {
        return this.riddles.length;
    }
}
