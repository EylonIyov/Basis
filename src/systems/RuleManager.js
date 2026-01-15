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
            // Wall type rules - each type can be made passable
            'WALL_IS_AIR': false,      // ALL walls become passable (legacy)
            'BRICK_IS_AIR': false,     // Brick walls become passable
            'WOOD_IS_AIR': false,      // Wood walls become passable
            'IRON_IS_AIR': false,      // Iron walls become passable
            'STEEL_IS_AIR': false,     // Steel walls become passable
            'EMERALD_IS_AIR': false,   // Emerald walls become passable
            'GOLD_IS_AIR': false,      // Gold walls become passable
            'DIAMOND_IS_AIR': false,   // Diamond walls become passable
            'LAPIS_IS_AIR': false,     // Lapis walls become passable
            'QUARTZ_IS_AIR': false,    // Quartz walls become passable
            
            // Transformation rules - one wall type becomes another
            'STEEL_TO_EMERALD': false,  // Steel walls transform into emerald
            'IRON_TO_STEEL': false,     // Iron walls transform into steel
            'STEEL_TO_IRON': false,     // Steel walls transform into iron
            'WOOD_TO_IRON': false,      // Wood walls transform into iron
            'IRON_TO_WOOD': false,      // Iron walls transform into wood
            'LAPIS_TO_DIAMOND': false,  // Lapis walls transform into diamond
            'GOLD_TO_LAPIS': false,     // Gold walls transform into lapis
            
            // Shuffle rules - walls move to alternate positions
            'BRICK_SHUFFLE': false,    // Brick walls shuffle positions
            'WOOD_SHUFFLE': false,     // Wood walls shuffle positions
            'IRON_SHUFFLE': false,     // Iron walls shuffle positions
            'STEEL_SHUFFLE': false,    // Steel walls shuffle positions
            
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
            'WALL_IS_AIR': 'All walls have vanished!',
            'BRICK_IS_AIR': 'Brick walls crumble to dust!',
            'WOOD_IS_AIR': 'Wood walls rot away!',
            'IRON_IS_AIR': 'Iron bars rust and break!',
            'STEEL_IS_AIR': 'Steel plates melt away!',
            'BRICK_SHUFFLE': 'Bricks rearrange themselves!',
            'WOOD_SHUFFLE': 'Wood planks shift around!',
            'IRON_SHUFFLE': 'Iron bars relocate!',
            'STEEL_SHUFFLE': 'Steel plates reposition!',
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
            'BRICK_IS_AIR': false,
            'WOOD_IS_AIR': false,
            'IRON_IS_AIR': false,
            'STEEL_IS_AIR': false,
            'EMERALD_IS_AIR': false,
            'GOLD_IS_AIR': false,
            'DIAMOND_IS_AIR': false,
            'LAPIS_IS_AIR': false,
            'QUARTZ_IS_AIR': false,
            'STEEL_TO_EMERALD': false,
            'IRON_TO_STEEL': false,
            'STEEL_TO_IRON': false,
            'WOOD_TO_IRON': false,
            'IRON_TO_WOOD': false,
            'LAPIS_TO_DIAMOND': false,
            'GOLD_TO_LAPIS': false,
            'BRICK_SHUFFLE': false,
            'WOOD_SHUFFLE': false,
            'IRON_SHUFFLE': false,
            'STEEL_SHUFFLE': false,
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
