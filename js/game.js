/**
 * Game States - Updated 11/25/2025
 */
const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    HIGH_SCORES: 'highScores'
};

/**
 * Main Game Controller - Orchestrates all game systems
 */
class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Game state
        this.state = GameStates.MENU;
        this.level = 1;
        this.lives = 3;
        this.maxLives = 5;
        this.levelTime = 0;
        this.gameTime = 0;

        // Initialize managers and systems
        this.highScoreManager = new HighScoreManager();
        this.levelManager = new LevelManager();
        this.powerUpManager = new PowerUpManager();
        this.scoreManager = new ScoreManager();
        this.physics = new Physics();
        this.audio = new AudioManager();
        this.input = new InputManager(this.canvas);
        this.renderer = new Renderer(this.canvas);
        this.particleSystem = new ParticleSystem(200);

        // Game entities
        this.balls = [];
        this.paddle = null;
        this.bricks = [];
        this.lasers = [];
        this.stuckBall = null; // Ball stuck to sticky paddle

        // Power-up special states
        this.autoBurstActive = false;
        this.autoBurstBallsRemaining = 0;
        this.autoBurstTimer = 0;
        this.nextBrickExplodes = false; // EXPLOSIVE_NEXT power-up
        
        // Party mode (from SUPER_POWERUP brick)
        this.partyModeActive = false;
        this.partyModeTimer = 0;
        this.partyModeDuration = 10; // 10 seconds
        this.partyModeHue = 0;

        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1 / 60;

        // Setup
        this.setupUI();
        this.updateHighScoreDisplay(); // Don't await to avoid blocking constructor

        // Start game loop
        requestAnimationFrame((t) => this.gameLoop(t));

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        
        // Simply match canvas to container size
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Remove any CSS sizing that might conflict
        this.canvas.style.width = '';
        this.canvas.style.height = '';
        
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
        if (this.input) {
            this.input.updateTouchZones();
        }
        
        // If we have a paddle, reposition it to ensure it's always visible
        if (this.paddle) {
            const paddleOffset = Math.max(50, this.canvas.height * 0.08);
            const newPaddleY = this.canvas.height - paddleOffset;
            this.paddle.position.y = newPaddleY;
        }
    }

    setupUI() {
        // One-time handler to init audio and start menu music on first tap/click
        const initAudioOnFirstInteraction = () => {
            if (!this.audio.initialized) {
                this.audio.init();
                // Start menu music immediately after init if on menu
                if (this.state === GameStates.MENU || this.state === GameStates.HIGH_SCORES) {
                    this.audio.startMusic();
                }
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', initAudioOnFirstInteraction);
            document.removeEventListener('touchstart', initAudioOnFirstInteraction);
        };
        
        document.addEventListener('click', initAudioOnFirstInteraction);
        document.addEventListener('touchstart', initAudioOnFirstInteraction);

        // Menu buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.startGame();
        });

        document.getElementById('scoresBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.showHighScores();
        });

        // Pause buttons
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.resumeGame();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.quitToMenu();
        });

        // Level complete button
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.nextLevel();
        });

        // Game over buttons
        document.getElementById('playAgain').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.startGame();
        });

        document.getElementById('mainMenu').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.setState(GameStates.MENU);
        });

        document.getElementById('submitScore').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.submitHighScore();
        });

        // Leaderboards button from game over screen
        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.showHighScores();
        });

        // High scores back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.audio.playButtonClick();
            this.setState(GameStates.MENU);
        });

        // Enable/disable submit button based on name input
        document.getElementById('nameInput').addEventListener('input', (e) => {
            const submitBtn = document.getElementById('submitScore');
            submitBtn.disabled = e.target.value.trim().length === 0;
        });

        // Enter key for name input
        document.getElementById('nameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim().length > 0) {
                this.submitHighScore();
            }
        });
    }

    setState(newState) {
        this.state = newState;
        
        // Refresh scores when entering main menu (but don't wait for it)
        if (newState === GameStates.MENU) {
            this.refreshHighScores();
        }
        
        // Handle music for menu states (only if audio is initialized)
        if (this.audio.initialized) {
            if (newState === GameStates.MENU || newState === GameStates.HIGH_SCORES) {
                // Start menu music if not already playing
                if (!this.audio.isMusicPlaying()) {
                    this.audio.startMusic();
                }
            } else if (newState === GameStates.PLAYING) {
                // Stop music when starting to play (will restart when ball is launched)
                this.audio.stopMusic();
            }
        }
        
        this.updateUI();
    }

    updateUI() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

        // Show appropriate screen
        switch (this.state) {
            case GameStates.MENU:
                document.getElementById('menu').classList.remove('hidden');
                break;
            case GameStates.PAUSED:
                document.getElementById('paused').classList.remove('hidden');
                break;
            case GameStates.LEVEL_COMPLETE:
                document.getElementById('levelComplete').classList.remove('hidden');
                break;
            case GameStates.GAME_OVER:
                document.getElementById('gameOver').classList.remove('hidden');
                break;
            case GameStates.HIGH_SCORES:
                document.getElementById('highScores').classList.remove('hidden');
                // Don't auto-display scores here - they're displayed in showHighScores()
                break;
        }
    }

    async updateHUD() {
        document.getElementById('score').textContent = 'Score: ' + this.scoreManager.score.toLocaleString();
        const highScore = await this.highScoreManager.getHighScore();
        document.getElementById('highScore').textContent = 'High: ' + highScore.toLocaleString();
        document.getElementById('level').textContent = 'Level: ' + this.level;
        document.getElementById('lives').textContent = 'Lives: ' + this.lives;
    }

    async updateHighScoreDisplay() {
        const highScore = await this.highScoreManager.getHighScore();
        document.getElementById('highScore').textContent = 'High: ' + highScore.toLocaleString();
    }

    /**
     * Refresh high scores from Firebase (non-blocking)
     */
    refreshHighScores() {
        // Fire and forget - don't await to avoid blocking UI
        this.highScoreManager.refreshScores().then(() => {
            // Update the high score display after refresh
            this.updateHighScoreDisplay();
        }).catch(error => {
            console.warn('Failed to refresh scores:', error);
        });
    }

    showHighScores() {
        this.setState(GameStates.HIGH_SCORES);
        // Force refresh when viewing leaderboard
        setTimeout(() => {
            this.highScoreManager.displayScores('scoresList', true);
        }, 100);
    }

    startGame() {
        this.level = 1;
        this.lives = 3;
        this.gameTime = 0;
        this.scoreManager.reset();
        this.levelManager.reset();
        this.powerUpManager.clear();
        
        // Refresh high score at game start
        this.refreshHighScores();
        
        this.loadLevel(this.level);
        this.setState(GameStates.PLAYING);
    }

    loadLevel(levelNum) {
        this.level = levelNum;
        this.levelTime = 0;
        
        // Generate bricks for this level - pass both width and height for proportional scaling
        this.bricks = this.levelManager.generateLevel(levelNum, this.canvas.width, this.canvas.height);
        
        // Calculate scaled sizes based on screen dimensions
        // Use the smaller dimension to ensure everything fits
        const scaleFactor = Math.min(this.canvas.width / 400, this.canvas.height / 600);
        
        // Scale paddle size - base is 80x12, scale with screen but keep reasonable bounds
        const paddleWidth = Math.max(60, Math.min(120, 80 * scaleFactor));
        const paddleHeight = Math.max(10, Math.min(16, 12 * scaleFactor));
        
        // Create paddle - position at 8% from bottom
        const paddleOffset = Math.max(50, this.canvas.height * 0.08);
        const paddleY = this.canvas.height - paddleOffset;
        this.paddle = new Paddle(this.canvas.width / 2, paddleY, paddleWidth, paddleHeight);
        
        // Store scale factor for ball creation
        this.scaleFactor = scaleFactor;
        
        // Create ball on paddle
        this.balls = [];
        this.createBallOnPaddle();
        
        // Clear other entities
        this.lasers = [];
        this.stuckBall = null;
        this.particleSystem.clear();
        this.powerUpManager.clear();
        this.scoreManager.resetCombo();
        
        this.updateHUD();
    }

    createBallOnPaddle() {
        // Scale ball radius based on screen size
        const ballRadius = Math.max(6, Math.min(12, 8 * (this.scaleFactor || 1)));
        
        // Calculate speed scale based on screen height
        // Taller screens need faster balls to maintain same gameplay feel
        // Base reference is 600px height
        const speedScale = Math.max(0.8, Math.min(1.5, this.canvas.height / 600));
        
        const ball = new Ball(
            this.paddle.position.x,
            this.paddle.position.y - ballRadius - 5,
            ballRadius,
            this.level,
            speedScale
        );
        this.balls.push(ball);
        return ball;
    }

    nextLevel() {
        this.level++;
        this.loadLevel(this.level);
        this.setState(GameStates.PLAYING);
    }

    pauseGame() {
        if (this.state === GameStates.PLAYING) {
            this.setState(GameStates.PAUSED);
        }
    }

    resumeGame() {
        if (this.state === GameStates.PAUSED) {
            this.setState(GameStates.PLAYING);
            this.input.clearKey('Escape');
            this.input.clearKey('KeyP');
        }
    }

    quitToMenu() {
        // Music continues - setState will keep it playing for menu
        this.setState(GameStates.MENU);
    }

    async loseLife() {
        this.lives--;
        this.audio.playLifeLost();
        this.audio.stopMusic(); // Stop all music (normal and super) when losing a life
        
        // Reset party mode
        this.partyModeActive = false;
        this.partyModeTimer = 0;
        
        // Flash screen red
        this.renderer.flashScreen('#ff0000', 0.3);
        
        if (this.lives <= 0) {
            await this.gameOver();
        } else {
            // Reset ball position
            this.balls = [];
            this.createBallOnPaddle();
            this.stuckBall = null;
            this.powerUpManager.clearEffects();
            this.paddle.reset(this.canvas.width / 2, this.paddle.position.y);
        }
        
        await this.updateHUD();
    }

    async gameOver() {
        this.audio.playGameOver();
        this.setState(GameStates.GAME_OVER);
        
        document.getElementById('finalScore').textContent = 'Score: ' + this.scoreManager.score.toLocaleString();
        document.getElementById('finalLevel').textContent = 'Level Reached: ' + this.level;
        
        // Reset submit button state for new game over
        const submitBtn = document.getElementById('submitScore');
        const nameInput = document.getElementById('nameInput');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submit';
        nameInput.disabled = false;
        nameInput.value = '';
        
        // Check for high score (async)
        try {
            const isHighScore = await this.highScoreManager.isHighScore(this.scoreManager.score);
            if (isHighScore) {
                document.getElementById('newHighScore').classList.remove('hidden');
                // Get and display predicted rank
                const rank = await this.highScoreManager.getPredictedRank(this.scoreManager.score);
                const rankText = document.getElementById('highScoreRank');
                if (rankText) {
                    const suffix = this.getOrdinalSuffix(rank);
                    rankText.textContent = `You ranked ${rank}${suffix}!`;
                }
                nameInput.focus();
            } else {
                document.getElementById('newHighScore').classList.add('hidden');
            }
        } catch (error) {
            console.warn('Failed to check high score status:', error);
            // Show input anyway on error
            document.getElementById('newHighScore').classList.remove('hidden');
            document.getElementById('highScoreRank').textContent = 'You made the leaderboard!';
            nameInput.focus();
        }
    }

    levelComplete() {
        this.audio.stopMusic(); // Stop all music (normal and super) when level is complete
        this.audio.playLevelComplete();
        
        // Reset party mode
        this.partyModeActive = false;
        this.partyModeTimer = 0;
        
        // Calculate bonus
        const bonus = this.scoreManager.calculateLevelScore(
            this.level,
            this.levelTime,
            this.lives
        );
        
        this.scoreManager.addBonus(bonus.total, 'LEVEL BONUS');
        
        this.setState(GameStates.LEVEL_COMPLETE);
        
        document.getElementById('levelScore').textContent = 'Score: ' + this.scoreManager.score.toLocaleString();
        document.getElementById('levelBonus').textContent = 'Bonus: +' + bonus.total.toLocaleString();
        
        this.updateHUD();
    }

    /**
     * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
     */
    getOrdinalSuffix(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    async submitHighScore() {
        const nameInput = document.getElementById('nameInput');
        const submitBtn = document.getElementById('submitScore');
        const name = nameInput.value.trim() || 'PLAYER';
        
        // Prevent double submission
        if (submitBtn.disabled && nameInput.value.trim().length > 0) return;
        
        // Show submitting state
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        try {
            await this.highScoreManager.addScore(name, this.scoreManager.score, this.level);
            await this.updateHighScoreDisplay();
            
            // Success state
            nameInput.disabled = true;
            submitBtn.textContent = 'Submitted! ✅';
            
            document.getElementById('newHighScore').classList.add('hidden');
            
            // Take them to the leaderboard after a brief delay
            setTimeout(() => {
                this.showHighScores();
            }, 500);
        } catch (error) {
            console.error('Failed to submit high score:', error);
            // Error state
            submitBtn.textContent = 'Failed - Try Again';
            submitBtn.disabled = false;
        }
    }

    // ==================== GAME LOGIC ====================

    update(dt) {
        if (this.state !== GameStates.PLAYING) return;

        this.gameTime += dt;
        this.levelTime += dt;
        
        // Update party mode timer
        if (this.partyModeActive) {
            this.partyModeTimer -= dt;
            this.partyModeHue = (this.partyModeHue + 200 * dt) % 360;
            
            if (this.partyModeTimer <= 0) {
                this.partyModeActive = false;
                this.partyModeTimer = 0;
                // Stop super music and resume normal gameplay music
                this.audio.stopSuperMusic(true);
            }
        }

        // Handle input
        this.handleInput(dt);

        // Update paddle
        this.paddle.update(dt, this.canvas.width);

        // Update balls
        this.updateBalls(dt);

        // Update bricks
        for (const brick of this.bricks) {
            brick.update(dt);
        }

        // Update lasers
        this.updateLasers(dt);

        // Update power-ups
        this.updatePowerUps(dt);

        // Update particles
        this.particleSystem.update(dt);

        // Update score manager
        this.scoreManager.update(dt);

        // Check level complete
        if (this.levelManager.isLevelComplete(this.bricks)) {
            this.levelComplete();
        }

        // Update HUD
        this.updateHUD();
    }

    handleInput(dt) {
        // Pause
        if (this.input.isPausePressed()) {
            this.pauseGame();
            this.input.clearKey('Escape');
            this.input.clearKey('KeyP');
            return;
        }

        // Paddle movement
        if (this.input.isMovingLeft()) {
            this.paddle.moveLeft();
        }
        if (this.input.isMovingRight()) {
            this.paddle.moveRight();
        }

        // Ball stuck on paddle follows paddle
        if (this.balls.length > 0 && !this.balls[0].launched) {
            this.balls[0].position.x = this.paddle.position.x;
        }

        // Sticky paddle ball follows paddle
        if (this.stuckBall) {
            this.stuckBall.position.x = this.paddle.position.x;
        }

        // Launch ball
        if (this.input.isLaunchPressed()) {
            // Launch unlaunched balls
            let ballLaunched = false;
            for (const ball of this.balls) {
                if (!ball.launched) {
                    ball.launch();
                    this.audio.playLaunch();
                    ballLaunched = true;
                }
            }
            
            // Release sticky ball
            if (this.stuckBall) {
                this.stuckBall.launch();
                this.audio.playLaunch();
                this.stuckBall = null;
                ballLaunched = true;
            }
            
            // Start background music if a ball was launched and music isn't playing
            if (ballLaunched && !this.audio.isMusicPlaying()) {
                this.audio.startMusic();
            }

            // Shoot laser if available
            if (this.paddle.hasLaser && this.paddle.canShootLaser()) {
                const laser = this.paddle.shootLaser();
                if (laser) {
                    this.lasers.push(laser);
                    this.audio.playLaser();
                }
            }
        }
    }

    updateBalls(dt) {
        // Handle AUTO_BURST power-up - spawn balls over time
        if (this.autoBurstActive && this.autoBurstBallsRemaining > 0) {
            this.autoBurstTimer += dt;
            if (this.autoBurstTimer >= 1.0) { // Spawn a ball every second
                this.autoBurstTimer = 0;
                this.autoBurstBallsRemaining--;
                
                // Spawn new ball from paddle with scaled size and speed
                const ballRadius = Math.max(6, Math.min(12, 8 * (this.scaleFactor || 1)));
                const speedScale = Math.max(0.8, Math.min(1.5, this.canvas.height / 600));
                const newBall = new Ball(
                    this.paddle.position.x + this.paddle.width / 2,
                    this.paddle.position.y - ballRadius - 5,
                    ballRadius,
                    this.level,
                    speedScale
                );
                newBall.launched = true;
                const angle = -Math.PI/2 + (Math.random() - 0.5) * (Math.PI / 4);
                newBall.velocity = Vector2.fromAngle(angle, newBall.speed);
                this.balls.push(newBall);
                this.audio.playPowerUp();
                
                // Particle burst for new ball
                this.particleSystem.emit(
                    newBall.position.x,
                    newBall.position.y,
                    10,
                    { color: '#00ffff', minSpeed: 2, maxSpeed: 5 }
                );
                
                if (this.autoBurstBallsRemaining <= 0) {
                    this.autoBurstActive = false;
                }
            }
        }

        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            
            const updateResult = ball.update(dt, this.canvas.width, this.canvas.height);

            // Play wall hit sound
            if (updateResult && updateResult.wallHit) {
                this.audio.playWallHit();
            }

            if (!ball.launched) continue;

            // Check paddle collision
            if (this.physics.checkBallPaddleCollision(ball, this.paddle)) {
                if (this.paddle.isSticky && !this.stuckBall) {
                    // Stick to paddle
                    ball.launched = false;
                    ball.velocity.set(0, 0);
                    this.stuckBall = ball;
                } else {
                    // Bounce off paddle
                    ball.bounceOffPaddle(this.paddle);
                    this.audio.playPaddleHit();
                    
                    // Emit particles
                    this.particleSystem.emit(
                        ball.position.x,
                        ball.position.y,
                        5,
                        { color: '#4ecdc4', minSpeed: 1, maxSpeed: 3 }
                    );
                }
            }

            // Check brick collisions
            for (const brick of this.bricks) {
                const collision = this.physics.checkBallBrickCollision(ball, brick);
                if (collision) {
                    this.handleBrickHit(ball, brick);
                    
                    // Speed up ball slightly
                    if (!ball.isMega) {
                        ball.speedUp(0.05);
                    }
                    break; // Only one brick collision per frame per ball
                }
            }

            // Check if ball is out of bounds
            if (ball.isOutOfBounds(this.canvas.height)) {
                this.balls.splice(i, 1);
                
                // If no balls left, lose a life
                if (this.balls.length === 0) {
                    this.loseLife(); // Fire and forget - don't await to keep game loop smooth
                }
            }
        }
    }

    handleBrickHit(ball, brick) {
        const result = brick.hit();
        
        // Check if EXPLOSIVE_NEXT power-up is active - make this brick explode
        if (this.nextBrickExplodes && !result.explosive) {
            result.explosive = true;
            this.nextBrickExplodes = false; // Consume the power-up
            
            // Visual indicator that power-up was used
            this.particleSystem.emit(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                20,
                { color: '#ff00ff', minSpeed: 3, maxSpeed: 7 }
            );
        }

        // Handle MOVING brick teleportation
        if (result.shouldTeleport && !result.destroyed) {
            const newPos = this.findEmptyBrickPosition(brick);
            if (newPos) {
                brick.setMoveTarget(newPos.x, newPos.y);
                this.audio.playPowerUp(); // Use power-up sound for teleport
            }
        }
        
        // Handle MIRROR brick clone creation (happens on first hit, not destruction)
        if (result.createClone && !result.destroyed) {
            this.createMirrorClone(brick);
        }
        
        if (result.destroyed) {
            this.audio.playBrickDestroy();
            
            // Trigger background pulse for visual feedback
            this.renderer.triggerPulse(0.3);
            
            // Handle clone destruction - if clone destroyed, destroy original too
            if (result.isClone && result.originalBrick && !result.originalBrick.destroyed) {
                // Give bonus points for destroying clone
                const bonusPoints = result.originalBrick.points * 2;
                this.scoreManager.addBrickScore(
                    bonusPoints,
                    result.originalBrick.x + result.originalBrick.width / 2,
                    result.originalBrick.y + result.originalBrick.height / 2
                );
                
                // Big particle burst for bonus
                this.particleSystem.emit(
                    result.originalBrick.x + result.originalBrick.width / 2,
                    result.originalBrick.y + result.originalBrick.height / 2,
                    25,
                    { color: '#e0e0e0', minSpeed: 3, maxSpeed: 8, gravity: 0.2 }
                );
                
                // Destroy original brick
                result.originalBrick.startDestroy();
                this.audio.playExplosion();
                this.renderer.triggerPulse(0.8);
            }
            
            // Handle SUPER_POWERUP brick - activate party mode
            if (result.isSuperPowerup) {
                this.activatePartyMode();
            }
            
            // Add score
            this.scoreManager.addBrickScore(
                result.points,
                brick.x + brick.width / 2,
                brick.y + brick.height / 2
            );

            // Emit particles
            this.particleSystem.emit(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                15,
                { color: brick.color, minSpeed: 2, maxSpeed: 6, gravity: 0.2 }
            );

            // Handle special brick effects - spawn power-up
            if (result.dropPowerUp) {
                // If brick has a specific hidden power-up, spawn that one
                if (result.hiddenPowerUp) {
                    this.powerUpManager.spawnSpecific(
                        brick.x + brick.width / 2,
                        brick.y + brick.height / 2,
                        result.hiddenPowerUp
                    );
                } else {
                    // Random power-up from power brick or super power-up brick
                    this.powerUpManager.spawn(
                        brick.x + brick.width / 2,
                        brick.y + brick.height / 2,
                        true
                    );
                }
            }
            
            // Party mode - every brick drops a power-up!
            if (this.partyModeActive && !result.dropPowerUp) {
                this.powerUpManager.spawn(
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2,
                    true
                );
            }

            if (result.explosive) {
                this.handleExplosion(brick);
            }

            // Random power-up drop chance from regular bricks (reduced since we have assigned power-ups)
            if (!result.dropPowerUp && !this.partyModeActive && Math.random() < 0.05) {
                this.powerUpManager.spawn(
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2,
                    true
                );
            }
        } else {
            this.audio.playBrickHit();
            
            // Small particle burst for hit
            this.particleSystem.emit(
                ball.position.x,
                ball.position.y,
                3,
                { color: brick.color, minSpeed: 1, maxSpeed: 2 }
            );
        }
    }

    handleExplosion(brick) {
        this.audio.playExplosion();
        
        // Trigger big background pulse for explosion
        this.renderer.triggerPulse(1.0);
        
        // Big particle burst
        this.particleSystem.emit(
            brick.x + brick.width / 2,
            brick.y + brick.height / 2,
            30,
            { 
                color: '#ff6b6b', 
                minSpeed: 3, 
                maxSpeed: 8, 
                minSize: 3, 
                maxSize: 8,
                gravity: 0.3
            }
        );

        // Damage neighboring bricks
        const neighbors = this.physics.getNeighborBricks(brick, this.bricks, 1.5);
        for (const neighbor of neighbors) {
            const result = neighbor.hit();
            if (result.destroyed) {
                this.scoreManager.addBrickScore(
                    result.points,
                    neighbor.x + neighbor.width / 2,
                    neighbor.y + neighbor.height / 2
                );
                
                this.particleSystem.emit(
                    neighbor.x + neighbor.width / 2,
                    neighbor.y + neighbor.height / 2,
                    10,
                    { color: neighbor.color, minSpeed: 2, maxSpeed: 5 }
                );

                // Chain explosions!
                if (result.explosive) {
                    setTimeout(() => this.handleExplosion(neighbor), 100);
                }
            }
        }

        // Screen shake effect (flash)
        this.renderer.flashScreen('#ff6b6b', 0.2);
    }

    /**
     * Find an empty position for a MOVING brick to teleport to
     */
    findEmptyBrickPosition(movingBrick) {
        const brickWidth = movingBrick.width;
        const brickHeight = movingBrick.height;
        const padding = 5;
        const maxY = this.canvas.height * 0.5; // Only teleport to upper half
        
        // Get all current brick positions
        const occupiedPositions = this.bricks
            .filter(b => b !== movingBrick && !b.isMoving)
            .map(b => ({ x: b.x, y: b.y, width: b.width, height: b.height }));
        
        // Try random positions
        for (let attempt = 0; attempt < 50; attempt++) {
            const testX = padding + Math.random() * (this.canvas.width - brickWidth - padding * 2);
            const testY = 50 + Math.random() * (maxY - 50 - brickHeight);
            
            // Check if position overlaps with existing bricks
            let overlaps = false;
            for (const pos of occupiedPositions) {
                if (testX < pos.x + pos.width + padding &&
                    testX + brickWidth + padding > pos.x &&
                    testY < pos.y + pos.height + padding &&
                    testY + brickHeight + padding > pos.y) {
                    overlaps = true;
                    break;
                }
            }
            
            // Also ensure it's not too close to original position
            const distFromOriginal = Math.sqrt(
                Math.pow(testX - movingBrick.x, 2) + 
                Math.pow(testY - movingBrick.y, 2)
            );
            
            if (!overlaps && distFromOriginal > 100) {
                return { x: testX, y: testY };
            }
        }
        
        return null; // No valid position found
    }
    
    /**
     * Create a clone of a MIRROR brick at a random empty position
     */
    createMirrorClone(originalBrick) {
        const newPos = this.findEmptyBrickPosition(originalBrick);
        if (!newPos) {
            return null; // No valid position found
        }
        
        // Create clone brick
        const clone = new Brick(
            newPos.x,
            newPos.y,
            originalBrick.width,
            originalBrick.height,
            BrickTypes.MIRROR
        );
        
        // Mark as clone and link to original
        clone.isClone = true;
        clone.originalBrick = originalBrick;
        
        // Track clone in original brick
        originalBrick.clones.push(clone);
        
        // Add to bricks array
        this.bricks.push(clone);
        
        // Visual effect for clone creation
        this.particleSystem.emit(
            clone.x + clone.width / 2,
            clone.y + clone.height / 2,
            20,
            { color: '#e0e0e0', minSpeed: 2, maxSpeed: 6 }
        );
        
        this.audio.playPowerUp();
        this.renderer.triggerPulse(0.5);
        
        return clone;
    }
    
    /**
     * Activate party mode - all bricks drop power-ups for 10 seconds
     */
    activatePartyMode() {
        this.partyModeActive = true;
        this.partyModeTimer = this.partyModeDuration;
        this.partyModeHue = 0;
        
        // Flash screen rainbow
        this.renderer.flashScreen('#ffd700', 0.5);
        this.renderer.triggerPulse(2.0);
        
        // Play special sound and start super music!
        this.audio.playExtraLife();
        
        // Start the exciting star power music (like Mario Kart)
        if (this.balls.some(b => b.launched)) {
            this.audio.startSuperMusic();
        }
        
        // Big particle burst from all bricks
        for (const brick of this.bricks) {
            if (!brick.destroyed) {
                this.particleSystem.emit(
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2,
                    5,
                    { 
                        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                        minSpeed: 1,
                        maxSpeed: 3
                    }
                );
            }
        }
    }

    updateLasers(dt) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.y -= laser.speed;

            // Check brick collisions
            for (const brick of this.bricks) {
                if (this.physics.checkLaserBrickCollision(laser, brick)) {
                    this.lasers.splice(i, 1);
                    this.handleBrickHit({ position: { x: laser.x, y: laser.y }, isMega: false }, brick);
                    break;
                }
            }

            // Remove if off screen
            if (laser.y < 0) {
                this.lasers.splice(i, 1);
            }
        }
    }

    updatePowerUps(dt) {
        const result = this.powerUpManager.update(dt, this.paddle, this.canvas.height);
        
        if (result) {
            if (result.collected) {
                this.applyPowerUp(result.type);
            } else if (result.expired) {
                this.removePowerUpEffect(result.type);
            }
        }

        // Update active power-up display
        this.updatePowerUpDisplay();
    }

    applyPowerUp(type) {
        this.audio.playPowerUp();
        this.powerUpManager.activate(type);

        switch (type.id) {
            case 'multiball':
                // Spawn 2 additional balls with scaled size
                const mainBall = this.balls.find(b => b.launched) || this.balls[0];
                if (mainBall) {
                    const ballRadius = Math.max(6, Math.min(12, 8 * (this.scaleFactor || 1)));
                    const speedScale = Math.max(0.8, Math.min(1.5, this.canvas.height / 600));
                    for (let i = 0; i < 2; i++) {
                        const newBall = new Ball(mainBall.position.x, mainBall.position.y, ballRadius, this.level, speedScale);
                        newBall.launched = true;
                        const angle = -Math.PI/2 + (i === 0 ? -0.5 : 0.5);
                        newBall.velocity = Vector2.fromAngle(angle, mainBall.speed);
                        this.balls.push(newBall);
                    }
                }
                break;

            case 'extend':
                this.paddle.extend(30);
                break;

            case 'shrink':
                this.audio.playPowerDown();
                this.paddle.shrink(30);
                break;

            case 'sticky':
                this.paddle.setSticky(true);
                break;

            case 'laser':
                this.paddle.setLaser(true);
                break;

            case 'mega':
                for (const ball of this.balls) {
                    ball.setMega(true);
                }
                break;

            case 'slow':
                for (const ball of this.balls) {
                    ball.speed = Math.max(3, ball.speed - 2);
                    ball.velocity.normalize().multiply(ball.speed);
                }
                break;

            case 'fast':
                this.audio.playPowerDown();
                for (const ball of this.balls) {
                    ball.speedUp(2);
                }
                break;

            case 'life':
                this.lives = Math.min(this.lives + 1, this.maxLives);
                this.audio.playExtraLife();
                this.updateHUD();
                break;

            case 'multiplier':
                this.scoreManager.setMultiplier(2);
                break;

            case 'autoburst':
                // Spawn 10 balls over time (1 per second)
                this.autoBurstActive = true;
                this.autoBurstBallsRemaining = 10;
                this.autoBurstTimer = 0;
                // Flash screen cyan to indicate activation
                this.renderer.flashScreen('#00ffff', 0.3);
                break;

            case 'explosive':
                // Next brick hit will explode
                this.nextBrickExplodes = true;
                // Visual indicator - paddle glows
                this.particleSystem.emit(
                    this.paddle.position.x + this.paddle.width / 2,
                    this.paddle.position.y,
                    15,
                    { color: '#ff00ff', minSpeed: 2, maxSpeed: 5 }
                );
                break;
        }
    }

    removePowerUpEffect(type) {
        switch (type.id) {
            case 'extend':
                this.paddle.shrink(30);
                break;

            case 'shrink':
                this.paddle.extend(30);
                break;

            case 'sticky':
                this.paddle.setSticky(false);
                break;

            case 'laser':
                this.paddle.setLaser(false);
                break;

            case 'mega':
                for (const ball of this.balls) {
                    ball.setMega(false);
                }
                break;

            case 'slow':
                for (const ball of this.balls) {
                    ball.speed = ball.baseSpeed;
                    ball.velocity.normalize().multiply(ball.speed);
                }
                break;

            case 'fast':
                for (const ball of this.balls) {
                    ball.speed = Math.max(ball.baseSpeed, ball.speed - 2);
                    ball.velocity.normalize().multiply(ball.speed);
                }
                break;

            case 'multiplier':
                this.scoreManager.resetMultiplier();
                break;
        }
    }

    updatePowerUpDisplay() {
        const container = document.getElementById('powerup-display');
        const effects = this.powerUpManager.getActiveEffects();
        
        if (effects.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = effects.map(e => 
            `<div class="powerup-indicator" style="border-left: 3px solid ${e.color}">
                <span>${e.icon} ${e.name}</span>
                <div class="timer">
                    <div class="timer-bar" style="width: ${e.percent}%; background: ${e.color}"></div>
                </div>
            </div>`
        ).join('');
    }

    // ==================== RENDERING ====================

    render() {
        this.renderer.clear();
        
        if (this.state === GameStates.PLAYING || 
            this.state === GameStates.PAUSED ||
            this.state === GameStates.LEVEL_COMPLETE) {
            
            this.renderer.draw({
                balls: this.balls,
                paddle: this.paddle,
                bricks: this.bricks,
                lasers: this.lasers,
                particleSystem: this.particleSystem,
                powerUpManager: this.powerUpManager,
                scoreManager: this.scoreManager,
                time: this.gameTime,
                partyModeActive: this.partyModeActive,
                partyModeHue: this.partyModeHue,
                partyModeTimer: this.partyModeTimer,
                partyModeDuration: this.partyModeDuration
            });

            this.renderer.drawBoundaries();

            // Draw launch indicator if ball not launched
            if (this.balls.length > 0 && !this.balls[0].launched) {
                this.renderer.drawLaunchIndicator(this.paddle, this.balls[0]);
            }

            // Draw combo indicator
            if (this.scoreManager.combo > 2) {
                this.renderer.drawCombo(
                    this.scoreManager.combo,
                    this.canvas.width / 2,
                    this.canvas.height - 100
                );
            }
        }
    }

    // ==================== GAME LOOP ====================

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        // Fixed timestep update
        this.accumulator += dt;
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }

        // Render
        this.render();

        // Clear frame input states
        this.input.clearFrameStates();

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ==================== START GAME ====================

window.addEventListener('load', () => {
    new Game();
});
