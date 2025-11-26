/**
 * RenderSystem - Handles all rendering to the canvas
 */
class RenderSystem {
    /**
     * Create a render system
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {EventBus} eventBus - Event bus
     * @param {ConfigManager} config - Configuration manager
     */
    constructor(canvas, eventBus, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.eventBus = eventBus;
        this.config = config;
        
        this.width = canvas.width;
        this.height = canvas.height;
        this.cameraY = 0;
        
        // Animation time for effects
        this.time = 0;
        
        // Quality settings
        this.quality = 'high';
        this.enableTrails = true;
        this.enableBloom = true;
    }

    /**
     * Resize the renderer
     */
    resize() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    /**
     * Set quality level
     * @param {string} quality - Quality level (high, medium, low)
     */
    setQuality(quality) {
        this.quality = quality;
        this.enableTrails = quality !== 'low';
        this.enableBloom = quality === 'high';
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw the background gradient
     */
    drawBackground() {
        const colors = this.config.get('visuals.backgroundColor');
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, colors.top);
        gradient.addColorStop(1, colors.bottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Main render function
     * @param {Array} entities - All game entities
     * @param {number} cameraY - Camera Y position
     */
    render(entities, cameraY) {
        this.cameraY = cameraY;
        this.time = Date.now() / 1000;

        this.clear();
        this.drawBackground();

        this.ctx.save();
        this.ctx.translate(0, -cameraY);

        // Separate entities by type
        const platforms = entities.filter(e => e.type === 'platform');
        const bubbles = entities.filter(e => e.type === 'bubble' && !e.isDead);
        const particles = entities.filter(e => e.type === 'particle');

        // Render in order (back to front)
        platforms.forEach(p => this.renderPlatform(p));
        
        if (this.enableTrails) {
            bubbles.forEach(b => this.renderBubbleTrail(b));
        }
        
        bubbles.forEach(b => this.renderBubble(b));
        particles.forEach(p => this.renderParticle(p));

        this.ctx.restore();
    }

    /**
     * Render a bubble entity
     * @param {Object} bubble - Bubble entity
     */
    renderBubble(bubble) {
        const radius = bubble.radius || 15;
        
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);

        // Create gradient based on bubble state
        const gradient = this.ctx.createRadialGradient(
            bubble.x - radius / 3,
            bubble.y - radius / 3,
            radius / 10,
            bubble.x,
            bubble.y,
            radius
        );

        if (bubble.isClone) {
            // Pink gradient for cloned bubbles
            gradient.addColorStop(0, 'rgba(255, 192, 203, 0.9)');
            gradient.addColorStop(0.8, 'rgba(255, 105, 180, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 105, 180, 0.4)');
        } else {
            // Blue gradient for normal bubbles
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.8, 'rgba(135, 206, 235, 0.6)');
            gradient.addColorStop(1, 'rgba(135, 206, 235, 0.4)');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Add stroke
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Add shine effect
        this.ctx.beginPath();
        this.ctx.arc(
            bubble.x - radius / 3,
            bubble.y - radius / 3,
            radius / 4,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();

        // Add reverse gravity indicator
        if (bubble.hasReverseGravity) {
            this.ctx.save();
            this.ctx.strokeStyle = '#9b59b6';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    /**
     * Render bubble trail
     * @param {Object} bubble - Bubble entity
     */
    renderBubbleTrail(bubble) {
        if (!bubble.trailPoints || bubble.trailPoints.length < 2) return;

        this.ctx.save();
        
        const color = bubble.isClone ? 
            'rgba(255, 105, 180, ' : 
            'rgba(135, 206, 235, ';

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let i = 1; i < bubble.trailPoints.length; i++) {
            const alpha = 1 - (i / bubble.trailPoints.length);
            const width = (1 - (i / bubble.trailPoints.length)) * 8;

            this.ctx.beginPath();
            this.ctx.strokeStyle = color + (alpha * 0.5) + ')';
            this.ctx.lineWidth = width;
            this.ctx.moveTo(bubble.trailPoints[i - 1].x, bubble.trailPoints[i - 1].y);
            this.ctx.lineTo(bubble.trailPoints[i].x, bubble.trailPoints[i].y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Render a platform entity
     * @param {Object} platform - Platform entity
     */
    renderPlatform(platform) {
        let color = this.config.get(`platforms.types.${platform.platformType}.color`) || '#2ecc71';

        // Handle rainbow platform special rendering
        if (platform.platformType === 'rainbow') {
            this.renderRainbowPlatform(platform);
            return;
        }

        // Handle breaking animation
        if (platform.breaking) {
            this.ctx.globalAlpha = 0.5;
        }

        this.ctx.fillStyle = color;
        this.drawRoundedRect(platform.x, platform.y, platform.width, platform.height, 5);
        this.ctx.fill();

        // Add shadow/depth effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(platform.x, platform.y + platform.height - 5, platform.width, 5);

        // Reset alpha
        this.ctx.globalAlpha = 1;

        // Add platform-specific effects
        this.addPlatformEffects(platform);
    }

    /**
     * Render rainbow platform with animated gradient
     * @param {Object} platform - Platform entity
     */
    renderRainbowPlatform(platform) {
        const gradient = this.ctx.createLinearGradient(
            platform.x, 0,
            platform.x + platform.width, 0
        );

        // Animated rainbow colors
        const offset = (this.time * 2) % 1;
        const colors = [
            `hsl(${(offset * 360) % 360}, 80%, 60%)`,
            `hsl(${(offset * 360 + 60) % 360}, 80%, 60%)`,
            `hsl(${(offset * 360 + 120) % 360}, 80%, 60%)`,
            `hsl(${(offset * 360 + 180) % 360}, 80%, 60%)`,
            `hsl(${(offset * 360 + 240) % 360}, 80%, 60%)`,
            `hsl(${(offset * 360 + 300) % 360}, 80%, 60%)`
        ];

        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });

        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(platform.x, platform.y, platform.width, platform.height, 5);
        this.ctx.fill();

        // Add sparkle effect
        if (this.enableBloom) {
            this.addSparkles(platform);
        }
    }

    /**
     * Add platform-specific visual effects
     * @param {Object} platform - Platform entity
     */
    addPlatformEffects(platform) {
        switch (platform.platformType) {
            case 'boost':
                this.addBoostArrows(platform);
                break;
            case 'reverse':
                this.addReverseSymbol(platform);
                break;
        }
    }

    /**
     * Add boost arrows to platform
     * @param {Object} platform - Platform entity
     */
    addBoostArrows(platform) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        const arrowCount = 3;
        const arrowWidth = 8;
        const spacing = platform.width / (arrowCount + 1);
        
        for (let i = 1; i <= arrowCount; i++) {
            const x = platform.x + spacing * i;
            const y = platform.y + platform.height / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 3);
            this.ctx.lineTo(x - arrowWidth / 2, y + 3);
            this.ctx.lineTo(x, y - 5);
            this.ctx.lineTo(x + arrowWidth / 2, y + 3);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    /**
     * Add reverse gravity symbol to platform
     * @param {Object} platform - Platform entity
     */
    addReverseSymbol(platform) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⟳', platform.x + platform.width / 2, platform.y + 12);
        this.ctx.restore();
    }

    /**
     * Add sparkle effects to platform
     * @param {Object} platform - Platform entity
     */
    addSparkles(platform) {
        this.ctx.save();
        
        const sparkleCount = 3;
        for (let i = 0; i < sparkleCount; i++) {
            const offset = (this.time * 3 + i) % 1;
            const x = platform.x + offset * platform.width;
            const y = platform.y - 5 + Math.sin(this.time * 5 + i) * 3;
            const size = 2 + Math.sin(this.time * 4 + i * 2) * 1;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    /**
     * Render a particle entity
     * @param {Object} particle - Particle entity
     */
    renderParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha || 1;

        if (particle.text) {
            // Score popup text
            this.ctx.font = `bold ${particle.fontSize || 18}px Arial`;
            this.ctx.fillStyle = particle.color || '#2ecc71';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(particle.text, particle.x, particle.y);
            this.ctx.fillText(particle.text, particle.x, particle.y);
        } else {
            // Visual particle
            this.ctx.fillStyle = particle.color || '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size || 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Draw a rounded rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} radius - Corner radius
     */
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderSystem;
}
