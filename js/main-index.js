import sessionManager from './session.js';
import audioManager from './audio.js';

class LandingPage {
    constructor() {
        this.isMobile = this.checkMobile();
        this.init();
    }

    checkMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    init() {
        this.bindEvents();
        this.checkReducedMotion();
        this.optimizeForMobile();
        this.setupViewportHandler();
    }

    optimizeForMobile() {
        // Prevent zoom on double-tap
        document.addEventListener('touchend', function(e) {
            if (e.touches && e.touches.length < 2) {
                e.preventDefault();
            }
        }, { passive: false });

        // Handle viewport changes
        this.setupViewportHandler();

        // Add mobile-specific CSS class
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
        }

        // Initialize audio after user interaction on mobile
        if (this.isMobile) {
            this.setupMobileAudio();
        }
    }

    setupViewportHandler() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        const debouncedResize = this.debounce(() => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 250);

        window.addEventListener('resize', debouncedResize);

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }, 300);
        });
    }

    setupMobileAudio() {
        // Auto-play audio after first user interaction on mobile
        const enableAudio = () => {
            audioManager.handleUserInteraction();
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('click', enableAudio);
        };

        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
    }

    bindEvents() {
        const yesBtn = document.getElementById('yes-btn');
        const forceBtn = document.getElementById('force-btn');

        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                this.handleButtonClick();
            });
            
            yesBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                yesBtn.style.transform = 'scale(0.95)';
            });
            
            yesBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                yesBtn.style.transform = 'scale(1)';
                this.handleButtonClick();
            });
        }

        if (forceBtn) {
            forceBtn.addEventListener('click', () => {
                this.handleButtonClick();
            });
            
            forceBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                forceBtn.style.transform = 'scale(0.95)';
            });
            
            forceBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                forceBtn.style.transform = 'scale(1)';
                this.handleButtonClick();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleButtonClick();
            }
        });

        // Touch device detection for additional optimizations
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.body.classList.add('touch-device');
        }

        // Handle page visibility for mobile
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause audio
                if (audioManager.bgMusic && !audioManager.bgMusic.paused) {
                    audioManager.bgMusic.pause();
                }
            }
        });
    }

    async handleButtonClick() {
        // Add haptic feedback if available
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Ensure audio is ready on mobile
        if (this.isMobile) {
            audioManager.handleUserInteraction();
        }
        
        audioManager.playBg('bg_soft_ambient.mp3');
        this.startCelebration();
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

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LandingPage());
} else {
    new LandingPage();
}

// Handle page load for mobile
window.addEventListener('load', () => {
    // Add loaded class for any post-load animations
    document.body.classList.add('loaded');
    
    // Mobile-specific optimizations after load
    if (window.innerWidth <= 768) {
        // Force layout recalculation for mobile
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }
});