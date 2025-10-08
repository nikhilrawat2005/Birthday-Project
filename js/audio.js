class AudioManager {
    constructor() {
        this.bgMusic = document.getElementById('bg-music');
        this.sfx = document.getElementById('sfx');
        this.currentBg = null;
        this.isMuted = false;
        
        this.init();
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
    }

    async playBg(track) {
        if (!track) return;
        if (this.currentBg === track && !this.bgMusic.paused) return;
        
        try {
            this.bgMusic.src = `assets/audio/${track}`;
            this.bgMusic.volume = 0.7;
            await this.bgMusic.play();
            this.currentBg = track;
            
            // PATCH: Persist the current background track
            try {
                localStorage.setItem('birthday_bg', track);
            } catch(e) {}
        } catch (error) {
            console.log('Background music play failed:', error);
        }
    }

    async playSfx(sfx) {
        if (this.isMuted) return;
        
        try {
            this.sfx.src = `assets/audio/${sfx}`;
            this.sfx.volume = 0.8;
            await this.sfx.play();
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
}

const audioManager = new AudioManager();
export default audioManager;