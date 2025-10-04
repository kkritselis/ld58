class MenuManager {
    constructor() {
        this.menu = null;
        this.controlsModal = null;
        this.startButton = null;
        this.controlsButton = null;
        this.modalCloseButton = null;
        this.musicVolumeSlider = null;
        this.sfxVolumeSlider = null;
        this.musicValueDisplay = null;
        this.sfxValueDisplay = null;
        
        this.game = null;
        this.audioManager = null;
        this.isGameStarted = false;
    }

    init(game, audioManager) {
        this.game = game;
        this.audioManager = audioManager;
        
        // Get DOM elements
        this.menu = document.getElementById('menu');
        this.controlsModal = document.getElementById('controls-modal');
        this.startButton = document.getElementById('start-button');
        this.controlsButton = document.getElementById('controls-button');
        this.modalCloseButton = document.getElementById('modal-close');
        this.musicVolumeSlider = document.getElementById('music-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        this.musicValueDisplay = document.getElementById('music-value');
        this.sfxValueDisplay = document.getElementById('sfx-value');
        this.returnToMenuButton = document.getElementById('return-to-menu');
        
        // Set initial volume values
        this.updateVolumeDisplays();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Add global test function for debugging
        window.testAudio = () => {
            console.log('Global test audio function called');
            if (this.audioManager) {
                this.audioManager.debugAudioState();
                this.audioManager.playMusic('menu').then(success => {
                    console.log('Global test result:', success);
                }).catch(error => {
                    console.error('Global test error:', error);
                });
            } else {
                console.error('AudioManager not available');
            }
        };
        
        // Try to start menu music automatically
        this.startMenuMusic();
        
        console.log('MenuManager initialized');
    }

    setupEventListeners() {
        // Start button
        this.startButton.addEventListener('click', () => {
            this.audioManager.playSFX('select');
            this.startGame();
        });

        // Controls button
        this.controlsButton.addEventListener('click', async () => {
            this.audioManager.playSFX('select');
            this.showControlsModal();
            // Start menu music when controls is clicked (user interaction)
            try {
                await this.audioManager.playMusic('menu');
                console.log('Menu music started from controls button');
            } catch (error) {
                console.warn('Could not start menu music from controls:', error);
            }
        });

        // Modal close button
        this.modalCloseButton.addEventListener('click', () => {
            this.audioManager.playSFX('select');
            this.hideControlsModal();
        });

        // Close modal when clicking outside
        this.controlsModal.addEventListener('click', (event) => {
            if (event.target === this.controlsModal) {
                this.audioManager.playSFX('select');
                this.hideControlsModal();
            }
        });

        // Volume sliders
        this.musicVolumeSlider.addEventListener('input', (event) => {
            const volume = event.target.value / 100;
            this.audioManager.setMusicVolume(volume);
            this.updateVolumeDisplays();
        });

        this.musicVolumeSlider.addEventListener('change', (event) => {
            // Play select sound when slider is released
            this.audioManager.playSFX('select');
        });

        this.sfxVolumeSlider.addEventListener('input', (event) => {
            const volume = event.target.value / 100;
            this.audioManager.setSFXVolume(volume);
            this.updateVolumeDisplays();
        });

        this.sfxVolumeSlider.addEventListener('change', (event) => {
            // Play select sound when slider is released
            this.audioManager.playSFX('select');
        });


        // Return to menu button
        this.returnToMenuButton.addEventListener('click', () => {
            this.audioManager.playSFX('select');
            this.returnToMenu();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.controlsModal.classList.contains('show')) {
                    this.hideControlsModal();
                } else if (this.isGameStarted) {
                    // Show controls modal in-game
                    this.showControlsModal();
                }
            }
        });
    }

    updateVolumeDisplays() {
        const musicVolume = Math.round(this.audioManager.getMusicVolume() * 100);
        const sfxVolume = Math.round(this.audioManager.getSFXVolume() * 100);
        
        this.musicVolumeSlider.value = musicVolume;
        this.sfxVolumeSlider.value = sfxVolume;
        this.musicValueDisplay.textContent = `${musicVolume}%`;
        this.sfxValueDisplay.textContent = `${sfxVolume}%`;
    }

    showControlsModal() {
        this.controlsModal.classList.add('show');
        this.updateVolumeDisplays();
        
        // Pause game when modal is open
        if (this.isGameStarted && this.game) {
            this.game.pause();
        }
    }

    hideControlsModal() {
        this.controlsModal.classList.remove('show');
        
        // Resume game when modal is closed
        if (this.isGameStarted && this.game) {
            this.game.resume();
        }
    }

    async startGame() {
        if (this.isGameStarted) return;
        
        try {
            // Fade out and hide scrolling text
            const scrollingText = document.getElementById('scrolling-text');
            if (scrollingText) {
                scrollingText.style.transition = 'opacity 1s ease-out';
                scrollingText.style.opacity = '0';
                setTimeout(() => {
                    scrollingText.style.display = 'none';
                }, 1000);
            }
            
            // Fade out and hide title image
            const title = document.getElementById('title');
            if (title) {
                title.style.transition = 'opacity 1s ease-out';
                title.style.opacity = '0';
                setTimeout(() => {
                    title.style.display = 'none';
                }, 1000);
            }
            
            // Hide menu
            this.menu.classList.add('hidden');
            
            // Resume audio context for autoplay
            this.audioManager.resumeAudioContext();
            
            // Start game music (after user interaction)
            try {
                await this.audioManager.playMusic('game');
                console.log('Game music started');
            } catch (error) {
                console.warn('Could not start game music:', error);
            }
            
            // Initialize game (if not already initialized)
            if (!this.game.isInitialized) {
                await this.game.init();
            }
            
            // Start the game loop
            this.game.start();
            
            // Enable pointer lock for game controls
            this.game.inputHandler.enablePointerLock();
            
            // Start ship fly-in animation
            this.game.startShipFlyIn();
            
            this.isGameStarted = true;
            console.log('Game started successfully');
            
        } catch (error) {
            console.error('Failed to start game:', error);
            // Show menu again on error
            this.menu.classList.remove('hidden');
        }
    }

    showMenu() {
        this.menu.classList.remove('hidden');
        this.isGameStarted = false;
    }

    hideMenu() {
        this.menu.classList.add('hidden');
    }

    // Try to start menu music automatically (handles autoplay restrictions)
    async startMenuMusic() {
        try {
            console.log('Attempting to start menu music...');
            const success = await this.audioManager.playMusic('menu');
            if (success) {
                console.log('Menu music started automatically');
            } else {
                console.log('Menu music blocked by autoplay policy - will start after user interaction');
                // Add a subtle hint to the user
                this.addAudioHint();
            }
        } catch (error) {
            console.warn('Could not start menu music:', error);
        }
    }

    // Add a subtle hint that audio is available
    addAudioHint() {
        const hint = document.createElement('div');
        hint.id = 'audio-hint';
        hint.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            opacity: 0.8;
            cursor: pointer;
            transition: opacity 0.3s;
        `;
        hint.textContent = 'Click anywhere to enable audio';
        hint.onclick = () => {
            this.audioManager.playSFX('select');
            this.startMenuMusic();
            hint.remove();
        };
        
        document.body.appendChild(hint);
        
        // Remove hint after 5 seconds
        setTimeout(() => {
            if (hint.parentNode) {
                hint.remove();
            }
        }, 5000);
    }

    // Method to return to menu (for future use)
    returnToMenu() {
        if (this.game) {
            this.game.pause(); // Pause instead of stop to keep the scene
            this.game.inputHandler.disablePointerLock(); // Disable pointer lock
        }
        this.audioManager.stopMusic();
        this.showMenu();
        
        // Show scrolling text again
        const scrollingText = document.getElementById('scrolling-text');
        if (scrollingText) {
            scrollingText.style.display = 'block';
            scrollingText.style.opacity = '1';
        }
        
        // Show title again
        const title = document.getElementById('title');
        if (title) {
            title.style.display = 'block';
            title.style.opacity = '1';
        }
        
        // Restart menu music when returning to menu
        this.startMenuMusic();
    }
}
