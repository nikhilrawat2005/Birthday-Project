class AudioManager {
    constructor() {
        this.bgMusic = document.getElementById('bg-music');
        this.sfx = document.getElementById('sfx');
        this.currentBg = null;
        this.isMuted = false;
        this.isMobile = this.checkMobile();
        
        this.init();
    }

    checkMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    init() {
        // Add mute button if it exists
        this.setupMuteButton();
        
        // PATCH: Restore persisted audio state
        try {
            const savedBg = localStorage.getItem('birthday_bg');
            const muted = localStorage.getItem('birthday_muted') === '1';
            if (muted) this.toggleMute(true);
            if (savedBg) {
                // attempt to resume the same bg (may be blocked until user gesture)
                this.playBg(savedBg).catch(()=>{});
            }
        } catch(e) { 
            console.warn('audio state restore failed', e); 
        }

        // Mobile optimizations
        this.setupMobileOptimizations();
    }

    setupMobileOptimizations() {
        if (this.isMobile) {
            // Lower default volume on mobile to prevent sudden loud sounds
            this.bgMusic.volume = 0.5;
            this.sfx.volume = 0.6;
            
            // Handle audio context on mobile
            this.setupAudioContext();
        }
    }

    setupAudioContext() {
        // Create and resume audio context on user interaction for mobile
        document.addEventListener('touchstart', () => {
            if (this.bgMusic.paused && this.currentBg) {
                this.bgMusic.play().catch(e => console.log('Mobile audio play failed:', e));
            }
        }, { once: true });
    }

    async playBg(track) {
        if (!track) return;
        if (this.currentBg === track && !this.bgMusic.paused) return;
        
        try {
            this.bgMusic.src = `assets/audio/${track}`;
            this.bgMusic.volume = this.isMobile ? 0.5 : 0.7;
            
            // On mobile, wait for user interaction
            if (this.isMobile && this.bgMusic.paused) {
                // Auto-play will be handled by user interaction
                this.currentBg = track;
                return;
            }
            
            await this.bgMusic.play();
            this.currentBg = track;
            
            // PATCH: Persist the current background track
            try {
                localStorage.setItem('birthday_bg', track);
            } catch(e) {}
        } catch (error) {
            console.log('Background music play failed:', error);
            
            // On mobile, this is expected until user interacts
            if (!this.isMobile) {
                this.currentBg = track;
                try {
                    localStorage.setItem('birthday_bg', track);
                } catch(e) {}
            }
        }
    }

    async playSfx(sfx) {
        if (this.isMuted) return;
        
        try {
            this.sfx.src = `assets/audio/${sfx}`;
            this.sfx.volume = this.isMobile ? 0.6 : 0.8;
            
            // On mobile, use a clone to allow overlapping sounds
            if (this.isMobile && !this.sfx.paused) {
                const clone = this.sfx.cloneNode();
                clone.volume = this.sfx.volume;
                await clone.play();
                setTimeout(() => clone.remove(), 3000);
            } else {
                await this.sfx.play();
            }
        } catch (error) {
            console.log('SFX play failed:', error);
        }
    }

    toggleMute(forceValue) {
        this.isMuted = typeof forceValue === 'boolean' ? forceValue : !this.isMuted;
        
        // PATCH: Persist mute state
        try {
            localStorage.setItem('birthday_muted', this.isMuted ? '1' : '0');
        } catch(e) {}
        
        this.bgMusic.muted = this.isMuted;
        this.sfx.muted = this.isMuted;
        
        // Update mute button if exists
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
            muteBtn.setAttribute('aria-label', this.isMuted ? 'Unmute sound' : 'Mute sound');
        }
        
        return this.isMuted;
    }

    setupMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            // Add touch feedback for mobile
            if (this.isMobile) {
                muteBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    muteBtn.style.transform = 'scale(0.9)';
                });
                
                muteBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    muteBtn.style.transform = 'scale(1)';
                    this.toggleMute();
                });
            }
            
            muteBtn.addEventListener('click', () => this.toggleMute());
        }
    }

    stopAll() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.sfx.pause();
        this.sfx.currentTime = 0;
        this.currentBg = null;
    }

    // Mobile-specific method to handle audio after user interaction
    handleUserInteraction() {
        if (this.isMobile && this.currentBg && this.bgMusic.paused) {
            this.bgMusic.play().catch(e => console.log('Post-interaction audio play failed:', e));
        }
    }
}

const audioManager = new AudioManager();

// Export for global access in HTML files
window.audioManager = audioManager;

export default audioManager;