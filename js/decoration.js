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
        this.startDecorationFlow();
        audioManager.playBg('bg_party_happy.mp3');
    }

    async loadSessionState() {
        const session = await sessionManager.getSession();
        if (session && session.state && session.state.decoration) {
            const decoration = session.state.decoration;
            if (decoration.bannerAdded) {
                this.addBannerAndClouds();
            }
            if (decoration.balloonsAdded) {
                this.addBalloons();
                document.getElementById('add-balloons').style.display = 'none';
                this.currentStep = 1;
            }
            if (decoration.cakeAdded) {
                this.showCake();
                document.getElementById('add-cake').style.display = 'none';
                document.getElementById('cut-cake').style.display = 'block';
                this.currentStep = 2;
            }
        } else {
            // Start fresh flow
            this.startDecorationFlow();
        }
    }

    bindEvents() {
        document.getElementById('add-balloons').addEventListener('click', () => {
            this.addBalloons();
            document.getElementById('add-balloons').style.display = 'none';
            document.getElementById('add-cake').style.display = 'block';
            audioManager.playSfx('sfx_click.mp3');
            
            this.updateSessionState({ 
                balloonsAdded: true 
            });
            
            // Update ducky message
            this.updateDuckySpeech("Now let's add a cake! 🎂");
        });

        document.getElementById('add-cake').addEventListener('click', () => {
            this.showCake();
            document.getElementById('add-cake').style.display = 'none';
            document.getElementById('cut-cake').style.display = 'block';
            audioManager.playSfx('sfx_click.mp3');
            
            this.updateSessionState({ 
                cakeAdded: true 
            });
            
            this.updateDuckySpeech("Perfect! Now let's cut the cake! 🍰");
        });

        document.getElementById('cut-cake').addEventListener('click', () => {
            audioManager.playSfx('sfx_cake_boom.mp3');
            this.createExplosion();
            this.createConfetti();
            
            this.updateSessionState({ 
                cakeCut: true 
            });
            
            setTimeout(() => {
                audioManager.playBg('bg_game_loop.mp3');
                sessionManager.navigateTo('game');
            }, 2000);
        });
    }

    startDecorationFlow() {
        // Show initial empty scene with ducky message
        this.updateDuckySpeech("It feels empty... Let's add some decorations! 🎀");
        
        // Auto-add banner and clouds after a short delay
        setTimeout(() => {
            this.addBannerAndClouds();
            this.updateSessionState({ 
                bannerAdded: true 
            });
            
            // After banner appears, show balloon button and update message
            setTimeout(() => {
                document.getElementById('add-balloons').style.display = 'block';
                this.updateDuckySpeech("We should add balloons too! 🎈");
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

        // Animate banner in
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);

        this.createCloudsWithTrainEffect();
    }

    createCloudsWithTrainEffect() {
        const cloudsContainer = document.querySelector('.clouds-container');
        cloudsContainer.innerHTML = '';
        
        const messages = [
            "Best Wishes!",
            "Happy Birthday!",
            "You're Amazing!",
            "So Special!",
            "Joy & Happiness!",
            "Love You!"
        ];
        
        for (let i = 0; i < messages.length; i++) {
            setTimeout(() => {
                const cloud = document.createElement('div');
                cloud.className = 'cloud';
                cloud.textContent = messages[i];
                
                // Vertical placement
                const baseTop = 12 + i * 12;
                const jitter = Math.floor(Math.random() * 8);
                cloud.style.top = `${Math.min(82, baseTop + jitter)}%`;
                
                cloud.style.animationDelay = `${i * 2.2}s`;
                cloudsContainer.appendChild(cloud);
                
                // Smooth appearance
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