// js/result.js
import sessionManager from './session.js';
import audioManager from './audio.js';

class ResultPage {
    constructor() {
        this.currentScene = 'transition-scene';
        this.config = null;
        this.isMobile = this.checkMobile();

        // CHANGED: Only Blog3 for all scores
        this.pageMappingByScore = [
            { min: 0, max: 9999, page: 'blog3' },
        ];

        this.init();
    }

    checkMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    async init() {
        try {
            await this.loadSessionData();
            this.setupScenes();
            this.bindEvents();
            this.optimizeForMobile();
            
            // Initialize audio with mobile considerations
            if (!this.isMobile) {
                audioManager.playBg && audioManager.playBg('bg_soft_ambient.mp3');
            } else {
                this.setupMobileAudio();
            }
        } catch (err) {
            console.error('ResultPage init error:', err);
        }
    }

    optimizeForMobile() {
        this.setupViewportHandler();
        
        // Add mobile class for CSS targeting
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            document.body.classList.add('result-mobile');
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
            audioManager.playBg && audioManager.playBg('bg_soft_ambient.mp3').catch(() => {});
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('click', enableAudio);
        };

        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
    }

    async loadSessionData() {
        const session = await sessionManager.getSession();

        let score = 0;
        if (session) {
            if (session.state && session.state.game && typeof session.state.game.score !== 'undefined') {
                score = session.state.game.score;
            } else if (session.game && typeof session.game.score !== 'undefined') {
                score = session.game.score;
            } else {
                try {
                    const localDataRaw = localStorage.getItem('birthdayLocalData');
                    if (localDataRaw) {
                        const localData = JSON.parse(localDataRaw);
                        if (localData.game && typeof localData.game.score !== 'undefined') {
                            score = localData.game.score;
                        }
                        else if (localData.state && localData.state.game && typeof localData.state.game.score !== 'undefined') {
                            score = localData.state.game.score;
                        }
                    }
                } catch (err) {
                    console.warn('Error reading fallback localData in result page:', err);
                }
            }
        }

        const scoreEl = document.getElementById('kitty-score');
        if (scoreEl) scoreEl.textContent = score || 0;
        
        // Store score globally for use in other methods
        window.kittyScore = score;
    }

    extractScoreFromState(state) {
        if (!state || typeof state !== 'object') return null;
        const candidates = [
            state.kitty,
            state.kitties,
            state.score,
            state.points,
            state.game && state.game.score,
            state.progress && state.progress.kitty,
            state.progress && state.progress.score
        ];
        for (const c of candidates) if (c !== undefined && c !== null && !isNaN(Number(c))) return Number(c);
        try {
            const json = JSON.stringify(state);
            const m = json.match(/"kitty"\s*:\s*(\d+)/i) || json.match(/"kitties"\s*:\s*(\d+)/i) || json.match(/"score"\s*:\s*(\d+)/i);
            if (m) return Number(m[1]);
        } catch { }
        return null;
    }

    setupScenes() {
        this.scenes = { 'transition-scene': document.getElementById('transition-scene') };
    }

    bindEvents() {
        const yesBtn = document.getElementById('yes-reward');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                this.handleRewardButtonClick();
            });
            
            // Mobile touch events
            yesBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                yesBtn.style.transform = 'scale(0.95)';
            });
            
            yesBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                yesBtn.style.transform = 'scale(1)';
                this.handleRewardButtonClick();
            });
        }

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) passwordForm.addEventListener('submit', e => {
            e.preventDefault();
            this.verifyPassword();
        });

        const cancelBtn = document.querySelector('.cancel-password');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hidePasswordModal();
                audioManager.playSfx && audioManager.playSfx('sfx_click.mp3');
            });
            
            // Mobile touch events
            cancelBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                cancelBtn.style.transform = 'scale(0.95)';
            });
            
            cancelBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                cancelBtn.style.transform = 'scale(1)';
            });
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && this.currentScene === 'transition-scene') this.startRevealSequence();
            if (e.key === 'Escape' && document.getElementById('password-backdrop')?.classList.contains('active')) this.hidePasswordModal();
        });

        // Mobile: handle touch events for the transition scene
        if (this.isMobile) {
            const transitionContent = document.querySelector('.transition-content');
            if (transitionContent) {
                transitionContent.addEventListener('touchstart', (e) => {
                    if (this.currentScene === 'transition-scene') {
                        e.preventDefault();
                        this.startRevealSequence();
                    }
                });
            }
        }
    }

    handleRewardButtonClick() {
        // Haptic feedback on mobile
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        audioManager.playSfx && audioManager.playSfx('sfx_click.mp3');
        this.startRevealSequence();
    }

    startRevealSequence() {
        const score = window.kittyScore || parseInt(document.getElementById('kitty-score')?.dataset.score || '0', 10);
        const chosen = this.choosePageForScore(score);
        const submitBtn = document.querySelector('.submit-password');
        if (submitBtn) submitBtn.dataset.targetPage = chosen;
        const transitionContent = document.querySelector('.transition-content');
        if (transitionContent) transitionContent.classList.add('slide-out');
        setTimeout(() => this.showPasswordModal(), 700);
    }

    showPasswordModal() {
        const backdrop = document.getElementById('password-backdrop');
        const input = document.getElementById('password-input');
        const errorBox = document.getElementById('password-error');
        if (backdrop) backdrop.classList.add('active');
        if (input) input.value = '';
        
        // Focus input with delay for mobile
        setTimeout(() => {
            input?.focus();
            // On mobile, ensure virtual keyboard doesn't push content
            if (this.isMobile && input) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
        
        if (errorBox) errorBox.style.display = 'none';
    }

    hidePasswordModal() {
        const backdrop = document.getElementById('password-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        
        // On mobile, blur input to hide keyboard
        if (this.isMobile) {
            const input = document.getElementById('password-input');
            if (input) input.blur();
        }
    }

    async verifyPassword() {
        const passwordInput = document.getElementById('password-input');
        const submitBtn = document.querySelector('.submit-password');
        const btnText = submitBtn?.querySelector('.btn-text');
        const spinner = submitBtn?.querySelector('.loading-spinner');
        const errorDiv = document.getElementById('password-error');
        
        // CHANGED: Default to blog3 instead of blog1
        const password = passwordInput?.value.trim() || '';
        const targetPage = submitBtn?.dataset.targetPage || 'blog3';
        if (!password) return this.showPasswordError('Please enter a password');

        if (btnText) btnText.style.display = 'none';
        if (spinner) spinner.style.display = 'block';
        if (submitBtn) submitBtn.disabled = true;
        if (errorDiv) errorDiv.style.display = 'none';

        try {
            const response = await fetch('/api/unlock-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: targetPage, password })
            });
            const data = await response.json();
            if (data.ok) {
                // Haptic feedback on mobile
                if (this.isMobile && navigator.vibrate) {
                    navigator.vibrate(100);
                }
                
                audioManager.playSfx && audioManager.playSfx('sfx_success_jingle.mp3');
                this.showSuccessAnimation();
                setTimeout(() => window.location.href = data.url, 1200);
            } else {
                // Haptic feedback on mobile for error
                if (this.isMobile && navigator.vibrate) {
                    navigator.vibrate(200);
                }
                
                audioManager.playSfx && audioManager.playSfx('sfx_error.mp3');
                this.showPasswordError(data.error || 'Invalid password');
                this.shakePasswordModal();
            }
        } catch (e) {
            console.error('Password verification failed:', e);
            
            // Haptic feedback on mobile for error
            if (this.isMobile && navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            audioManager.playSfx && audioManager.playSfx('sfx_error.mp3');
            this.showPasswordError('Network error. Please try again.');
            this.shakePasswordModal();
        } finally {
            if (btnText) btnText.style.display = 'block';
            if (spinner) spinner.style.display = 'none';
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    showPasswordError(message) {
        const errorDiv = document.getElementById('password-error');
        if (errorDiv) {
            errorDiv.textContent = `❌ ${message}`;
            errorDiv.style.display = 'block';
            
            // Auto-hide error after 5 seconds on mobile
            if (this.isMobile) {
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 5000);
            }
        }
    }

    shakePasswordModal() {
        const modal = document.querySelector('.modal-content');
        if (!modal) return;
        modal.classList.add('shake');
        setTimeout(() => modal.classList.remove('shake'), 500);
    }

    showSuccessAnimation() {
        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.style.animation = 'successPulse 0.6s ease-in-out';
            setTimeout(() => modal.style.animation = '', 600);
        }
        this.createConfetti();
    }

    createConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '1001';
        document.body.appendChild(container);

        const colors = ['#ff6b8b', '#ff8e53', '#4facfe', '#00f2fe', '#a8e6cf', '#dcedc1'];
        const emojis = ['🎉', '✨', '🌟', '💫', '🎊', '💖'];

        // Reduce confetti count on mobile for performance
        const confettiCount = this.isMobile ? 20 : 30;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'absolute';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.fontSize = `${Math.random() * 15 + 12}px`;
                confetti.style.opacity = '0.8';
                confetti.style.animation = `confettiFall ${Math.random() * 2 + 1}s ease-out forwards`;

                if (Math.random() > 0.5) {
                    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
                    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                } else {
                    confetti.style.width = '8px';
                    confetti.style.height = '8px';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.borderRadius = '50%';
                }

                container.appendChild(confetti);
                setTimeout(() => confetti.remove(), 2200);
            }, i * 50);
        }

        setTimeout(() => container.remove(), 3000);
    }

    choosePageForScore(score) {
        for (const mapping of this.pageMappingByScore) {
            if (score >= mapping.min && score <= mapping.max) return mapping.page;
        }
        return this.pageMappingByScore[0].page;
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ResultPage());
} else {
    new ResultPage();
}