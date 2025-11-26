/**
 * Paddle - Player-controlled paddle for bouncing the ball
 */
class Paddle {
    constructor(x, y, width = 80, height = 12) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.width = width;
        this.height = height;
        this.baseWidth = width;
        this.minWidth = 40;
        this.maxWidth = 150;
        
        // Physics properties
        this.acceleration = 1.5;
        this.maxSpeed = 12;
        this.isMoving = false;
        
        this.color = '#4ecdc4';
        this.glowColor = 'rgba(78, 205, 196, 0.5)';
        
        // Power-up states
        this.isSticky = false;
        this.hasLaser = false;
        this.laserCooldown = 0;
        this.laserCooldownTime = 0.3; // seconds between shots
    }

    reset(x, y) {
        this.position.set(x, y);
        this.velocity.set(0, 0);
        this.width = this.baseWidth;
        this.isSticky = false;
        this.hasLaser = false;
        this.laserCooldown = 0;
        this.color = '#4ecdc4';
    }

    moveLeft() {
        this.velocity.x -= this.acceleration;
        if (this.velocity.x < -this.maxSpeed) this.velocity.x = -this.maxSpeed;
        this.isMoving = true;
    }

    moveRight() {
        this.velocity.x += this.acceleration;
        if (this.velocity.x > this.maxSpeed) this.velocity.x = this.maxSpeed;
        this.isMoving = true;
    }

    update(dt, canvasWidth) {
        // Instant deceleration if no input
        if (!this.isMoving) {
            this.velocity.x = 0;
        }
        
        // Update position
        this.position.x += this.velocity.x;
        
        // Reset input flag
        this.isMoving = false;
        
        // Boundary constraints
        const halfWidth = this.width / 2;
        if (this.position.x - halfWidth < 0) {
            this.position.x = halfWidth;
            this.velocity.x = 0;
        } else if (this.position.x + halfWidth > canvasWidth) {
            this.position.x = canvasWidth - halfWidth;
            this.velocity.x = 0;
        }

        // Update laser cooldown
        if (this.laserCooldown > 0) {
            this.laserCooldown -= dt;
        }
    }

    // Direct position set for touch/mouse control
    setTargetX(x, canvasWidth) {
        const halfWidth = this.width / 2;
        this.position.x = Math.max(halfWidth, Math.min(canvasWidth - halfWidth, x));
    }

    checkBallCollision(ball) {
        // Check if ball is within paddle bounds
        const ballBottom = ball.position.y + ball.radius;
        const ballTop = ball.position.y - ball.radius;
        const ballLeft = ball.position.x - ball.radius;
        const ballRight = ball.position.x + ball.radius;

        const paddleTop = this.position.y;
        const paddleBottom = this.position.y + this.height;
        const paddleLeft = this.position.x - this.width / 2;
        const paddleRight = this.position.x + this.width / 2;

        // Ball must be moving downward and overlap with paddle
        if (ball.velocity.y > 0 &&
            ballBottom >= paddleTop &&
            ballTop <= paddleBottom &&
            ballRight >= paddleLeft &&
            ballLeft <= paddleRight) {
            return true;
        }
        return false;
    }

    extend(amount = 20) {
        this.width = Math.min(this.width + amount, this.maxWidth);
    }

    shrink(amount = 20) {
        this.width = Math.max(this.width - amount, this.minWidth);
    }

    setSticky(enabled) {
        this.isSticky = enabled;
        if (enabled) {
            this.color = '#ffd700';
            this.glowColor = 'rgba(255, 215, 0, 0.5)';
        } else {
            this.color = '#4ecdc4';
            this.glowColor = 'rgba(78, 205, 196, 0.5)';
        }
    }

    setLaser(enabled) {
        this.hasLaser = enabled;
        if (enabled) {
            this.color = '#ff6b6b';
            this.glowColor = 'rgba(255, 107, 107, 0.5)';
        } else if (!this.isSticky) {
            this.color = '#4ecdc4';
            this.glowColor = 'rgba(78, 205, 196, 0.5)';
        }
    }

    canShootLaser() {
        return this.hasLaser && this.laserCooldown <= 0;
    }

    shootLaser() {
        if (!this.canShootLaser()) return null;
        this.laserCooldown = this.laserCooldownTime;
        return {
            x: this.position.x,
            y: this.position.y - 5,
            width: 4,
            height: 15,
            speed: 12
        };
    }

    draw(ctx) {
        const x = this.position.x - this.width / 2;
        const y = this.position.y;

        // Draw glow
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 20;

        // Draw paddle body with rounded corners
        const radius = this.height / 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(x, y, this.width, this.height, radius);
        ctx.fill();

        // Draw gradient overlay
        const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, this.width, this.height, radius);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw laser indicators if laser power-up active
        if (this.hasLaser) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(x + 10, y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.arc(x + this.width - 10, y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw sticky indicator
        if (this.isSticky) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.roundRect(x + 5, y + 2, this.width - 10, 3, 1);
            ctx.fill();
        }
    }
}
