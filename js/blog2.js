class Blog2Experience {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.isPlaying = false;
        this.hasStarted = false;
        this.init();
    }

    init() {
        this.setupAudio();
        this.bindEvents();
        this.startExperience();
    }

    setupAudio() {
        // Set audio to start from 10 seconds
        this.audio.currentTime = 10;
        this.audio.volume = 0.7;

        // Auto-play after animations
        setTimeout(() => {
            if (!this.hasStarted) {
                this.startAudio();
            }
        }, 3000);
    }

    startAudio() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.hasStarted = true;
        }).catch(error => {
            console.log('Audio play failed:', error);
        });
    }

    bindEvents() {
        // Next page password events
        document.getElementById('next-page-submit').addEventListener('click', () => {
            this.validateNextPagePassword();
        });

        document.getElementById('next-page-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateNextPagePassword();
            }
        });
    }

    startExperience() {
        // Initial animations are handled by CSS
        this.createFloatingElements();
    }

    async validateNextPagePassword() {
        const passwordInput = document.getElementById('next-page-password');
        const passwordError = document.getElementById('next-page-error');
        const submitBtn = document.getElementById('next-page-submit');
        const password = passwordInput.value.trim();
        
        if (!password) {
            this.showNextPageError('Please enter a password');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Checking... 🔍';

        try {
            const response = await fetch('/api/unlock-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page: 'blog3',
                    password: password
                })
            });

            const data = await response.json();

            if (data.ok) {
                // Correct password - redirect to next page
                this.showNextPageSuccess('Password correct! Redirecting... 🎉');
                setTimeout(() => {
                    window.location.href = data.url;
                }, 1500);
            } else {
                // Wrong password
                this.showNextPageError(data.error || 'Incorrect password! Try again.');
                this.shakePasswordInput();
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Password verification failed:', error);
            this.showNextPageError('Network error. Please try again.');
            this.shakePasswordInput();
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = 'Unlock Next Page 🗝️';
        }
    }

    showNextPageError(message) {
        const errorDiv = document.getElementById('next-page-error');
        if (errorDiv) {
            errorDiv.textContent = `❌ ${message}`;
            errorDiv.style.display = 'block';
            errorDiv.classList.remove('success');
            errorDiv.classList.add('error');
        }
    }

    showNextPageSuccess(message) {
        const errorDiv = document.getElementById('next-page-error');
        if (errorDiv) {
            errorDiv.textContent = `✅ ${message}`;
            errorDiv.style.display = 'block';
            errorDiv.classList.remove('error');
            errorDiv.classList.add('success');
        }
    }

    shakePasswordInput() {
        const input = document.getElementById('next-page-password');
        if (input) {
            input.classList.add('shake');
            setTimeout(() => {
                input.classList.remove('shake');
            }, 500);
        }
    }

    createFloatingElements() {
        // Additional floating elements
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                const types = ['💖', '💝', '✨', '🌟', '⭐', '🌼'];
                element.textContent = types[Math.floor(Math.random() * types.length)];
                element.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: 100%;
                    font-size: ${Math.random() * 20 + 15}px;
                    opacity: 0.7;
                    animation: floatElement ${Math.random() * 10 + 5}s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                `;
                
                document.body.appendChild(element);
            }, i * 800);
        }
        
        // Add element animation
        const elementKeyframes = `
            @keyframes floatElement {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 0.7;
                }
                90% {
                    opacity: 0.7;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        
        if (!document.getElementById('element-float-animation')) {
            const style = document.createElement('style');
            style.id = 'element-float-animation';
            style.textContent = elementKeyframes;
            document.head.appendChild(style);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Blog2Experience();
});

// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});