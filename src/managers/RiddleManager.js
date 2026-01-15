/**
 * RiddleManager - Loads and manages riddles from JSON files
 * Supports both Barrier Riddles (local effect) and Rule Riddles (systemic effect)
 */
export class RiddleManager {
    constructor() {
        this.riddles = [];
        this.barrierRiddles = [];
        this.ruleRiddles = [];
        this.usedRiddles = new Set();
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
            
            // Separate riddles by type
            this.barrierRiddles = this.riddles.filter(r => r.type === 'barrier' || !r.type);
            this.ruleRiddles = this.riddles.filter(r => r.type === 'rule');
            
            console.log(`[RiddleManager] Loaded ${this.riddles.length} riddles (${this.barrierRiddles.length} barrier, ${this.ruleRiddles.length} rule)`);
        } catch (error) {
            console.error('[RiddleManager] Error loading riddles:', error);
            this.riddles = [];
            this.barrierRiddles = [];
            this.ruleRiddles = [];
        }
    }

    /**
     * Get a random riddle (any type) that hasn't been used yet
     * @returns {Object|null} A riddle object or null if no riddles available
     */
    getRandomRiddle() {
        return this.getRandomRiddleOfType(null);
    }

    /**
     * Get a random barrier riddle
     * @returns {Object|null} A barrier riddle object
     */
    getBarrierRiddle() {
        return this.getRandomRiddleOfType('barrier');
    }

    /**
     * Get a random rule riddle
     * @returns {Object|null} A rule riddle object
     */
    getRuleRiddle() {
        return this.getRandomRiddleOfType('rule');
    }

    /**
     * Get a random riddle of a specific type
     * @param {string|null} type - 'barrier', 'rule', or null for any
     * @returns {Object|null}
     */
    getRandomRiddleOfType(type) {
        let pool;
        
        if (type === 'barrier') {
            pool = this.barrierRiddles;
        } else if (type === 'rule') {
            pool = this.ruleRiddles;
        } else {
            pool = this.riddles;
        }

        if (pool.length === 0) {
            console.warn(`[RiddleManager] No riddles of type '${type}' available`);
            return null;
        }

        // Filter out used riddles
        let availableRiddles = pool.filter(r => !this.usedRiddles.has(r.id));

        // If all riddles of this type have been used, reset for this type
        if (availableRiddles.length === 0) {
            console.log(`[RiddleManager] All ${type || 'riddles'} used, allowing reuse`);
            // Only clear the used set for this type
            pool.forEach(r => this.usedRiddles.delete(r.id));
            availableRiddles = pool;
        }

        // Pick a random riddle
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
     * Get a rule riddle that matches a specific rule ID
     * @param {string} ruleId - The rule ID to match (e.g., 'IRON_IS_AIR')
     * @returns {Object|null} A matching riddle or a random rule riddle if no match
     */
    getRiddleForRule(ruleId) {
        // Find a riddle whose effect matches this rule
        const matchingRiddle = this.ruleRiddles.find(
            r => r.effect && r.effect.ruleId === ruleId
        );
        
        if (matchingRiddle) {
            this.usedRiddles.add(matchingRiddle.id);
            return matchingRiddle;
        }
        
        // Fallback to any rule riddle if no specific match
        console.warn(`[RiddleManager] No riddle found for rule '${ruleId}', using random rule riddle`);
        return this.getRuleRiddle();
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
     * Get the effect from a rule riddle
     * @param {Object} riddle - The riddle object
     * @returns {Object|null} The effect object or null
     */
    getRiddleEffect(riddle) {
        if (!riddle || riddle.type !== 'rule') {
            return null;
        }
        return riddle.effect || null;
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

    /**
     * Get counts by type
     * @returns {Object}
     */
    getCounts() {
        return {
            total: this.riddles.length,
            barrier: this.barrierRiddles.length,
            rule: this.ruleRiddles.length,
            used: this.usedRiddles.size
        };
    }
}

