/**
 * AudioSystem - Handles all game audio including sound effects and music
 */
class AudioSystem {
    /**
     * Create an audio system
     * @param {EventBus} eventBus - Event bus
     * @param {ConfigManager} config - Configuration manager
     */
    constructor(eventBus, config) {
        this.eventBus = eventBus;
        this.config = config;
        
        // Audio context (created on first user interaction)
        this.audioContext = null;
        this.sounds = new Map();
        this.initialized = false;
        this.isMuted = false;
        
        // Volume settings
        this.masterVolume = config.get('audio.masterVolume') || 0.7;
        this.sfxVolume = config.get('audio.sfxVolume') || 0.8;
        this.musicVolume = config.get('audio.musicVolume') || 0.3;
        
        // Background music
        this.backgroundMusic = null;
        this.backgroundMusicGain = null;
        
        this.setupEventListeners();
    }

    /**
     * Initialize audio context (must be called from user interaction)
     */
    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Generate procedural sounds
            this.generateSounds();
            
            this.eventBus.emit('audio:initialized');
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
        }
    }

    /**
     * Setup event listeners for game events
     */
    setupEventListeners() {
        // Game events
        this.eventBus.on('bubble:jumped', () => this.play('jump'));
        this.eventBus.on('collision:boost', () => this.play('boost'));
        this.eventBus.on('collision:breaking', () => this.play('break'));
        this.eventBus.on('collision:rainbow', () => this.play('split'));
        this.eventBus.on('bubble:boosted', () => this.play('boost'));
        this.eventBus.on('bubble:split', () => this.play('split'));
        this.eventBus.on('platform:break', () => this.play('break'));
        this.eventBus.on('gravity:reverse', () => this.play('reverse'));
        this.eventBus.on('difficulty:changed', () => this.play('levelup'));
        this.eventBus.on('game:over', () => this.play('gameover'));
        
        // Audio control events
        this.eventBus.on('audio:mute', () => this.mute());
        this.eventBus.on('audio:unmute', () => this.unmute());
        this.eventBus.on('audio:toggle', () => this.toggleMute());
    }

    /**
     * Generate procedural sound effects
     */
    generateSounds() {
        // Jump sound - short pop
        this.sounds.set('jump', this.createOscillatorSound({
            frequency: 400,
            duration: 0.1,
            type: 'sine',
            decay: 0.1,
            pitchBend: 200
        }));

        // Boost sound - rising tone
        this.sounds.set('boost', this.createOscillatorSound({
            frequency: 300,
            duration: 0.25,
            type: 'sine',
            decay: 0.2,
            pitchBend: 400
        }));

        // Break sound - noise burst
        this.sounds.set('break', this.createNoiseSound({
            duration: 0.15,
            decay: 0.1
        }));

        // Split/Rainbow sound - sparkle
        this.sounds.set('split', this.createChimeSound({
            frequencies: [523, 659, 784, 1047],
            duration: 0.4
        }));

        // Reverse gravity sound - whoosh down
        this.sounds.set('reverse', this.createOscillatorSound({
            frequency: 600,
            duration: 0.3,
            type: 'sawtooth',
            decay: 0.25,
            pitchBend: -400
        }));

        // Level up sound - triumphant chord
        this.sounds.set('levelup', this.createChimeSound({
            frequencies: [440, 554, 659, 880],
            duration: 0.6
        }));

        // Game over sound - descending tone
        this.sounds.set('gameover', this.createOscillatorSound({
            frequency: 400,
            duration: 0.8,
            type: 'triangle',
            decay: 0.7,
            pitchBend: -300
        }));
    }

    /**
     * Create an oscillator-based sound
     * @param {Object} options - Sound options
     * @returns {Function} Sound play function
     */
    createOscillatorSound(options) {
        return () => {
            if (!this.audioContext || this.isMuted) return;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = options.type || 'sine';
            oscillator.frequency.setValueAtTime(
                options.frequency,
                this.audioContext.currentTime
            );

            // Pitch bend
            if (options.pitchBend) {
                oscillator.frequency.linearRampToValueAtTime(
                    options.frequency + options.pitchBend,
                    this.audioContext.currentTime + options.duration
                );
            }

            // Envelope
            const volume = this.masterVolume * this.sfxVolume;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                this.audioContext.currentTime + options.duration
            );

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + options.duration);
        };
    }

    /**
     * Create a noise-based sound
     * @param {Object} options - Sound options
     * @returns {Function} Sound play function
     */
    createNoiseSound(options) {
        return () => {
            if (!this.audioContext || this.isMuted) return;

            const bufferSize = this.audioContext.sampleRate * options.duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * options.decay));
            }

            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = buffer;
            gainNode.gain.value = this.masterVolume * this.sfxVolume * 0.3;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            source.start();
        };
    }

    /**
     * Create a chime sound with multiple frequencies
     * @param {Object} options - Sound options
     * @returns {Function} Sound play function
     */
    createChimeSound(options) {
        return () => {
            if (!this.audioContext || this.isMuted) return;

            options.frequencies.forEach((freq, i) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.value = freq;

                const startTime = this.audioContext.currentTime + (i * 0.05);
                const volume = (this.masterVolume * this.sfxVolume * 0.2) / options.frequencies.length;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.001,
                    startTime + options.duration
                );

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.start(startTime);
                oscillator.stop(startTime + options.duration);
            });
        };
    }

    /**
     * Play a sound by name
     * @param {string} name - Sound name
     */
    play(name) {
        if (!this.initialized) return;

        const soundFn = this.sounds.get(name);
        if (soundFn) {
            try {
                soundFn();
            } catch (error) {
                console.warn(`Failed to play sound "${name}":`, error);
            }
        }
    }

    /**
     * Mute all audio
     */
    mute() {
        this.isMuted = true;
        if (this.backgroundMusicGain) {
            this.backgroundMusicGain.gain.value = 0;
        }
    }

    /**
     * Unmute all audio
     */
    unmute() {
        this.isMuted = false;
        if (this.backgroundMusicGain) {
            this.backgroundMusicGain.gain.value = this.masterVolume * this.musicVolume;
        }
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.isMuted;
    }

    /**
     * Set master volume
     * @param {number} volume - Volume (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set sound effects volume
     * @param {number} volume - Volume (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set music volume
     * @param {number} volume - Volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusicGain) {
            this.backgroundMusicGain.gain.value = this.masterVolume * this.musicVolume;
        }
    }

    /**
     * Check if audio is muted
     * @returns {boolean} Muted state
     */
    getMuted() {
        return this.isMuted;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}
