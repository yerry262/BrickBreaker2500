/**
 * LevelManager - Handles level generation, progression, and brick layouts
 */
class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevels = 30;
        this.brickRows = 5;
        this.brickCols = 8;
        this.brickWidth = 60;
        this.brickHeight = 20;
        this.brickPadding = 4;
        this.topOffset = 60;
        this.sideOffset = 10;
    }

    /**
     * Generate bricks for the current level
     * Now takes both width and height for proportional scaling
     */
    generateLevel(level, canvasWidth, canvasHeight) {
        this.currentLevel = level;
        const bricks = [];
        
        // Get level pattern first to know how many rows we have
        const pattern = this.getLevelPattern(level);
        const numRows = pattern.length;
        
        // PROPORTIONAL SCALING BASED ON SCREEN SIZE
        // The brick area should take up ~35% of screen height (from top)
        // This ensures consistent gameplay feel across all aspect ratios
        
        const brickAreaHeight = canvasHeight * 0.35; // 35% of screen for bricks
        this.topOffset = canvasHeight * 0.08; // 8% from top for score UI
        
        // Calculate brick height based on available vertical space
        // Leave room for padding between rows
        const verticalPaddingRatio = 0.15; // 15% of brick area for padding
        const availableHeightForBricks = brickAreaHeight * (1 - verticalPaddingRatio);
        this.brickHeight = availableHeightForBricks / numRows;
        
        // Cap brick height to reasonable bounds
        this.brickHeight = Math.max(15, Math.min(40, this.brickHeight));
        
        // Calculate vertical padding based on brick height
        this.brickPadding = Math.max(2, Math.min(8, this.brickHeight * 0.2));
        
        // Calculate brick width based on canvas width
        this.sideOffset = Math.max(5, canvasWidth * 0.02); // 2% side margins
        const availableWidth = canvasWidth - (this.sideOffset * 2);
        this.brickWidth = (availableWidth - (this.brickPadding * (this.brickCols - 1))) / this.brickCols;
        
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                const brickType = pattern[row][col];
                if (brickType === 0) continue; // Empty space
                
                const x = this.sideOffset + col * (this.brickWidth + this.brickPadding);
                const y = this.topOffset + row * (this.brickHeight + this.brickPadding);
                
                const type = this.getBrickType(brickType);
                const brick = new Brick(x, y, this.brickWidth, this.brickHeight, type);
                
                // After level 2, strengthen some bricks with extra hits
                if (level > 2 && type !== BrickTypes.METAL && type !== BrickTypes.POWER) {
                    this.applyLevelStrength(brick, level);
                }
                
                bricks.push(brick);
            }
        }
        
        // Assign random power-ups to some bricks based on level
        this.assignRandomPowerUps(bricks, level);
        
        return bricks;
    }
    
    /**
     * Apply extra strength to bricks based on level
     */
    applyLevelStrength(brick, level) {
        // Chance to add extra hits increases with level
        const extraHitChance = Math.min(0.1 + (level - 2) * 0.05, 0.5);
        
        if (Math.random() < extraHitChance) {
            // Add 1-3 extra hits based on level
            const maxExtraHits = Math.min(Math.floor((level - 2) / 3) + 1, 4);
            const extraHits = Math.floor(Math.random() * maxExtraHits) + 1;
            
            brick.hitsRemaining += extraHits;
            brick.maxHits = brick.hitsRemaining;
            brick.points += extraHits * 10; // More points for harder bricks
            
            // Update color based on total hits
            if (brick.hitsRemaining >= 4) {
                brick.color = '#8e44ad'; // Purple for very tough
                brick.baseColor = '#8e44ad';
            } else if (brick.hitsRemaining >= 3) {
                brick.color = '#45b7d1'; // Blue
                brick.baseColor = '#45b7d1';
            } else if (brick.hitsRemaining >= 2) {
                brick.color = '#4ecdc4'; // Teal
                brick.baseColor = '#4ecdc4';
            }
        }
    }
    
    /**
     * Assign random power-ups to bricks
     */
    assignRandomPowerUps(bricks, level) {
        // Number of power-ups based on level
        const basePowerUps = 2;
        const levelBonus = Math.floor(level / 2);
        const numPowerUps = Math.min(basePowerUps + levelBonus, Math.floor(bricks.length * 0.3));
        
        // Get eligible bricks (not metal, not already power type)
        const eligibleBricks = bricks.filter(b => 
            b.type !== BrickTypes.METAL && 
            b.type !== BrickTypes.POWER &&
            !b.hiddenPowerUp
        );
        
        // Shuffle and select bricks
        const shuffled = eligibleBricks.sort(() => Math.random() - 0.5);
        const selectedBricks = shuffled.slice(0, numPowerUps);
        
        // Assign power-ups
        const powerUpTypes = this.getAvailablePowerUpTypes();
        
        for (const brick of selectedBricks) {
            const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            brick.setHiddenPowerUp(randomPowerUp);
        }
    }
    
    /**
     * Get available power-up types for random assignment
     */
    getAvailablePowerUpTypes() {
        return [
            PowerUpTypes.MULTI_BALL,
            PowerUpTypes.EXTEND_PADDLE,
            PowerUpTypes.STICKY_PADDLE,
            PowerUpTypes.LASER,
            PowerUpTypes.MEGA_BALL,
            PowerUpTypes.SLOW_BALL,
            PowerUpTypes.EXTRA_LIFE,
            PowerUpTypes.SCORE_MULTIPLIER,
            PowerUpTypes.AUTO_BURST,
            PowerUpTypes.EXPLOSIVE_NEXT
        ];
    }

    /**
     * Get brick type from pattern number
     */
    getBrickType(num) {
        switch(num) {
            case 1: return BrickTypes.NORMAL;
            case 2: return BrickTypes.STRONG;
            case 3: return BrickTypes.SUPER;
            case 4: return BrickTypes.METAL;
            case 5: return BrickTypes.POWER;
            case 6: return BrickTypes.EXPLOSIVE;
            case 7: return BrickTypes.RAINBOW;
            case 8: return BrickTypes.MOVING;
            case 9: return BrickTypes.MIRROR;
            case 10: return BrickTypes.SUPER_POWERUP;
            default: return BrickTypes.NORMAL;
        }
    }

    /**
     * Get level pattern - returns 2D array of brick types
     */
    getLevelPattern(level) {
        // Predefined patterns for first 10 levels, then procedural generation
        const patterns = {
            0: [
                [10,10,10,10,10,10,10,10],
                [9,9,9,9,9,9,9,9],
                [8,8,8,8,8,8,8,8],
                [7,7,7,7,7,7,7,7],
                [6,6,6,6,6,6,6,6],
                [5,5,5,5,5,5,5,5],
                [4,4,4,4,4,4,4,4],
                [3,3,3,3,3,3,3,3],
                [2,2,2,2,2,2,2,2],
                [1,1,1,1,1,1,1,1]
            ],
            // Level 1: Simple intro
            1: [
                [1,0,1,0,0,1,0,1],
                [1,0,1,0,0,1,0,1],
                [7,7,7,10,10,7,7,7],
                [1,1,1,1,1,1,1,1]
            ],
            // Level 2: Introduce Strong
            2: [
                [1,1,0,1,1,0,1,1],
                [7,7,7,7,7,7,7,7],
                [0,1,0,1,1,0,1,0],
                [7,7,0,0,0,7,7,7],
                [1,1,1,2,2,1,1,1]
            ],
            // Level 3: Introduce power bricks and moving bricks
            3: [
                [1,1,1,10,10,1,1,1],
                [1,1,1,0,0,1,1,1],
                [8,8,8,8,8,8,8,8],
                [1,1,1,1,1,1,1,1],
                [7,7,0,0,0,0,7,7],
                [7,0,0,0,0,0,0,7]
            ],
            // Level 4: Introduce explosive bricks
            4: [
                [1,1,1,6,6,1,1,1],
                [1,2,2,1,1,2,2,1],
                [7,7,7,7,7,7,7,7],
                [6,1,1,5,5,1,1,6],
                [1,1,1,1,1,1,1,1]
            ],
            // Level 5: Diamond pattern
            5: [
                [0,0,0,1,1,0,0,0],
                [0,0,1,2,2,1,0,0],
                [0,1,2,5,5,2,1,0],
                [1,2,1,7,7,1,2,1],
                [0,1,2,8,8,2,1,0],
                [0,0,3,8,8,3,0,0]
            ],
            // Level 6: Introduce super bricks
            6: [
                [3,2,1,1,1,1,2,3],
                [2,2,2,1,1,2,2,2],
                [1,1,1,5,5,1,1,1],
                [7,7,7,7,7,7,7,7],
                [0,1,1,1,4,1,1,0]
            ],
            // Level 7: Rainbow challenge
            7: [
                [7,1,1,1,1,1,1,7],
                [1,7,2,2,2,2,7,1],
                [1,2,7,3,3,7,2,1],
                [1,2,3,5,5,3,2,1],
                [1,2,7,3,3,7,2,1],
                [1,7,2,2,2,2,7,1],
                [7,1,1,1,1,1,1,7]
            ],
            // Level 8: Introduce metal bricks
            8: [
                [4,1,1,1,1,1,1,4],
                [1,2,2,2,2,2,2,1],
                [1,2,5,1,1,5,2,1],
                [1,2,2,2,2,2,2,1],
                [4,1,1,1,1,1,1,4]
            ],
            // Level 9: Mixed challenge
            9: [
                [3,3,2,1,1,2,3,3],
                [2,2,2,6,6,2,2,2],
                [1,1,5,1,1,5,1,1],
                [4,1,1,1,1,1,1,4],
                [1,2,2,2,2,2,2,1],
                [1,1,1,1,1,1,1,1]
            ],
            // Level 10: Complex pattern spiral
            10: [
                [3,3,3,3,3,3,3,3],
                [2,4,4,4,4,4,4,2],
                [8,4,7,7,7,7,4,8],
                [8,4,8,3,3,3,4,8],
                [7,4,7,3,4,10,7,7],
                [7,4,4,4,4,4,7,7],
                [7,7,7,7,7,4,7,7],
                [4,4,4,4,2,4,4,4]
            ]
        };

        if (patterns[level]) {
            return patterns[level];
        }

        // Procedural generation for levels 11+
        return this.generateProceduralPattern(level);
    }

    /**
     * Generate procedural pattern for higher levels
     */
    generateProceduralPattern(level) {
        const rows = Math.min(5 + Math.floor(level / 5), 8);
        const pattern = [];
        
        // Difficulty factors
        const strongChance = Math.min(0.1 + (level - 10) * 0.03, 0.4);
        const superChance = Math.min((level - 10) * 0.02, 0.2);
        const metalChance = Math.min((level - 15) * 0.01, 0.1);
        const powerChance = 0.05;
        const explosiveChance = Math.min((level - 10) * 0.015, 0.1);
        const rainbowChance = 0.02;
        const movingChance = Math.min((level - 10) * 0.02, 0.15);
        const mirrorChance = Math.min((level - 10) * 0.015, 0.08);
        const superPowerupChance = 0.01; // 1% chance for super power-up brick

        for (let row = 0; row < rows; row++) {
            const rowPattern = [];
            for (let col = 0; col < this.brickCols; col++) {
                // Random empty spaces (less likely in higher levels)
                if (Math.random() < 0.1 - (level * 0.005)) {
                    rowPattern.push(0);
                    continue;
                }

                const rand = Math.random();
                let type = 1; // Default normal

                if (rand < superPowerupChance) {
                    type = 10; // Super Power-up (1% chance)
                } else if (rand < superPowerupChance + rainbowChance) {
                    type = 7; // Rainbow
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance) {
                    type = 9; // Mirror
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance + powerChance) {
                    type = 5; // Power
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance + powerChance + explosiveChance) {
                    type = 6; // Explosive
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance + powerChance + explosiveChance + movingChance) {
                    type = 8; // Moving
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance + powerChance + explosiveChance + movingChance + metalChance) {
                    type = 4; // Metal
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance + powerChance + explosiveChance + movingChance + metalChance + superChance) {
                    type = 3; // Super
                } else if (rand < superPowerupChance + rainbowChance + mirrorChance + powerChance + explosiveChance + movingChance + metalChance + superChance + strongChance) {
                    type = 2; // Strong
                }

                rowPattern.push(type);
            }
            pattern.push(rowPattern);
        }

        return pattern;
    }

    /**
     * Check if all destructible bricks are cleared
     */
    isLevelComplete(bricks) {
        return bricks.every(brick => 
            brick.destroyed || brick.type === BrickTypes.METAL
        );
    }

    /**
     * Get total destructible bricks in level
     */
    getDestructibleCount(bricks) {
        return bricks.filter(brick => 
            brick.type !== BrickTypes.METAL
        ).length;
    }

    /**
     * Calculate level completion bonus
     */
    getLevelBonus(level, timeSeconds, livesRemaining) {
        const baseBonus = 500 + (level * 100);
        const timeBonus = Math.max(0, (300 - timeSeconds) * 10);
        const lifeBonus = livesRemaining * 1000;
        return Math.floor(baseBonus + timeBonus + lifeBonus);
    }

    /**
     * Get next level number
     */
    nextLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
        }
        return this.currentLevel;
    }

    /**
     * Reset to level 1
     */
    reset() {
        this.currentLevel = 1;
    }
}
