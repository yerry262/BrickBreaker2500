/**
 * AudioManager - Handles sound effects using Web Audio API
 */
class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.15; // Quiet background music
        this.enabled = true;
        this.initialized = false;
        
        // Background music state
        this.musicPlaying = false;
        this.musicOscillators = [];
        this.musicGainNode = null;
        this.musicIntervalId = null;
        
        // Super/Star mode music state
        this.superModeActive = false;
        this.superMusicIntervalId = null;
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
     * Start upbeat background music
     * Only starts if not already playing
     */
    startMusic() {
        if (!this.enabled || !this.context || this.musicPlaying) return;
        
        this.musicPlaying = true;
        
        // Create master gain for music
        this.musicGainNode = this.context.createGain();
        this.musicGainNode.connect(this.context.destination);
        this.musicGainNode.gain.setValueAtTime(this.musicVolume * this.masterVolume, this.context.currentTime);
        
        // Upbeat chord progression (C - G - Am - F) in a loop
        const chordProgressions = [
            [261.63, 329.63, 392.00], // C major (C4, E4, G4)
            [196.00, 246.94, 293.66], // G major (G3, B3, D4)
            [220.00, 261.63, 329.63], // A minor (A3, C4, E4)
            [174.61, 220.00, 261.63]  // F major (F3, A3, C4)
        ];
        
        let chordIndex = 0;
        let beatCount = 0;
        
        // Play music pattern
        const playBeat = () => {
            if (!this.musicPlaying || !this.context) return;
            
            const currentTime = this.context.currentTime;
            const chord = chordProgressions[chordIndex];
            
            // Bass note (root of chord, one octave down)
            if (beatCount % 2 === 0) {
                this.playMusicNote(chord[0] / 2, 0.3, 'triangle', 0.4);
            }
            
            // Chord stab on off-beats
            if (beatCount % 4 === 2) {
                chord.forEach((freq, i) => {
                    setTimeout(() => {
                        if (this.musicPlaying) {
                            this.playMusicNote(freq, 0.15, 'sine', 0.2);
                        }
                    }, i * 20);
                });
            }
            
            // High melody note
            if (beatCount % 8 === 0 || beatCount % 8 === 3 || beatCount % 8 === 5) {
                const melodyNote = chord[Math.floor(Math.random() * chord.length)] * 2;
                this.playMusicNote(melodyNote, 0.1, 'sine', 0.15);
            }
            
            // Advance beat
            beatCount++;
            if (beatCount % 8 === 0) {
                chordIndex = (chordIndex + 1) % chordProgressions.length;
            }
        };
        
        // Start the beat loop (tempo ~140 BPM, 8th notes)
        playBeat();
        this.musicIntervalId = setInterval(playBeat, 215); // ~140 BPM in 8th notes
    }
    
    /**
     * Play a single music note (quieter, for background)
     */
    playMusicNote(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.context || !this.musicPlaying) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.musicGainNode);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        
        // Soft attack and release for smoother sound
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration + 0.05);
    }
    
    /**
     * Stop background music
     */
    stopMusic() {
        if (!this.musicPlaying && !this.superModeActive) return;
        
        this.musicPlaying = false;
        this.superModeActive = false;
        
        // Clear the normal music interval
        if (this.musicIntervalId) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
        }
        
        // Clear the super music interval
        if (this.superMusicIntervalId) {
            clearInterval(this.superMusicIntervalId);
            this.superMusicIntervalId = null;
        }
        
        // Fade out the music gain
        if (this.musicGainNode && this.context) {
            try {
                this.musicGainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
            } catch (e) {
                // Ignore if already stopped
            }
        }
    }
    
    /**
     * Check if music is currently playing
     */
    isMusicPlaying() {
        return this.musicPlaying;
    }
    
    /**
     * Start super/star mode music - fast, energetic, like Mario Kart star
     */
    startSuperMusic() {
        if (!this.enabled || !this.context || this.superModeActive) return;
        
        // Stop normal music first (but keep musicPlaying flag for later resume)
        const wasPlayingNormalMusic = this.musicPlaying;
        if (this.musicIntervalId) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
        }
        
        this.superModeActive = true;
        this.musicPlaying = true;
        
        // Create or reuse master gain for music
        if (!this.musicGainNode) {
            this.musicGainNode = this.context.createGain();
            this.musicGainNode.connect(this.context.destination);
        }
        // Slightly louder for super mode
        this.musicGainNode.gain.setValueAtTime(this.musicVolume * this.masterVolume * 1.3, this.context.currentTime);
        
        // Fast, exciting chord progression in major keys
        const superChords = [
            [329.63, 415.30, 493.88], // E major (E4, G#4, B4)
            [349.23, 440.00, 523.25], // F major (F4, A4, C5)
            [392.00, 493.88, 587.33], // G major (G4, B4, D5)
            [440.00, 554.37, 659.25]  // A major (A4, C#5, E5)
        ];
        
        let chordIndex = 0;
        let beatCount = 0;
        
        const playSuperBeat = () => {
            if (!this.superModeActive || !this.context) return;
            
            const chord = superChords[chordIndex];
            
            // Driving bass line - every beat
            this.playMusicNote(chord[0] / 2, 0.12, 'sawtooth', 0.5);
            
            // Fast arpeggiated chords
            chord.forEach((freq, i) => {
                setTimeout(() => {
                    if (this.superModeActive) {
                        this.playMusicNote(freq, 0.08, 'square', 0.25);
                    }
                }, i * 25);
            });
            
            // High energy melody - alternating notes
            if (beatCount % 2 === 0) {
                const melodyNote = chord[2] * 2; // High note
                this.playMusicNote(melodyNote, 0.06, 'sine', 0.3);
            } else {
                const melodyNote = chord[1] * 2;
                this.playMusicNote(melodyNote, 0.06, 'sine', 0.25);
            }
            
            // Extra sparkle on some beats
            if (beatCount % 4 === 0) {
                this.playMusicNote(chord[2] * 4, 0.05, 'sine', 0.15); // Very high sparkle
            }
            
            beatCount++;
            // Change chord every 4 beats for fast progression
            if (beatCount % 4 === 0) {
                chordIndex = (chordIndex + 1) % superChords.length;
            }
        };
        
        // Much faster tempo - ~180 BPM (twice as fast feeling)
        playSuperBeat();
        this.superMusicIntervalId = setInterval(playSuperBeat, 130);
    }
    
    /**
     * Stop super mode music and optionally resume normal music
     */
    stopSuperMusic(resumeNormalMusic = true) {
        if (!this.superModeActive) return;
        
        this.superModeActive = false;
        
        // Clear super music interval
        if (this.superMusicIntervalId) {
            clearInterval(this.superMusicIntervalId);
            this.superMusicIntervalId = null;
        }
        
        // Reset gain to normal level
        if (this.musicGainNode && this.context) {
            this.musicGainNode.gain.setValueAtTime(this.musicVolume * this.masterVolume, this.context.currentTime);
        }
        
        // Resume normal music if requested and we were playing music
        if (resumeNormalMusic && this.musicPlaying) {
            this.musicPlaying = false; // Reset so startMusic will work
            this.startMusic();
        }
    }
    
    /**
     * Check if super mode music is active
     */
    isSuperMusicPlaying() {
        return this.superModeActive;
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }
}
