/**
 * PerformanceManager - Monitors FPS and adjusts quality settings
 */
class PerformanceManager {
    /**
     * Create a performance manager
     * @param {EventBus} eventBus - Event bus
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // FPS tracking
        this.frameCount = 0;
        this.fps = 60;
        this.lastFrameTime = 0;
        this.fpsHistory = [];
        this.maxFpsHistory = 60;
        
        // Performance settings
        this.quality = 'high';
        this.settings = {
            maxParticles: 100,
            particleQuality: 'high',
            enableTrails: true,
            enableBloom: true,
            targetFps: 60
        };
        
        // Auto-adjustment
        this.autoAdjust = true;
        this.adjustmentCooldown = 0;
        this.adjustmentCooldownMax = 3000; // ms
        
        // Start monitoring
        this.lastMonitorTime = Date.now();
        this.monitorInterval = null;
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        this.monitorInterval = setInterval(() => {
            this.checkPerformance();
        }, 1000);
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    /**
     * Update frame timing
     * @param {number} currentTime - Current timestamp
     */
    updateFrame(currentTime) {
        if (this.lastFrameTime > 0) {
            const deltaTime = currentTime - this.lastFrameTime;
            this.fps = Math.round(1000 / deltaTime);
        }
        this.lastFrameTime = currentTime;
        this.frameCount++;
        
        // Track FPS history
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > this.maxFpsHistory) {
            this.fpsHistory.shift();
        }
        
        // Update cooldown
        if (this.adjustmentCooldown > 0) {
            this.adjustmentCooldown -= currentTime - this.lastMonitorTime;
            this.lastMonitorTime = currentTime;
        }
    }

    /**
     * Check performance and adjust if needed
     */
    checkPerformance() {
        if (!this.autoAdjust) return;
        
        const avgFps = this.getAverageFps();
        
        this.eventBus.emit('performance:fps_update', { 
            fps: this.fps, 
            avgFps: avgFps,
            quality: this.quality 
        });
        
        // Only adjust if cooldown has expired
        if (this.adjustmentCooldown > 0) return;
        
        // Degrade quality if FPS too low
        if (avgFps < 45 && this.quality !== 'low') {
            this.degradeQuality();
        }
        // Improve quality if FPS is good
        else if (avgFps > 55 && this.quality !== 'high') {
            this.improveQuality();
        }
    }

    /**
     * Get average FPS
     * @returns {number} Average FPS
     */
    getAverageFps() {
        if (this.fpsHistory.length === 0) return 60;
        return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    }

    /**
     * Degrade quality settings
     */
    degradeQuality() {
        if (this.quality === 'high') {
            this.quality = 'medium';
            this.settings.particleQuality = 'medium';
            this.settings.maxParticles = 50;
            this.settings.enableBloom = false;
        } else if (this.quality === 'medium') {
            this.quality = 'low';
            this.settings.particleQuality = 'low';
            this.settings.maxParticles = 25;
            this.settings.enableTrails = false;
        }
        
        this.adjustmentCooldown = this.adjustmentCooldownMax;
        this.eventBus.emit('performance:quality_changed', {
            quality: this.quality,
            settings: { ...this.settings }
        });
        
        console.log(`Performance: Quality degraded to ${this.quality}`);
    }

    /**
     * Improve quality settings
     */
    improveQuality() {
        if (this.quality === 'low') {
            this.quality = 'medium';
            this.settings.particleQuality = 'medium';
            this.settings.maxParticles = 50;
            this.settings.enableTrails = true;
        } else if (this.quality === 'medium') {
            this.quality = 'high';
            this.settings.particleQuality = 'high';
            this.settings.maxParticles = 100;
            this.settings.enableBloom = true;
        }
        
        this.adjustmentCooldown = this.adjustmentCooldownMax;
        this.eventBus.emit('performance:quality_changed', {
            quality: this.quality,
            settings: { ...this.settings }
        });
        
        console.log(`Performance: Quality improved to ${this.quality}`);
    }

    /**
     * Set quality level manually
     * @param {string} quality - Quality level (high, medium, low)
     */
    setQuality(quality) {
        this.quality = quality;
        
        switch (quality) {
            case 'high':
                this.settings.particleQuality = 'high';
                this.settings.maxParticles = 100;
                this.settings.enableTrails = true;
                this.settings.enableBloom = true;
                break;
            case 'medium':
                this.settings.particleQuality = 'medium';
                this.settings.maxParticles = 50;
                this.settings.enableTrails = true;
                this.settings.enableBloom = false;
                break;
            case 'low':
                this.settings.particleQuality = 'low';
                this.settings.maxParticles = 25;
                this.settings.enableTrails = false;
                this.settings.enableBloom = false;
                break;
        }
        
        this.eventBus.emit('performance:quality_changed', {
            quality: this.quality,
            settings: { ...this.settings }
        });
    }

    /**
     * Enable/disable auto quality adjustment
     * @param {boolean} enabled - Enable auto adjustment
     */
    setAutoAdjust(enabled) {
        this.autoAdjust = enabled;
    }

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get current quality level
     * @returns {string} Quality level
     */
    getQuality() {
        return this.quality;
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getFps() {
        return this.fps;
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getStats() {
        return {
            fps: this.fps,
            avgFps: this.getAverageFps(),
            quality: this.quality,
            frameCount: this.frameCount,
            autoAdjust: this.autoAdjust
        };
    }

    /**
     * Reset statistics
     */
    reset() {
        this.frameCount = 0;
        this.fpsHistory = [];
        this.fps = 60;
        this.lastFrameTime = 0;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}
