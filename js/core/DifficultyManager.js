/**
 * DifficultyManager - Manages progressive difficulty scaling
 */
class DifficultyManager {
    /**
     * Create a difficulty manager
     * @param {EventBus} eventBus - Event bus
     * @param {ConfigManager} config - Configuration manager
     */
    constructor(eventBus, config) {
        this.eventBus = eventBus;
        this.config = config;
        
        this.currentLevel = 'easy';
        this.score = 0;
        this.previousLevel = 'easy';
        
        // Get difficulty thresholds from config
        this.levels = ['easy', 'medium', 'hard', 'expert'];
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventBus.on('score:changed', (data) => {
            this.updateDifficulty(data.score);
        });

        this.eventBus.on('game:reset', () => {
            this.reset();
        });
    }

    /**
     * Update difficulty based on score
     * @param {number} score - Current score
     */
    updateDifficulty(score) {
        this.score = score;
        this.previousLevel = this.currentLevel;
        
        // Determine new level based on score thresholds
        const difficultyConfig = this.config.getSection('difficulty');
        
        if (score >= difficultyConfig.expert.scoreThreshold) {
            this.currentLevel = 'expert';
        } else if (score >= difficultyConfig.hard.scoreThreshold) {
            this.currentLevel = 'hard';
        } else if (score >= difficultyConfig.medium.scoreThreshold) {
            this.currentLevel = 'medium';
        } else {
            this.currentLevel = 'easy';
        }
        
        // Emit level change event
        if (this.previousLevel !== this.currentLevel) {
            this.eventBus.emit('difficulty:changed', {
                from: this.previousLevel,
                to: this.currentLevel,
                score: score
            });
        }
    }

    /**
     * Get current difficulty level
     * @returns {string} Current level name
     */
    getCurrentLevel() {
        return this.currentLevel;
    }

    /**
     * Get difficulty level config
     * @returns {Object} Current level configuration
     */
    getCurrentConfig() {
        return this.config.get(`difficulty.${this.currentLevel}`);
    }

    /**
     * Get platform gap adjusted for difficulty
     * @returns {number} Adjusted gap size
     */
    getPlatformGap() {
        const baseGap = this.config.get('platforms.normalGap');
        const multiplier = this.config.get(`difficulty.${this.currentLevel}.gapMultiplier`);
        return Math.floor(baseGap * multiplier);
    }

    /**
     * Get platform speed multiplier
     * @returns {number} Speed multiplier
     */
    getSpeedMultiplier() {
        return this.config.get(`difficulty.${this.currentLevel}.speedMultiplier`);
    }

    /**
     * Get score multiplier for current difficulty
     * @returns {number} Score multiplier
     */
    getScoreMultiplier() {
        const multipliers = {
            easy: 1.0,
            medium: 1.2,
            hard: 1.5,
            expert: 2.0
        };
        return multipliers[this.currentLevel] || 1.0;
    }

    /**
     * Get adjusted platform type probabilities
     * @returns {Object} Platform type probabilities
     */
    getPlatformProbabilities() {
        const baseTypes = this.config.get('platforms.types');
        
        // Clone base types
        const adjusted = {};
        for (const [type, config] of Object.entries(baseTypes)) {
            adjusted[type] = { ...config };
        }
        
        // Adjust probabilities based on difficulty
        switch (this.currentLevel) {
            case 'easy':
                adjusted.normal.probability = 0.7;
                adjusted.breaking.probability = 0.15;
                adjusted.boost.probability = 0.1;
                adjusted.reverse.probability = 0.03;
                adjusted.rainbow.probability = 0.02;
                break;
                
            case 'medium':
                adjusted.normal.probability = 0.5;
                adjusted.breaking.probability = 0.25;
                adjusted.boost.probability = 0.12;
                adjusted.reverse.probability = 0.08;
                adjusted.rainbow.probability = 0.05;
                break;
                
            case 'hard':
                adjusted.normal.probability = 0.4;
                adjusted.breaking.probability = 0.3;
                adjusted.boost.probability = 0.12;
                adjusted.reverse.probability = 0.12;
                adjusted.rainbow.probability = 0.06;
                break;
                
            case 'expert':
                // Use base probabilities from config
                break;
        }
        
        return adjusted;
    }

    /**
     * Select a random platform type based on current difficulty
     * @returns {string} Platform type
     */
    selectPlatformType() {
        const probabilities = this.getPlatformProbabilities();
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, config] of Object.entries(probabilities)) {
            cumulative += config.probability;
            if (rand <= cumulative) {
                return type;
            }
        }
        
        return 'normal';
    }

    /**
     * Get moving platform chance for current difficulty
     * @returns {number} Chance (0-1)
     */
    getMovingPlatformChance() {
        const baseChance = this.config.get('platforms.movingChance') || 0.2;
        const multiplier = this.getSpeedMultiplier();
        return Math.min(0.5, baseChance * multiplier);
    }

    /**
     * Get platform movement speed for current difficulty
     * @returns {number} Movement speed
     */
    getPlatformSpeed() {
        const baseSpeed = this.config.get('platforms.baseSpeed') || 2;
        const multiplier = this.getSpeedMultiplier();
        return baseSpeed * multiplier;
    }

    /**
     * Get platform width range for current difficulty
     * @returns {Object} Width range {min, max}
     */
    getPlatformWidthRange() {
        const baseMin = this.config.get('platforms.width.min') || 80;
        const baseMax = this.config.get('platforms.width.max') || 140;
        
        // Harder difficulties have smaller platforms
        const shrinkFactor = {
            easy: 1.0,
            medium: 0.9,
            hard: 0.8,
            expert: 0.7
        }[this.currentLevel];
        
        return {
            min: Math.floor(baseMin * shrinkFactor),
            max: Math.floor(baseMax * shrinkFactor)
        };
    }

    /**
     * Get progress to next difficulty level
     * @returns {Object} Progress info
     */
    getProgress() {
        const currentIndex = this.levels.indexOf(this.currentLevel);
        
        if (currentIndex >= this.levels.length - 1) {
            return { progress: 1, nextLevel: null, pointsNeeded: 0 };
        }
        
        const nextLevel = this.levels[currentIndex + 1];
        const currentThreshold = this.config.get(`difficulty.${this.currentLevel}.scoreThreshold`);
        const nextThreshold = this.config.get(`difficulty.${nextLevel}.scoreThreshold`);
        
        const progress = (this.score - currentThreshold) / (nextThreshold - currentThreshold);
        const pointsNeeded = nextThreshold - this.score;
        
        return {
            progress: Math.max(0, Math.min(1, progress)),
            nextLevel: nextLevel,
            pointsNeeded: Math.max(0, pointsNeeded)
        };
    }

    /**
     * Reset difficulty to initial state
     */
    reset() {
        this.currentLevel = 'easy';
        this.previousLevel = 'easy';
        this.score = 0;
    }

    /**
     * Get all difficulty levels
     * @returns {Array} Level names
     */
    getLevels() {
        return [...this.levels];
    }

    /**
     * Get level display name
     * @param {string} level - Level key
     * @returns {string} Display name
     */
    getLevelName(level = null) {
        const lvl = level || this.currentLevel;
        return this.config.get(`difficulty.${lvl}.name`) || lvl;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DifficultyManager;
}
