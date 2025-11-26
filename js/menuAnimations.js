/**
 * MenuAnimations - Dynamic menu brick animations and demo ball
 * Creates engaging visual effects on the main menu
 */
class MenuAnimations {
    constructor() {
        this.bricks = [];
        this.demoBall = null;
        this.animationFrame = null;
        this.patternInterval = null;
        this.demoBallTimeout = null;
        this.currentPattern = 0;
        this.time = 0;
        this.isActive = false;
        
        // Demo ball properties
        this.ballX = 0;
        this.ballY = 0;
        this.ballVX = 0;
        this.ballVY = 0;
        this.ballRadius = 8;
        this.ballActive = false;
        this.ballTrail = [];
        
        // Animation patterns - each returns transform values for a brick
        this.patterns = [
            this.sineWave.bind(this),
            this.cosineWave.bind(this),
            this.alternatingSineWave.bind(this),
            this.rowWave.bind(this),
            this.columnWave.bind(this),
            this.diagonalWave.bind(this),
            this.circularMotion.bind(this),
            this.breathe.bind(this),
            this.cascade.bind(this),
            this.mexicanWave.bind(this),
            this.bounce.bind(this),
            this.zigzag.bind(this),
            this.pulse.bind(this),
            this.spiral.bind(this),
            this.randomJitter.bind(this),
            this.heartbeat.bind(this),
            this.pendulum.bind(this),
            this.ripple.bind(this)
        ];
        
        this.patternDuration = 5000; // 5 seconds per pattern
    }
    
    /**
     * Initialize the menu animations
     */
    init() {
        this.bricks = document.querySelectorAll('.menu-brick');
        this.createDemoBall();
        this.isActive = true;
        this.time = 0;
        
        // Start animation loop
        this.animate();
        
        // Change pattern every few seconds
        this.schedulePatternChange();
        
        // Schedule demo ball launch
        this.scheduleDemoBall();
    }
    
    /**
     * Create the demo ball element
     */
    createDemoBall() {
        // Remove existing demo ball if any
        const existing = document.querySelector('.demo-ball');
        if (existing) existing.remove();
        
        this.demoBall = document.createElement('div');
        this.demoBall.className = 'demo-ball';
        this.demoBall.style.cssText = `
            position: absolute;
            width: ${this.ballRadius * 2}px;
            height: ${this.ballRadius * 2}px;
            background: radial-gradient(circle at 30% 30%, #fff, #4ecdc4);
            border-radius: 50%;
            pointer-events: none;
            z-index: 5;
            opacity: 0;
            box-shadow: 0 0 10px rgba(78, 205, 196, 0.8), 0 0 20px rgba(78, 205, 196, 0.4);
            transition: opacity 0.3s;
        `;
        
        const menu = document.getElementById('menu');
        if (menu) {
            menu.appendChild(this.demoBall);
        }
    }
    
    /**
     * Schedule the next pattern change
     */
    schedulePatternChange() {
        if (this.patternInterval) clearInterval(this.patternInterval);
        
        this.patternInterval = setInterval(() => {
            if (!this.isActive) return;
            
            // Pick a random pattern different from current
            let newPattern;
            do {
                newPattern = Math.floor(Math.random() * this.patterns.length);
            } while (newPattern === this.currentPattern && this.patterns.length > 1);
            
            this.currentPattern = newPattern;
            this.time = 0; // Reset time for smooth transition
        }, this.patternDuration);
    }
    
    /**
     * Schedule random demo ball launches
     */
    scheduleDemoBall() {
        const scheduleNext = () => {
            if (!this.isActive) return;
            
            // Random delay between 8-20 seconds
            const delay = 8000 + Math.random() * 12000;
            
            this.demoBallTimeout = setTimeout(() => {
                if (this.isActive && !this.ballActive) {
                    this.launchDemoBall();
                }
                scheduleNext();
            }, delay);
        };
        
        // Initial launch after 3-8 seconds
        this.demoBallTimeout = setTimeout(() => {
            if (this.isActive) {
                this.launchDemoBall();
            }
            scheduleNext();
        }, 3000 + Math.random() * 5000);
    }
    
    /**
     * Launch the demo ball
     */
    launchDemoBall() {
        if (!this.demoBall || !this.isActive) return;
        
        const menu = document.getElementById('menu');
        if (!menu) return;
        
        const rect = menu.getBoundingClientRect();
        
        // Start from a random edge
        const edge = Math.floor(Math.random() * 4);
        const speed = 3 + Math.random() * 2;
        
        switch (edge) {
            case 0: // Top
                this.ballX = Math.random() * rect.width;
                this.ballY = -this.ballRadius;
                this.ballVX = (Math.random() - 0.5) * speed;
                this.ballVY = speed;
                break;
            case 1: // Right
                this.ballX = rect.width + this.ballRadius;
                this.ballY = Math.random() * rect.height;
                this.ballVX = -speed;
                this.ballVY = (Math.random() - 0.5) * speed;
                break;
            case 2: // Bottom
                this.ballX = Math.random() * rect.width;
                this.ballY = rect.height + this.ballRadius;
                this.ballVX = (Math.random() - 0.5) * speed;
                this.ballVY = -speed;
                break;
            case 3: // Left
                this.ballX = -this.ballRadius;
                this.ballY = Math.random() * rect.height;
                this.ballVX = speed;
                this.ballVY = (Math.random() - 0.5) * speed;
                break;
        }
        
        this.ballTrail = [];
        this.ballActive = true;
        this.demoBall.style.opacity = '1';
    }
    
    /**
     * Update demo ball position
     */
    updateDemoBall() {
        if (!this.ballActive || !this.demoBall) return;
        
        const menu = document.getElementById('menu');
        if (!menu) return;
        
        const rect = menu.getBoundingClientRect();
        
        // Move ball
        this.ballX += this.ballVX;
        this.ballY += this.ballVY;
        
        // Add to trail
        this.ballTrail.push({ x: this.ballX, y: this.ballY });
        if (this.ballTrail.length > 10) this.ballTrail.shift();
        
        // Bounce off walls (except bottom - it wraps around)
        if (this.ballX <= this.ballRadius) {
            this.ballX = this.ballRadius;
            this.ballVX = Math.abs(this.ballVX);
        } else if (this.ballX >= rect.width - this.ballRadius) {
            this.ballX = rect.width - this.ballRadius;
            this.ballVX = -Math.abs(this.ballVX);
        }
        
        if (this.ballY <= this.ballRadius) {
            this.ballY = this.ballRadius;
            this.ballVY = Math.abs(this.ballVY);
        }
        
        // Check collision with menu bricks
        this.checkBrickCollisions();
        
        // If ball goes way off screen, deactivate it
        if (this.ballY > rect.height + 100 || 
            this.ballX < -100 || 
            this.ballX > rect.width + 100 ||
            this.ballY < -100) {
            this.ballActive = false;
            this.demoBall.style.opacity = '0';
        }
        
        // Update ball position
        this.demoBall.style.left = `${this.ballX - this.ballRadius}px`;
        this.demoBall.style.top = `${this.ballY - this.ballRadius}px`;
    }
    
    /**
     * Check collision with menu bricks
     */
    checkBrickCollisions() {
        this.bricks.forEach(brick => {
            // Skip destroyed bricks
            if (brick.classList.contains('destroyed')) return;
            
            const rect = brick.getBoundingClientRect();
            const menuRect = document.getElementById('menu').getBoundingClientRect();
            
            // Convert to menu-relative coordinates
            const brickLeft = rect.left - menuRect.left;
            const brickTop = rect.top - menuRect.top;
            const brickRight = brickLeft + rect.width;
            const brickBottom = brickTop + rect.height;
            
            // Simple AABB collision
            if (this.ballX + this.ballRadius > brickLeft &&
                this.ballX - this.ballRadius < brickRight &&
                this.ballY + this.ballRadius > brickTop &&
                this.ballY - this.ballRadius < brickBottom) {
                
                // Determine bounce direction
                const overlapLeft = (this.ballX + this.ballRadius) - brickLeft;
                const overlapRight = brickRight - (this.ballX - this.ballRadius);
                const overlapTop = (this.ballY + this.ballRadius) - brickTop;
                const overlapBottom = brickBottom - (this.ballY - this.ballRadius);
                
                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);
                
                if (minOverlapX < minOverlapY) {
                    this.ballVX = -this.ballVX;
                    this.ballX += this.ballVX > 0 ? minOverlapX : -minOverlapX;
                } else {
                    this.ballVY = -this.ballVY;
                    this.ballY += this.ballVY > 0 ? minOverlapY : -minOverlapY;
                }
                
                // Destroy the brick!
                this.destroyBrick(brick);
            }
        });
    }
    
    /**
     * Destroy a brick and respawn it after a delay
     */
    destroyBrick(brick) {
        brick.classList.add('destroyed');
        
        // Respawn brick after 3-6 seconds
        const respawnDelay = 3000 + Math.random() * 3000;
        setTimeout(() => {
            if (this.isActive) {
                brick.classList.remove('destroyed');
            }
        }, respawnDelay);
    }
    
    /**
     * Main animation loop
     */
    animate() {
        if (!this.isActive) return;
        
        this.time += 0.016; // ~60fps
        
        // Apply current pattern to bricks
        this.bricks.forEach((brick, index) => {
            const transform = this.patterns[this.currentPattern](index, this.bricks.length, this.time);
            brick.style.transform = transform;
        });
        
        // Update demo ball
        this.updateDemoBall();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    // ==================== ANIMATION PATTERNS ====================
    
    /**
     * Classic sine wave - all bricks move up/down in a wave
     */
    sineWave(index, total, time) {
        const y = Math.sin(time * 3 + index * 0.5) * 12;
        return `translateY(${y}px)`;
    }
    
    /**
     * Cosine wave with horizontal movement
     */
    cosineWave(index, total, time) {
        const x = Math.cos(time * 2 + index * 0.3) * 8;
        const y = Math.sin(time * 2.5 + index * 0.4) * 10;
        return `translate(${x}px, ${y}px)`;
    }
    
    /**
     * Alternating sine - odd/even bricks move opposite
     */
    alternatingSineWave(index, total, time) {
        const direction = index % 2 === 0 ? 1 : -1;
        const y = Math.sin(time * 3) * 15 * direction;
        return `translateY(${y}px)`;
    }
    
    /**
     * Row-based wave - each row moves together
     */
    rowWave(index, total, time) {
        const row = Math.floor(index / 9);
        const y = Math.sin(time * 2.5 + row * 1.2) * 12;
        const x = Math.cos(time * 2 + row * 0.8) * 5;
        return `translate(${x}px, ${y}px)`;
    }
    
    /**
     * Column-based wave
     */
    columnWave(index, total, time) {
        const col = index % 9;
        const y = Math.sin(time * 2 + col * 0.7) * 15;
        return `translateY(${y}px)`;
    }
    
    /**
     * Diagonal wave effect
     */
    diagonalWave(index, total, time) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const diagonal = row + col;
        const y = Math.sin(time * 2.5 + diagonal * 0.4) * 12;
        return `translateY(${y}px)`;
    }
    
    /**
     * Circular motion - bricks orbit in small circles
     */
    circularMotion(index, total, time) {
        const phase = index * 0.4;
        const x = Math.cos(time * 2 + phase) * 6;
        const y = Math.sin(time * 2 + phase) * 6;
        return `translate(${x}px, ${y}px)`;
    }
    
    /**
     * Breathing effect - all expand and contract
     */
    breathe(index, total, time) {
        const scale = 1 + Math.sin(time * 1.5) * 0.15;
        const y = Math.sin(time * 1.5) * -5;
        return `translateY(${y}px) scale(${scale})`;
    }
    
    /**
     * Cascade - wave that travels from left to right
     */
    cascade(index, total, time) {
        const col = index % 9;
        const delay = col * 0.3;
        const y = Math.sin(time * 4 - delay) * 10;
        const visible = Math.sin(time * 4 - delay) > -0.5;
        return `translateY(${y}px)`;
    }
    
    /**
     * Mexican wave / stadium wave effect
     */
    mexicanWave(index, total, time) {
        const position = index / total;
        const wavePos = (time * 0.5) % 1;
        const dist = Math.abs(position - wavePos);
        const wave = dist < 0.15 ? Math.sin((1 - dist / 0.15) * Math.PI) : 0;
        const y = -wave * 20;
        const scale = 1 + wave * 0.2;
        return `translateY(${y}px) scale(${scale})`;
    }
    
    /**
     * Bouncy effect
     */
    bounce(index, total, time) {
        const phase = index * 0.2;
        const bounce = Math.abs(Math.sin(time * 4 + phase));
        const y = -bounce * 15;
        return `translateY(${y}px)`;
    }
    
    /**
     * Zigzag pattern
     */
    zigzag(index, total, time) {
        const row = Math.floor(index / 9);
        const direction = row % 2 === 0 ? 1 : -1;
        const x = Math.sin(time * 3) * 10 * direction;
        const y = Math.cos(time * 2 + index * 0.1) * 5;
        return `translate(${x}px, ${y}px)`;
    }
    
    /**
     * Pulse from center
     */
    pulse(index, total, time) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const centerRow = 1;
        const centerCol = 4;
        const dist = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
        const wave = Math.sin(time * 3 - dist * 0.8) * 10;
        return `translateY(${wave}px)`;
    }
    
    /**
     * Spiral motion
     */
    spiral(index, total, time) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const angle = time * 2 + (row * 9 + col) * 0.2;
        const radius = 5 + Math.sin(time) * 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return `translate(${x}px, ${y}px)`;
    }
    
    /**
     * Random jitter/shake
     */
    randomJitter(index, total, time) {
        // Use deterministic "random" based on time and index
        const seed = Math.sin(time * 10 + index * 100) * 10000;
        const x = (seed % 10) - 5;
        const y = ((seed * 1.5) % 10) - 5;
        return `translate(${x}px, ${y}px)`;
    }
    
    /**
     * Heartbeat effect
     */
    heartbeat(index, total, time) {
        const beat = Math.sin(time * 6);
        const scale = beat > 0.7 ? 1.15 : (beat > 0.5 ? 1.1 : 1);
        return `scale(${scale})`;
    }
    
    /**
     * Pendulum swing
     */
    pendulum(index, total, time) {
        const col = index % 9;
        const centerCol = 4;
        const distFromCenter = col - centerCol;
        const swing = Math.sin(time * 2) * distFromCenter * 3;
        const y = Math.abs(swing) * 0.5;
        return `translate(${swing}px, ${y}px)`;
    }
    
    /**
     * Ripple effect from random point
     */
    ripple(index, total, time) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        // Ripple originates from center
        const dist = Math.sqrt(Math.pow(row - 1, 2) + Math.pow(col - 4, 2));
        const wave = Math.sin(time * 4 - dist * 1.5);
        const y = wave * 8;
        const scale = 1 + wave * 0.1;
        return `translateY(${y}px) scale(${scale})`;
    }
    
    /**
     * Stop all animations
     */
    stop() {
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.patternInterval) {
            clearInterval(this.patternInterval);
            this.patternInterval = null;
        }
        
        if (this.demoBallTimeout) {
            clearTimeout(this.demoBallTimeout);
            this.demoBallTimeout = null;
        }
        
        // Reset brick transforms and restore destroyed bricks
        this.bricks.forEach(brick => {
            brick.style.transform = '';
            brick.classList.remove('destroyed');
        });
        
        // Hide demo ball
        if (this.demoBall) {
            this.demoBall.style.opacity = '0';
            this.ballActive = false;
        }
    }
    
    /**
     * Restart animations
     */
    restart() {
        this.stop();
        setTimeout(() => this.init(), 100);
    }
}

// Create global instance
window.menuAnimations = new MenuAnimations();
