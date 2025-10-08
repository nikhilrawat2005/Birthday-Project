import sessionManager from './session.js';
import audioManager from './audio.js';

class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkReducedMotion();
    }

    bindEvents() {
        document.getElementById('yes-btn').addEventListener('click', () => {
            audioManager.playBg('bg_soft_ambient.mp3');
            this.startCelebration();
        });

        document.getElementById('force-btn').addEventListener('click', () => {
            audioManager.playBg('bg_soft_ambient.mp3');
            this.startCelebration();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.startCelebration();
            }
        });
    }

    async startCelebration() {
        await sessionManager.updateSession({
            progress: { landing: true },
            startedAt: new Date().toISOString()
        });
        
        sessionManager.navigateTo('decoration');
    }

    checkReducedMotion() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.ducky').forEach(ducky => {
                ducky.style.animation = 'none';
            });
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LandingPage());
} else {
    new LandingPage();
}