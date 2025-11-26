/**
 * PowerUp Types - Different power-up configurations
 */
const PowerUpTypes = {
    MULTI_BALL: {
        id: 'multiball',
        name: 'Multi-Ball',
        icon: '⚫',
        color: '#9b59b6',
        duration: 0, // Instant effect
        description: 'Spawns 2 additional balls'
    },
    EXTEND_PADDLE: {
        id: 'extend',
        name: 'Extend',
        icon: '↔',
        color: '#3498db',
        duration: 15,
        description: 'Increases paddle width'
    },
    SHRINK_PADDLE: {
        id: 'shrink',
        name: 'Shrink',
        icon: '⇥',
        color: '#e74c3c',
        duration: 10,
        description: 'Decreases paddle width (bad!)'
    },
    STICKY_PADDLE: {
        id: 'sticky',
        name: 'Sticky',
        icon: '✋',
        color: '#f1c40f',
        duration: 10,
        description: 'Ball sticks to paddle'
    },
    LASER: {
        id: 'laser',
        name: 'Laser',
        icon: '⚡',
        color: '#e74c3c',
        duration: 15,
        description: 'Shoot lasers from paddle'
    },
    MEGA_BALL: {
        id: 'mega',
        name: 'Mega Ball',
        icon: '🔥',
        color: '#e67e22',
        duration: 10,
        description: 'Ball destroys bricks without bouncing'
    },
    SLOW_BALL: {
        id: 'slow',
        name: 'Slow Mo',
        icon: '🐢',
        color: '#1abc9c',
        duration: 8,
        description: 'Slows down the ball'
    },
    FAST_BALL: {
        id: 'fast',
        name: 'Speed Up',
        icon: '💨',
        color: '#f39c12',
        duration: 8,
        description: 'Speeds up the ball (bad!)'
    },
    EXTRA_LIFE: {
        id: 'life',
        name: 'Extra Life',
        icon: '❤',
        color: '#e74c3c',
        duration: 0, // Instant effect
        description: 'Adds one extra life'
    },
    SCORE_MULTIPLIER: {
        id: 'multiplier',
        name: '2X Score',
        icon: '×2',
        color: '#f1c40f',
        duration: 15,
        description: 'Double points for limited time'
    },
    AUTO_BURST: {
        id: 'autoburst',
        name: 'Auto Burst',
        icon: '🎆',
        color: '#ff69b4',
        duration: 10,
        description: 'Launches 10 balls, 1 per second'
    },
    EXPLOSIVE_NEXT: {
        id: 'explosive',
        name: 'Bomb Ball',
        icon: '💣',
        color: '#ff4757',
        duration: 0, // Until next brick hit
        description: 'Next brick hit explodes'
    }
};

/**
 * PowerUp - Falling power-up entity
 */
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 20;
        this.type = type;
        this.speed = 2;
        this.collected = false;
        this.rotation = 0;
        this.bobOffset = 0;
        this.bobSpeed = 3;
    }

    update(dt) {
        this.y += this.speed;
        this.rotation += dt * 2;
        this.bobOffset = Math.sin(this.rotation * this.bobSpeed) * 3;
    }

    checkCollision(paddle) {
        return (
            this.x < paddle.position.x + paddle.width / 2 &&
            this.x + this.width > paddle.position.x - paddle.width / 2 &&
            this.y < paddle.position.y + paddle.height &&
            this.y + this.height > paddle.position.y
        );
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight;
    }

    draw(ctx) {
        ctx.save();
        
        const drawX = this.x + this.bobOffset;
        const drawY = this.y;

        // Draw glow
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 15;

        // Draw background pill
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, this.width, this.height, 10);
        ctx.fill();

        // Draw gradient overlay
        const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, this.width, this.height, 10);
        ctx.fill();

        // Draw icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, drawX + this.width / 2, drawY + this.height / 2);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

/**
 * PowerUpManager - Handles power-up spawning, collection, and effects
 */
class PowerUpManager {
    constructor() {
        this.powerUps = [];
        this.activeEffects = [];
        this.spawnChance = 0.3; // 30% chance when power brick destroyed
    }

    /**
     * Attempt to spawn a power-up at given location
     */
    spawn(x, y, guaranteed = false) {
        if (!guaranteed && Math.random() > this.spawnChance) {
            return null;
        }

        const type = this.getRandomPowerUpType();
        const powerUp = new PowerUp(x, y, type);
        this.powerUps.push(powerUp);
        return powerUp;
    }
    
    /**
     * Spawn a specific power-up type at given location
     */
    spawnSpecific(x, y, type) {
        const powerUp = new PowerUp(x, y, type);
        this.powerUps.push(powerUp);
        return powerUp;
    }

    /**
     * Get random power-up type with weighted probabilities
     */
    getRandomPowerUpType() {
        const weights = [
            { type: PowerUpTypes.MULTI_BALL, weight: 15 },
            { type: PowerUpTypes.EXTEND_PADDLE, weight: 20 },
            { type: PowerUpTypes.SHRINK_PADDLE, weight: 8 },
            { type: PowerUpTypes.STICKY_PADDLE, weight: 12 },
            { type: PowerUpTypes.LASER, weight: 10 },
            { type: PowerUpTypes.MEGA_BALL, weight: 8 },
            { type: PowerUpTypes.SLOW_BALL, weight: 12 },
            { type: PowerUpTypes.FAST_BALL, weight: 5 },
            { type: PowerUpTypes.EXTRA_LIFE, weight: 5 },
            { type: PowerUpTypes.SCORE_MULTIPLIER, weight: 10 },
            { type: PowerUpTypes.AUTO_BURST, weight: 6 },
            { type: PowerUpTypes.EXPLOSIVE_NEXT, weight: 8 }
        ];

        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of weights) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }

        return PowerUpTypes.EXTEND_PADDLE;
    }

    /**
     * Update all power-ups and active effects
     */
    update(dt, paddle, canvasHeight) {
        // Update falling power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update(dt);

            // Check collection
            if (powerUp.checkCollision(paddle)) {
                this.powerUps.splice(i, 1);
                return { collected: true, type: powerUp.type };
            }

            // Remove if off screen
            if (powerUp.isOffScreen(canvasHeight)) {
                this.powerUps.splice(i, 1);
            }
        }

        // Update active effects durations
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            this.activeEffects[i].remaining -= dt;
            if (this.activeEffects[i].remaining <= 0) {
                const expired = this.activeEffects.splice(i, 1)[0];
                return { expired: true, type: expired.type };
            }
        }

        return null;
    }

    /**
     * Activate a power-up effect
     */
    activate(type) {
        // Check if this effect is already active (extend duration)
        const existing = this.activeEffects.find(e => e.type.id === type.id);
        
        if (existing && type.duration > 0) {
            existing.remaining = type.duration; // Reset duration
        } else if (type.duration > 0) {
            this.activeEffects.push({
                type: type,
                remaining: type.duration
            });
        }
    }

    /**
     * Check if a specific effect is active
     */
    isActive(typeId) {
        return this.activeEffects.some(e => e.type.id === typeId);
    }

    /**
     * Get remaining time for an effect
     */
    getRemaining(typeId) {
        const effect = this.activeEffects.find(e => e.type.id === typeId);
        return effect ? effect.remaining : 0;
    }

    /**
     * Get all active effects for UI display
     */
    getActiveEffects() {
        return this.activeEffects.map(e => ({
            name: e.type.name,
            icon: e.type.icon,
            color: e.type.color,
            remaining: e.remaining,
            duration: e.type.duration,
            percent: (e.remaining / e.type.duration) * 100
        }));
    }

    /**
     * Draw all falling power-ups
     */
    draw(ctx) {
        for (const powerUp of this.powerUps) {
            powerUp.draw(ctx);
        }
    }

    /**
     * Clear all power-ups and effects
     */
    clear() {
        this.powerUps = [];
        this.activeEffects = [];
    }

    /**
     * Remove timed effects only (keep collecting new ones)
     */
    clearEffects() {
        this.activeEffects = [];
    }
}
