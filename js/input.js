class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false, clicked: false };
        this.touch = { x: 0, y: 0, active: false, tapped: false };
        
        this.setupListeners();
    }

    setupListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
            this.mouse.clicked = true;
            this.updateMousePos(e);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.pressed = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePos(e);
        });

        // Touch (mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.active = true;
            this.touch.tapped = true;
            this.updateTouchPos(e.touches[0]);
        });

        this.canvas.addEventListener('touchend', () => {
            this.touch.active = false;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateTouchPos(e.touches[0]);
        });
    }

    updateMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    updateTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        this.touch.x = touch.clientX - rect.left;
        this.touch.y = touch.clientY - rect.top;
    }

    isPressed() {
        return this.mouse.pressed || this.touch.active || this.keys['Space'] || this.keys['ArrowUp'];
    }

    // Returns true only on the frame the input started
    isJustPressed() {
        const pressed = this.mouse.clicked || this.touch.tapped || this.keys['Space'] || this.keys['ArrowUp'];
        return pressed;
    }

    resetFrame() {
        this.mouse.clicked = false;
        this.touch.tapped = false;
    }
}