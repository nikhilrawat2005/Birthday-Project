class BirthdayExperience {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.isPlaying = false;
        this.hasStarted = false;
        this.wishGranted = sessionStorage.getItem('wishGranted') === 'true';
        this.duckyMessage = "Hello Prisha! 🐤 I've been waiting to share this special message with you. You are such an amazing person with a heart full of love and kindness. Your friendship means the world to everyone around you. On your special day, I wish you endless happiness, laughter that never fades, and dreams that always come true. Remember, you're capable of achieving anything you set your mind to! Keep shining bright like the star you are. Happy Birthday! 🌟";
        this.init();
    }

    init() {
        this.setupInitialState();
        this.setupAudio();
        this.bindEvents();
        this.startExperience();
        this.setupScrollAnimations();
    }

    setupInitialState() {
        if (this.wishGranted) {
            // Wish already granted - hide landing overlay and show main content
            this.hideLandingOverlay();
            this.hideWishButtons();
            
            // Show password prompt after a short delay
            setTimeout(() => {
                this.showDuckyMessage();
            }, 1000);
        } else {
            // First time - show landing overlay
            this.showLandingOverlay();
            document.body.classList.add('overlay-active');
        }
    }

    setupAudio() {
        // Set audio to start from 10 seconds
        this.audio.currentTime = 10;
        this.audio.volume = 0.7;

        // Auto-play after animations (around 8 seconds)
        setTimeout(() => {
            if (!this.hasStarted && this.wishGranted) {
                this.startAudio();
            }
        }, 8000);
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
        // Landing wish button
        document.querySelector('.landing-wish-btn').addEventListener('click', () => {
            this.showWishModal();
        });

        // Wish button (in footer - will be hidden after wish granted)
        const wishBtn = document.querySelector('.wish-btn');
        if (wishBtn) {
            wishBtn.addEventListener('click', () => {
                this.showWishModal();
            });
        }

        // Modal events
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideWishModal();
        });

        document.querySelector('.blow-btn').addEventListener('click', () => {
            this.blowOutCandles();
        });

        // Next page password events
        document.getElementById('next-page-submit').addEventListener('click', () => {
            this.validateNextPagePassword();
        });

        document.getElementById('next-page-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateNextPagePassword();
            }
        });

        // Character interactions
        document.querySelectorAll('.character').forEach(char => {
            char.addEventListener('click', (e) => {
                this.animateCharacter(e.target);
            });
        });

        // Close modal on backdrop click
        document.getElementById('wish-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('wish-modal')) {
                this.hideWishModal();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideWishModal();
                this.hideDuckyMessage();
            }
        });
    }

    startExperience() {
        // Initial animations are handled by CSS
        // Additional JS-powered animations can go here
        this.createFloatingHearts();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    if (entry.target.classList.contains('gallery-item')) {
                        this.animateGalleryItem(entry.target);
                    }
                }
            });
        }, observerOptions);

        // Observe all elements that should animate on scroll
        document.querySelectorAll('.message-paragraph, .gallery-item, .magic-btn').forEach(el => {
            observer.observe(el);
        });
    }

    animateGalleryItem(item) {
        item.style.animation = 'galleryReveal 0.8s ease forwards';
    }

    showLandingOverlay() {
        document.getElementById('landing-overlay').classList.add('active');
        document.body.classList.add('overlay-active');
    }

    hideLandingOverlay() {
        document.getElementById('landing-overlay').classList.remove('active');
        document.body.classList.remove('overlay-active');
        
        // Play celebration audio when main content is revealed
        this.playCelebrationSound();
    }

    showDuckyMessage() {
        document.getElementById('ducky-message').classList.add('active');
        this.typeDuckyMessage();
    }

    hideDuckyMessage() {
        document.getElementById('ducky-message').classList.remove('active');
    }

    showWishModal() {
        const modal = document.getElementById('wish-modal');
        modal.classList.add('active');
        
        // Add magical sound effect
        this.playMagicSound();
        
        // Animate modal entrance
        this.animateModalEntrance();
    }

    hideWishModal() {
        const modal = document.getElementById('wish-modal');
        modal.classList.remove('active');
    }

    animateModalEntrance() {
        const candles = document.querySelectorAll('.wish-candle');
        candles.forEach((candle, index) => {
            setTimeout(() => {
                candle.classList.add('burning');
            }, index * 200);
        });
    }

    blowOutCandles() {
        const candles = document.querySelectorAll('.wish-candle');
        const blowBtn = document.querySelector('.blow-btn');
        
        // Disable button during animation
        blowBtn.disabled = true;
        blowBtn.textContent = 'Making your wish come true... ✨';

        // Blow out candles sequentially
        candles.forEach((candle, index) => {
            setTimeout(() => {
                candle.classList.remove('burning');
                candle.style.opacity = '0.5';
                
                // Add smoke effect
                this.createSmokeEffect(candle);
                
            }, index * 300);
        });

        // Final celebration
        setTimeout(() => {
            this.createConfettiBurst();
            this.playCelebrationSound();
            
            // Update button text
            blowBtn.textContent = 'Wish Granted! 🌟';
            
            // Close modal and transition to main content
            setTimeout(() => {
                this.hideWishModal();
                this.onWishGranted();
                blowBtn.disabled = false;
                blowBtn.textContent = 'Blow Out Candles 🎂';
            }, 2000);
            
        }, 1500);
    }

    onWishGranted() {
        // Set flag in session storage
        sessionStorage.setItem('wishGranted', 'true');
        this.wishGranted = true;
        
        // Hide landing overlay and reveal main content
        this.hideLandingOverlay();
        this.hideWishButtons();
        
        // Show ducky message after a short delay
        setTimeout(() => {
            this.showDuckyMessage();
        }, 1500);
    }

    hideWishButtons() {
        // Hide all wish buttons
        document.querySelector('.landing-wish-btn').style.display = 'none';
        const wishBtn = document.querySelector('.wish-btn');
        if (wishBtn) {
            wishBtn.classList.add('hidden');
        }
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
                    page: 'blog2',
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

    typeDuckyMessage() {
        const duckyText = document.getElementById('ducky-text');
        const message = this.duckyMessage;
        let index = 0;
        
        duckyText.innerHTML = '';
        
        const typeInterval = setInterval(() => {
            if (index < message.length) {
                duckyText.innerHTML += message[index];
                index++;
                
                // Add typing cursor
                const cursor = document.createElement('span');
                cursor.className = 'typing-cursor';
                duckyText.appendChild(cursor);
                
                // Scroll to bottom
                duckyText.scrollTop = duckyText.scrollHeight;
            } else {
                clearInterval(typeInterval);
                // Remove cursor when done
                const cursor = duckyText.querySelector('.typing-cursor');
                if (cursor) {
                    cursor.remove();
                }
            }
        }, 50);
    }

    createSmokeEffect(candle) {
        const smoke = document.createElement('div');
        smoke.style.cssText = `
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
            animation: smokeRise 2s ease-out forwards;
        `;
        
        const keyframes = `
            @keyframes smokeRise {
                0% {
                    transform: translateX(-50%) translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateX(-50%) translateY(-50px) scale(2);
                    opacity: 0;
                }
            }
        `;
        
        // Add keyframes if not already present
        if (!document.getElementById('smoke-animation')) {
            const style = document.createElement('style');
            style.id = 'smoke-animation';
            style.textContent = keyframes;
            document.head.appendChild(style);
        }
        
        candle.appendChild(smoke);
        
        // Remove smoke element after animation
        setTimeout(() => {
            smoke.remove();
        }, 2000);
    }

    createConfettiBurst() {
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1001;
        `;
        
        document.body.appendChild(confettiContainer);

        const colors = ['#ff6b8b', '#ff8e53', '#4facfe', '#00f2fe', '#a8e6cf', '#dcedc1'];
        const emojis = ['🎉', '✨', '🌟', '💫', '🎊', '💖', '🥳', '🎂'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 20 + 15}px;
                    opacity: 0.9;
                    animation: confettiBurst 2s ease-out forwards;
                `;
                
                if (Math.random() > 0.3) {
                    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
                    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                } else {
                    confetti.style.width = '12px';
                    confetti.style.height = '12px';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.borderRadius = '50%';
                }
                
                // Add burst animation
                const burstKeyframes = `
                    @keyframes confettiBurst {
                        0% {
                            transform: translate(0, 0) rotate(0deg) scale(0);
                            opacity: 1;
                        }
                        50% {
                            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(180deg) scale(1);
                            opacity: 0.8;
                        }
                        100% {
                            transform: translate(${Math.random() * 200 - 100}px, 100vh) rotate(360deg) scale(0);
                            opacity: 0;
                        }
                    }
                `;
                
                if (!document.getElementById('confetti-burst-animation')) {
                    const style = document.createElement('style');
                    style.id = 'confetti-burst-animation';
                    style.textContent = burstKeyframes;
                    document.head.appendChild(style);
                }
                
                confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 2000);
            }, i * 50);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 3000);
    }

    animateCharacter(character) {
        // Bounce animation when clicked
        character.style.animation = 'characterBounce 0.6s ease';
        
        setTimeout(() => {
            character.style.animation = '';
        }, 600);
        
        // Add custom keyframes for bounce
        const bounceKeyframes = `
            @keyframes characterBounce {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-20px) scale(1.1); }
            }
        `;
        
        if (!document.getElementById('character-bounce-animation')) {
            const style = document.createElement('style');
            style.id = 'character-bounce-animation';
            style.textContent = bounceKeyframes;
            document.head.appendChild(style);
        }
        
        this.playCharacterSound();
    }

    createFloatingHearts() {
        // Additional floating hearts in background
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.textContent = '💖';
                heart.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: 100%;
                    font-size: ${Math.random() * 20 + 15}px;
                    opacity: 0.7;
                    animation: floatHeart ${Math.random() * 10 + 5}s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                `;
                
                document.body.appendChild(heart);
            }, i * 1000);
        }
        
        // Add heart animation
        const heartKeyframes = `
            @keyframes floatHeart {
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
        
        if (!document.getElementById('heart-float-animation')) {
            const style = document.createElement('style');
            style.id = 'heart-float-animation';
            style.textContent = heartKeyframes;
            document.head.appendChild(style);
        }
    }

    playMagicSound() {
        // Create a magical sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.5); // C6
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    playCelebrationSound() {
        // Create celebration sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Play multiple frequencies for celebration effect
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(300 + i * 100, audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, i * 100);
            }
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    playCharacterSound() {
        // Play a cute sound when character is clicked
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BirthdayExperience();
});

// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});