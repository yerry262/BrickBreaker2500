/**
 * TouchManager - Enhanced touch controls for mobile devices
 */
class TouchManager {
    /**
     * Create a touch manager
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {EventBus} eventBus - Event bus
     */
    constructor(canvas, eventBus) {
        this.canvas = canvas;
        this.eventBus = eventBus;
        
        // Touch state
        this.touchPoints = new Map();
        this.lastTap = 0;
        this.lastTapPosition = { x: 0, y: 0 };
        
        // Configuration
        this.doubleTapThreshold = 300; // ms
        this.swipeThreshold = 50; // pixels
        this.tapTimeout = 200; // ms
        
        // Input state
        this.tapped = false;
        this.swiped = null;
        
        this.setupTouchEvents();
        this.preventDefaultBehaviors();
    }

    /**
     * Setup touch event listeners
     */
    setupTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
    }

    /**
     * Prevent default touch behaviors
     */
    preventDefaultBehaviors() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';

        // Prevent elastic scrolling on iOS
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            this.touchPoints.set(touch.identifier, {
                startX: touch.clientX - rect.left,
                startY: touch.clientY - rect.top,
                currentX: touch.clientX - rect.left,
                currentY: touch.clientY - rect.top,
                startTime: Date.now()
            });
        }

        // Single finger tap = jump
        if (e.touches.length === 1) {
            this.tapped = true;
            this.eventBus.emit('input:tap');
            this.eventBus.emit('input:jump');
        }

        // Two finger tap = special action (future use)
        if (e.touches.length === 2) {
            this.eventBus.emit('input:two_finger_tap');
        }
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const touchData = this.touchPoints.get(touch.identifier);
            if (touchData) {
                const rect = this.canvas.getBoundingClientRect();
                touchData.currentX = touch.clientX - rect.left;
                touchData.currentY = touch.clientY - rect.top;
            }
        }
    }

    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const touchData = this.touchPoints.get(touch.identifier);
            if (touchData) {
                this.processTouchGesture(touchData);
                this.touchPoints.delete(touch.identifier);
            }
        }
    }

    /**
     * Process completed touch gesture
     * @param {Object} touchData - Touch data
     */
    processTouchGesture(touchData) {
        const deltaX = touchData.currentX - touchData.startX;
        const deltaY = touchData.currentY - touchData.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = Date.now() - touchData.startTime;

        // Quick tap (not a swipe)
        if (distance < 20 && duration < this.tapTimeout) {
            this.checkDoubleTap(touchData);
            return;
        }

        // Swipe detection
        if (distance >= this.swipeThreshold) {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // Swipe up
            if (angle >= -135 && angle <= -45) {
                this.swiped = 'up';
                this.eventBus.emit('input:swipe', { direction: 'up', deltaX, deltaY });
                this.eventBus.emit('input:swipe_up');
            }
            // Swipe down
            else if (angle >= 45 && angle <= 135) {
                this.swiped = 'down';
                this.eventBus.emit('input:swipe', { direction: 'down', deltaX, deltaY });
                this.eventBus.emit('input:swipe_down');
            }
            // Swipe left
            else if (angle >= 135 || angle <= -135) {
                this.swiped = 'left';
                this.eventBus.emit('input:swipe', { direction: 'left', deltaX, deltaY });
                this.eventBus.emit('input:swipe_left');
            }
            // Swipe right
            else {
                this.swiped = 'right';
                this.eventBus.emit('input:swipe', { direction: 'right', deltaX, deltaY });
                this.eventBus.emit('input:swipe_right');
            }
        }
    }

    /**
     * Check for double tap
     * @param {Object} touchData - Touch data
     */
    checkDoubleTap(touchData) {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;
        
        const distanceFromLastTap = Math.sqrt(
            Math.pow(touchData.startX - this.lastTapPosition.x, 2) +
            Math.pow(touchData.startY - this.lastTapPosition.y, 2)
        );

        if (timeSinceLastTap < this.doubleTapThreshold && distanceFromLastTap < 50) {
            this.eventBus.emit('input:double_tap', {
                x: touchData.startX,
                y: touchData.startY
            });
        }

        this.lastTap = now;
        this.lastTapPosition = { x: touchData.startX, y: touchData.startY };
    }

    /**
     * Check if screen was tapped this frame
     * @returns {boolean} True if tapped
     */
    wasTapped() {
        return this.tapped;
    }

    /**
     * Get swipe direction if swiped this frame
     * @returns {string|null} Swipe direction or null
     */
    getSwipe() {
        return this.swiped;
    }

    /**
     * Reset frame state
     */
    resetFrame() {
        this.tapped = false;
        this.swiped = null;
    }

    /**
     * Check if touch is active
     * @returns {boolean} True if touching
     */
    isTouching() {
        return this.touchPoints.size > 0;
    }

    /**
     * Get number of active touch points
     * @returns {number} Touch count
     */
    getTouchCount() {
        return this.touchPoints.size;
    }

    /**
     * Get touch position (first touch)
     * @returns {Object|null} Touch position {x, y}
     */
    getTouchPosition() {
        if (this.touchPoints.size === 0) return null;
        
        const firstTouch = this.touchPoints.values().next().value;
        return { x: firstTouch.currentX, y: firstTouch.currentY };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchManager;
}
