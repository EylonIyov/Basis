/**
 * RuleManager - Global state manager for systemic rules
 * Manages dynamic game rules that change physics and behavior
 * Inspired by "Baba Is You" style rule modifications
 */
export class RuleManager {
    constructor() {
        this.activeRules = new Set();
        
        // Define available rules and their effects
        this.ruleDefinitions = {
            wall_is_air: {
                name: 'Wall is Air',
                description: 'All walls become traversable',
                effect: 'walls_traversable',
                visualEffect: 'evaporate_walls',
                persistent: true // Stays active for entire level
            },
            player_is_fast: {
                name: 'Player is Fast',
                description: 'Movement speed doubled',
                effect: 'double_speed',
                visualEffect: 'speed_particles',
                persistent: true
            }
        };
        
        // Scene reference (set when activated)
        this.scene = null;
        
        // Visual effect references for cleanup
        this.activeEffects = new Map();
    }

    /**
     * Set the scene reference for visual effects
     */
    setScene(scene) {
        this.scene = scene;
    }

    /**
     * Activate a rule and apply its effects
     */
    activateRule(ruleId, scene) {
        if (!this.ruleDefinitions[ruleId]) {
            console.error(`Unknown rule: ${ruleId}`);
            return false;
        }

        if (this.activeRules.has(ruleId)) {
            console.log(`Rule already active: ${ruleId}`);
            return true;
        }

        this.scene = scene || this.scene;
        const rule = this.ruleDefinitions[ruleId];
        
        console.log(`Activating rule: ${rule.name}`);
        this.activeRules.add(ruleId);
        
        // Apply visual effects
        this.applyVisualEffect(ruleId, rule.visualEffect);
        
        // Apply gameplay effects
        this.applyGameplayEffect(ruleId, rule.effect);
        
        return true;
    }

    /**
     * Deactivate a rule and remove its effects
     */
    deactivateRule(ruleId) {
        if (!this.activeRules.has(ruleId)) {
            return false;
        }

        const rule = this.ruleDefinitions[ruleId];
        console.log(`Deactivating rule: ${rule.name}`);
        
        this.activeRules.delete(ruleId);
        
        // Remove visual effects
        this.removeVisualEffect(ruleId);
        
        // Revert gameplay effects
        this.revertGameplayEffect(ruleId, rule.effect);
        
        return true;
    }

    /**
     * Check if a rule is currently active
     */
    isRuleActive(ruleId) {
        return this.activeRules.has(ruleId);
    }

    /**
     * Get all active rules
     */
    getActiveRules() {
        return Array.from(this.activeRules).map(ruleId => ({
            id: ruleId,
            ...this.ruleDefinitions[ruleId]
        }));
    }

    /**
     * Reset all rules (typically called on level restart)
     */
    resetRules() {
        console.log('Resetting all rules');
        
        // Deactivate all rules
        const activeRuleIds = Array.from(this.activeRules);
        activeRuleIds.forEach(ruleId => this.deactivateRule(ruleId));
        
        this.activeRules.clear();
        this.activeEffects.clear();
    }

    /**
     * Apply visual effects for a rule
     */
    applyVisualEffect(ruleId, effectType) {
        if (!this.scene) {
            console.warn('No scene set for visual effects');
            return;
        }

        switch (effectType) {
            case 'evaporate_walls':
                this.evaporateWalls();
                break;
            case 'speed_particles':
                this.createSpeedParticles();
                break;
            default:
                console.log(`No visual effect defined for: ${effectType}`);
        }
    }

    /**
     * Remove visual effects for a rule
     */
    removeVisualEffect(ruleId) {
        const effect = this.activeEffects.get(ruleId);
        if (effect) {
            // Clean up effect objects
            if (effect.particles) {
                effect.particles.destroy();
            }
            if (effect.tweens) {
                effect.tweens.forEach(tween => tween.stop());
            }
            this.activeEffects.delete(ruleId);
        }
    }

    /**
     * Visual effect: Make walls semi-transparent with particle evaporation
     */
    evaporateWalls() {
        if (!this.scene || !this.scene.walls) return;

        const tweens = [];
        
        this.scene.walls.forEach(wall => {
            // Fade walls to semi-transparent
            const tween = this.scene.tweens.add({
                targets: wall,
                alpha: 0.3,
                duration: 500,
                ease: 'Power2'
            });
            tweens.push(tween);
            
            // Create particle burst effect
            const x = wall.x;
            const y = wall.y;
            
            // Simple particle effect using small rectangles
            for (let i = 0; i < 8; i++) {
                const particle = this.scene.add.rectangle(x, y, 4, 4, 0x34495e);
                particle.setDepth(20);
                
                const angle = (Math.PI * 2 * i) / 8;
                const distance = 30 + Math.random() * 20;
                
                this.scene.tweens.add({
                    targets: particle,
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }
        });
        
        this.activeEffects.set('wall_is_air', { tweens });
    }

    /**
     * Visual effect: Create speed particles around player
     */
    createSpeedParticles() {
        if (!this.scene) return;
        
        // Store reference for later cleanup
        this.activeEffects.set('player_is_fast', { 
            particles: null // Placeholder for particle system
        });
        
        console.log('Speed particles effect applied (placeholder)');
    }

    /**
     * Apply gameplay effects for a rule
     */
    applyGameplayEffect(ruleId, effectType) {
        switch (effectType) {
            case 'walls_traversable':
                // Physics system checks isRuleActive('wall_is_air')
                console.log('Walls are now traversable');
                break;
            case 'double_speed':
                // Physics system checks isRuleActive('player_is_fast')
                console.log('Player speed doubled');
                break;
            default:
                console.log(`No gameplay effect defined for: ${effectType}`);
        }
    }

    /**
     * Revert gameplay effects when rule is deactivated
     */
    revertGameplayEffect(ruleId, effectType) {
        switch (effectType) {
            case 'walls_traversable':
                // Restore wall visuals
                if (this.scene && this.scene.walls) {
                    this.scene.walls.forEach(wall => {
                        this.scene.tweens.add({
                            targets: wall,
                            alpha: 1,
                            duration: 300,
                            ease: 'Power2'
                        });
                    });
                }
                console.log('Walls restored to solid');
                break;
            case 'double_speed':
                console.log('Player speed restored to normal');
                break;
        }
    }

    /**
     * Get rule definition by ID
     */
    getRuleDefinition(ruleId) {
        return this.ruleDefinitions[ruleId];
    }

    /**
     * Check if a rule exists
     */
    ruleExists(ruleId) {
        return !!this.ruleDefinitions[ruleId];
    }
}

