/**
 * RuleManager - Centralized game rule state management
 * Handles dynamic rule changes (Baba Is You style mechanics)
 * Emits events when rules change for visual feedback
 */
export class RuleManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        
        // Define all possible rules and their default states
        this.rules = {
            // Movement rules
            'WALL_IS_AIR': false,      // Walls become passable
            'WALL_IS_STOP': true,      // Walls block movement (default)
            
            // Speed rules
            'PLAYER_IS_FAST': false,   // Player moves at double speed
            'PLAYER_IS_SLOW': false,   // Player moves at half speed
            
            // Push rules
            'PUSH_IS_DISABLED': false, // Disable pushing mechanics
            
            // Gate rules
            'GATE_IS_OPEN': false,     // All gates become open
            
            // Win condition rules
            'FRIEND_IS_GOAL': true,    // Friend is the win condition (default)
            
            // Special rules
            'PLAYER_IS_GHOST': false,  // Player can pass through everything
        };

        // Track active visual effects for each rule
        this.activeEffects = new Map();
        
        // Rule change history for debugging/undo
        this.history = [];
    }

    /**
     * Check if a specific rule is active
     * @param {string} ruleId - The rule identifier (e.g., 'WALL_IS_AIR')
     * @returns {boolean} Whether the rule is active
     */
    isRuleActive(ruleId) {
        // Normalize rule ID to uppercase
        const normalizedId = ruleId.toUpperCase().replace(/_/g, '_');
        
        if (this.rules.hasOwnProperty(normalizedId)) {
            return this.rules[normalizedId];
        }
        
        // Legacy support for snake_case
        const legacyId = ruleId.toLowerCase();
        if (legacyId === 'wall_is_air') return this.rules['WALL_IS_AIR'];
        if (legacyId === 'player_is_fast') return this.rules['PLAYER_IS_FAST'];
        
        console.warn(`[RuleManager] Unknown rule: ${ruleId}`);
        return false;
    }

    /**
     * Alias for isRuleActive for compatibility
     */
    checkRule(ruleId) {
        return this.isRuleActive(ruleId);
    }

    /**
     * Set a rule to active or inactive
     * @param {string} ruleId - The rule identifier
     * @param {boolean} isActive - Whether the rule should be active
     * @param {Object} options - Additional options (source, silent)
     */
    setRule(ruleId, isActive, options = {}) {
        const normalizedId = ruleId.toUpperCase();
        
        if (!this.rules.hasOwnProperty(normalizedId)) {
            console.warn(`[RuleManager] Attempting to set unknown rule: ${ruleId}`);
            return false;
        }

        const previousValue = this.rules[normalizedId];
        
        // Only process if value is actually changing
        if (previousValue === isActive) {
            return false;
        }

        // Update rule
        this.rules[normalizedId] = isActive;

        // Record in history
        this.history.push({
            ruleId: normalizedId,
            previousValue,
            newValue: isActive,
            timestamp: Date.now(),
            source: options.source || 'unknown'
        });

        // Emit event unless silent
        if (!options.silent) {
            this.emit('ruleChanged', {
                ruleId: normalizedId,
                isActive,
                previousValue
            });

            // Emit specific event for this rule
            this.emit(`rule:${normalizedId}`, isActive);
        }

        console.log(`[RuleManager] Rule changed: ${normalizedId} = ${isActive}`);
        return true;
    }

    /**
     * Toggle a rule on/off
     * @param {string} ruleId - The rule identifier
     * @returns {boolean} The new state of the rule
     */
    toggleRule(ruleId) {
        const normalizedId = ruleId.toUpperCase();
        const currentState = this.rules[normalizedId];
        this.setRule(normalizedId, !currentState);
        return this.rules[normalizedId];
    }

    /**
     * Apply a "Rule Riddle" effect - changes game rules
     * @param {Object} effect - The effect to apply
     */
    applyRiddleEffect(effect) {
        if (!effect || !effect.ruleId) {
            console.error('[RuleManager] Invalid riddle effect:', effect);
            return;
        }

        this.setRule(effect.ruleId, effect.value !== undefined ? effect.value : true, {
            source: 'riddle'
        });

        // Store effect metadata for visual feedback
        this.activeEffects.set(effect.ruleId, {
            appliedAt: Date.now(),
            duration: effect.duration || null, // null = permanent
            description: effect.description || ''
        });

        // Emit event for visual effects
        this.emit('effectApplied', {
            ruleId: effect.ruleId,
            description: effect.description
        });
    }

    /**
     * Get all currently active rules (non-default states)
     * @returns {Array} Array of active rule objects
     */
    getActiveRules() {
        const defaultRules = {
            'WALL_IS_AIR': false,
            'WALL_IS_STOP': true,
            'PLAYER_IS_FAST': false,
            'PLAYER_IS_SLOW': false,
            'PUSH_IS_DISABLED': false,
            'GATE_IS_OPEN': false,
            'FRIEND_IS_GOAL': true,
            'PLAYER_IS_GHOST': false
        };

        return Object.entries(this.rules)
            .filter(([id, value]) => value !== defaultRules[id])
            .map(([id, value]) => ({ id, value }));
    }

    /**
     * Get human-readable description of a rule
     * @param {string} ruleId - The rule identifier
     * @returns {string} Description of the rule
     */
    getRuleDescription(ruleId) {
        const descriptions = {
            'WALL_IS_AIR': 'Walls have become transparent! Walk through them.',
            'WALL_IS_STOP': 'Walls are solid and block movement.',
            'PLAYER_IS_FAST': 'You move at lightning speed!',
            'PLAYER_IS_SLOW': 'You move in slow motion...',
            'PUSH_IS_DISABLED': 'You can no longer push objects.',
            'GATE_IS_OPEN': 'All gates have been unlocked!',
            'FRIEND_IS_GOAL': 'Reach your friend to win!',
            'PLAYER_IS_GHOST': 'You can phase through everything!'
        };

        return descriptions[ruleId.toUpperCase()] || 'Unknown rule effect.';
    }

    /**
     * Reset all rules to default state
     */
    reset() {
        this.rules = {
            'WALL_IS_AIR': false,
            'WALL_IS_STOP': true,
            'PLAYER_IS_FAST': false,
            'PLAYER_IS_SLOW': false,
            'PUSH_IS_DISABLED': false,
            'GATE_IS_OPEN': false,
            'FRIEND_IS_GOAL': true,
            'PLAYER_IS_GHOST': false
        };

        this.activeEffects.clear();
        this.history = [];

        this.emit('rulesReset');
        console.log('[RuleManager] All rules reset to defaults');
    }

    /**
     * Get the rule change history
     * @returns {Array} Array of rule change records
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Undo the last rule change
     * @returns {boolean} Whether undo was successful
     */
    undoLastChange() {
        if (this.history.length === 0) {
            return false;
        }

        const lastChange = this.history.pop();
        this.rules[lastChange.ruleId] = lastChange.previousValue;
        
        this.emit('ruleChanged', {
            ruleId: lastChange.ruleId,
            isActive: lastChange.previousValue,
            previousValue: lastChange.newValue,
            isUndo: true
        });

        return true;
    }

    /**
     * Serialize current state for saving
     * @returns {Object} Serialized rule state
     */
    serialize() {
        return {
            rules: { ...this.rules },
            activeEffects: Object.fromEntries(this.activeEffects)
        };
    }

    /**
     * Deserialize and restore state
     * @param {Object} data - Serialized rule state
     */
    deserialize(data) {
        if (data.rules) {
            this.rules = { ...this.rules, ...data.rules };
        }
        if (data.activeEffects) {
            this.activeEffects = new Map(Object.entries(data.activeEffects));
        }
        this.emit('rulesLoaded');
    }
}
