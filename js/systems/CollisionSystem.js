/**
 * CollisionSystem - Handles collision detection and response
 */
class CollisionSystem {
    /**
     * Create a collision system
     * @param {EventBus} eventBus - Event bus for collision events
     * @param {ConfigManager} config - Configuration manager
     */
    constructor(eventBus, config) {
        this.eventBus = eventBus;
        this.config = config;
    }

    /**
     * Update collision detection
     * @param {Array} entities - All game entities
     */
    update(entities) {
        const bubbles = entities.filter(e => e.type === 'bubble' && !e.isDead);
        const platforms = entities.filter(e => e.type === 'platform' && !e.markedForDeletion);

        // Check bubble-platform collisions
        bubbles.forEach(bubble => {
            platforms.forEach(platform => {
                if (this.checkBubblePlatformCollision(bubble, platform)) {
                    this.handleBubblePlatformCollision(bubble, platform);
                }
            });
        });
    }

    /**
     * Check collision between bubble and platform
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     * @returns {boolean} True if colliding
     */
    checkBubblePlatformCollision(bubble, platform) {
        // Only check collision if bubble is falling
        if (bubble.vy <= 0) return false;

        const radius = bubble.radius || this.config.get('physics.bubbleRadius');

        return (
            bubble.x + radius > platform.x &&
            bubble.x - radius < platform.x + platform.width &&
            bubble.y + radius >= platform.y &&
            bubble.y + radius <= platform.y + platform.height + bubble.vy
        );
    }

    /**
     * Handle collision between bubble and platform
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     */
    handleBubblePlatformCollision(bubble, platform) {
        const radius = bubble.radius || this.config.get('physics.bubbleRadius');
        
        // Position bubble on top of platform
        bubble.y = platform.y - radius;

        // Emit collision event based on platform type
        const eventData = { bubble, platform };

        switch (platform.platformType) {
            case 'normal':
                this.handleNormalCollision(bubble, platform);
                this.eventBus.emit('collision:normal', eventData);
                break;

            case 'breaking':
                this.handleBreakingCollision(bubble, platform);
                this.eventBus.emit('collision:breaking', eventData);
                break;

            case 'boost':
                this.handleBoostCollision(bubble, platform);
                this.eventBus.emit('collision:boost', eventData);
                break;

            case 'reverse':
                this.handleReverseCollision(bubble, platform);
                this.eventBus.emit('collision:reverse', eventData);
                break;

            case 'rainbow':
                this.handleRainbowCollision(bubble, platform);
                this.eventBus.emit('collision:rainbow', eventData);
                break;

            default:
                this.handleNormalCollision(bubble, platform);
                this.eventBus.emit('collision:normal', eventData);
        }

        // Score for hitting platform (only first hit)
        if (!platform.hit) {
            platform.hit = true;
            const points = this.config.get(`platforms.types.${platform.platformType}.points`) || 10;
            this.eventBus.emit('score:add', { points, platform });
        }

        // General collision event
        this.eventBus.emit('collision:platform', eventData);
    }

    /**
     * Handle normal platform collision
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     */
    handleNormalCollision(bubble, platform) {
        bubble.vy = this.config.get('physics.jumpStrength');
    }

    /**
     * Handle breaking platform collision
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     */
    handleBreakingCollision(bubble, platform) {
        bubble.vy = this.config.get('physics.jumpStrength');
        platform.markedForDeletion = true;
        platform.breaking = true;
        
        this.eventBus.emit('platform:break', { platform });
    }

    /**
     * Handle boost platform collision
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     */
    handleBoostCollision(bubble, platform) {
        bubble.vy = this.config.get('physics.boostStrength');
        
        this.eventBus.emit('bubble:boosted', { bubble, platform });
    }

    /**
     * Handle reverse gravity platform collision
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     */
    handleReverseCollision(bubble, platform) {
        bubble.vy = this.config.get('physics.jumpStrength');
        
        this.eventBus.emit('gravity:reverse', { 
            bubbleId: bubble.id,
            duration: this.config.get('physics.reverseGravityDuration')
        });
    }

    /**
     * Handle rainbow (split) platform collision
     * @param {Object} bubble - Bubble entity
     * @param {Object} platform - Platform entity
     */
    handleRainbowCollision(bubble, platform) {
        bubble.vy = this.config.get('physics.jumpStrength');
        
        // Only split if not already a clone
        if (!bubble.isClone) {
            this.eventBus.emit('bubble:split', { bubble, platform });
        }
    }

    /**
     * Check if point is inside rectangle
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @param {number} rx - Rectangle X
     * @param {number} ry - Rectangle Y
     * @param {number} rw - Rectangle width
     * @param {number} rh - Rectangle height
     * @returns {boolean} True if inside
     */
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    /**
     * Check circle-rectangle collision
     * @param {Object} circle - Circle with x, y, radius
     * @param {Object} rect - Rectangle with x, y, width, height
     * @returns {boolean} True if colliding
     */
    circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        return distanceSquared < circle.radius * circle.radius;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionSystem;
}
