/**
 * Bubble Entity - Represents the player-controlled bubble
 */
class BubbleEntity {
    /**
     * Create a bubble entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {boolean} isClone - Whether this is a split clone
     */
    constructor(x = 0, y = 0, isClone = false) {
        // Entity identification
        this.id = null; // Set by EntityManager
        this.type = 'bubble';
        
        // Position and velocity
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Properties
        this.radius = 15;
        this.isClone = isClone;
        this.isDead = false;
        this.hasReverseGravity = false;
        
        // Visual trail
        this.trailPoints = [];
        this.maxTrailPoints = 20;
    }

    /**
     * Apply a jump force
     * @param {number} strength - Jump velocity (negative = up)
     */
    jump(strength = -8) {
        this.vy = strength;
    }

    /**
     * Apply a horizontal force
     * @param {number} force - Horizontal force
     */
    applyHorizontalForce(force) {
        this.vx += force;
    }

    /**
     * Split the bubble into two
     * @returns {BubbleEntity} New cloned bubble
     */
    split() {
        const clone = new BubbleEntity(
            this.x + 30,
            this.y,
            true
        );
        
        // Give both bubbles opposite horizontal velocity
        this.vx = -2;
        clone.vx = 2;
        clone.vy = this.vy;
        clone.radius = this.radius;
        
        return clone;
    }

    /**
     * Update trail points
     */
    updateTrail() {
        this.trailPoints.unshift({ x: this.x, y: this.y });
        
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.pop();
        }
    }

    /**
     * Mark bubble as dead
     */
    die() {
        this.isDead = true;
    }

    /**
     * Reset bubble for object pooling
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.isDead = false;
        this.isClone = false;
        this.hasReverseGravity = false;
        this.trailPoints = [];
    }

    /**
     * Clone this bubble's state
     * @returns {Object} Cloned state
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            radius: this.radius,
            isClone: this.isClone,
            isDead: this.isDead,
            hasReverseGravity: this.hasReverseGravity
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
 * Factory function for creating bubbles
 */
function createBubble(x, y, isClone = false) {
    return new BubbleEntity(x, y, isClone);
}

/**
 * Reset function for bubble pooling
 */
function resetBubble(bubble) {
    bubble.reset();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BubbleEntity, createBubble, resetBubble };
}
