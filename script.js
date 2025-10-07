class BirthdaySurprise {
    constructor() {
        this.currentScene = 'landing-page';
        this.scenes = {
            'landing-page': document.getElementById('landing-page'),
            'empty-page': document.getElementById('empty-page'),
            'decoration-page': document.getElementById('decoration-page'),
            'game-page': document.getElementById('game-page'),
            'transition-page': document.getElementById('transition-page'),
            'reward-page': document.getElementById('reward-page'),
            'final-page': document.getElementById('final-page')
        };
        
        this.gameState = {
            score: 0,
            timeLeft: 60,
            gameActive: false,
            bucket: null,
            kitties: []
        };

        // Track if event listeners are already bound
        this.eventListenersBound = false;

        // Timer and timeout tracking
        this.timerId = null;
        this.spawnTimeouts = [];
        this._gameControlsBound = false;

        // Preload kitty images
        this.KITTY_IMAGES = [
            'assets/images/kitty_01.png',
            'assets/images/kitty_02.png', 
            'assets/images/kitty_03.png',
            'assets/images/kitty_04.png',
            'assets/images/kitty_05.png'
        ];

        this.audioManager = {
            bgMusic: document.getElementById('bg-music'),
            sfx: document.getElementById('sfx'),
            currentBg: null,
            
            playBg: function(track) {
                if (this.currentBg === track) return;
                this.bgMusic.src = `assets/audio/${track}`;
                this.bgMusic.volume = 0.7;
                this.bgMusic.play().catch(e => console.log('Audio play failed:', e));
                this.currentBg = track;
            },
            
            playSfx: function(sfx) {
                this.sfx.src = `assets/audio/${sfx}`;
                this.sfx.volume = 0.8;
                this.sfx.play().catch(e => console.log('SFX play failed:', e));
            }
        };

        // Handle window resize
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        this.init();
    }

    init() {
        // Only bind events once
        if (!this.eventListenersBound) {
            this.bindEvents();
            this.eventListenersBound = true;
        }
        this.preloadAssets();
        this.handleResize(); // Initial sizing
    }

    handleResize() {
        // Adjust game canvas size for responsiveness
        if (this.currentScene === 'game-page') {
            this.resizeGameCanvas();
        }
        
        // Adjust any other responsive elements as needed
        this.adjustSpeechBubbles();
    }

    resizeGameCanvas() {
        const canvas = document.getElementById('game-canvas');
        const container = document.querySelector('.canvas-container');
        if (!canvas || !container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const dpr = window.devicePixelRatio || 1;

        // set CSS size (visible)
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;

        // set actual pixel buffer size for crispness
        canvas.width = Math.floor(containerWidth * dpr);
        canvas.height = Math.floor(containerHeight * dpr);

        const ctx = canvas.getContext('2d');
        // reset transforms and scale to dpr so drawing uses css px coordinates
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;

        // Recompute bucket size/position using CSS px (container sizes)
        if (this.gameState && this.gameState.bucket) {
            this.gameState.bucket.width = Math.min(120, containerWidth * 0.15);
            this.gameState.bucket.height = Math.min(120, containerHeight * 0.195);
            this.gameState.bucket.x = Math.max(0, containerWidth / 2 - this.gameState.bucket.width / 2);
            this.gameState.bucket.y = containerHeight - 100;
        }
    }

    adjustSpeechBubbles() {
        // Adjust speech bubble positions for different screen sizes
        const speechBubbles = document.querySelectorAll('.speech-bubble');
        speechBubbles.forEach(bubble => {
            const duckyContainer = bubble.closest('.ducky-container');
            if (duckyContainer && duckyContainer.classList.contains('bottom-right')) {
                if (window.innerWidth < 768) {
                    bubble.style.right = '0';
                    bubble.style.left = 'auto';
                }
            }
        });
    }

    bindEvents() {
        // Landing page buttons
        document.getElementById('yes-btn').addEventListener('click', () => {
            this.audioManager.playBg('bg_soft_ambient.mp3');
            this.showScene('empty-page');
        });

        document.getElementById('force-btn').addEventListener('click', () => {
            this.audioManager.playBg('bg_soft_ambient.mp3');
            this.showScene('empty-page');
        });

        // Empty page - add decorations
        document.getElementById('add-decoration').addEventListener('click', () => {
            this.audioManager.playBg('bg_party_happy.mp3');
            this.showScene('decoration-page');
            this.resetDecorationPage(); // Reset decoration page state
            // Add banner and clouds to decoration page
            this.addBannerAndClouds();
            // Show add balloons button first
            document.getElementById('add-balloons').style.display = 'block';
            document.querySelector('.cake-container').style.display = 'none';
        });

        // Add balloons
        document.getElementById('add-balloons').addEventListener('click', () => {
            this.addBalloons();
            document.getElementById('add-balloons').style.display = 'none';
            document.getElementById('add-cake').style.display = 'block';
            this.audioManager.playSfx('sfx_click.mp3');
            
            // Update ducky message
            const speechBubble = document.querySelector('#decoration-page .speech-bubble');
            if (speechBubble) {
                speechBubble.textContent = "Now let's add a cake! 🎂";
            }
        });

        // Add cake
        document.getElementById('add-cake').addEventListener('click', () => {
            document.getElementById('add-cake').style.display = 'none';
            document.getElementById('cut-cake').style.display = 'block';
            document.querySelector('.cake-container').style.display = 'block';
            this.audioManager.playSfx('sfx_click.mp3');
            
            // Update ducky message
            const speechBubble = document.querySelector('#decoration-page .speech-bubble');
            if (speechBubble) {
                speechBubble.textContent = "Perfect! Now let's cut the cake! 🎂";
            }
        });

        // Cut cake
        document.getElementById('cut-cake').addEventListener('click', () => {
            this.audioManager.playSfx('sfx_cake_boom.mp3');
            this.createExplosion();
            this.createConfetti();
            setTimeout(() => {
                this.audioManager.playBg('bg_game_loop.mp3');
                this.startKittyGame();
            }, 2000);
        });

        // Transition page - yes to reward
        document.getElementById('yes-reward').addEventListener('click', () => {
            this.audioManager.playSfx('sfx_click.mp3');
            // Animate ducky-kitty image moving to the side
            const duckyKitty = document.querySelector('#transition-page .ducky-kitty-image');
            const speechBubble = document.querySelector('#transition-page .speech-bubble');
            
            if (duckyKitty) {
                duckyKitty.style.transition = 'all 1s ease';
                duckyKitty.style.transform = 'translateX(-100vw)';
            }
            
            if (speechBubble) {
                speechBubble.style.transition = 'all 1s ease';
                speechBubble.style.transform = 'translateX(-100vw)';
            }
            
            setTimeout(() => {
                this.showScene('reward-page');
                this.audioManager.playBg('bg_soft_ambient.mp3');
                // Scroll to top when showing reward page
                document.querySelector('.blog-container').scrollTop = 0;
            }, 1000);
        });

        // Final page buttons
        document.getElementById('bye-btn').addEventListener('click', () => {
            this.sayGoodbyeToDucky();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.fullRestart();
        });

        // Blog restart button
        document.getElementById('blog-restart-btn').addEventListener('click', () => {
            this.fullRestart();
        });
    }

    // New method to reset transition page
    resetTransitionPage() {
        // Reset the ducky-kitty image position and animation
        const duckyKitty = document.querySelector('#transition-page .ducky-kitty-image');
        if (duckyKitty) {
            duckyKitty.style.transition = '';
            duckyKitty.style.transform = '';
            duckyKitty.classList.add('talking');
        }
        
        // Reset the speech bubble position
        const speechBubble = document.querySelector('#transition-page .speech-bubble');
        if (speechBubble) {
            speechBubble.style.transition = '';
            speechBubble.style.transform = '';
        }
        
        // Make sure transition page content is visible
        const transitionContent = document.querySelector('#transition-page .transition-content');
        if (transitionContent) {
            transitionContent.style.display = 'flex';
        }
    }

    // New method to completely reset the application
    fullRestart() {
        // stop timer
        if (this.timerId) { 
            clearInterval(this.timerId); 
            this.timerId = null; 
        }

        // clear spawn timeouts
        this.spawnTimeouts.forEach(id => clearTimeout(id));
        this.spawnTimeouts = [];

        // reset gameState
        this.gameState = { 
            score: 0, 
            timeLeft: 60, 
            gameActive: false, 
            bucket: null, 
            kitties: [] 
        };

        // reset decorations and transition page
        this.resetDecorationPage();
        this.resetTransitionPage();

        // stop audio safely
        try {
            this.audioManager.bgMusic.pause();
            this.audioManager.bgMusic.currentTime = 0;
            this.audioManager.sfx.pause();
            this.audioManager.sfx.currentTime = 0;
            this.audioManager.currentBg = null;
        } catch (e) { 
            console.warn('Audio cleanup error', e); 
        }

        // show landing page and reset scroll
        this.showScene('landing-page');
        window.scrollTo(0, 0);
    }

    // New method to reset decoration page
    resetDecorationPage() {
        // Reset button states
        document.getElementById('add-balloons').style.display = 'block';
        document.getElementById('add-cake').style.display = 'none';
        document.getElementById('cut-cake').style.display = 'none';
        document.querySelector('.cake-container').style.display = 'none';

        // Clear dynamic content
        const balloonsContainer = document.querySelector('.balloons-container');
        if (balloonsContainer) balloonsContainer.innerHTML = '';

        const bannerContainer = document.querySelector('#decoration-page .banner-container');
        if (bannerContainer) bannerContainer.innerHTML = '';

        const cloudsContainer = document.querySelector('#decoration-page .clouds-container');
        if (cloudsContainer) cloudsContainer.innerHTML = '';

        // Reset speech bubble
        const speechBubble = document.querySelector('#decoration-page .speech-bubble');
        if (speechBubble) {
            speechBubble.textContent = "We should add balloons too! 🎈";
        }
    }

    showScene(sceneName) {
        // Hide all scenes
        Object.values(this.scenes).forEach(scene => {
            scene.classList.remove('active');
        });
        
        // Show target scene
        this.scenes[sceneName].classList.add('active');
        this.currentScene = sceneName;

        // Special scene handling
        if (sceneName === 'transition-page') {
            this.showTransitionMessage();
            // Ensure transition content is visible
            const transitionContent = document.querySelector('#transition-page .transition-content');
            if (transitionContent) {
                transitionContent.style.display = 'flex';
            }
        } else if (sceneName === 'final-page') {
            this.createHearts();
        } else if (sceneName === 'game-page') {
            this.addGameDecorations();
            // Reset controls binding flag when starting new game
            this._gameControlsBound = false;
            // Resize canvas after a brief delay to ensure proper rendering
            setTimeout(() => this.resizeGameCanvas(), 100);
        }
        
        // Adjust for current screen size
        this.handleResize();
    }

    addBannerAndClouds() {
        // Add banner to decoration page
        const bannerContainer = document.querySelector('#decoration-page .banner-container');
        bannerContainer.innerHTML = '';
        
        const banner = document.createElement('div');
        banner.className = 'banner show';
        banner.textContent = 'Happy Birthday, My Love!';
        bannerContainer.appendChild(banner);

        // Create clouds for decoration page with train effect
        this.createCloudsWithTrainEffect();
    }

    // Improved cloud creation with train effect
    createCloudsWithTrainEffect() {
        const cloudsContainer = document.querySelector('#decoration-page .clouds-container');
        cloudsContainer.innerHTML = '';
        
        const messages = [
            "Best Wishes!",
            "Happy Birthday!",
            "You're Amazing!",
            "So Special!",
            "Joy & Happiness!",
            "Love You!"
        ];
        
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const cloud = document.createElement('div');
                cloud.className = 'cloud';
                cloud.textContent = messages[i];
                cloud.style.top = `${15 + i * 15}%`;
                cloud.style.animationDelay = `${i * 3}s`; // Staggered delay for train effect
                cloudsContainer.appendChild(cloud);
                
                // Add show class after a small delay to create fade-in effect
                setTimeout(() => {
                    cloud.classList.add('show');
                }, 100);
            }, i * 800); // Increased delay between cloud creation for better train effect
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

    createExplosion() {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        document.getElementById('decoration-page').appendChild(explosion);

        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.background = this.getRandomColor();
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rotation = Math.random() * 360;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.setProperty('--r', `${rotation}deg`);
            
            explosion.appendChild(particle);
        }

        setTimeout(() => {
            explosion.remove();
        }, 1000);
    }

    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.getElementById('decoration-page').appendChild(confettiContainer);

        const confettiCount = 150;
        const colors = ['#ff6b8b', '#ff8e53', '#4facfe', '#00f2fe', '#a8e6cf', '#dcedc1'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 5}s`;
            confettiContainer.appendChild(confetti);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    getRandomColor() {
        const colors = ['#ff6b8b', '#ff8e53', '#4facfe', '#00f2fe', '#a8e6cf', '#dcedc1'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    addGameDecorations() {
        const gameDecorations = document.querySelector('.game-decorations');
        gameDecorations.innerHTML = '';
        
        // Add decorative kitties on sides
        for (let i = 0; i < 4; i++) {
            const kitty = document.createElement('div');
            kitty.className = 'game-kitty';
            kitty.textContent = '🐱';
            kitty.style.left = i < 2 ? '20px' : 'auto';
            kitty.style.right = i >= 2 ? '20px' : 'auto';
            kitty.style.top = `${20 + (i % 2) * 40}%`;
            gameDecorations.appendChild(kitty);
        }
        
        // Add decorative balloons with images
        for (let i = 0; i < 6; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'game-balloon';
            balloon.style.left = `${10 + i * 15}%`;
            balloon.style.top = '10%';
            balloon.style.animation = `float ${5 + i}s ease-in-out infinite`;
            gameDecorations.appendChild(balloon);
        }
    }

    startKittyGame() {
        this.showScene('game-page');
        
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        
        // Set responsive canvas size
        this.resizeGameCanvas();

        this.gameState = {
            score: 0,
            timeLeft: 60,
            gameActive: true,
            bucket: { 
                x: canvas.width / 2 - 60,
                y: canvas.height - 100, 
                width: Math.min(120, canvas.width * 0.15),
                height: Math.min(120, canvas.height * 0.195)
            },
            kitties: [],
            kittyImages: [],
            bucketImage: null
        };

        // Preload kitty images and bucket image
        this.loadGameImages().then(() => {
            this.updateScore();
            this.startGameLoop(ctx, canvas);
            this.startGameTimer();
            this.spawnKitties();
            this.bindGameControls(canvas);
        });
    }

    loadGameImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const totalImages = this.KITTY_IMAGES.length + 1; // kitties + bucket
            
            this.gameState.kittyImages = [];
            
            // Load kitty images
            this.KITTY_IMAGES.forEach((src) => {
                const img = new Image();
                img.onload = () => {
                    loaded++;
                    if (loaded === totalImages) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    loaded++;
                    if (loaded === totalImages) {
                        resolve();
                    }
                };
                img.src = src;
                this.gameState.kittyImages.push(img);
            });
            
            // Load bucket image
            this.gameState.bucketImage = new Image();
            this.gameState.bucketImage.onload = () => {
                loaded++;
                if (loaded === totalImages) {
                    resolve();
                }
            };
            this.gameState.bucketImage.onerror = () => {
                loaded++;
                if (loaded === totalImages) {
                    resolve();
                }
            };
            this.gameState.bucketImage.src = 'assets/images/bucket.png';
        });
    }

    startGameLoop(ctx, canvas) {
        const gameLoop = () => {
            if (!this.gameState.gameActive) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = '#E0F7FF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw bucket image instead of colored rectangle
            if (this.gameState.bucketImage && this.gameState.bucketImage.complete) {
                ctx.drawImage(
                    this.gameState.bucketImage, 
                    this.gameState.bucket.x, 
                    this.gameState.bucket.y, 
                    this.gameState.bucket.width, 
                    this.gameState.bucket.height
                );
            } else {
                // Fallback to rectangle if image not loaded
                ctx.fillStyle = '#ff8aa1';
                ctx.fillRect(this.gameState.bucket.x, this.gameState.bucket.y, this.gameState.bucket.width, this.gameState.bucket.height);
            }

            // Draw motivational text with proper font sizing
            ctx.fillStyle = '#ff6b8b';
            const cw = canvas.clientWidth || (canvas.width / (window.devicePixelRatio || 1));
            const fontPx = Math.round(Math.max(14, Math.min(20, cw * 0.03)));
            ctx.font = `${fontPx}px Poppins`;
            ctx.textAlign = 'center';
            ctx.fillText('Catch the kitties with the bucket!', canvas.width / 2, 30);

            // Draw kitties and check collisions
            this.gameState.kitties.forEach((kitty, index) => {
                kitty.y += kitty.speed;
                kitty.x += kitty.vx;
                
                // Keep kitties within horizontal bounds
                if (kitty.x < kitty.radius) {
                    kitty.x = kitty.radius;
                    kitty.vx *= -1;
                } else if (kitty.x > canvas.width - kitty.radius) {
                    kitty.x = canvas.width - kitty.radius;
                    kitty.vx *= -1;
                }
                
                // Draw kitty image (responsive size - increased by 1.5x)
                if (kitty.image && kitty.image.complete) {
                    ctx.drawImage(kitty.image, kitty.x - kitty.radius, kitty.y - kitty.radius, kitty.radius * 2, kitty.radius * 2);
                } else {
                    // Fallback to circle drawing
                    ctx.fillStyle = kitty.color;
                    ctx.beginPath();
                    ctx.arc(kitty.x, kitty.y, kitty.radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Check collision with bucket
                if (this.checkCollision(kitty, this.gameState.bucket)) {
                    this.gameState.score++;
                    this.gameState.kitties.splice(index, 1);
                    this.updateScore();
                    this.audioManager.playSfx('sfx_collect_chime.mp3');
                }

                // Remove if out of bounds
                if (kitty.y - kitty.radius > canvas.height) {
                    this.gameState.kitties.splice(index, 1);
                }
            });

            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }

    bindGameControls(canvas) {
        if (this._gameControlsBound) return;
        this._gameControlsBound = true;

        const moveBucketFromX = (clientX) => {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left - this.gameState.bucket.width / 2;
            this.gameState.bucket.x = Math.max(0, Math.min(canvas.clientWidth - this.gameState.bucket.width, x));
        };

        // Pointer (mouse + touch unified)
        this._pointerHandler = (e) => {
            if (!this.gameState.gameActive) return;
            // pointer events give clientX
            const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
            if (clientX) moveBucketFromX(clientX);
        };
        canvas.addEventListener('pointermove', this._pointerHandler);

        // Keyboard support (optional but accessible)
        this._keyHandler = (e) => {
            if (!this.gameState.gameActive) return;
            if (e.key === 'ArrowLeft') this.gameState.bucket.x = Math.max(0, this.gameState.bucket.x - 20);
            if (e.key === 'ArrowRight') this.gameState.bucket.x = Math.min(canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x + 20);
        };
        window.addEventListener('keydown', this._keyHandler);
    }

    checkCollision(kitty, bucket) {
        // closest point on rect to circle center
        const closestX = Math.max(bucket.x, Math.min(kitty.x, bucket.x + bucket.width));
        const closestY = Math.max(bucket.y, Math.min(kitty.y, bucket.y + bucket.height));
        const dx = kitty.x - closestX;
        const dy = kitty.y - closestY;
        return (dx*dx + dy*dy) < (kitty.radius * kitty.radius);
    }

    spawnKitties() {
        if (!this.gameState.gameActive) return;

        const canvas = document.getElementById('game-canvas');
        const colors = ['#FFDDE6', '#FFCCD5', '#FFB6C1', '#FFA8B8'];
        
        // Responsive kitty size based on canvas dimensions - INCREASED BY 1.5x
        const kittyRadius = Math.min(105, canvas.width * 0.12, canvas.height * 0.15); // 1.5x larger
        
        const newKitty = {
            x: Math.random() * (canvas.width - kittyRadius * 2) + kittyRadius,
            y: -20,
            radius: kittyRadius,
            speed: 1.5 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 0.4, // horizontal drift
            color: colors[Math.floor(Math.random() * colors.length)],
            image: this.gameState.kittyImages[Math.floor(Math.random() * this.gameState.kittyImages.length)]
        };

        this.gameState.kitties.push(newKitty);

        const nextSpawn = 800 + Math.random() * 1200;
        const t = setTimeout(() => {
            // remove this timeout from list once run
            this.spawnTimeouts = this.spawnTimeouts.filter(id => id !== t);
            this.spawnKitties();
        }, nextSpawn);
        this.spawnTimeouts.push(t);
    }

    startGameTimer() {
        // clear any previous timer
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        // ensure gameActive true
        this.gameState.timeLeft = this.gameState.timeLeft ?? 60;
        this.gameState.gameActive = true;

        this.timerId = setInterval(() => {
            if (!this.gameState || !this.gameState.gameActive) return;

            this.gameState.timeLeft--;
            document.getElementById('time-left').textContent = this.gameState.timeLeft;

            if (this.gameState.timeLeft <= 5) {
                this.audioManager.playSfx('sfx_timer_tick.mp3');
            }

            if (this.gameState.timeLeft <= 0) {
                clearInterval(this.timerId);
                this.timerId = null;
                this.gameState.gameActive = false;
                this.endGame();
            }
        }, 1000);
    }

    updateScore() {
        document.getElementById('kitty-count').textContent = this.gameState.score;
    }

    endGame() {
        this.audioManager.playSfx('sfx_success_jingle.mp3');
        setTimeout(() => {
            this.showTransitionMessage();
        }, 2000);
    }

    showTransitionMessage() {
        document.getElementById('kitty-score').textContent = this.gameState.score;
        this.showScene('transition-page');
    }

    createHearts() {
        const heartsContainer = document.querySelector('.hearts-container');
        heartsContainer.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart';
                heart.textContent = '💖';
                heart.style.left = `${Math.random() * 100}%`;
                heart.style.animationDelay = `${Math.random() * 2}s`;
                heartsContainer.appendChild(heart);

                // Remove heart after animation
                setTimeout(() => heart.remove(), 3000);
            }, i * 300);
        }
    }

    sayGoodbyeToDucky() {
        const ducky = document.getElementById('final-ducky');
        const byeBtn = document.getElementById('bye-btn');
        
        // Hide the button
        byeBtn.style.display = 'none';
        
        // Make ducky fall from top
        ducky.classList.add('falling');
        
        this.audioManager.playSfx('sfx_confetti_rustle.mp3');
        
        // After falling, make it jump
        setTimeout(() => {
            ducky.classList.remove('falling');
            ducky.classList.add('jumping');
            
            // Create extra hearts
            this.createHearts();
            
            // Play success sound
            this.audioManager.playSfx('sfx_success_jingle.mp3');
        }, 1000);
    }

    preloadAssets() {
        // Preload critical assets
        const assets = [
            'assets/images/ducky_full.png',
            'assets/images/cake1.png',
            'assets/images/kitty_01.png',
            'assets/images/kitty_02.png',
            'assets/images/kitty_03.png',
            'assets/images/kitty_04.png',
            'assets/images/kitty_05.png',
            'assets/images/bucket.png',
            'assets/images/balloon1.png',
            'assets/images/ducky_kitty.png' // New image for transition
        ];

        assets.forEach(asset => {
            const img = new Image();
            img.src = asset;
        });
    }
}

// Robust initialization function
function initBirthdaySurprise() {
    // All your existing initialization code here
    new BirthdaySurprise();
}

// Check the document's ready state before adding a listener 
if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', initBirthdaySurprise);
} else {
    // DOM is already ready, run immediately
    initBirthdaySurprise();
}