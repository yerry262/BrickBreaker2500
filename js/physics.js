/**
 * Physics - Handles collision detection and physics calculations
 */
class Physics {
    constructor() {
        this.gravity = 0; // No gravity for brick breaker
    }

    /**
     * Check ball-brick collision and handle response
     */
    checkBallBrickCollision(ball, brick) {
        if (brick.destroyed || brick.destroying) return null;

        const collision = brick.checkCollision(ball);
        if (!collision) return null;

        // Handle collision response (unless mega ball)
        if (!ball.isMega || brick.type === BrickTypes.METAL) {
            if (collision.axis === 'x') {
                ball.velocity.x *= -1;
                // Push ball out of brick
                if (collision.side === 'left') {
                    ball.position.x = brick.x - ball.radius - 1;
                } else {
                    ball.position.x = brick.x + brick.width + ball.radius + 1;
                }
            } else {
                ball.velocity.y *= -1;
                // Push ball out of brick
                if (collision.side === 'top') {
                    ball.position.y = brick.y - ball.radius - 1;
                } else {
                    ball.position.y = brick.y + brick.height + ball.radius + 1;
                }
            }
        }

        return collision;
    }

    /**
     * Check ball-paddle collision
     */
    checkBallPaddleCollision(ball, paddle) {
        if (!ball.launched) return false;
        
        // Only check if ball is moving down
        if (ball.velocity.y <= 0) return false;

        const ballBottom = ball.position.y + ball.radius;
        const ballTop = ball.position.y - ball.radius;
        const ballLeft = ball.position.x - ball.radius;
        const ballRight = ball.position.x + ball.radius;

        const paddleTop = paddle.position.y;
        const paddleBottom = paddle.position.y + paddle.height;
        const paddleLeft = paddle.position.x - paddle.width / 2;
        const paddleRight = paddle.position.x + paddle.width / 2;

        // Check overlap
        if (ballBottom >= paddleTop &&
            ballTop <= paddleBottom &&
            ballRight >= paddleLeft &&
            ballLeft <= paddleRight) {
            return true;
        }

        return false;
    }

    /**
     * Check laser-brick collision
     */
    checkLaserBrickCollision(laser, brick) {
        if (brick.destroyed) return false;

        return (
            laser.x < brick.x + brick.width &&
            laser.x + laser.width > brick.x &&
            laser.y < brick.y + brick.height &&
            laser.y + laser.height > brick.y
        );
    }

    /**
     * Get neighboring bricks for explosive effect
     */
    getNeighborBricks(brick, allBricks, radius = 1) {
        const neighbors = [];
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        const explosionRadius = (brick.width + brick.height) * radius;

        for (const other of allBricks) {
            if (other === brick || other.destroyed) continue;

            const otherCenterX = other.x + other.width / 2;
            const otherCenterY = other.y + other.height / 2;

            const dx = otherCenterX - brickCenterX;
            const dy = otherCenterY - brickCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= explosionRadius) {
                neighbors.push(other);
            }
        }

        return neighbors;
    }

    /**
     * Calculate reflection angle based on paddle hit position
     */
    calculateBounceAngle(ball, paddle) {
        // Calculate where on the paddle the ball hit (0 to 1)
        const paddleLeft = paddle.position.x - paddle.width / 2;
        const hitPosition = (ball.position.x - paddleLeft) / paddle.width;
        
        // Map to angle range: -60 to -120 degrees (in radians)
        // hitPosition 0 (left edge) = -150 degrees
        // hitPosition 1 (right edge) = -30 degrees
        const minAngle = -Math.PI * 5/6; // -150 degrees
        const maxAngle = -Math.PI / 6;   // -30 degrees
        
        return minAngle + hitPosition * (maxAngle - minAngle);
    }
}
