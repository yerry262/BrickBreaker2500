/**
 * Particle Entity - Represents visual effect particles
 */
class ParticleEntity {
    /**
     * Create a particle entity
     * @param {Object} options - Particle options
     */
    constructor(options = {}) {
        // Entity identification
        this.id = null; // Set by EntityManager
        this.type = 'particle';
        
        // Position and velocity
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        
        // Visual properties
        this.size = options.size || 3;
        this.originalSize = this.size;
        this.color = options.color || '#ffffff';
        this.alpha = 1;
        
        // Lifetime
        this.lifetime = options.lifetime || 1000;
        this.maxLifetime = this.lifetime;
        
        // Physics
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 1;
        
        // Behavior flags
        this.shrink = options.shrink !== false;
        this.isDead = false;
        
        // Text properties (for score popups)
        this.text = options.text || null;
        this.fontSize = options.fontSize || 18;
    }

    /**
     * Update particle state
     * @param {number} deltaTime - Delta time multiplier
     */
    update(deltaTime = 1) {
        // Apply gravity
        this.vy += this.gravity * deltaTime;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update lifetime (assuming ~60fps, convert deltaTime to ms)
        this.lifetime -= deltaTime * 16.67;
        
        // Calculate alpha based on lifetime
        this.alpha = Math.max(0, this.lifetime / this.maxLifetime);
        
        // Shrink if enabled
        if (this.shrink) {
            this.size = Math.max(0.5, this.alpha * this.originalSize);
        }
        
        // Mark as dead when lifetime expires
        if (this.lifetime <= 0) {
            this.isDead = true;
        }
    }

    /**
     * Reset particle for object pooling
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 3;
        this.originalSize = 3;
        this.color = '#ffffff';
        this.alpha = 1;
        this.lifetime = 1000;
        this.maxLifetime = 1000;
        this.gravity = 0;
        this.friction = 1;
        this.shrink = true;
        this.isDead = false;
        this.text = null;
        this.fontSize = 18;
    }

    /**
     * Configure particle with new options
     * @param {Object} options - New options
     */
    configure(options) {
        Object.assign(this, options);
        this.originalSize = this.size;
        this.maxLifetime = this.lifetime;
        this.alpha = 1;
        this.isDead = false;
    }
}

/**
 * Explosion Particle - Particles that explode outward with gravity
 */
class ExplosionParticle extends ParticleEntity {
    constructor(options = {}) {
        super({
            ...options,
            gravity: options.gravity || 0.2,
            friction: options.friction || 0.98,
            lifetime: options.lifetime || 800
        });
    }
}

/**
 * Trail Particle - Particles that fade quickly behind moving objects
 */
class TrailParticle extends ParticleEntity {
    constructor(options = {}) {
        super({
            ...options,
            gravity: 0,
            friction: options.friction || 0.95,
            lifetime: options.lifetime || 400,
            size: options.size || 2
        });
    }
}

/**
 * Score Particle - Text particles for score popups
 */
class ScoreParticle extends ParticleEntity {
    constructor(options = {}) {
        super({
            ...options,
            gravity: 0,
            friction: 0.95,
            lifetime: options.lifetime || 1500,
            shrink: false,
            text: options.text || '+10',
            fontSize: options.fontSize || 18
        });
        this.vy = options.vy || -2;
    }

    update(deltaTime = 1) {
        super.update(deltaTime);
        
        // Scale font size with alpha
        if (this.text) {
            this.fontSize = Math.max(12, this.alpha * 24);
        }
    }
}

/**
 * Sparkle Particle - Small sparkly particles
 */
class SparkleParticle extends ParticleEntity {
    constructor(options = {}) {
        super({
            ...options,
            gravity: 0,
            friction: 0.9,
            lifetime: options.lifetime || 600,
            size: options.size || 2
        });
        this.twinkle = true;
        this.twinkleSpeed = options.twinkleSpeed || 10;
    }

    update(deltaTime = 1) {
        super.update(deltaTime);
        
        // Twinkle effect
        if (this.twinkle) {
            this.alpha *= 0.5 + Math.sin(Date.now() / 1000 * this.twinkleSpeed) * 0.5;
        }
    }
}

/**
 * Factory function for creating particles
 */
function createParticle(options) {
    return new ParticleEntity(options);
}

/**
 * Reset function for particle pooling
 */
function resetParticle(particle) {
    particle.reset();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ParticleEntity, 
        ExplosionParticle, 
        TrailParticle, 
        ScoreParticle, 
        SparkleParticle,
        createParticle, 
        resetParticle 
    };
}
