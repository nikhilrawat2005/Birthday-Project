import sessionManager from './session.js';
import audioManager from './audio.js';
import inputManager from './input.js';

class KittyGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isMobile = this.checkMobile();
        this.gameState = {
            score: 0,
            timeLeft: this.isMobile ? 45 : 60,
            gameActive: false,
            bucket: null,
            kitties: [],
            kittyImages: [],
            bucketImage: null
        };

        // Adjust for mobile performance
        this.KITTY_IMAGES = [
            'assets/images/kitty_01.png',
            'assets/images/kitty_02.png', 
            'assets/images/kitty_03.png',
            'assets/images/kitty_04.png',
            'assets/images/kitty_05.png'
        ];

        this.timerId = null;
        this.spawnTimeouts = [];
        this.animationFrameId = null;
        this.isPaused = false;
        this.lastSpawnTime = 0;
        this.spawnRate = this.isMobile ? 1000 : 800;

        this.init();
    }

    checkMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    async init() {
        await this.setupGame();
        this.setupEventListeners();
        this.showInstructions();
        this.checkOrientation();
        this.optimizeForMobile();
    }

    optimizeForMobile() {
        // Adjust game parameters for mobile
        if (this.isMobile) {
            this.gameState.timeLeft = 45; // Shorter game on mobile
            this.spawnRate = 1000; // Slower spawn rate
        } else {
            this.gameState.timeLeft = 60;
            this.spawnRate = 800;
        }

        // Setup viewport handler
        this.setupViewportHandler();

        // Add mobile class for CSS targeting
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            document.body.classList.add('game-mobile');
        }

        // Reduce maximum kitties for mobile performance
        this.maxKitties = this.isMobile ? 8 : 12;
    }

    setupViewportHandler() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        const debouncedResize = this.debounce(() => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            this.handleResize();
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

    handleOrientationChange() {
        if (this.isMobile) {
            // Reinitialize game on orientation change
            setTimeout(() => {
                this.handleResize();
                this.checkOrientation();
            }, 500);
        }
    }

    async setupGame() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        await this.setupCanvas();
        await this.loadGameImages();
        this.setupGameState();
        this.addGameDecorations();
        
        // Show touch controls if needed
        this.setupTouchControls();
    }

    async setupCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const dpr = window.devicePixelRatio || 1;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Set CSS size
        this.canvas.style.width = `${containerWidth}px`;
        this.canvas.style.height = `${containerHeight}px`;

        // Set actual pixel buffer size
        this.canvas.width = Math.floor(containerWidth * dpr);
        this.canvas.height = Math.floor(containerHeight * dpr);

        // Scale context
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
        
        // Mobile performance optimization
        if (this.isMobile) {
            this.ctx.imageSmoothingQuality = 'low';
        }
    }

    async loadGameImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const totalImages = this.KITTY_IMAGES.length + 1;
            
            this.gameState.kittyImages = [];
            
            // Load kitty images
            this.KITTY_IMAGES.forEach((src) => {
                const img = new Image();
                img.onload = () => {
                    loaded++;
                    if (loaded === totalImages) resolve();
                };
                img.onerror = () => {
                    loaded++;
                    if (loaded === totalImages) resolve();
                };
                img.src = src;
                this.gameState.kittyImages.push(img);
            });
            
            // Load bucket image
            this.gameState.bucketImage = new Image();
            this.gameState.bucketImage.onload = () => {
                loaded++;
                if (loaded === totalImages) resolve();
            };
            this.gameState.bucketImage.onerror = () => {
                loaded++;
                if (loaded === totalImages) resolve();
            };
            this.gameState.bucketImage.src = 'assets/images/bucket.png';
        });
    }

    setupGameState() {
        // Adjust bucket size for mobile
        const bucketWidth = this.isMobile ? 
            Math.min(100, this.canvas.clientWidth * 0.18) :
            Math.min(120, this.canvas.clientWidth * 0.15);

        const bucketHeight = this.isMobile ?
            Math.min(100, this.canvas.clientHeight * 0.16) :
            Math.min(120, this.canvas.clientHeight * 0.195);

        this.gameState = {
            score: 0,
            timeLeft: this.isMobile ? 45 : 60,
            gameActive: false,
            bucket: { 
                x: this.canvas.clientWidth / 2 - bucketWidth / 2,
                y: this.canvas.clientHeight - (this.isMobile ? 80 : 100), 
                width: bucketWidth,
                height: bucketHeight
            },
            kitties: [],
            kittyImages: this.gameState.kittyImages,
            bucketImage: this.gameState.bucketImage
        };

        this.updateScore();
    }

    setupEventListeners() {
        // Input controls
        inputManager.bindPointer(this.canvas);
        inputManager.bindKeyboard();
        inputManager.bindTouchButtons('#touch-controls');

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState.gameActive) {
                this.pauseGame();
            }
        });

        // Keyboard controls for pause
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p') {
                this.togglePause();
            }
        });

        // Touch controls for mobile
        const leftBtn = document.querySelector('.left-btn');
        const rightBtn = document.querySelector('.right-btn');
        
        if (leftBtn && rightBtn) {
            leftBtn.addEventListener('click', () => this.moveBucketLeft());
            rightBtn.addEventListener('click', () => this.moveBucketRight());
        }

        // Mobile-specific: pause on touch outside game area
        if (this.isMobile) {
            document.addEventListener('touchstart', (e) => {
                if (!this.canvas.contains(e.target) && 
                    !e.target.closest('.touch-controls') && 
                    this.gameState.gameActive && 
                    !this.isPaused) {
                    this.pauseGame();
                }
            });
        }
    }

    setupTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls && (this.isMobile || 'ontouchstart' in window)) {
            touchControls.style.display = 'flex';
            
            // Mobile performance: reduce touch control opacity when not active
            touchControls.style.opacity = '0.9';
        }
    }

    showInstructions() {
        // Remove existing instructions
        const existingInstructions = document.querySelector('.game-instructions');
        if (existingInstructions) {
            existingInstructions.remove();
        }

        const instructions = document.createElement('div');
        instructions.className = 'game-instructions';
        
        const mobileInstructions = this.isMobile ? 
            '<li>👆 Touch and drag to move</li><li>🎯 Or use touch buttons</li>' : 
            '<li>🎮 Use arrow keys to move</li>';
            
        instructions.innerHTML = `
            <h3>How to Play</h3>
            <ul>
                ${mobileInstructions}
                <li>🐱 Catch falling kitties</li>
                <li>⏱️ ${this.gameState.timeLeft} seconds timer</li>
                <li>⏸️ Press P to pause</li>
            </ul>
        `;
        document.querySelector('.scene').appendChild(instructions);

        // Auto-hide instructions after 5 seconds on mobile, 8 on desktop
        const hideDelay = this.isMobile ? 5000 : 8000;
        setTimeout(() => {
            instructions.style.opacity = '0.7';
        }, hideDelay);
    }

    startGame() {
        this.gameState.gameActive = true;
        this.isPaused = false;
        this.updateScore();
        this.startGameTimer();
        this.spawnKitties();
        this.gameLoop();
        
        // Initialize audio with mobile considerations
        if (!this.isMobile) {
            audioManager.playBg('bg_game_loop.mp3');
        } else {
            this.setupMobileAudio();
        }
    }

    setupMobileAudio() {
        // Auto-play audio after first user interaction on mobile
        const enableAudio = () => {
            audioManager.handleUserInteraction();
            audioManager.playBg('bg_game_loop.mp3').catch(() => {});
            document.removeEventListener('touchstart', enableAudio);
        };

        document.addEventListener('touchstart', enableAudio, { once: true });
    }

    gameLoop() {
        if (!this.gameState.gameActive || this.isPaused) {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.ctx.fillStyle = '#E0F7FF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw bucket
        this.drawBucket();

        // Draw motivational text (smaller on mobile)
        this.ctx.fillStyle = '#ff6b8b';
        const fontPx = this.isMobile ? 
            Math.round(Math.max(12, Math.min(16, this.canvas.clientWidth * 0.035))) :
            Math.round(Math.max(14, Math.min(20, this.canvas.clientWidth * 0.03)));
        this.ctx.font = `${fontPx}px Poppins`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Catch the kitties with the bucket!', this.canvas.width / 2, this.isMobile ? 25 : 30);

        // Update and draw kitties
        this.updateKitties();

        // Move bucket based on input
        this.updateBucketPosition();

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    drawBucket() {
        if (this.gameState.bucketImage && this.gameState.bucketImage.complete) {
            this.ctx.drawImage(
                this.gameState.bucketImage, 
                this.gameState.bucket.x, 
                this.gameState.bucket.y, 
                this.gameState.bucket.width, 
                this.gameState.bucket.height
            );
        } else {
            // Fallback
            this.ctx.fillStyle = '#ff8aa1';
            this.ctx.fillRect(this.gameState.bucket.x, this.gameState.bucket.y, this.gameState.bucket.width, this.gameState.bucket.height);
        }
    }

    updateBucketPosition() {
        // Use inputManager state to move bucket
        const moveSpeed = this.isMobile ? 8 : 10;
        
        if (inputManager.state.left) {
            this.gameState.bucket.x = Math.max(0, this.gameState.bucket.x - moveSpeed);
        }
        if (inputManager.state.right) {
            this.gameState.bucket.x = Math.min(this.canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x + moveSpeed);
        }

        // Pointer takes precedence
        if (inputManager.state.pointerActive) {
            this.gameState.bucket.x = inputManager.state.pointerX - this.gameState.bucket.width / 2;
            // Clamp to canvas
            this.gameState.bucket.x = Math.max(0, Math.min(this.canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x));
        }
    }

    moveBucketLeft() {
        const moveDistance = this.isMobile ? 15 : 20;
        this.gameState.bucket.x = Math.max(0, this.gameState.bucket.x - moveDistance);
    }

    moveBucketRight() {
        const moveDistance = this.isMobile ? 15 : 20;
        this.gameState.bucket.x = Math.min(this.canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x + moveDistance);
    }

    // PATCH: Fixed kitty update loop to prevent missed collisions
    updateKitties() {
        // iterate backwards so splice is safe
        for (let i = this.gameState.kitties.length - 1; i >= 0; i--) {
            const kitty = this.gameState.kitties[i];

            // Adjust speed for mobile
            const speedMultiplier = this.isMobile ? 0.9 : 1.0;
            kitty.y += kitty.speed * speedMultiplier;
            kitty.x += kitty.vx;
            
            // Horizontal bounds
            if (kitty.x < kitty.radius) {
                kitty.x = kitty.radius;
                kitty.vx *= -1;
            } else if (kitty.x > this.canvas.clientWidth - kitty.radius) {
                kitty.x = this.canvas.clientWidth - kitty.radius;
                kitty.vx *= -1;
            }
            
            // Draw kitty
            if (kitty.image && kitty.image.complete) {
                this.ctx.drawImage(kitty.image, kitty.x - kitty.radius, kitty.y - kitty.radius, kitty.radius * 2, kitty.radius * 2);
            } else {
                this.ctx.fillStyle = kitty.color;
                this.ctx.beginPath();
                this.ctx.arc(kitty.x, kitty.y, kitty.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Check collision with bucket
            if (this.checkCollision(kitty, this.gameState.bucket)) {
                this.gameState.score++;
                this.gameState.kitties.splice(i, 1);
                this.updateScore();
                audioManager.playSfx('sfx_collect_chime.mp3');
                continue; // kitty removed, continue with next
            }

            // Remove if out of bounds
            if (kitty.y - kitty.radius > this.canvas.clientHeight) {
                this.gameState.kitties.splice(i, 1);
            }
        }
    }

    checkCollision(kitty, bucket) {
        const closestX = Math.max(bucket.x, Math.min(kitty.x, bucket.x + bucket.width));
        const closestY = Math.max(bucket.y, Math.min(kitty.y, bucket.y + bucket.height));
        const dx = kitty.x - closestX;
        const dy = kitty.y - closestY;
        return (dx*dx + dy*dy) < (kitty.radius * kitty.radius);
    }

    spawnKitties() {
        if (!this.gameState.gameActive || this.isPaused) return;
        
        // Limit number of kitties for mobile performance
        if (this.gameState.kitties.length >= this.maxKitties) {
            const nextSpawn = this.spawnRate;
            const t = setTimeout(() => {
                this.spawnTimeouts = this.spawnTimeouts.filter(id => id !== t);
                this.spawnKitties();
            }, nextSpawn);
            this.spawnTimeouts.push(t);
            return;
        }

        const colors = ['#FFDDE6', '#FFCCD5', '#FFB6C1', '#FFA8B8'];
        const kittyRadius = this.isMobile ? 
            Math.min(80, this.canvas.clientWidth * 0.1, this.canvas.clientHeight * 0.12) :
            Math.min(105, this.canvas.clientWidth * 0.12, this.canvas.clientHeight * 0.15);
        
        const newKitty = {
            x: Math.random() * (this.canvas.clientWidth - kittyRadius * 2) + kittyRadius,
            y: -20,
            radius: kittyRadius,
            speed: this.isMobile ? 1.2 + Math.random() * 1.2 : 1.5 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            image: this.gameState.kittyImages[Math.floor(Math.random() * this.gameState.kittyImages.length)]
        };

        this.gameState.kitties.push(newKitty);

        const nextSpawn = this.spawnRate + Math.random() * (this.isMobile ? 1400 : 1200);
        const t = setTimeout(() => {
            this.spawnTimeouts = this.spawnTimeouts.filter(id => id !== t);
            this.spawnKitties();
        }, nextSpawn);
        this.spawnTimeouts.push(t);
    }

    startGameTimer() {
        this.timerId = setInterval(() => {
            if (!this.gameState.gameActive || this.isPaused) return;

            this.gameState.timeLeft--;
            document.getElementById('time-left').textContent = this.gameState.timeLeft;

            if (this.gameState.timeLeft <= 5) {
                audioManager.playSfx('sfx_timer_tick.mp3');
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

    async endGame() {
        // Stop the game loop
        this.gameState.gameActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Clear timeouts
        this.spawnTimeouts.forEach(clearTimeout);
        this.spawnTimeouts = [];

        // Save score to backend
        await this.saveScore();

        // Haptic feedback on mobile
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(200);
        }

        audioManager.playSfx('sfx_success_jingle.mp3');
        setTimeout(() => {
            sessionManager.navigateTo('result');
        }, 2000);
    }

    async saveScore() {
        try {
            await sessionManager.updateSession({
                game: {
                    score: this.gameState.score,
                    completedAt: new Date().toISOString(),
                    deviceType: this.isMobile ? 'mobile' : 'desktop'
                }
            });

            // Also save to scores endpoint
            await fetch(`${sessionManager.apiBase}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionManager.sessionId,
                    score: this.gameState.score,
                    meta: {
                        device: navigator.userAgent,
                        time: new Date().toISOString(),
                        isMobile: this.isMobile
                    }
                })
            });
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }

    pauseGame() {
        if (!this.gameState.gameActive) return;
        
        this.isPaused = true;
        this.showPauseOverlay();
        if (audioManager.bgMusic) {
            audioManager.bgMusic.pause();
        }
    }

    resumeGame() {
        if (!this.gameState.gameActive) return;
        
        this.isPaused = false;
        this.hidePauseOverlay();
        if (audioManager.bgMusic) {
            audioManager.bgMusic.play().catch(e => console.log('Audio resume failed'));
        }
        this.gameLoop();
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    showPauseOverlay() {
        let overlay = document.querySelector('.pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'pause-overlay';
            
            const resumeText = this.isMobile ? 'Tap to resume' : 'Press P or click to resume';
            
            overlay.innerHTML = `
                <div class="pause-message">
                    <h2>Game Paused</h2>
                    <p>${resumeText}</p>
                    <button class="btn primary" id="resume-btn">Resume Game</button>
                </div>
            `;
            document.querySelector('.scene').appendChild(overlay);

            // Mobile: tap anywhere to resume
            if (this.isMobile) {
                overlay.addEventListener('touchstart', (e) => {
                    if (e.target === overlay || e.target.id === 'resume-btn') {
                        this.resumeGame();
                    }
                });
            } else {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay || e.target.id === 'resume-btn') {
                        this.resumeGame();
                    }
                });
            }
        }
        overlay.classList.add('active');
    }

    hidePauseOverlay() {
        const overlay = document.querySelector('.pause-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    checkOrientation() {
        if (this.isMobile && window.innerHeight > window.innerWidth) {
            // Portrait mode - show warning for landscape preferred games
            this.showOrientationWarning();
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.isMobile && window.innerHeight > window.innerWidth) {
                    this.showOrientationWarning();
                } else {
                    this.hideOrientationWarning();
                }
            }, 300);
        });
    }

    showOrientationWarning() {
        let warning = document.querySelector('.orientation-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'orientation-warning';
            warning.innerHTML = `
                <div>
                    <h2>🎮 Rotate Your Device</h2>
                    <p>For the best gaming experience, please rotate your device to landscape mode.</p>
                    <button class="btn primary" onclick="this.closest('.orientation-warning').classList.remove('active')">
                        Continue Anyway
                    </button>
                </div>
            `;
            document.querySelector('.scene').appendChild(warning);
        }
        warning.classList.add('active');
    }

    hideOrientationWarning() {
        const warning = document.querySelector('.orientation-warning');
        if (warning) {
            warning.classList.remove('active');
        }
    }

    handleResize() {
        this.setupCanvas().then(() => {
            // Adjust bucket position and size
            if (this.gameState.bucket) {
                const bucketWidth = this.isMobile ? 
                    Math.min(100, this.canvas.clientWidth * 0.18) :
                    Math.min(120, this.canvas.clientWidth * 0.15);

                const bucketHeight = this.isMobile ?
                    Math.min(100, this.canvas.clientHeight * 0.16) :
                    Math.min(120, this.canvas.clientHeight * 0.195);

                this.gameState.bucket.width = bucketWidth;
                this.gameState.bucket.height = bucketHeight;
                this.gameState.bucket.x = Math.max(0, this.canvas.clientWidth / 2 - this.gameState.bucket.width / 2);
                this.gameState.bucket.y = this.canvas.clientHeight - (this.isMobile ? 80 : 100);
            }
        });
    }

    addGameDecorations() {
        const gameDecorations = document.querySelector('.game-decorations');
        if (!gameDecorations) return;

        gameDecorations.innerHTML = '';
        
        // Add decorative kitties on sides (fewer on mobile)
        const kittyCount = this.isMobile ? 2 : 4;
        for (let i = 0; i < kittyCount; i++) {
            const kitty = document.createElement('div');
            kitty.className = 'game-kitty';
            kitty.textContent = '🐱';
            kitty.style.left = i < (kittyCount/2) ? '10px' : 'auto';
            kitty.style.right = i >= (kittyCount/2) ? '10px' : 'auto';
            kitty.style.top = `${20 + (i % 2) * 40}%`;
            gameDecorations.appendChild(kitty);
        }
        
        // Add decorative balloons (fewer on mobile)
        const balloonCount = this.isMobile ? 4 : 6;
        for (let i = 0; i < balloonCount; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'game-balloon';
            balloon.style.left = `${10 + i * (this.isMobile ? 20 : 15)}%`;
            balloon.style.top = '10%';
            balloon.style.animation = `float ${5 + i}s ease-in-out infinite`;
            gameDecorations.appendChild(balloon);
        }
    }

    cleanup() {
        this.gameState.gameActive = false;
        this.isPaused = false;
        
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        
        this.spawnTimeouts.forEach(clearTimeout);
        this.spawnTimeouts = [];
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        inputManager.unbindAll();
        audioManager.stopAll();
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

// Initialize the game when the page loads
let game;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for session to be ready
    await sessionManager.getOrCreateSession();
    
    game = new KittyGame();
    
    // Start the game automatically after a brief delay
    setTimeout(() => {
        game.startGame();
    }, 1000);
});

// Cleanup when leaving the page
window.addEventListener('beforeunload', () => {
    if (game) {
        game.cleanup();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game) {
        game.pauseGame();
    }
});

export default KittyGame;