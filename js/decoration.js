import sessionManager from './session.js';
import audioManager from './audio.js';

class DecorationPage {
    constructor() {
        this.balloonsAdded = false;
        this.cakeAdded = false;
        this.currentStep = 0;
        this.init();
    }

    async init() {
        await this.loadSessionState();
        this.bindEvents();
        audioManager.playBg('bg_party_happy.mp3');
        
        // REMOVED: this.startDecorationFlow() - Now only called from loadSessionState when needed
    }

    async loadSessionState() {
        const session = await sessionManager.getSession();
        
        // Check if we have existing decoration state
        const hasDecorationState = session && session.state && session.state.decoration;
        
        if (hasDecorationState) {
            const decoration = session.state.decoration;
            
            // Restore banner if it was added
            if (decoration.bannerAdded) {
                this.addBannerAndClouds();
            }
            
            // Restore balloons if they were added
            if (decoration.balloonsAdded) {
                this.addBalloons();
                document.getElementById('add-balloons').style.display = 'none';
                document.getElementById('add-cake').style.display = 'block';
                this.currentStep = 1;
                this.updateDuckySpeech("Balloons perfect lag rahe hain! Ab sabse important cheez — ek cute sa cake add karte hain 🎂");
            }
            
            // Restore cake if it was added
            if (decoration.cakeAdded) {
                this.showCake();
                document.getElementById('add-balloons').style.display = 'none';
                document.getElementById('add-cake').style.display = 'none';
                document.getElementById('cut-cake').style.display = 'block';
                this.currentStep = 2;
                this.updateDuckySpeech("Cake set ho gaya! Ab tumhare liye ek special cake-cutting moment banate hain 🍰");
            }
            
            // If cake was cut, we should have navigated away, but handle just in case
            if (decoration.cakeCut) {
                this.updateDuckySpeech("Cake cut ho gaya, ab asli surprise ke game ke liye ready ho jao! 🎁");
            }
            
            // Update duck message based on current state
            this.updateDuckyMessageForState();
            
        } else {
            // No existing state - start fresh decoration flow
            this.startDecorationFlow();
        }
    }

    bindEvents() {
        // Add Balloons button
        document.getElementById('add-balloons').addEventListener('click', () => {
            this.handleAddBalloons();
        });

        // Add Cake button
        document.getElementById('add-cake').addEventListener('click', () => {
            this.handleAddCake();
        });

        // Cut Cake button
        document.getElementById('cut-cake').addEventListener('click', () => {
            this.handleCutCake();
        });
    }

    // NEW: Separate handler functions with button disabling
    async handleAddBalloons() {
        const button = document.getElementById('add-balloons');
        button.disabled = true;
        
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
            button.disabled = false;
        }, 1000);
    }

    async handleAddCake() {
        const button = document.getElementById('add-cake');
        button.disabled = true;
        
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
            button.disabled = false;
        }, 1000);
    }

    async handleCutCake() {
        const button = document.getElementById('cut-cake');
        button.disabled = true;
        
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
        if (this.cakeAdded) {
            this.updateDuckySpeech("Cake set ho gaya! Ab tumhare liye ek special cake-cutting moment banate hain 🍰");
        } else if (this.balloonsAdded) {
            this.updateDuckySpeech("Balloons perfect lag rahe hain! Ab sabse important cheez — ek cute sa cake add karte hain 🎂");
        } else {
            this.updateDuckySpeech("Yaha sab thoda khali sa lag raha hai... chalo tumhare liye perfect decorations banate hain 🎀");
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
                document.getElementById('add-balloons').style.display = 'block';
                // CHANGED: Enhanced message
                this.updateDuckySpeech("Banner aa gaya, ab thode cute balloons bhi add karte hain 🎈");
            }, 1000);
        }, 1500);
    }

    updateDuckySpeech(message) {
        const speechBubble = document.getElementById('ducky-speech');
        if (speechBubble) {
            speechBubble.textContent = message;
        }
    }

    addBannerAndClouds() {
        const bannerContainer = document.querySelector('.banner-container');
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
        cloudsContainer.innerHTML = '';
        
        const messages = [
            "You're Amazing!",
            "So Special!",
            "Joy & Happiness!",
            "Love You!",
            "Best Wishes!",
            "Happy Birthday!"
        ];
        
        for (let i = 0; i < messages.length; i++) {
            setTimeout(() => {
                const cloud = document.createElement('div');
                cloud.className = 'cloud';
                cloud.textContent = messages[i];
                
                const baseTop = 12 + i * 12;
                const jitter = Math.floor(Math.random() * 8);
                cloud.style.top = `${Math.min(82, baseTop + jitter)}%`;
                
                cloud.style.animationDelay = `${i * 2.2}s`;
                cloudsContainer.appendChild(cloud);
                
                requestAnimationFrame(() => cloud.classList.add('show'));
            }, i * 400);
        }
    }

    addBalloons() {
        const balloonsContainer = document.querySelector('.balloons-container');
        balloonsContainer.innerHTML = '';
        const balloonCount = 8;

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
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container balloon-confetti';
        document.querySelector('.scene').appendChild(confettiContainer);

        for (let i = 0; i < 40; i++) {
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

        const heartCount = 20;

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
        }
    }

    createExplosion() {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        document.querySelector('.scene').appendChild(explosion);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            
            const tx = (Math.random() - 0.5) * 500;
            const ty = (Math.random() - 0.5) * 500;
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
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.querySelector('.scene').appendChild(confettiContainer);

        for (let i = 0; i < 100; i++) {
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
}

new DecorationPage();