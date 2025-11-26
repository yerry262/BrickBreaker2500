class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    resize() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    draw(physics) {
        this.clear();
        
        this.ctx.save();
        // Apply camera transform
        this.ctx.translate(0, -physics.cameraY);

        // Draw Platforms
        physics.platforms.forEach(platform => {
            this.drawPlatform(platform);
        });

        // Draw Bubbles
        physics.bubbles.forEach(bubble => {
            this.drawBubble(bubble);
        });

        this.ctx.restore();
    }

    drawBubble(bubble) {
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        
        // Bubble gradient
        const gradient = this.ctx.createRadialGradient(
            bubble.x - bubble.radius/3, 
            bubble.y - bubble.radius/3, 
            bubble.radius/10, 
            bubble.x, 
            bubble.y, 
            bubble.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.8, 'rgba(135, 206, 235, 0.6)');
        gradient.addColorStop(1, 'rgba(135, 206, 235, 0.4)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Shine reflection
        this.ctx.beginPath();
        this.ctx.arc(bubble.x - bubble.radius/3, bubble.y - bubble.radius/3, bubble.radius/4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
    }

    drawPlatform(platform) {
        let color = '#2ecc71'; // Normal - Green
        if (platform.type === 'break') color = '#e74c3c'; // Break - Red
        if (platform.type === 'boost') color = '#f1c40f'; // Boost - Yellow
        if (platform.type === 'reverse') color = '#9b59b6'; // Reverse - Purple

        this.ctx.fillStyle = color;
        
        // Rounded rectangle
        const r = 5;
        const x = platform.x;
        const y = platform.y;
        const w = platform.width;
        const h = platform.height;

        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        
        this.ctx.fill();

        // Add some detail/texture
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(x, y + h - 5, w, 5);
    }
}