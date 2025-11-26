/**
 * Renderer - Handles all canvas drawing operations
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Background stars
        this.stars = this.generateStars(100);
        
        // Floating particles for enhanced background
        this.bgParticles = this.generateBgParticles(30);
        
        // Color wave state
        this.colorWaveOffset = 0;
        
        // Reactive pulse (triggered by events)
        this.pulseIntensity = 0;
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * 600,
                y: Math.random() * 800,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 2 + 1
            });
        }
        return stars;
    }

    generateBgParticles(count) {
        const particles = [];
        const colors = ['#4ecdc4', '#ff6b6b', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * 600,
                y: Math.random() * 800,
                size: Math.random() * 20 + 10,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: Math.random() * 0.3 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.2 + 0.05,
                pulse: Math.random() * Math.PI * 2
            });
        }
        return particles;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.stars = this.generateStars(100);
        this.bgParticles = this.generateBgParticles(30);
    }

    /**
     * Trigger a reactive pulse (call when something exciting happens)
     */
    triggerPulse(intensity = 1) {
        this.pulseIntensity = Math.min(this.pulseIntensity + intensity, 2);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw animated background with enhanced visuals
     */
    drawBackground(time) {
        // Update color wave
        this.colorWaveOffset += 0.01;
        
        // Decay pulse
        this.pulseIntensity *= 0.95;
        
        // Dynamic gradient background based on time
        const hueShift = Math.sin(time * 0.1) * 10;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, `hsl(${240 + hueShift}, 40%, 8%)`);
        gradient.addColorStop(0.5, `hsl(${250 + hueShift}, 35%, 15%)`);
        gradient.addColorStop(1, `hsl(${240 + hueShift}, 40%, 8%)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw color wave effect
        this.drawColorWave(time);

        // Draw floating background particles
        this.drawBgParticles(time);

        // Draw twinkling stars
        for (const star of this.stars) {
            const twinkle = Math.sin(time * star.twinkleSpeed + star.brightness * 10) * 0.5 + 0.5;
            this.ctx.globalAlpha = star.brightness * twinkle * 0.8;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // Draw subtle grid lines with pulse effect
        const gridAlpha = 0.05 + this.pulseIntensity * 0.05;
        this.ctx.strokeStyle = `rgba(100, 149, 237, ${gridAlpha})`;
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw reactive pulse overlay
        if (this.pulseIntensity > 0.1) {
            const pulseGradient = this.ctx.createRadialGradient(
                this.width / 2, this.height / 2, 0,
                this.width / 2, this.height / 2, this.width
            );
            pulseGradient.addColorStop(0, `rgba(78, 205, 196, ${this.pulseIntensity * 0.1})`);
            pulseGradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = pulseGradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    /**
     * Draw color wave effect
     */
    drawColorWave(time) {
        const waveHeight = 100;
        const waves = 3;
        const colors = [
            'rgba(78, 205, 196, 0.03)',
            'rgba(255, 107, 107, 0.03)',
            'rgba(149, 225, 211, 0.03)'
        ];

        for (let w = 0; w < waves; w++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            
            for (let x = 0; x <= this.width; x += 10) {
                const y = this.height - waveHeight * (w + 1) + 
                    Math.sin(x * 0.01 + time * (0.5 + w * 0.2) + w) * 30 +
                    Math.sin(x * 0.02 + time * 0.3) * 20;
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.lineTo(this.width, this.height);
            this.ctx.closePath();
            this.ctx.fillStyle = colors[w % colors.length];
            this.ctx.fill();
        }
    }

    /**
     * Draw floating background particles
     */
    drawBgParticles(time) {
        for (const p of this.bgParticles) {
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += 0.02;
            
            // Wrap around
            if (p.y > this.height + p.size) {
                p.y = -p.size;
                p.x = Math.random() * this.width;
            }
            if (p.x < -p.size) p.x = this.width + p.size;
            if (p.x > this.width + p.size) p.x = -p.size;
            
            // Calculate pulsing alpha
            const pulsingAlpha = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);
            
            // Draw glowing particle
            const gradient = this.ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size
            );
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.globalAlpha = pulsingAlpha + this.pulseIntensity * 0.1;
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw all game entities
     */
    draw(gameState) {
        const { balls, paddle, bricks, lasers, particleSystem, powerUpManager, scoreManager, time } = gameState;

        // Draw background
        this.drawBackground(time);
        
        // Draw party mode overlay if active
        if (gameState.partyModeActive) {
            this.drawPartyModeOverlay(gameState.partyModeHue, gameState.partyModeTimer, gameState.partyModeDuration);
        }

        // Draw bricks (with party mode effect if active)
        for (const brick of bricks) {
            if (gameState.partyModeActive) {
                this.drawBrickWithPartyMode(brick, gameState.partyModeHue);
            } else {
                brick.draw(this.ctx);
            }
        }

        // Draw power-ups
        if (powerUpManager) {
            powerUpManager.draw(this.ctx);
        }

        // Draw lasers
        if (lasers) {
            for (const laser of lasers) {
                this.drawLaser(laser);
            }
        }

        // Draw balls
        for (const ball of balls) {
            ball.draw(this.ctx);
        }

        // Draw paddle
        paddle.draw(this.ctx);

        // Draw particles
        if (particleSystem) {
            particleSystem.draw(this.ctx);
        }

        // Draw score popups
        if (scoreManager) {
            scoreManager.drawPopups(this.ctx);
        }
    }

    /**
     * Draw laser projectile
     */
    drawLaser(laser) {
        this.ctx.save();
        
        // Glow effect
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 10;
        
        // Laser body
        const gradient = this.ctx.createLinearGradient(
            laser.x, laser.y,
            laser.x, laser.y + laser.height
        );
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#ff0000');
        gradient.addColorStop(1, '#ff6b6b');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(laser.x - laser.width/2, laser.y, laser.width, laser.height);
        
        this.ctx.restore();
    }

    /**
     * Draw launch indicator when ball is on paddle
     */
    drawLaunchIndicator(paddle, ball) {
        if (ball.launched) return;

        this.ctx.save();
        
        // Draw dotted line showing launch direction
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(ball.position.x, ball.position.y);
        this.ctx.lineTo(ball.position.x, ball.position.y - 100);
        this.ctx.stroke();
        
        // Draw arrow head
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(ball.position.x, ball.position.y - 110);
        this.ctx.lineTo(ball.position.x - 8, ball.position.y - 95);
        this.ctx.lineTo(ball.position.x + 8, ball.position.y - 95);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw "TAP TO LAUNCH" text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TAP or SPACE to launch', ball.position.x, ball.position.y - 130);
        
        this.ctx.restore();
    }

    /**
     * Draw combo indicator
     */
    drawCombo(combo, x, y) {
        if (combo <= 1) return;

        this.ctx.save();
        
        const scale = 1 + (combo - 1) * 0.1;
        this.ctx.font = `bold ${24 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Glow effect
        this.ctx.shadowColor = '#4ecdc4';
        this.ctx.shadowBlur = 20;
        
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillText(`COMBO x${combo}!`, x, y);
        
        this.ctx.restore();
    }
    
    /**
     * Draw party mode overlay
     */
    drawPartyModeOverlay(hue, timeRemaining, duration) {
        this.ctx.save();
        
        // Rainbow glow around screen edges
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.width * 0.3,
            this.width / 2, this.height / 2, this.width * 0.6
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.15)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Party mode indicator text
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
        this.ctx.fillText('🎉 PARTY MODE! 🎉', this.width / 2, 30);
        
        // Timer bar
        const barWidth = 200;
        const barHeight = 8;
        const barX = (this.width - barWidth) / 2;
        const barY = 45;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress
        const progress = timeRemaining / duration;
        const progressGradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        progressGradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
        progressGradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 50%)`);
        this.ctx.fillStyle = progressGradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        this.ctx.restore();
    }
    
    /**
     * Draw brick with party mode rainbow effect
     */
    drawBrickWithPartyMode(brick, hue) {
        if (brick.destroyed) return;
        
        this.ctx.save();
        
        // Apply scale and alpha for destroy animation
        if (brick.destroying) {
            this.ctx.globalAlpha = brick.alpha;
            const centerX = brick.x + brick.width / 2;
            const centerY = brick.y + brick.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(brick.scale, brick.scale);
            this.ctx.translate(-centerX, -centerY);
        }
        
        const drawX = brick.x + brick.shakeOffset.x;
        const drawY = brick.y + brick.shakeOffset.y;
        
        // Party mode rainbow glow
        this.ctx.shadowColor = `hsl(${(hue + brick.x + brick.y) % 360}, 100%, 50%)`;
        this.ctx.shadowBlur = 20;
        
        // Create rainbow gradient for party mode
        const gradient = this.ctx.createLinearGradient(drawX, drawY, drawX + brick.width, drawY + brick.height);
        gradient.addColorStop(0, `hsl(${(hue + brick.x) % 360}, 70%, 60%)`);
        gradient.addColorStop(0.5, brick.color);
        gradient.addColorStop(1, `hsl(${(hue + brick.y) % 360}, 70%, 60%)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(drawX, drawY, brick.width, brick.height, 4);
        this.ctx.fill();
        
        // Draw overlay gradient
        const overlayGradient = this.ctx.createLinearGradient(drawX, drawY, drawX, drawY + brick.height);
        overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        overlayGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = overlayGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(drawX, drawY, brick.width, brick.height, 4);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = `hsl(${(hue + brick.x + brick.y) % 360}, 100%, 70%)`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(drawX, drawY, brick.width, brick.height, 4);
        this.ctx.stroke();
        
        // Draw power-up icon overlay (spinning during party mode)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('✨', drawX + brick.width / 2, drawY + brick.height / 2);
        
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    /**
     * Draw level complete celebration
     */
    drawLevelComplete(level, bonus) {
        this.ctx.save();
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Level complete text
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 30;
        this.ctx.fillText(`LEVEL ${level}`, this.width / 2, this.height / 2 - 40);
        this.ctx.fillText('COMPLETE!', this.width / 2, this.height / 2 + 20);
        
        // Bonus text
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.shadowColor = '#4ecdc4';
        this.ctx.fillText(`Bonus: +${bonus}`, this.width / 2, this.height / 2 + 70);
        
        this.ctx.restore();
    }

    /**
     * Draw game boundaries
     */
    drawBoundaries() {
        this.ctx.save();
        
        // Side walls glow
        const wallGradientLeft = this.ctx.createLinearGradient(0, 0, 10, 0);
        wallGradientLeft.addColorStop(0, 'rgba(100, 149, 237, 0.3)');
        wallGradientLeft.addColorStop(1, 'transparent');
        this.ctx.fillStyle = wallGradientLeft;
        this.ctx.fillRect(0, 0, 10, this.height);
        
        const wallGradientRight = this.ctx.createLinearGradient(this.width - 10, 0, this.width, 0);
        wallGradientRight.addColorStop(0, 'transparent');
        wallGradientRight.addColorStop(1, 'rgba(100, 149, 237, 0.3)');
        this.ctx.fillStyle = wallGradientRight;
        this.ctx.fillRect(this.width - 10, 0, 10, this.height);
        
        // Top wall glow
        const wallGradientTop = this.ctx.createLinearGradient(0, 0, 0, 10);
        wallGradientTop.addColorStop(0, 'rgba(100, 149, 237, 0.3)');
        wallGradientTop.addColorStop(1, 'transparent');
        this.ctx.fillStyle = wallGradientTop;
        this.ctx.fillRect(0, 0, this.width, 10);
        
        this.ctx.restore();
    }

    /**
     * Flash screen effect
     */
    flashScreen(color = 'white', alpha = 0.3) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
    }
}
