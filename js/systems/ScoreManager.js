/**
 * ScoreManager - Handles scoring, combos, and multipliers
 */
class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2; // Seconds before combo resets
        this.multiplier = 1;
        this.baseMultiplier = 1;
        this.bricksDestroyed = 0;
        this.totalBricksInLevel = 0;
        
        // Score popup queue for visual feedback
        this.popups = [];
    }

    /**
     * Reset for new game
     */
    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.multiplier = 1;
        this.baseMultiplier = 1;
        this.bricksDestroyed = 0;
        this.popups = [];
    }

    /**
     * Reset combo for new level (keep score)
     */
    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
        this.bricksDestroyed = 0;
    }

    /**
     * Add points for brick destruction
     */
    addBrickScore(basePoints, x, y) {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        this.bricksDestroyed++;
        
        // Track max combo
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Calculate combo multiplier (caps at 3x)
        const comboMultiplier = Math.min(1 + (this.combo - 1) * 0.1, 3);
        
        // Apply all multipliers
        const totalMultiplier = comboMultiplier * this.multiplier;
        const points = Math.floor(basePoints * totalMultiplier);
        
        this.score += points;

        // Create score popup
        this.popups.push({
            x: x,
            y: y,
            text: `+${points}`,
            combo: this.combo > 1 ? `x${comboMultiplier.toFixed(1)}` : '',
            life: 1,
            vy: -2
        });

        return points;
    }

    /**
     * Add bonus points (level complete, etc.)
     */
    addBonus(points, label, x, y) {
        this.score += points;
        
        if (x !== undefined && y !== undefined) {
            this.popups.push({
                x: x,
                y: y,
                text: `+${points}`,
                combo: label || '',
                life: 1.5,
                vy: -1.5,
                isBonus: true
            });
        }

        return points;
    }

    /**
     * Set score multiplier (from power-ups)
     */
    setMultiplier(mult) {
        this.multiplier = mult;
    }

    /**
     * Reset multiplier to base
     */
    resetMultiplier() {
        this.multiplier = this.baseMultiplier;
    }

    /**
     * Update timers and popups
     */
    update(dt) {
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Update score popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i];
            popup.y += popup.vy;
            popup.life -= dt;
            
            if (popup.life <= 0) {
                this.popups.splice(i, 1);
            }
        }
    }

    /**
     * Draw score popups
     */
    drawPopups(ctx) {
        for (const popup of this.popups) {
            const alpha = Math.min(1, popup.life);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            
            // Draw main score
            ctx.font = popup.isBonus ? 'bold 18px Arial' : 'bold 14px Arial';
            ctx.fillStyle = popup.isBonus ? '#ffd700' : '#ffffff';
            ctx.fillText(popup.text, popup.x, popup.y);
            
            // Draw combo indicator
            if (popup.combo) {
                ctx.font = '10px Arial';
                ctx.fillStyle = '#4ecdc4';
                ctx.fillText(popup.combo, popup.x, popup.y + 12);
            }
            
            ctx.restore();
        }
    }

    /**
     * Get current combo multiplier
     */
    getComboMultiplier() {
        return Math.min(1 + (this.combo - 1) * 0.1, 3);
    }

    /**
     * Get score stats for display
     */
    getStats() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            multiplier: this.multiplier,
            comboMultiplier: this.getComboMultiplier(),
            bricksDestroyed: this.bricksDestroyed
        };
    }

    /**
     * Calculate level completion score
     */
    calculateLevelScore(level, timeSeconds, livesRemaining) {
        const baseBonus = 500 + (level * 100);
        const timeBonus = Math.max(0, Math.floor((300 - timeSeconds) * 10));
        const lifeBonus = livesRemaining * 1000;
        const comboBonus = this.maxCombo * 50;
        
        return {
            base: baseBonus,
            time: timeBonus,
            lives: lifeBonus,
            combo: comboBonus,
            total: baseBonus + timeBonus + lifeBonus + comboBonus
        };
    }
}
