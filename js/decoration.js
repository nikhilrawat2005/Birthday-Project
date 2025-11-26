import sessionManager from './session.js';
import audioManager from './audio.js';

class DecorationPage {
    constructor() {
        this.balloonsAdded = false;
        this.cakeAdded = false;
        this.currentStep = 0;
        this.isMobile = this.checkMobile();
        this.init();
    }

    checkMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    async init() {
        await this.loadSessionState();
        this.bindEvents();
        this.optimizeForMobile();
        
        // Initialize audio with mobile considerations
        if (!this.isMobile) {
            audioManager.playBg('bg_party_happy.mp3');
        } else {
            // On mobile, wait for user interaction
            this.setupMobileAudio();
        }
    }

    optimizeForMobile() {
        // Adjust animation counts for mobile performance
        if (this.isMobile) {
            this.particleCount = 30;
            this.confettiCount = 60;
            this.balloonCount = 6;
            this.heartCount = 15;
        } else {
            this.particleCount = 50;
            this.confettiCount = 100;
            this.balloonCount = 8;
            this.heartCount = 20;
        }

        this.setupViewportHandler();
        this.setupTouchOptimizations();

        // Add mobile class for CSS targeting
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
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
                this.handleOrientationChange();
            }, 300);
        });
    }

    setupTouchOptimizations() {
        // Improve touch scrolling
        document.addEventListener('touchstart', function() {}, { passive: true });
        
        // Prevent zoom on double-tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    setupMobileAudio() {
        // Auto-play audio after first user interaction on mobile
        const enableAudio = () => {
            audioManager.handleUserInteraction();
            audioManager.playBg('bg_party_happy.mp3').catch(() => {});
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('click', enableAudio);
        };

        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
    }

    handleOrientationChange() {
        // Recalculate positions on orientation change
        if (this.isMobile) {
            setTimeout(() => {
                this.repositionElements();
            }, 500);
        }
    }

    repositionElements() {
        // Reposition decorative elements for new orientation
        const banner = document.querySelector('.banner');
        const cake = document.querySelector('.cake-container');
        const ducky = document.querySelector('.ducky-bottom-right');
        
        if (banner) {
            banner.style.marginTop = window.innerHeight > window.innerWidth ? '20px' : '10px';
        }
        
        if (cake) {
            cake.style.bottom = window.innerHeight > window.innerWidth ? '10vh' : '5vh';
        }
        
        if (ducky) {
            ducky.style.bottom = window.innerHeight > window.innerWidth ? '20px' : '10px';
            ducky.style.right = window.innerHeight > window.innerWidth ? '20px' : '10px';
        }
    }

    async loadSessionState() {
        const session = await sessionManager.getSession();

        // If session or decoration is not present -> start fresh flow
        const decoration = session && session.state && session.state.decoration ? session.state.decoration : null;

        // If decoration object is missing or empty, start the fresh decoration flow
        const decorationHasFlags = decoration && (decoration.bannerAdded || decoration.balloonsAdded || decoration.cakeAdded || decoration.cakeCut);

        if (!decorationHasFlags) {
            // No meaningful decoration saved — start fresh
            this.startDecorationFlow();
            return;
        }

        // If we reach here, restoration from a valid decoration state is intended
        if (decoration.bannerAdded) {
            this.addBannerAndClouds();
        }

        if (decoration.balloonsAdded) {
            this.balloonsAdded = true;
            this.addBalloons();
            document.getElementById('add-balloons').style.display = 'none';
            document.getElementById('add-cake').style.display = 'block';
            this.currentStep = 1;
        }

        if (decoration.cakeAdded) {
            this.cakeAdded = true;
            this.showCake();
            document.getElementById('add-cake').style.display = 'none';
            document.getElementById('cut-cake').style.display = 'block';
            this.currentStep = 2;
            this.updateDuckySpeech("Cake set ho gaya! Ab tumhare liye ek special cake-cutting moment banate hain 🍰");
        }

        if (decoration.cakeCut) {
            this.updateDuckySpeech("Cake cut ho gaya, ab asli surprise ke game ke liye ready ho jao! 🎁");
        }

        // Ensure the ducky message and visible buttons match restored state
        this.updateDuckyMessageForState();
    }

    bindEvents() {
        // Add Balloons button
        const addBalloonsBtn = document.getElementById('add-balloons');
        if (addBalloonsBtn) {
            addBalloonsBtn.addEventListener('click', () => {
                this.handleAddBalloons();
            });
            
            // Mobile touch events
            addBalloonsBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                addBalloonsBtn.style.transform = 'scale(0.95)';
            });
            
            addBalloonsBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                addBalloonsBtn.style.transform = 'scale(1)';
                this.handleAddBalloons();
            });
        }

        // Add Cake button
        const addCakeBtn = document.getElementById('add-cake');
        if (addCakeBtn) {
            addCakeBtn.addEventListener('click', () => {
                this.handleAddCake();
            });
            
            // Mobile touch events
            addCakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                addCakeBtn.style.transform = 'scale(0.95)';
            });
            
            addCakeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                addCakeBtn.style.transform = 'scale(1)';
                this.handleAddCake();
            });
        }

        // Cut Cake button
        const cutCakeBtn = document.getElementById('cut-cake');
        if (cutCakeBtn) {
            cutCakeBtn.addEventListener('click', () => {
                this.handleCutCake();
            });
            
            // Mobile touch events
            cutCakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                cutCakeBtn.style.transform = 'scale(0.95)';
            });
            
            cutCakeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                cutCakeBtn.style.transform = 'scale(1)';
                this.handleCutCake();
            });
        }

        // Cake image touch/click
        const cake = document.querySelector('.cake');
        if (cake) {
            cake.addEventListener('click', () => {
                if (this.cakeAdded && !this.cakeCut) {
                    this.handleCutCake();
                }
            });
            
            cake.addEventListener('touchstart', (e) => {
                if (this.cakeAdded && !this.cakeCut) {
                    e.preventDefault();
                    cake.style.transform = 'scale(1.1)';
                }
            });
            
            cake.addEventListener('touchend', (e) => {
                if (this.cakeAdded && !this.cakeCut) {
                    e.preventDefault();
                    cake.style.transform = 'scale(1)';
                    this.handleCutCake();
                }
            });
        }
    }

    // NEW: Separate handler functions with button disabling
    async handleAddBalloons() {
        const button = document.getElementById('add-balloons');
        if (button) {
            button.disabled = true;
        }
        
        // Haptic feedback on mobile
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(30);
        }
        
        this.addBalloons();
        this.createBalloonConfetti();
        document.getElementById('add-balloons').style.display = 'none';
        document.getElementById('add-cake').style.display = 'block';
        audioManager.playSfx('sfx_click.mp3');
        
        await this.updateSessionState({ 
            balloonsAdded: true 
        });
        
        // CHANGED: Enhanced message
        this.updateDuckySpeech("Balloons perfect lag rahe hain! Ab sabse important cheez — ek cute sa cake add karte hain 🎂");
        
        setTimeout(() => {
            if (button) button.disabled = false;
        }, 1000);
    }

    async handleAddCake() {
        const button = document.getElementById('add-cake');
        if (button) {
            button.disabled = true;
        }
        
        // Haptic feedback on mobile
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(30);
        }
        
        this.showCake();
        document.getElementById('add-cake').style.display = 'none';
        document.getElementById('cut-cake').style.display = 'block';
        audioManager.playSfx('sfx_click.mp3');
        
        await this.updateSessionState({ 
            cakeAdded: true 
        });
        
        // CHANGED: Enhanced message
        this.updateDuckySpeech("Cake set ho gaya! Ab tumhare liye ek special cake-cutting moment banate hain 🍰");
        
        setTimeout(() => {
            if (button) button.disabled = false;
        }, 1000);
    }

    async handleCutCake() {
        const button = document.getElementById('cut-cake');
        if (button) {
            button.disabled = true;
        }
        
        // Haptic feedback on mobile
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        audioManager.playSfx('sfx_cake_boom.mp3');
        this.createExplosion();
        this.createConfetti();
        this.createFloatingHearts();

        // CHANGED: Enhanced message
        this.updateDuckySpeech("Cake cut ho gaya, ab asli surprise ke game ke liye ready ho jao! 🎁");
        
        await this.updateSessionState({ 
            cakeCut: true 
        });
        
        setTimeout(() => {
            audioManager.playBg('bg_game_loop.mp3');
            sessionManager.navigateTo('game');
        }, 2000);
    }

    // NEW: Update duck message based on current state
    updateDuckyMessageForState() {
        // Make sure elements exist
        const btnBalloons = document.getElementById('add-balloons');
        const btnAddCake = document.getElementById('add-cake');
        const btnCutCake = document.getElementById('cut-cake');

        // Default hide all then reveal as needed (defensive)
        if (btnBalloons) btnBalloons.style.display = 'none';
        if (btnAddCake) btnAddCake.style.display = 'none';
        if (btnCutCake) btnCutCake.style.display = 'none';

        if (this.cakeAdded) {
            this.updateDuckySpeech("Cake set ho gaya! Ab tumhare liye ek special cake-cutting moment banate hain 🍰");
            if (btnCutCake) btnCutCake.style.display = 'block';
        } else if (this.balloonsAdded) {
            this.updateDuckySpeech("Balloons perfect lag rahe hain! Ab cake add karte hain 🎂");
            if (btnAddCake) btnAddCake.style.display = 'block';
        } else {
            // Nothing added yet: reveal the add-balloons button to start
            this.updateDuckySpeech("Yaha sab thoda khali sa lag raha hai... chalo tumhare liye perfect decorations banate hain 🎀");
            if (btnBalloons) btnBalloons.style.display = 'block';
        }
    }

    startDecorationFlow() {
        // CHANGED: Enhanced initial message
        this.updateDuckySpeech("Yaha sab thoda khali sa lag raha hai... chalo tumhare liye perfect decorations banate hain 🎀");
        
        setTimeout(() => {
            this.addBannerAndClouds();
            this.updateSessionState({ 
                bannerAdded: true 
            });
            
            setTimeout(() => {
                const addBalloonsBtn = document.getElementById('add-balloons');
                if (addBalloonsBtn) {
                    addBalloonsBtn.style.display = 'block';
                }
                // CHANGED: Enhanced message
                this.updateDuckySpeech("Banner aa gaya, ab thode cute balloons bhi add karte hain 🎈");
            }, 1000);
        }, 1500);
    }

    updateDuckySpeech(message) {
        const speechBubble = document.getElementById('ducky-speech');
        if (speechBubble) {
            speechBubble.textContent = message;
            
            // Add typing effect on mobile for better UX
            if (this.isMobile) {
                speechBubble.style.opacity = '0';
                setTimeout(() => {
                    speechBubble.style.opacity = '1';
                }, 100);
            }
        }
    }

    addBannerAndClouds() {
        const bannerContainer = document.querySelector('.banner-container');
        if (!bannerContainer) return;
        
        bannerContainer.innerHTML = '';
        
        const banner = document.createElement('div');
        banner.className = 'banner';
        banner.textContent = 'Happy Birthday, My Love!';
        bannerContainer.appendChild(banner);

        setTimeout(() => {
            banner.classList.add('show');
        }, 100);

        this.createCloudsWithTrainEffect();
    }

    createCloudsWithTrainEffect() {
        const cloudsContainer = document.querySelector('.clouds-container');
        if (!cloudsContainer) return;
        
        cloudsContainer.innerHTML = '';
        
        const messages = [
            "You're Amazing!",
            "So Special!",
            "Joy & Happiness!",
            "Love You!",
            "Best Wishes!",
            "Happy Birthday!"
        ];
        
        // Reduce cloud count on mobile for performance
        const cloudCount = this.isMobile ? 4 : 6;
        
        for (let i = 0; i < cloudCount; i++) {
            setTimeout(() => {
                const cloud = document.createElement('div');
                cloud.className = 'cloud';
                cloud.textContent = messages[i % messages.length];
                
                const baseTop = 12 + i * (this.isMobile ? 15 : 12);
                const jitter = Math.floor(Math.random() * 8);
                cloud.style.top = `${Math.min(82, baseTop + jitter)}%`;
                
                cloud.style.animationDelay = `${i * (this.isMobile ? 2.8 : 2.2)}s`;
                cloudsContainer.appendChild(cloud);
                
                requestAnimationFrame(() => cloud.classList.add('show'));
            }, i * 400);
        }
    }

    addBalloons() {
        const balloonsContainer = document.querySelector('.balloons-container');
        if (!balloonsContainer) return;
        
        balloonsContainer.innerHTML = '';
        const balloonCount = this.balloonCount;

        const colors = [
            { color: '#ff6b8b', dark: '#e55a7b' },
            { color: '#ff8e53', dark: '#e67d4a' },
            { color: '#4facfe', dark: '#3d9bed' },
            { color: '#00f2fe', dark: '#00d9e6' },
            { color: '#a8e6cf', dark: '#97d5be' },
            { color: '#dcedc1', dark: '#cbdbb0' }
        ];

        for (let i = 0; i < balloonCount; i++) {
            setTimeout(() => {
                const balloon = document.createElement('div');
                balloon.className = 'balloon';
                balloon.style.left = `${Math.random() * 100}%`;
                balloon.style.animationDelay = `${Math.random() * 2}s`;
                
                const colorIndex = Math.floor(Math.random() * colors.length);
                balloon.style.setProperty('--balloon-color', colors[colorIndex].color);
                balloon.style.setProperty('--balloon-dark', colors[colorIndex].dark);
                
                balloonsContainer.appendChild(balloon);
            }, i * 300);
        }
    }

    createBalloonConfetti() {
        const scene = document.querySelector('.scene');
        if (!scene) return;
        
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container balloon-confetti';
        scene.appendChild(confettiContainer);

        const confettiCount = this.isMobile ? 25 : 40;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti balloon-confetti-piece';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
                confetti.style.animationDelay = `${Math.random() * 1.5}s`;
                confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 4000);
            }, i * 30);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    // NEW: Create floating hearts effect
    createFloatingHearts() {
        const scene = document.querySelector('.scene');
        if (!scene) return;

        const heartCount = this.heartCount;

        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'floating-heart';
                heart.textContent = '♥';

                heart.style.left = `${Math.random() * 100}%`;
                heart.style.bottom = `${Math.random() * 20}px`;
                heart.style.animationDelay = `${Math.random() * 2}s`;

                scene.appendChild(heart);

                setTimeout(() => {
                    heart.remove();
                }, 6000);
            }, i * 120);
        }
    }

    showCake() {
        const cakeContainer = document.querySelector('.cake-container');
        if (cakeContainer) {
            cakeContainer.classList.add('visible');
            
            // Add bounce animation for mobile
            if (this.isMobile) {
                cakeContainer.style.animation = 'bounceIn 0.8s ease-out';
            }
        }
    }

    createExplosion() {
        const scene = document.querySelector('.scene');
        if (!scene) return;
        
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        scene.appendChild(explosion);

        const particleCount = this.particleCount;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            
            const tx = (Math.random() - 0.5) * (this.isMobile ? 300 : 500);
            const ty = (Math.random() - 0.5) * (this.isMobile ? 300 : 500);
            const r = Math.random() * 720 - 360;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.setProperty('--r', `${r}deg`);
            
            explosion.appendChild(particle);
        }

        setTimeout(() => {
            explosion.remove();
        }, 1000);
    }

    createConfetti() {
        const scene = document.querySelector('.scene');
        if (!scene) return;
        
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        scene.appendChild(confettiContainer);

        const confettiCount = this.confettiCount;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
                confetti.style.animationDelay = `${Math.random() * 2}s`;
                confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }, i * 50);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 6000);
    }

    async updateSessionState(updates) {
        await sessionManager.updateSession({
            decoration: updates
        });
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

new DecorationPage();