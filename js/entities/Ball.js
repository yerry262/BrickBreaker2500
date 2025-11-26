/**
 * Ball - The bouncing ball entity that breaks bricks
 */
class Ball {
    constructor(x, y, radius = 8, level = 1, speedScale = 1) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.radius = radius;
        this.speedScale = speedScale; // Scale speed based on screen size
        
        // Set base speed based on level, then scale for screen size
        let baseSpeedValue;
        if (level <= 5) {
            baseSpeedValue = 6;
        } else if (level <= 10) {
            baseSpeedValue = 8;
        } else {
            baseSpeedValue = 10;
        }
        
        this.baseSpeed = baseSpeedValue * speedScale;
        this.speed = this.baseSpeed;
        this.maxSpeed = 12 * speedScale;
        this.launched = false;
        this.trail = [];
        this.maxTrailLength = 10;
        this.color = '#ffffff';
        this.glowColor = '#4ecdc4';
        
        // Power-up states
        this.isMega = false;
        this.isFireball = false;
    }

    reset(x, y) {
        this.position.set(x, y);
        this.velocity.set(0, 0);
        this.speed = this.baseSpeed;
        this.launched = false;
        this.trail = [];
        this.isMega = false;
        this.isFireball = false;
        this.color = '#ffffff';
        this.glowColor = '#4ecdc4';
    }

    launch(angle = -Math.PI / 2) {
        if (this.launched) return;
        
        // Add slight randomness to angle (-15 to 15 degrees)
        const randomOffset = (Math.random() - 0.5) * (Math.PI / 6);
        const finalAngle = angle + randomOffset;
        
        this.velocity = Vector2.fromAngle(finalAngle, this.speed);
        this.launched = true;
    }

    update(dt, canvasWidth, canvasHeight) {
        if (!this.launched) return { wallHit: null };

        // Update trail
        this.trail.push({ x: this.position.x, y: this.position.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Move ball
        this.position.add(Vector2.multiply(this.velocity, dt * 60));

        // Track wall hits for sound effects
        let wallHit = null;

        // Wall collisions
        if (this.position.x - this.radius <= 0) {
            this.position.x = this.radius;
            this.velocity.x = Math.abs(this.velocity.x);
            wallHit = 'left';
        } else if (this.position.x + this.radius >= canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.velocity.x = -Math.abs(this.velocity.x);
            wallHit = 'right';
        }

        // Top wall collision
        if (this.position.y - this.radius <= 0) {
            this.position.y = this.radius;
            this.velocity.y = Math.abs(this.velocity.y);
            wallHit = 'top';
        }

        // Ensure minimum vertical velocity to prevent horizontal loops
        const minVerticalVelocity = 1;
        if (Math.abs(this.velocity.y) < minVerticalVelocity) {
            this.velocity.y = this.velocity.y >= 0 ? minVerticalVelocity : -minVerticalVelocity;
            this.velocity.normalize().multiply(this.speed);
        }

        return { wallHit };
    }

    isOutOfBounds(canvasHeight) {
        return this.position.y - this.radius > canvasHeight;
    }

    bounceOffPaddle(paddle) {
        // Calculate where the ball hit the paddle (0 = left edge, 1 = right edge)
        const hitPoint = (this.position.x - paddle.position.x) / paddle.width;
        
        // Convert to angle: -60 degrees (left) to -120 degrees (right)
        // This gives us angles that go up and to the sides
        const angle = -Math.PI / 2 + (hitPoint - 0.5) * (Math.PI / 3);
        
        // Set velocity based on angle
        this.velocity = Vector2.fromAngle(angle, this.speed);
        
        // Ensure ball is above paddle
        this.position.y = paddle.position.y - this.radius - 1;
        
        // Add some of paddle's velocity for more dynamic bouncing
        this.velocity.x += paddle.velocity.x * 0.3;
        
        // Normalize and set speed
        this.velocity.normalize().multiply(this.speed);
    }

    speedUp(amount = 0.2) {
        this.speed = Math.min(this.speed + amount, this.maxSpeed);
        this.velocity.normalize().multiply(this.speed);
    }

    setMega(enabled) {
        this.isMega = enabled;
        if (enabled) {
            this.color = '#ff6b6b';
            this.glowColor = '#ff0000';
            this.radius = 12;
        } else {
            this.color = '#ffffff';
            this.glowColor = '#4ecdc4';
            this.radius = 8;
        }
    }

    setFireball(enabled) {
        this.isFireball = enabled;
        if (enabled) {
            this.color = '#ffa500';
            this.glowColor = '#ff4500';
        } else if (!this.isMega) {
            this.color = '#ffffff';
            this.glowColor = '#4ecdc4';
        }
    }

    draw(ctx) {
        // Draw trail
        if (this.launched && this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = this.glowColor;
            ctx.lineWidth = this.radius * 0.8;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw glow
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius * 2
        );
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw ball
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(
            this.position.x - this.radius * 0.3,
            this.position.y - this.radius * 0.3,
            this.radius * 0.3,
            0, Math.PI * 2
        );
        ctx.fill();
    }
}
