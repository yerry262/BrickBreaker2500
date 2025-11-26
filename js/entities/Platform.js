/**
 * Platform Entity - Represents platforms in the game
 */
class PlatformEntity {
    /**
     * Create a platform entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Platform width
     * @param {string} platformType - Type of platform
     */
    constructor(x = 0, y = 0, width = 100, platformType = 'normal') {
        // Entity identification
        this.id = null; // Set by EntityManager
        this.type = 'platform';
        
        // Position and dimensions
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 15;
        
        // Movement
        this.vx = 0;
        
        // Platform type and state
        this.platformType = platformType;
        this.hit = false;
        this.markedForDeletion = false;
        this.breaking = false;
        this.breakTimer = 0;
    }

    /**
     * Set movement velocity
     * @param {number} vx - Horizontal velocity
     */
    setVelocity(vx) {
        this.vx = vx;
    }

    /**
     * Start breaking animation
     * @param {number} duration - Break animation duration
     */
    startBreaking(duration = 500) {
        this.breaking = true;
        this.breakTimer = duration;
    }

    /**
     * Update break animation
     * @param {number} deltaTime - Delta time in ms
     * @returns {boolean} True if should be deleted
     */
    updateBreaking(deltaTime) {
        if (!this.breaking) return false;
        
        this.breakTimer -= deltaTime;
        if (this.breakTimer <= 0) {
            this.markedForDeletion = true;
            return true;
        }
        return false;
    }

    /**
     * Get center X position
     * @returns {number} Center X
     */
    getCenterX() {
        return this.x + this.width / 2;
    }

    /**
     * Get center Y position
     * @returns {number} Center Y
     */
    getCenterY() {
        return this.y + this.height / 2;
    }

    /**
     * Check if a point is on the platform
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @returns {boolean} True if point is on platform
     */
    containsPoint(px, py) {
        return px >= this.x && 
               px <= this.x + this.width && 
               py >= this.y && 
               py <= this.y + this.height;
    }

    /**
     * Reset platform for object pooling
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.width = 100;
        this.vx = 0;
        this.platformType = 'normal';
        this.hit = false;
        this.markedForDeletion = false;
        this.breaking = false;
        this.breakTimer = 0;
    }

    /**
     * Get platform state
     * @returns {Object} Platform state
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            vx: this.vx,
            platformType: this.platformType,
            hit: this.hit
        };
    }

    /**
     * Restore state from object
     * @param {Object} state - State to restore
     */
    setState(state) {
        Object.assign(this, state);
    }
}

/**
 * Platform types enumeration
 */
const PlatformTypes = {
    NORMAL: 'normal',
    BREAKING: 'breaking',
    BOOST: 'boost',
    REVERSE: 'reverse',
    RAINBOW: 'rainbow'
};

/**
 * Factory function for creating platforms
 */
function createPlatform(x, y, width, platformType) {
    return new PlatformEntity(x, y, width, platformType);
}

/**
 * Reset function for platform pooling
 */
function resetPlatform(platform) {
    platform.reset();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlatformEntity, PlatformTypes, createPlatform, resetPlatform };
}
