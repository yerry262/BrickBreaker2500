class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.4;
        this.jumpStrength = -8;
        this.maxFallSpeed = 10;
        this.isDead = false;
    }

    jump() {
        this.vy = this.jumpStrength;
    }

    update() {
        this.vy += this.gravity;
        if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
        
        this.x += this.vx;
        this.y += this.vy;

        // Simple friction/air resistance
        this.vx *= 0.95;
    }
}

class Platform {
    constructor(x, y, width, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 15;
        this.type = type; // normal, break, boost, reverse
        this.vx = 0;
        this.markedForDeletion = false;
        this.passed = false;

        if (Math.random() < 0.2 && y < 0) { // 20% chance to move, but not the starting platforms
            this.vx = (Math.random() - 0.5) * 4;
        }
    }

    update(canvasWidth) {
        this.x += this.vx;
        
        // Bounce off walls
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.vx *= -1;
        }
    }
}

class PhysicsEngine {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.bubbles = [];
        this.platforms = [];
        this.cameraY = 0;
        this.score = 0;
        this.gameSpeed = 0;
        this.platformGap = 120;
        this.lastPlatformY = canvasHeight;
    }

    init() {
        this.bubbles = [new Bubble(this.width / 2, this.height - 100)];
        this.platforms = [];
        this.cameraY = 0;
        this.score = 0;
        this.lastPlatformY = this.height;

        // Create initial platforms
        for (let i = 0; i < 10; i++) {
            this.generatePlatform();
        }
        // Ensure a starting platform under the bubble
        this.platforms.push(new Platform(this.width / 2 - 50, this.height - 50, 100));
    }

    generatePlatform() {
        const width = 80 + Math.random() * 60;
        const x = Math.random() * (this.width - width);
        const y = this.lastPlatformY - this.platformGap;
        
        let type = 'normal';
        const rand = Math.random();
        if (rand < 0.1) type = 'boost';
        else if (rand < 0.2) type = 'break';
        // else if (rand < 0.25) type = 'reverse'; // TODO: Implement reverse gravity later

        this.platforms.push(new Platform(x, y, width, type));
        this.lastPlatformY = y;
    }

    update(input) {
        // Handle Input
        if (input.isJustPressed()) {
            this.bubbles.forEach(bubble => bubble.jump());
        }

        // Update Bubbles
        this.bubbles.forEach(bubble => {
            bubble.update();

            // Wall collisions
            if (bubble.x - bubble.radius < 0) {
                bubble.x = bubble.radius;
                bubble.vx *= -0.5;
            } else if (bubble.x + bubble.radius > this.width) {
                bubble.x = this.width - bubble.radius;
                bubble.vx *= -0.5;
            }

            // Check death (fall off screen)
            if (bubble.y - this.cameraY > this.height + 100) {
                bubble.isDead = true;
            }
        });

        // Remove dead bubbles
        this.bubbles = this.bubbles.filter(b => !b.isDead);

        // Update Platforms
        this.platforms.forEach(platform => {
            platform.update(this.width);
        });

        // Collision Detection (Bubble vs Platform)
        // Only collide if falling down
        this.bubbles.forEach(bubble => {
            if (bubble.vy > 0) { 
                this.platforms.forEach(platform => {
                    if (
                        bubble.x + bubble.radius > platform.x &&
                        bubble.x - bubble.radius < platform.x + platform.width &&
                        bubble.y + bubble.radius > platform.y &&
                        bubble.y + bubble.radius < platform.y + platform.height + bubble.vy // Check previous frame position roughly
                    ) {
                        // Collision!
                        if (platform.type === 'break') {
                            platform.markedForDeletion = true;
                            bubble.jump(); // Small jump off breaking platform
                        } else if (platform.type === 'boost') {
                            bubble.vy = -15; // Super jump
                        } else {
                            bubble.vy = -8; // Normal jump bounce
                            bubble.y = platform.y - bubble.radius;
                        }
                    }
                });
            }
        });

        // Remove broken platforms
        this.platforms = this.platforms.filter(p => !p.markedForDeletion);

        // Update Camera
        // If bubble goes above 1/3 of screen, move camera up
        let targetY = 0;
        if (this.bubbles.length > 0) {
            // Follow the highest bubble
            const highestBubble = this.bubbles.reduce((prev, curr) => prev.y < curr.y ? prev : curr);
            if (highestBubble.y < this.cameraY + this.height * 0.4) {
                targetY = highestBubble.y - this.height * 0.4;
                this.cameraY += (targetY - this.cameraY) * 0.1;
                this.score += Math.floor(Math.abs(targetY - this.cameraY) * 0.1); // Score based on height
            }
        }

        // Generate new platforms
        if (this.lastPlatformY > this.cameraY - 100) {
            this.generatePlatform();
        }

        // Cleanup old platforms
        this.platforms = this.platforms.filter(p => p.y > this.cameraY + this.height + 100 ? false : true);
    }

    isGameOver() {
        return this.bubbles.length === 0;
    }
}