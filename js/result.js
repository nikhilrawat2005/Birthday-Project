// js/result.js
import sessionManager from './session.js';
import audioManager from './audio.js';

class ResultPage {
    constructor() {
        this.currentScene = 'transition-scene';
        this.config = null;

        // CHANGED: Only Blog3 for all scores
        this.pageMappingByScore = [
            { min: 0, max: 9999, page: 'blog3' },
        ];

        this.init();
    }

    async init() {
        try {
            await this.loadSessionData();
            this.setupScenes();
            this.bindEvents();
            audioManager.playBg && audioManager.playBg('bg_soft_ambient.mp3');
        } catch (err) {
            console.error('ResultPage init error:', err);
        }
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
        if (yesBtn) yesBtn.addEventListener('click', () => {
            audioManager.playSfx && audioManager.playSfx('sfx_click.mp3');
            this.startRevealSequence();
        });

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) passwordForm.addEventListener('submit', e => {
            e.preventDefault();
            this.verifyPassword();
        });

        const cancelBtn = document.querySelector('.cancel-password');
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            this.hidePasswordModal();
            audioManager.playSfx && audioManager.playSfx('sfx_click.mp3');
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && this.currentScene === 'transition-scene') this.startRevealSequence();
            if (e.key === 'Escape' && document.getElementById('password-backdrop')?.classList.contains('active')) this.hidePasswordModal();
        });
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
        setTimeout(() => input?.focus(), 300);
        if (errorBox) errorBox.style.display = 'none';
    }

    hidePasswordModal() {
        const backdrop = document.getElementById('password-backdrop');
        if (backdrop) backdrop.classList.remove('active');
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
                audioManager.playSfx && audioManager.playSfx('sfx_success_jingle.mp3');
                this.showSuccessAnimation();
                setTimeout(() => window.location.href = data.url, 1200);
            } else {
                audioManager.playSfx && audioManager.playSfx('sfx_error.mp3');
                this.showPasswordError(data.error || 'Invalid password');
                this.shakePasswordModal();
            }
        } catch (e) {
            console.error('Password verification failed:', e);
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

        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'absolute';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.fontSize = `${Math.random() * 20 + 15}px`;
                confetti.style.opacity = '0.8';
                confetti.style.animation = `confettiFall ${Math.random() * 2 + 1}s ease-out forwards`;

                if (Math.random() > 0.5) {
                    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
                    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                } else {
                    confetti.style.width = '10px';
                    confetti.style.height = '10px';
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ResultPage());
} else {
    new ResultPage();
}