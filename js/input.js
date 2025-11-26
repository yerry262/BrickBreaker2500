/**
 * InputManager - Handles keyboard, mouse, and touch input
 */
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Keyboard state
        this.keys = {};
        
        // Mouse/Touch state
        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            justPressed: false
        };
        
        this.touch = {
            active: false,
            x: 0,
            y: 0,
            startX: 0,
            startY: 0
        };

        // Touch zones for mobile controls
        this.touchZones = {
            leftThird: 0,
            rightThird: 0
        };

        this.setupListeners();
        this.updateTouchZones();
    }

    setupListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent scrolling with arrow keys and space
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
            this.mouse.justPressed = true;
            this.updateMousePosition(e);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.pressed = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.pressed = false;
        });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.active = true;
            this.mouse.justPressed = true;
            const touch = e.touches[0];
            this.updateTouchPosition(touch);
            this.touch.startX = this.touch.x;
            this.touch.startY = this.touch.y;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this.updateTouchPosition(e.touches[0]);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', () => {
            this.touch.active = false;
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.updateTouchZones();
        });
    }

    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mouse.x = (e.clientX - rect.left) * scaleX;
        this.mouse.y = (e.clientY - rect.top) * scaleY;
    }

    updateTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.touch.x = (touch.clientX - rect.left) * scaleX;
        this.touch.y = (touch.clientY - rect.top) * scaleY;
        
        // Also update mouse position for unified handling
        this.mouse.x = this.touch.x;
        this.mouse.y = this.touch.y;
    }

    updateTouchZones() {
        this.touchZones.leftThird = this.canvas.width / 3;
        this.touchZones.rightThird = this.canvas.width * 2 / 3;
    }

    /**
     * Check if moving left (keyboard or touch)
     */
    isMovingLeft() {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            return true;
        }
        
        // Touch on left third of screen
        if (this.touch.active && this.touch.x < this.touchZones.leftThird) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if moving right (keyboard or touch)
     */
    isMovingRight() {
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            return true;
        }
        
        // Touch on right third of screen
        if (this.touch.active && this.touch.x > this.touchZones.rightThird) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if launch/action pressed
     */
    isLaunchPressed() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.mouse.justPressed;
    }

    /**
     * Check if shoot laser pressed
     */
    isShootPressed() {
        return this.keys['Space'] || this.keys['KeyX'] || this.mouse.pressed;
    }

    /**
     * Check if pause pressed
     */
    isPausePressed() {
        return this.keys['Escape'] || this.keys['KeyP'];
    }

    /**
     * Get pointer position (mouse or touch)
     */
    getPointerX() {
        if (this.touch.active) {
            return this.touch.x;
        }
        return this.mouse.x;
    }

    getPointerY() {
        if (this.touch.active) {
            return this.touch.y;
        }
        return this.mouse.y;
    }

    /**
     * Check if using pointer control (mouse/touch for direct paddle control)
     */
    isUsingPointer() {
        return this.touch.active || this.mouse.pressed;
    }

    /**
     * Clear single-frame states (call at end of frame)
     */
    clearFrameStates() {
        this.mouse.justPressed = false;
    }

    /**
     * Clear key state (useful for menus)
     */
    clearKey(code) {
        this.keys[code] = false;
    }

    /**
     * Reset all input states
     */
    reset() {
        this.keys = {};
        this.mouse.pressed = false;
        this.mouse.justPressed = false;
        this.touch.active = false;
    }
}
