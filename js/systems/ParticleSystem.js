/**
 * ParticleSystem - Manages particle effects for visual feedback
 */
class ParticleSystem {
    /**
     * Create a particle system
     * @param {EventBus} eventBus - Event bus
     * @param {EntityManager} entityManager - Entity manager
     * @param {ConfigManager} config - Configuration manager
     */
    constructor(eventBus, entityManager, config) {
        this.eventBus = eventBus;
        this.entityManager = entityManager;
        this.config = config;
        
        this.maxParticles = config.get('particles.maxParticles') || 100;
        this.particles = [];
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for particle creation
     */
    setupEventListeners() {
        this.eventBus.on('platform:break', (data) => {
            this.createBreakEffect(data.platform);
        });

        this.eventBus.on('bubble:boosted', (data) => {
            this.createBoostEffect(data.bubble);
        });

        this.eventBus.on('bubble:split', (data) => {
            this.createSplitEffect(data.bubble);
        });

        this.eventBus.on('score:add', (data) => {
            if (data.platform) {
                this.createScorePopup(data.points, data.platform.x + data.platform.width / 2, data.platform.y);
            }
        });

        this.eventBus.on('gravity:reverse', (data) => {
            // Could add visual effect for gravity reversal
        });
    }

    /**
     * Update all particles
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime = 1) {
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            this.updateParticle(particle, deltaTime);

            // Remove dead particles
            if (particle.isDead) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Update a single particle
     * @param {Object} particle - Particle to update
     * @param {number} deltaTime - Delta time
     */
    updateParticle(particle, deltaTime) {
        // Apply gravity if enabled
        if (particle.gravity) {
            particle.vy += particle.gravity * deltaTime;
        }

        // Apply friction
        if (particle.friction) {
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
        }

        // Update position
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;

        // Update lifetime
        particle.lifetime -= deltaTime * 16; // Approximate ms per frame
        
        // Calculate alpha based on lifetime
        particle.alpha = Math.max(0, particle.lifetime / particle.maxLifetime);

        // Update size if shrinking
        if (particle.shrink) {
            particle.size = Math.max(0.5, particle.alpha * particle.originalSize);
        }

        // Mark as dead when lifetime expires
        if (particle.lifetime <= 0) {
            particle.isDead = true;
        }
    }

    /**
     * Create a particle
     * @param {Object} options - Particle options
     * @returns {Object} Created particle
     */
    createParticle(options) {
        // Enforce max particles
        if (this.particles.length >= this.maxParticles) {
            // Remove oldest particle
            this.particles.shift();
        }

        const particle = {
            type: 'particle',
            x: options.x || 0,
            y: options.y || 0,
            vx: options.vx || 0,
            vy: options.vy || 0,
            size: options.size || 3,
            originalSize: options.size || 3,
            color: options.color || '#ffffff',
            alpha: 1,
            lifetime: options.lifetime || 1000,
            maxLifetime: options.lifetime || 1000,
            gravity: options.gravity || 0,
            friction: options.friction || 1,
            shrink: options.shrink !== false,
            text: options.text || null,
            fontSize: options.fontSize || 18,
            isDead: false
        };

        this.particles.push(particle);
        return particle;
    }

    /**
     * Create break effect when platform breaks
     * @param {Object} platform - Platform that broke
     */
    createBreakEffect(platform) {
        const count = this.config.get('particles.breakParticleCount') || 15;
        const centerX = platform.x + platform.width / 2;
        const centerY = platform.y + platform.height / 2;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 3 + Math.random() * 5;
            
            this.createParticle({
                x: centerX + (Math.random() - 0.5) * platform.width,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 3 + Math.random() * 4,
                color: this.getRandomBreakColor(),
                lifetime: 500 + Math.random() * 500,
                gravity: 0.3,
                friction: 0.98
            });
        }
    }

    /**
     * Create boost effect
     * @param {Object} bubble - Bubble that was boosted
     */
    createBoostEffect(bubble) {
        const count = this.config.get('particles.boostParticleCount') || 10;

        for (let i = 0; i < count; i++) {
            this.createParticle({
                x: bubble.x + (Math.random() - 0.5) * 20,
                y: bubble.y + bubble.radius,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 5 + 3,
                size: 2 + Math.random() * 3,
                color: '#f1c40f',
                lifetime: 400 + Math.random() * 400,
                gravity: 0.1,
                friction: 0.96
            });
        }
    }

    /**
     * Create split/rainbow effect
     * @param {Object} bubble - Bubble that split
     */
    createSplitEffect(bubble) {
        const count = this.config.get('particles.splitParticleCount') || 25;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 4 + Math.random() * 6;
            
            this.createParticle({
                x: bubble.x,
                y: bubble.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: `hsl(${Math.random() * 360}, 80%, 60%)`,
                lifetime: 600 + Math.random() * 600,
                gravity: 0.1,
                friction: 0.97
            });
        }
    }

    /**
     * Create score popup
     * @param {number} points - Points scored
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createScorePopup(points, x, y) {
        this.createParticle({
            x: x,
            y: y - 10,
            vx: 0,
            vy: -2,
            text: `+${points}`,
            color: points >= 50 ? '#f1c40f' : points >= 20 ? '#e74c3c' : '#2ecc71',
            fontSize: points >= 50 ? 24 : points >= 20 ? 20 : 16,
            lifetime: 1500,
            shrink: false,
            friction: 0.95
        });
    }

    /**
     * Get random color for break particles
     * @returns {string} HSL color string
     */
    getRandomBreakColor() {
        const hue = Math.random() * 60 + 15; // Orange to red range
        return `hsl(${hue}, 70%, 50%)`;
    }

    /**
     * Get all particles for rendering
     * @returns {Array} Array of particles
     */
    getParticles() {
        return this.particles;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count
     * @returns {number} Number of active particles
     */
    getCount() {
        return this.particles.length;
    }

    /**
     * Set max particles (for performance tuning)
     * @param {number} max - Maximum particle count
     */
    setMaxParticles(max) {
        this.maxParticles = max;
        
        // Trim if over limit
        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}
