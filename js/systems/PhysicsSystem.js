/**
 * PhysicsSystem - Handles all physics calculations for entities
 */
class PhysicsSystem {
    /**
     * Create a physics system
     * @param {EventBus} eventBus - Event bus for physics events
     * @param {ConfigManager} config - Configuration manager
     */
    constructor(eventBus, config) {
        this.eventBus = eventBus;
        this.config = config;
        this.screenWidth = 800;
        this.screenHeight = 600;
        
        // Physics settings from config
        this.gravity = config.get('physics.gravity');
        this.jumpStrength = config.get('physics.jumpStrength');
        this.boostStrength = config.get('physics.boostStrength');
        this.maxFallSpeed = config.get('physics.maxFallSpeed');
        this.friction = config.get('physics.friction');
        this.wallBounce = config.get('physics.wallBounce');
        
        // Reverse gravity tracking
        this.reverseGravityEntities = new Set();
        this.reverseGravityTimers = new Map();
    }

    /**
     * Set screen dimensions
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     */
    setScreenSize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
    }

    /**
     * Update all physics for entities
     * @param {Array} entities - All game entities
     * @param {number} deltaTime - Time since last frame (normalized)
     */
    update(entities, deltaTime = 1) {
        const bubbles = entities.filter(e => e.type === 'bubble' && !e.isDead);
        const platforms = entities.filter(e => e.type === 'platform');

        // Update bubbles
        bubbles.forEach(bubble => this.updateBubble(bubble, deltaTime));

        // Update platforms
        platforms.forEach(platform => this.updatePlatform(platform, deltaTime));
    }

    /**
     * Update bubble physics
     * @param {Object} bubble - Bubble entity
     * @param {number} deltaTime - Delta time
     */
    updateBubble(bubble, deltaTime) {
        // Determine gravity direction
        const gravityDir = this.reverseGravityEntities.has(bubble.id) ? -1 : 1;
        
        // Apply gravity
        bubble.vy += this.gravity * gravityDir * deltaTime;

        // Clamp fall speed
        if (Math.abs(bubble.vy) > this.maxFallSpeed) {
            bubble.vy = Math.sign(bubble.vy) * this.maxFallSpeed;
        }

        // Apply friction to horizontal movement
        bubble.vx *= this.friction;

        // Update position
        bubble.x += bubble.vx * deltaTime;
        bubble.y += bubble.vy * deltaTime;

        // Wall collisions
        this.handleWallCollision(bubble);

        // Update trail
        if (bubble.trailPoints) {
            this.updateTrail(bubble);
        }
    }

    /**
     * Handle wall collision for bubble
     * @param {Object} bubble - Bubble entity
     */
    handleWallCollision(bubble) {
        const radius = bubble.radius || this.config.get('physics.bubbleRadius');

        if (bubble.x - radius < 0) {
            bubble.x = radius;
            bubble.vx *= this.wallBounce;
            this.eventBus.emit('bubble:wall_hit', { bubble, side: 'left' });
        } else if (bubble.x + radius > this.screenWidth) {
            bubble.x = this.screenWidth - radius;
            bubble.vx *= this.wallBounce;
            this.eventBus.emit('bubble:wall_hit', { bubble, side: 'right' });
        }
    }

    /**
     * Update bubble trail points
     * @param {Object} bubble - Bubble entity
     */
    updateTrail(bubble) {
        const maxPoints = this.config.get('particles.trailMaxPoints') || 20;
        
        bubble.trailPoints.unshift({ x: bubble.x, y: bubble.y });
        
        if (bubble.trailPoints.length > maxPoints) {
            bubble.trailPoints.pop();
        }
    }

    /**
     * Update platform physics
     * @param {Object} platform - Platform entity
     * @param {number} deltaTime - Delta time
     */
    updatePlatform(platform, deltaTime) {
        if (!platform.vx) return;

        platform.x += platform.vx * deltaTime;

        // Bounce off screen edges
        if (platform.x <= 0) {
            platform.x = 0;
            platform.vx = Math.abs(platform.vx);
        } else if (platform.x + platform.width >= this.screenWidth) {
            platform.x = this.screenWidth - platform.width;
            platform.vx = -Math.abs(platform.vx);
        }
    }

    /**
     * Make a bubble jump
     * @param {Object} bubble - Bubble entity
     */
    jump(bubble) {
        bubble.vy = this.jumpStrength;
        this.eventBus.emit('bubble:jumped', { bubble });
    }

    /**
     * Apply boost to a bubble
     * @param {Object} bubble - Bubble entity
     */
    boost(bubble) {
        bubble.vy = this.boostStrength;
        this.eventBus.emit('bubble:boosted', { bubble });
    }

    /**
     * Apply reverse gravity to a bubble
     * @param {number} bubbleId - Bubble ID
     * @param {number} duration - Duration in milliseconds
     */
    applyReverseGravity(bubbleId, duration = null) {
        duration = duration || this.config.get('physics.reverseGravityDuration');
        
        this.reverseGravityEntities.add(bubbleId);
        
        // Clear existing timer
        if (this.reverseGravityTimers.has(bubbleId)) {
            clearTimeout(this.reverseGravityTimers.get(bubbleId));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.reverseGravityEntities.delete(bubbleId);
            this.reverseGravityTimers.delete(bubbleId);
            this.eventBus.emit('bubble:gravity_restored', { bubbleId });
        }, duration);

        this.reverseGravityTimers.set(bubbleId, timer);
        this.eventBus.emit('bubble:gravity_reversed', { bubbleId, duration });
    }

    /**
     * Check if bubble has reverse gravity
     * @param {number} bubbleId - Bubble ID
     * @returns {boolean} True if reversed
     */
    hasReverseGravity(bubbleId) {
        return this.reverseGravityEntities.has(bubbleId);
    }

    /**
     * Clear all reverse gravity effects
     */
    clearReverseGravity() {
        this.reverseGravityEntities.clear();
        for (const timer of this.reverseGravityTimers.values()) {
            clearTimeout(timer);
        }
        this.reverseGravityTimers.clear();
    }

    /**
     * Reset the physics system
     */
    reset() {
        this.clearReverseGravity();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsSystem;
}
