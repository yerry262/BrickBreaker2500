/**
 * Brick Types - Different brick configurations
 */
const BrickTypes = {
    NORMAL: {
        id: 1,
        hits: 1,
        points: 10,
        color: '#ff6b6b',
        glowColor: 'rgba(255, 107, 107, 0.5)'
    },
    STRONG: {
        id: 2,
        hits: 2,
        points: 20,
        color: '#4ecdc4',
        glowColor: 'rgba(78, 205, 196, 0.5)'
    },
    SUPER: {
        id: 3,
        hits: 3,
        points: 30,
        color: '#45b7d1',
        glowColor: 'rgba(69, 183, 209, 0.5)'
    },
    METAL: {
        id: 4,
        hits: Infinity,
        points: 0,
        color: '#95a5a6',
        glowColor: 'rgba(149, 165, 166, 0.5)'
    },
    POWER: {
        id: 5,
        hits: 1,
        points: 50,
        color: '#f39c12',
        glowColor: 'rgba(243, 156, 18, 0.5)'
    },
    EXPLOSIVE: {
        id: 6,
        hits: 1,
        points: 25,
        color: '#e74c3c',
        glowColor: 'rgba(231, 76, 60, 0.5)'
    },
    RAINBOW: {
        id: 7,
        hits: 1,
        points: 100,
        color: '#9b59b6',
        glowColor: 'rgba(155, 89, 182, 0.5)'
    },
    MOVING: {
        id: 8,
        hits: 2,
        points: 40,
        color: '#00bcd4',
        glowColor: 'rgba(0, 188, 212, 0.5)'
    },
    MIRROR: {
        id: 9,
        hits: 2,
        points: 75,
        color: '#e0e0e0',
        glowColor: 'rgba(224, 224, 224, 0.8)'
    },
    SUPER_POWERUP: {
        id: 10,
        hits: 2,
        points: 150,
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.8)'
    }
};

// Color progression for multi-hit bricks
const HitColors = {
    3: '#45b7d1',  // Full health - blue
    2: '#4ecdc4',  // Medium - teal
    1: '#ff6b6b'   // Low - red
};

/**
 * Brick - Destructible block entity
 */
class Brick {
    constructor(x, y, width, height, type = BrickTypes.NORMAL) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.maxHits = type.hits;
        this.hitsRemaining = type.hits;
        this.points = type.points;
        this.baseColor = type.color;
        this.color = type.color;
        this.glowColor = type.glowColor;
        this.destroyed = false;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeTime = 0;
        
        // Animation properties
        this.scale = 1;
        this.alpha = 1;
        this.destroying = false;
        this.destroyTime = 0;
        
        // Rainbow brick animation
        this.rainbowHue = Math.random() * 360;
        
        // Hidden power-up (assigned by LevelManager)
        this.hiddenPowerUp = null;
        this.powerUpAnimTime = Math.random() * Math.PI * 2; // Random start phase
        this.shimmerOffset = 0;
        
        // Movement properties (for MOVING brick type)
        this.isMoving = false;
        this.moveTargetX = x;
        this.moveTargetY = y;
        this.moveSpeed = 5;
        this.originalX = x;
        this.originalY = y;
        
        // Mirror brick properties
        this.isClone = false;
        this.originalBrick = null; // Reference to original for clones
        this.clones = []; // Track clones created by this brick
        this.maxClones = 3;
        
        // Mirror animation
        this.mirrorShine = 0;
        this.mirrorShineSpeed = 2;
    }

    hit() {
        if (this.destroyed || this.hitsRemaining === Infinity) {
            // Metal brick - just shake
            if (this.hitsRemaining === Infinity) {
                this.shake();
            }
            return { destroyed: false, points: 0 };
        }

        this.hitsRemaining--;
        this.shake();
        
        // Mirror brick creates clone on FIRST hit (not when destroyed) - stays in place!
        const shouldCreateClone = this.type === BrickTypes.MIRROR && 
                                  this.hitsRemaining === 1 && 
                                  !this.isClone && 
                                  this.clones.length < this.maxClones;
        
        // Moving brick teleports when hit (if not destroyed)
        const shouldTeleport = this.type === BrickTypes.MOVING && this.hitsRemaining > 0;

        // Update color based on remaining hits (only for non-powerup bricks)
        if (this.hitsRemaining > 0 && this.maxHits > 1 && !this.hiddenPowerUp) {
            this.color = HitColors[this.hitsRemaining] || this.type.color;
        }

        if (this.hitsRemaining <= 0) {
            this.startDestroy();
            
            // Check if this is a clone being destroyed - if so, mark original for bonus
            const isCloneDestroyed = this.isClone;
            const originalRef = this.originalBrick;
            
            return { 
                destroyed: true, 
                points: this.points,
                dropPowerUp: this.type === BrickTypes.POWER || this.hiddenPowerUp !== null || this.type === BrickTypes.SUPER_POWERUP,
                hiddenPowerUp: this.hiddenPowerUp,
                explosive: this.type === BrickTypes.EXPLOSIVE,
                createClone: false, // Clone creation happens on first hit, not destruction
                isClone: isCloneDestroyed,
                originalBrick: originalRef,
                isSuperPowerup: this.type === BrickTypes.SUPER_POWERUP
            };
        }

        return { destroyed: false, points: 5, shouldTeleport: shouldTeleport, createClone: shouldCreateClone }; // Partial hit points
    }
    
    /**
     * Set a new target position for the brick to move to
     */
    setMoveTarget(x, y) {
        this.moveTargetX = x;
        this.moveTargetY = y;
        this.isMoving = true;
    }

    /**
     * Assign a hidden power-up to this brick
     */
    setHiddenPowerUp(powerUpType) {
        this.hiddenPowerUp = powerUpType;
        this.glowColor = powerUpType.color;
    }

    shake() {
        this.shakeTime = 0.15;
    }

    startDestroy() {
        this.destroying = true;
        this.destroyTime = 0.2;
    }

    update(dt) {
        // Update shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            this.shakeOffset.x = (Math.random() - 0.5) * 4;
            this.shakeOffset.y = (Math.random() - 0.5) * 4;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }

        // Update destroy animation
        if (this.destroying) {
            this.destroyTime -= dt;
            this.scale = Math.max(0, this.destroyTime / 0.2);
            this.alpha = this.scale;
            
            if (this.destroyTime <= 0) {
                this.destroyed = true;
            }
        }

        // Rainbow brick color cycling
        if (this.type === BrickTypes.RAINBOW && !this.destroying) {
            this.rainbowHue = (this.rainbowHue + 2) % 360;
            this.color = `hsl(${this.rainbowHue}, 70%, 60%)`;
        }
        
        // Power-up brick shimmer animation
        if (this.hiddenPowerUp && !this.destroying) {
            this.powerUpAnimTime += dt * 3;
            this.shimmerOffset = Math.sin(this.powerUpAnimTime) * 0.5 + 0.5;
        }
        
        // Smooth movement for moving bricks
        if (this.isMoving) {
            const dx = this.moveTargetX - this.x;
            const dy = this.moveTargetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 2) {
                this.x = this.moveTargetX;
                this.y = this.moveTargetY;
                this.isMoving = false;
            } else {
                const speed = this.moveSpeed * 60 * dt;
                this.x += (dx / dist) * Math.min(speed, dist);
                this.y += (dy / dist) * Math.min(speed, dist);
            }
        }
        
        // Moving brick visual pulse
        if (this.type === BrickTypes.MOVING && !this.destroying) {
            this.powerUpAnimTime += dt * 4;
        }
        
        // Mirror brick shine animation
        if (this.type === BrickTypes.MIRROR && !this.destroying) {
            this.mirrorShine = (this.mirrorShine + dt * this.mirrorShineSpeed) % (Math.PI * 2);
        }
    }

    checkCollision(ball) {
        if (this.destroyed) return null;

        const ballLeft = ball.position.x - ball.radius;
        const ballRight = ball.position.x + ball.radius;
        const ballTop = ball.position.y - ball.radius;
        const ballBottom = ball.position.y + ball.radius;

        const brickLeft = this.x;
        const brickRight = this.x + this.width;
        const brickTop = this.y;
        const brickBottom = this.y + this.height;

        // Check if ball overlaps brick
        if (ballRight >= brickLeft && ballLeft <= brickRight &&
            ballBottom >= brickTop && ballTop <= brickBottom) {
            
            // Determine collision side
            const overlapLeft = ballRight - brickLeft;
            const overlapRight = brickRight - ballLeft;
            const overlapTop = ballBottom - brickTop;
            const overlapBottom = brickBottom - ballTop;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
                // Horizontal collision
                return { axis: 'x', side: overlapLeft < overlapRight ? 'left' : 'right' };
            } else {
                // Vertical collision
                return { axis: 'y', side: overlapTop < overlapBottom ? 'top' : 'bottom' };
            }
        }

        return null;
    }

    draw(ctx) {
        if (this.destroyed) return;

        ctx.save();
        
        // Apply scale and alpha for destroy animation
        if (this.destroying) {
            ctx.globalAlpha = this.alpha;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-centerX, -centerY);
        }

        const drawX = this.x + this.shakeOffset.x;
        const drawY = this.y + this.shakeOffset.y;

        // Draw glow for special bricks and power-up bricks
        if (this.type === BrickTypes.POWER || this.type === BrickTypes.RAINBOW || this.hiddenPowerUp) {
            ctx.shadowColor = this.hiddenPowerUp ? this.hiddenPowerUp.color : this.glowColor;
            ctx.shadowBlur = 15 + (this.hiddenPowerUp ? Math.sin(this.powerUpAnimTime * 2) * 5 : 0);
        }

        // Draw brick body with power-up color effect
        if (this.hiddenPowerUp && !this.destroying) {
            // Create animated gradient between base color and power-up color
            const gradient = ctx.createLinearGradient(drawX, drawY, drawX + this.width, drawY);
            const powerColor = this.hiddenPowerUp.color;
            const shimmer = this.shimmerOffset;
            
            gradient.addColorStop(0, this.baseColor);
            gradient.addColorStop(0.3 + shimmer * 0.2, powerColor);
            gradient.addColorStop(0.5, this.baseColor);
            gradient.addColorStop(0.7 - shimmer * 0.2, powerColor);
            gradient.addColorStop(1, this.baseColor);
            
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, this.width, this.height, 4);
        ctx.fill();

        // Draw gradient overlay
        const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, this.width, this.height, 4);
        ctx.fill();
        
        // Mirror brick shine effect
        if (this.type === BrickTypes.MIRROR && !this.destroying) {
            const shineGradient = ctx.createLinearGradient(
                drawX + Math.sin(this.mirrorShine) * this.width * 0.5,
                drawY,
                drawX + this.width * 0.5 + Math.sin(this.mirrorShine) * this.width * 0.5,
                drawY + this.height
            );
            shineGradient.addColorStop(0, 'transparent');
            shineGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
            shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
            shineGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)');
            shineGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = shineGradient;
            ctx.beginPath();
            ctx.roundRect(drawX, drawY, this.width, this.height, 4);
            ctx.fill();
        }

        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, this.width, this.height, 4);
        ctx.stroke();

        // Draw hit indicator for multi-hit bricks (always show hits remaining)
        if (this.hitsRemaining > 1 && this.maxHits !== Infinity && !this.destroying) {
            // Draw dark background circle for better visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(drawX + this.width / 2, drawY + this.height / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                this.hitsRemaining.toString(),
                drawX + this.width / 2,
                drawY + this.height / 2
            );
        }

        // Draw metal pattern for metal bricks
        if (this.type === BrickTypes.METAL) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(drawX + 5 + i * 15, drawY + 5);
                ctx.lineTo(drawX + 5 + i * 15, drawY + this.height - 5);
                ctx.stroke();
            }
        }

        // Draw power-up icon for power bricks or bricks with hidden power-ups
        if (this.type === BrickTypes.POWER || this.hiddenPowerUp) {
            // Only show icon if not showing hit count
            if (this.hitsRemaining <= 1 || this.maxHits === 1) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icon = this.hiddenPowerUp ? this.hiddenPowerUp.icon : '⭐';
                ctx.fillText(icon, drawX + this.width / 2, drawY + this.height / 2);
            }
        }

        // Draw explosive indicator
        if (this.type === BrickTypes.EXPLOSIVE) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💥', drawX + this.width / 2, drawY + this.height / 2);
        }
        
        // Draw moving brick indicator (arrows)
        if (this.type === BrickTypes.MOVING && this.hitsRemaining <= 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('↔', drawX + this.width / 2, drawY + this.height / 2);
        }
        
        // Draw mirror brick indicator
        if (this.type === BrickTypes.MIRROR) {
            ctx.fillStyle = this.isClone ? 'rgba(100, 149, 237, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.isClone ? '🔄' : '🪞', drawX + this.width / 2, drawY + this.height / 2);
        }
        
        // Draw super power-up brick indicator (rainbow star)
        if (this.type === BrickTypes.SUPER_POWERUP) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌟', drawX + this.width / 2, drawY + this.height / 2);
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
