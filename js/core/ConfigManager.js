/**
 * ConfigManager - Centralized game configuration management
 * Stores all game parameters for easy tuning and difficulty adjustment
 */
class ConfigManager {
    constructor() {
        this.config = {
            // Physics configuration
            physics: {
                gravity: 0.4,
                jumpStrength: -8,
                boostStrength: -15,
                maxFallSpeed: 10,
                bubbleRadius: 15,
                friction: 0.95,
                wallBounce: -0.5,
                reverseGravityDuration: 3000
            },

            // Platform configuration
            platforms: {
                normalGap: 120,
                width: { min: 80, max: 140 },
                height: 15,
                movingChance: 0.2,
                baseSpeed: 2,
                types: {
                    normal: { 
                        probability: 0.5, 
                        color: '#2ecc71', 
                        points: 10,
                        name: 'Normal'
                    },
                    breaking: { 
                        probability: 0.2, 
                        color: '#e74c3c', 
                        points: 15,
                        name: 'Breaking'
                    },
                    boost: { 
                        probability: 0.15, 
                        color: '#f1c40f', 
                        points: 20,
                        name: 'Boost'
                    },
                    reverse: { 
                        probability: 0.1, 
                        color: '#9b59b6', 
                        points: 30,
                        name: 'Reverse Gravity'
                    },
                    rainbow: { 
                        probability: 0.05, 
                        color: '#ff69b4', 
                        points: 50,
                        name: 'Rainbow Split'
                    }
                }
            },

            // Difficulty progression
            difficulty: {
                easy: { 
                    scoreThreshold: 0, 
                    gapMultiplier: 1.0, 
                    speedMultiplier: 1.0,
                    name: 'Easy'
                },
                medium: { 
                    scoreThreshold: 500, 
                    gapMultiplier: 0.85, 
                    speedMultiplier: 1.5,
                    name: 'Medium'
                },
                hard: { 
                    scoreThreshold: 1500, 
                    gapMultiplier: 0.7, 
                    speedMultiplier: 2.0,
                    name: 'Hard'
                },
                expert: { 
                    scoreThreshold: 3000, 
                    gapMultiplier: 0.6, 
                    speedMultiplier: 2.5,
                    name: 'Expert'
                }
            },

            // Audio configuration
            audio: {
                masterVolume: 0.7,
                sfxVolume: 0.8,
                musicVolume: 0.3,
                sounds: {
                    jump: 'assets/audio/jump.mp3',
                    boost: 'assets/audio/boost.mp3',
                    break: 'assets/audio/break.mp3',
                    split: 'assets/audio/split.mp3',
                    gameOver: 'assets/audio/gameover.mp3',
                    levelUp: 'assets/audio/levelup.mp3'
                }
            },

            // Particle configuration
            particles: {
                maxParticles: 100,
                breakParticleCount: 15,
                boostParticleCount: 10,
                splitParticleCount: 25,
                trailEnabled: true,
                trailMaxPoints: 20
            },

            // Visual configuration
            visuals: {
                backgroundColor: {
                    top: '#87CEEB',
                    bottom: '#E0F7FA'
                },
                bubbleColors: {
                    primary: 'rgba(135, 206, 235, 0.6)',
                    shine: 'rgba(255, 255, 255, 0.9)',
                    clone: 'rgba(255, 105, 180, 0.6)'
                }
            },

            // Game settings
            game: {
                initialPlatformCount: 10,
                cameraFollowSpeed: 0.1,
                cameraThreshold: 0.4,
                deathBuffer: 100,
                platformCleanupBuffer: 100,
                scoreMultiplier: 0.1
            }
        };
    }

    /**
     * Get a configuration value using dot notation
     * @param {string} path - Dot-separated path (e.g., 'physics.gravity')
     * @returns {*} Configuration value
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    /**
     * Set a configuration value using dot notation
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.config);
        target[lastKey] = value;
    }

    /**
     * Get entire section of configuration
     * @param {string} section - Section name
     * @returns {Object} Configuration section
     */
    getSection(section) {
        return this.config[section] ? { ...this.config[section] } : null;
    }

    /**
     * Merge configuration with provided object
     * @param {Object} newConfig - Configuration to merge
     */
    merge(newConfig) {
        this.deepMerge(this.config, newConfig);
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     */
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.constructor();
    }

    /**
     * Export configuration as JSON
     * @returns {string} JSON string
     */
    toJSON() {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Load configuration from JSON
     * @param {string} json - JSON string
     */
    fromJSON(json) {
        try {
            const newConfig = JSON.parse(json);
            this.merge(newConfig);
        } catch (error) {
            console.error('Failed to load configuration:', error);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}
