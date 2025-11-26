/**
 * AudioManager - Handles sound effects using Web Audio API
 */
class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        this.enabled = true;
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    /**
     * Create oscillator-based sound
     */
    playTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

        const vol = volume * this.sfxVolume * this.masterVolume;
        gainNode.gain.setValueAtTime(vol, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    /**
     * Play noise-based sound (for hits)
     */
    playNoise(duration, volume = 1) {
        if (!this.enabled || !this.context) return;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.context.currentTime);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        const vol = volume * this.sfxVolume * this.masterVolume;
        gainNode.gain.setValueAtTime(vol, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        source.start();
    }

    // Sound effect methods
    playBrickHit() {
        this.playTone(400 + Math.random() * 200, 0.1, 'square', 0.3);
    }

    playBrickDestroy() {
        this.playTone(600, 0.1, 'square', 0.4);
        setTimeout(() => this.playTone(800, 0.1, 'square', 0.3), 50);
    }

    playPaddleHit() {
        this.playTone(200, 0.15, 'triangle', 0.4);
    }

    playWallHit() {
        this.playTone(150, 0.08, 'sine', 0.2);
    }

    playPowerUp() {
        this.playTone(523, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.4), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.4), 200);
    }

    playPowerDown() {
        this.playTone(400, 0.1, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.3), 100);
    }

    playLaunch() {
        this.playTone(300, 0.1, 'triangle', 0.3);
        this.playTone(400, 0.15, 'triangle', 0.2);
    }

    playLaser() {
        this.playTone(1000, 0.05, 'sawtooth', 0.2);
        this.playTone(800, 0.05, 'sawtooth', 0.15);
    }

    playExplosion() {
        this.playNoise(0.3, 0.5);
        this.playTone(100, 0.2, 'sine', 0.4);
    }

    playLevelComplete() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sine', 0.4), i * 150);
        });
    }

    playGameOver() {
        const notes = [400, 350, 300, 250];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sawtooth', 0.3), i * 200);
        });
    }

    playLifeLost() {
        this.playTone(300, 0.2, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.3), 150);
    }

    playCombo(comboCount) {
        const baseFreq = 400 + Math.min(comboCount, 10) * 50;
        this.playTone(baseFreq, 0.1, 'sine', 0.3);
    }

    playExtraLife() {
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.15, 'sine', 0.3), i * 80);
        });
    }

    playButtonClick() {
        this.playTone(600, 0.05, 'sine', 0.2);
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }
}
