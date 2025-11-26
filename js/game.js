/**
 * Game States Enumeration
 */
const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    HIGH_SCORES: 'highScores'
};

/**
 * Main Game Controller - Orchestrates all game systems
 */
class Game {
    constructor() {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        this.resizeCanvas();

        // Initialize core systems
        this.eventBus = new EventBus();
        this.config = new ConfigManager();
        this.entityManager = new EntityManager(this.eventBus);
        
        // Initialize game state
        this.state = GameStates.MENU;
        this.score = 0;
        this.cameraY = 0;
        this.lastPlatformY = 0;

        // Initialize managers
        this.difficultyManager = new DifficultyManager(this.eventBus, this.config);
        this.performanceManager = new PerformanceManager(this.eventBus);
        this.highScoreManager = new HighScoreManager();

        // Initialize input
        this.input = new InputManager(this.canvas);
        this.touchManager = new TouchManager(this.canvas, this.eventBus);

        // Initialize systems
        this.physicsSystem = new PhysicsSystem(this.eventBus, this.config);
        this.collisionSystem = new CollisionSystem(this.eventBus, this.config);
        this.particleSystem = new ParticleSystem(this.eventBus, this.entityManager, this.config);
        this.renderSystem = new RenderSystem(this.canvas, this.eventBus, this.config);
        this.audioSystem = new AudioSystem(this.eventBus, this.config);

        // UI elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.difficultyElement = document.getElementById('difficulty');

        // Setup
        this.setupEventListeners();
        this.setupUI();
        this.updateHighScoreDisplay();

        // Window resize handler
        window.addEventListener('resize', () => this.resizeCanvas());

        // Visibility change handler
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Start game loop
        this.lastFrameTime = 0;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);

        // Start performance monitoring
        this.performanceManager.startMonitoring();

        // Store reference for global access
        window.game = this;
    }

    /**
     * Resize canvas to fill window
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.renderSystem) {
            this.renderSystem.resize();
        }
        if (this.physicsSystem) {
            this.physicsSystem.setScreenSize(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Setup game event listeners
     */
    setupEventListeners() {
        // Score events
        this.eventBus.on('score:add', (data) => {
            const multiplier = this.difficultyManager.getScoreMultiplier();
            this.score += Math.floor(data.points * multiplier);
            this.updateScoreDisplay();
            this.eventBus.emit('score:changed', { score: this.score });
        });

        // Bubble events
        this.eventBus.on('bubble:split', (data) => {
            this.handleBubbleSplit(data);
        });

        this.eventBus.on('gravity:reverse', (data) => {
            this.physicsSystem.applyReverseGravity(data.bubbleId, data.duration);
            const bubble = this.entityManager.getEntity(data.bubbleId);
            if (bubble) {
                bubble.hasReverseGravity = true;
                setTimeout(() => {
                    if (bubble) bubble.hasReverseGravity = false;
                }, data.duration);
            }
        });

        // Performance events
        this.eventBus.on('performance:quality_changed', (data) => {
            this.renderSystem.setQuality(data.quality);
            this.particleSystem.setMaxParticles(data.settings.maxParticles);
        });

        // Difficulty events
        this.eventBus.on('difficulty:changed', (data) => {
            this.updateDifficultyDisplay();
        });

        // Input events
        this.eventBus.on('input:jump', () => {
            if (this.state === GameStates.PLAYING) {
                this.handleJump();
            }
        });
    }

    /**
     * Setup UI button handlers
     */
    setupUI() {
        // Menu buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.audioSystem.init();
            this.startGame();
        });
        document.getElementById('scoresBtn').addEventListener('click', () => this.showHighScores());

        // Game over buttons
        document.getElementById('playAgain').addEventListener('click', () => {
            this.startGame();
        });
        document.getElementById('mainMenu').addEventListener('click', () => this.setState(GameStates.MENU));
        document.getElementById('submitScore').addEventListener('click', () => this.submitHighScore());

        // High scores back button
        document.getElementById('backBtn').addEventListener('click', () => this.setState(GameStates.MENU));

        // Canvas click/touch for jump (as backup)
        this.canvas.addEventListener('click', () => {
            if (this.state === GameStates.PLAYING) {
                this.handleJump();
            }
        });
    }

    /**
     * Start a new game
     */
    startGame() {
        // Reset state
        this.score = 0;
        this.cameraY = 0;
        this.lastPlatformY = this.canvas.height;

        // Clear entities
        this.entityManager.clear();
        this.particleSystem.clear();

        // Reset systems
        this.physicsSystem.reset();
        this.difficultyManager.reset();
        this.performanceManager.reset();

        // Create initial bubble
        const bubble = this.createBubble(this.canvas.width / 2, this.canvas.height - 100);

        // Create initial platforms
        this.createInitialPlatforms();

        // Start playing
        this.setState(GameStates.PLAYING);
        this.updateScoreDisplay();
        this.updateDifficultyDisplay();
        
        this.eventBus.emit('game:started');
    }

    /**
     * Create a bubble entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {boolean} isClone - Is this a split clone
     * @returns {Object} Created bubble
     */
    createBubble(x, y, isClone = false) {
        const bubble = this.entityManager.createEntity('bubble', {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: this.config.get('physics.bubbleRadius'),
            isClone: isClone,
            isDead: false,
            hasReverseGravity: false,
            trailPoints: []
        });
        return bubble;
    }

    /**
     * Create initial platforms
     */
    createInitialPlatforms() {
        const platformCount = this.config.get('game.initialPlatformCount') || 10;

        // Starting platform directly under bubble
        this.createPlatform(
            this.canvas.width / 2 - 50,
            this.canvas.height - 50,
            100,
            'normal'
        );

        // Generate additional platforms
        for (let i = 0; i < platformCount; i++) {
            this.generatePlatform();
        }
    }

    /**
     * Create a platform entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Platform width
     * @param {string} type - Platform type
     * @returns {Object} Created platform
     */
    createPlatform(x, y, width, type) {
        const speedMultiplier = this.difficultyManager.getSpeedMultiplier();
        const movingChance = this.difficultyManager.getMovingPlatformChance();
        
        let vx = 0;
        if (Math.random() < movingChance && y < this.canvas.height - 200) {
            const baseSpeed = this.config.get('platforms.baseSpeed');
            vx = (Math.random() - 0.5) * baseSpeed * speedMultiplier * 2;
        }

        const platform = this.entityManager.createEntity('platform', {
            x: x,
            y: y,
            width: width,
            height: this.config.get('platforms.height'),
            vx: vx,
            platformType: type,
            hit: false,
            markedForDeletion: false,
            breaking: false
        });

        return platform;
    }

    /**
     * Generate a new platform above the highest platform
     */
    generatePlatform() {
        const gap = this.difficultyManager.getPlatformGap();
        const widthRange = this.difficultyManager.getPlatformWidthRange();
        const width = widthRange.min + Math.random() * (widthRange.max - widthRange.min);
        const x = Math.random() * (this.canvas.width - width);
        const y = this.lastPlatformY - gap;
        const type = this.difficultyManager.selectPlatformType();

        this.createPlatform(x, y, width, type);
        this.lastPlatformY = y;
    }

    /**
     * Handle jump input
     */
    handleJump() {
        const bubbles = this.entityManager.getEntitiesByType('bubble');
        bubbles.forEach(bubble => {
            if (!bubble.isDead) {
                this.physicsSystem.jump(bubble);
            }
        });
    }

    /**
     * Handle bubble split from rainbow platform
     * @param {Object} data - Split event data
     */
    handleBubbleSplit(data) {
        const originalBubble = data.bubble;
        
        // Create clone bubble
        const clone = this.createBubble(
            originalBubble.x + 30,
            originalBubble.y,
            true
        );
        
        // Give bubbles opposite horizontal velocities
        originalBubble.vx = -2;
        clone.vx = 2;
        clone.vy = originalBubble.vy;

        // Bonus score for split
        this.eventBus.emit('score:add', { points: 50, reason: 'split' });
    }

    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    loop(timestamp) {
        // Calculate delta time
        const deltaTime = this.lastFrameTime ? (timestamp - this.lastFrameTime) / 16.67 : 1;
        this.lastFrameTime = timestamp;

        // Update performance manager
        this.performanceManager.updateFrame(timestamp);

        if (this.state === GameStates.PLAYING) {
            // Handle input
            if (this.input.isJustPressed()) {
                this.handleJump();
            }

            // Get all entities
            const allEntities = this.entityManager.getAllEntities();
            const bubbles = this.entityManager.getEntitiesByType('bubble');
            const platforms = this.entityManager.getEntitiesByType('platform');

            // Update physics
            this.physicsSystem.update(allEntities, deltaTime);

            // Update collisions
            this.collisionSystem.update(allEntities);

            // Update particles
            this.particleSystem.update(deltaTime);

            // Update camera
            this.updateCamera(bubbles);

            // Check for death
            this.checkBubbleDeath(bubbles);

            // Generate new platforms
            this.generatePlatformsAsNeeded();

            // Cleanup old platforms
            this.cleanupPlatforms(platforms);

            // Update score based on height
            this.updateHeightScore();

            // Render
            const renderEntities = [
                ...platforms.filter(p => !p.markedForDeletion),
                ...bubbles.filter(b => !b.isDead),
                ...this.particleSystem.getParticles()
            ];
            this.renderSystem.render(renderEntities, this.cameraY);

            // Check game over
            const aliveBubbles = bubbles.filter(b => !b.isDead);
            if (aliveBubbles.length === 0) {
                this.endGame();
            }
        } else if (this.state === GameStates.MENU) {
            // Render empty background for menu
            this.renderSystem.clear();
            this.renderSystem.drawBackground();
        }

        // Reset input state
        this.input.resetFrame();
        this.touchManager.resetFrame();

        // Continue loop
        requestAnimationFrame(this.loop);
    }

    /**
     * Update camera to follow bubbles
     * @param {Array} bubbles - Bubble entities
     */
    updateCamera(bubbles) {
        const aliveBubbles = bubbles.filter(b => !b.isDead);
        if (aliveBubbles.length === 0) return;

        // Follow highest bubble
        const highestBubble = aliveBubbles.reduce(
            (highest, bubble) => bubble.y < highest.y ? bubble : highest,
            aliveBubbles[0]
        );

        const threshold = this.canvas.height * this.config.get('game.cameraThreshold');
        
        if (highestBubble.y < this.cameraY + threshold) {
            const targetY = highestBubble.y - threshold;
            const followSpeed = this.config.get('game.cameraFollowSpeed');
            this.cameraY += (targetY - this.cameraY) * followSpeed;
        }
    }

    /**
     * Check if bubbles have fallen off screen
     * @param {Array} bubbles - Bubble entities
     */
    checkBubbleDeath(bubbles) {
        const deathBuffer = this.config.get('game.deathBuffer');
        
        bubbles.forEach(bubble => {
            if (!bubble.isDead && bubble.y - this.cameraY > this.canvas.height + deathBuffer) {
                bubble.isDead = true;
                this.eventBus.emit('bubble:died', { bubbleId: bubble.id });
            }
        });
    }

    /**
     * Generate platforms as camera moves up
     */
    generatePlatformsAsNeeded() {
        while (this.lastPlatformY > this.cameraY - 100) {
            this.generatePlatform();
        }
    }

    /**
     * Remove platforms that are below the screen
     * @param {Array} platforms - Platform entities
     */
    cleanupPlatforms(platforms) {
        const cleanupBuffer = this.config.get('game.platformCleanupBuffer');
        
        platforms.forEach(platform => {
            if (platform.y > this.cameraY + this.canvas.height + cleanupBuffer) {
                this.entityManager.destroyEntity(platform.id);
            }
            if (platform.markedForDeletion) {
                this.entityManager.destroyEntity(platform.id);
            }
        });
    }

    /**
     * Update score based on height reached
     */
    updateHeightScore() {
        const heightScore = Math.floor(Math.abs(this.cameraY) * this.config.get('game.scoreMultiplier'));
        if (heightScore > this.score) {
            this.score = heightScore;
            this.updateScoreDisplay();
            this.eventBus.emit('score:changed', { score: this.score });
        }
    }

    /**
     * End the current game
     */
    endGame() {
        this.setState(GameStates.GAME_OVER);
        
        const finalScore = Math.floor(this.score);
        document.getElementById('finalScore').textContent = `Score: ${finalScore}`;

        if (this.highScoreManager.isHighScore(finalScore) && finalScore > 0) {
            document.getElementById('newHighScore').classList.remove('hidden');
            document.getElementById('newHighScore').style.display = 'block';
            document.getElementById('nameInput').value = '';
            document.getElementById('nameInput').focus();
        }

        this.eventBus.emit('game:over', { score: finalScore });
    }

    /**
     * Submit high score
     */
    submitHighScore() {
        const name = document.getElementById('nameInput').value;
        const score = Math.floor(this.score);
        this.highScoreManager.addScore(name, score);
        
        document.getElementById('newHighScore').classList.add('hidden');
        document.getElementById('newHighScore').style.display = 'none';
        
        this.updateHighScoreDisplay();
        this.showHighScores();
    }

    /**
     * Show high scores screen
     */
    showHighScores() {
        this.setState(GameStates.HIGH_SCORES);
        this.highScoreManager.displayScores('scoresList');
    }

    /**
     * Set game state
     * @param {string} newState - New state
     */
    setState(newState) {
        this.state = newState;

        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.style.display = 'none';
        });
        document.getElementById('newHighScore').classList.add('hidden');
        document.getElementById('newHighScore').style.display = 'none';

        // Show appropriate screen
        const screenMap = {
            [GameStates.MENU]: 'menu',
            [GameStates.GAME_OVER]: 'gameOver',
            [GameStates.HIGH_SCORES]: 'highScores'
        };

        const screenId = screenMap[this.state];
        if (screenId) {
            const screen = document.getElementById(screenId);
            screen.classList.remove('hidden');
            screen.style.display = 'block';
        }

        this.eventBus.emit('state:changed', { state: newState });
    }

    /**
     * Update score display
     */
    updateScoreDisplay() {
        this.scoreElement.textContent = `Score: ${Math.floor(this.score)}`;
    }

    /**
     * Update high score display
     */
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = `High: ${this.highScoreManager.getHighScore()}`;
    }

    /**
     * Update difficulty display
     */
    updateDifficultyDisplay() {
        if (this.difficultyElement) {
            this.difficultyElement.textContent = this.difficultyManager.getLevelName();
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden && this.state === GameStates.PLAYING) {
            this.pause();
        }
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.state === GameStates.PLAYING) {
            this.state = GameStates.PAUSED;
            this.eventBus.emit('game:paused');
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.state === GameStates.PAUSED) {
            this.state = GameStates.PLAYING;
            this.eventBus.emit('game:resumed');
        }
    }
}

// Start the game when page loads
window.onload = () => {
    const game = new Game();
};