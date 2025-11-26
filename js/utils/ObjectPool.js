/**
 * ObjectPool - Efficient object reuse for particles and effects
 */
class ObjectPool {
    constructor(createFn, initialSize = 50) {
        this.createFn = createFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    }

    getActive() {
        return this.active;
    }

    getActiveCount() {
        return this.active.length;
    }

    getPoolSize() {
        return this.pool.length;
    }
}

/**
 * Particle class for visual effects
 */
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 1;
        this.maxLife = 1;
        this.size = 5;
        this.color = '#ffffff';
        this.gravity = 0;
        this.friction = 0.98;
        this.shrink = true;
    }

    init(x, y, vx, vy, life, size, color, gravity = 0.1) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.gravity = gravity;
        return this;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const currentSize = this.shrink ? this.size * alpha : this.size;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * ParticleSystem - Manages particle pools and effects
 */
class ParticleSystem {
    constructor(maxParticles = 200) {
        this.pool = new ObjectPool(() => new Particle(), maxParticles);
    }

    emit(x, y, count, options = {}) {
        const {
            color = '#ffffff',
            minSpeed = 1,
            maxSpeed = 5,
            minLife = 0.3,
            maxLife = 1,
            minSize = 2,
            maxSize = 6,
            gravity = 0.1,
            spread = Math.PI * 2,
            direction = -Math.PI / 2
        } = options;

        for (let i = 0; i < count; i++) {
            if (this.pool.getActiveCount() >= 200) break;
            
            const particle = this.pool.acquire();
            const angle = direction + (Math.random() - 0.5) * spread;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const life = minLife + Math.random() * (maxLife - minLife);
            const size = minSize + Math.random() * (maxSize - minSize);
            
            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                life, size, color, gravity
            );
        }
    }

    update(dt) {
        const particles = this.pool.getActive();
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].update(dt)) {
                this.pool.release(particles[i]);
            }
        }
    }

    draw(ctx) {
        const particles = this.pool.getActive();
        for (const particle of particles) {
            particle.draw(ctx);
        }
    }

    clear() {
        this.pool.releaseAll();
    }
}
