class AudioManager {
    constructor() {
        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;
        this.musicAudio = null;
        this.sfxAudio = new Map();
        this.isInitialized = false;
        
        // Load settings from localStorage
        this.loadSettings();
    }

    init() {
        if (this.isInitialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load music files
            this.loadMusic('menu', 'assets/sounds/intro.mp3'); // Menu background music
            this.loadMusic('game', 'assets/sounds/intro.mp3'); // Game music (using same file for now)
            
            // Load SFX files
            this.loadSFX('select', 'assets/sounds/select.mp3'); // UI button click sound
            
            this.isInitialized = true;
            console.log('AudioManager initialized successfully');
        } catch (error) {
            console.warn('AudioManager initialization failed:', error);
        }
    }

    loadSettings() {
        try {
            const savedMusicVolume = localStorage.getItem('ld58_music_volume');
            const savedSfxVolume = localStorage.getItem('ld58_sfx_volume');
            
            if (savedMusicVolume !== null) {
                this.musicVolume = parseFloat(savedMusicVolume);
            }
            if (savedSfxVolume !== null) {
                this.sfxVolume = parseFloat(savedSfxVolume);
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('ld58_music_volume', this.musicVolume.toString());
            localStorage.setItem('ld58_sfx_volume', this.sfxVolume.toString());
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    async loadMusic(key, url) {
        try {
            console.log(`Loading music: ${key} from ${url}`);
            const audio = new Audio();
            audio.src = url;
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = this.musicVolume;
            
            // Add error handling
            audio.addEventListener('error', (e) => {
                console.error(`Audio error for ${key}:`, e);
                console.error('Audio error details:', {
                    error: audio.error,
                    networkState: audio.networkState,
                    readyState: audio.readyState
                });
            });
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Timeout loading ${key}`));
                }, 10000);
                
                audio.addEventListener('canplaythrough', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                audio.addEventListener('error', (e) => {
                    clearTimeout(timeout);
                    reject(e);
                });
                
                // Try to load
                audio.load();
            });
            
            // Store multiple music tracks
            if (!this.musicTracks) {
                this.musicTracks = new Map();
            }
            this.musicTracks.set(key, audio);
            
            // Keep the first loaded track as the main music audio for compatibility
            if (!this.musicAudio) {
                this.musicAudio = audio;
            }
            
            console.log(`Music loaded successfully: ${key}`, {
                duration: audio.duration,
                volume: audio.volume,
                readyState: audio.readyState
            });
        } catch (error) {
            console.error(`Failed to load music ${key}:`, error);
        }
    }

    async loadSFX(key, url) {
        try {
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto';
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve);
                audio.addEventListener('error', reject);
            });
            
            this.sfxAudio.set(key, audio);
            console.log(`SFX loaded: ${key}`);
        } catch (error) {
            console.warn(`Failed to load SFX ${key}:`, error);
        }
    }

    async playMusic(key = 'menu') {
        // Stop any currently playing music
        this.stopMusic();
        
        // Get the specific track
        const audio = this.musicTracks ? this.musicTracks.get(key) : this.musicAudio;
        
        if (!audio) {
            console.warn(`No music audio loaded for key: ${key}`);
            return false;
        }
        
        try {
            console.log(`Attempting to play music: ${key}`);
            audio.currentTime = 0;
            audio.volume = this.musicVolume;
            
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
                console.log(`Music started playing successfully: ${key}`);
                this.currentMusicKey = key;
            }
        } catch (error) {
            console.error(`Failed to play music ${key}:`, error);
            
            // Handle autoplay policy
            if (error.name === 'NotAllowedError') {
                console.warn('Autoplay blocked. User interaction required.');
                return false;
            }
        }
        return true;
    }

    stopMusic() {
        // Stop all music tracks
        if (this.musicTracks) {
            this.musicTracks.forEach((audio, key) => {
                audio.pause();
                audio.currentTime = 0;
            });
        } else if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
        }
        this.currentMusicKey = null;
    }

    playSFX(key) {
        const audio = this.sfxAudio.get(key);
        if (!audio) return;
        
        try {
            audio.currentTime = 0;
            audio.volume = this.sfxVolume;
            audio.play().catch(error => {
                console.warn('Failed to play SFX:', error);
            });
        } catch (error) {
            console.warn('Error playing SFX:', error);
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume for all music tracks
        if (this.musicTracks) {
            this.musicTracks.forEach(audio => {
                audio.volume = this.musicVolume;
            });
        } else if (this.musicAudio) {
            this.musicAudio.volume = this.musicVolume;
        }
        
        this.saveSettings();
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    getMusicVolume() {
        return this.musicVolume;
    }

    getSFXVolume() {
        return this.sfxVolume;
    }

    // Resume audio context (required for autoplay policies)
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Resuming audio context...');
            return this.audioContext.resume();
        }
        return Promise.resolve();
    }

    // Debug method to check audio state
    debugAudioState() {
        console.log('Audio Debug Info:', {
            isInitialized: this.isInitialized,
            musicTracks: this.musicTracks ? Array.from(this.musicTracks.keys()) : 'none',
            currentMusicKey: this.currentMusicKey,
            musicVolume: this.musicVolume,
            audioContext: this.audioContext,
            audioContextState: this.audioContext ? this.audioContext.state : 'not created'
        });
        
        if (this.musicTracks) {
            this.musicTracks.forEach((audio, key) => {
                console.log(`Music Track "${key}" State:`, {
                    src: audio.src,
                    volume: audio.volume,
                    paused: audio.paused,
                    currentTime: audio.currentTime,
                    duration: audio.duration,
                    readyState: audio.readyState,
                    networkState: audio.networkState
                });
            });
        } else if (this.musicAudio) {
            console.log('Music Audio State:', {
                src: this.musicAudio.src,
                volume: this.musicAudio.volume,
                paused: this.musicAudio.paused,
                currentTime: this.musicAudio.currentTime,
                duration: this.musicAudio.duration,
                readyState: this.musicAudio.readyState,
                networkState: this.musicAudio.networkState
            });
        }
    }
}
