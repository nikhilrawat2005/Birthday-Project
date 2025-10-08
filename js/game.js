import sessionManager from './session.js';
import audioManager from './audio.js';
import inputManager from './input.js';

class KittyGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = {
            score: 0,
            timeLeft: 60,
            gameActive: false,
            bucket: null,
            kitties: [],
            kittyImages: [],
            bucketImage: null
        };

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

        this.init();
    }

    async init() {
        await this.setupGame();
        this.setupEventListeners();
        this.showInstructions();
        this.checkOrientation();
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
        this.gameState = {
            score: 0,
            timeLeft: 60,
            gameActive: false,
            bucket: { 
                x: this.canvas.clientWidth / 2 - 60,
                y: this.canvas.clientHeight - 100, 
                width: Math.min(120, this.canvas.clientWidth * 0.15),
                height: Math.min(120, this.canvas.clientHeight * 0.195)
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
    }

    setupTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            touchControls.style.display = 'flex';
        }
    }

    showInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'game-instructions';
        instructions.innerHTML = `
            <h3>How to Play</h3>
            <ul>
                <li>🎮 Use arrow keys or touch to move</li>
                <li>🐱 Catch falling kitties</li>
                <li>⏱️ 60 seconds timer</li>
                <li>⏸️ Press P to pause</li>
            </ul>
        `;
        document.querySelector('.scene').appendChild(instructions);

        // Auto-hide instructions after 5 seconds
        setTimeout(() => {
            instructions.style.opacity = '0.7';
        }, 5000);
    }

    startGame() {
        this.gameState.gameActive = true;
        this.isPaused = false;
        this.updateScore();
        this.startGameTimer();
        this.spawnKitties();
        this.gameLoop();
        
        audioManager.playBg('bg_game_loop.mp3');
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

        // Draw motivational text
        this.ctx.fillStyle = '#ff6b8b';
        const fontPx = Math.round(Math.max(14, Math.min(20, this.canvas.clientWidth * 0.03)));
        this.ctx.font = `${fontPx}px Poppins`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Catch the kitties with the bucket!', this.canvas.width / 2, 30);

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
        if (inputManager.state.left) {
            this.gameState.bucket.x = Math.max(0, this.gameState.bucket.x - 10);
        }
        if (inputManager.state.right) {
            this.gameState.bucket.x = Math.min(this.canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x + 10);
        }

        // Pointer takes precedence
        if (inputManager.state.pointerActive) {
            this.gameState.bucket.x = inputManager.state.pointerX - this.gameState.bucket.width / 2;
            // Clamp to canvas
            this.gameState.bucket.x = Math.max(0, Math.min(this.canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x));
        }
    }

    moveBucketLeft() {
        this.gameState.bucket.x = Math.max(0, this.gameState.bucket.x - 20);
    }

    moveBucketRight() {
        this.gameState.bucket.x = Math.min(this.canvas.clientWidth - this.gameState.bucket.width, this.gameState.bucket.x + 20);
    }

    // PATCH: Fixed kitty update loop to prevent missed collisions
    updateKitties() {
        // iterate backwards so splice is safe
        for (let i = this.gameState.kitties.length - 1; i >= 0; i--) {
            const kitty = this.gameState.kitties[i];

            kitty.y += kitty.speed;
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

        const colors = ['#FFDDE6', '#FFCCD5', '#FFB6C1', '#FFA8B8'];
        const kittyRadius = Math.min(105, this.canvas.clientWidth * 0.12, this.canvas.clientHeight * 0.15);
        
        const newKitty = {
            x: Math.random() * (this.canvas.clientWidth - kittyRadius * 2) + kittyRadius,
            y: -20,
            radius: kittyRadius,
            speed: 1.5 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            image: this.gameState.kittyImages[Math.floor(Math.random() * this.gameState.kittyImages.length)]
        };

        this.gameState.kitties.push(newKitty);

        const nextSpawn = 800 + Math.random() * 1200;
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
                    completedAt: new Date().toISOString()
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
                        time: new Date().toISOString()
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
        audioManager.bgMusic.pause();
    }

    resumeGame() {
        if (!this.gameState.gameActive) return;
        
        this.isPaused = false;
        this.hidePauseOverlay();
        audioManager.bgMusic.play().catch(e => console.log('Audio resume failed'));
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
            overlay.innerHTML = `
                <div class="pause-message">
                    <h2>Game Paused</h2>
                    <p>Press P or click to resume</p>
                    <button class="btn primary" id="resume-btn">Resume Game</button>
                </div>
            `;
            document.querySelector('.scene').appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.id === 'resume-btn') {
                    this.resumeGame();
                }
            });
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
        if (window.innerHeight > window.innerWidth) {
            // Portrait mode - show warning for landscape preferred games
            this.showOrientationWarning();
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.innerHeight > window.innerWidth) {
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
                this.gameState.bucket.width = Math.min(120, this.canvas.clientWidth * 0.15);
                this.gameState.bucket.height = Math.min(120, this.canvas.clientHeight * 0.195);
                this.gameState.bucket.x = Math.max(0, this.canvas.clientWidth / 2 - this.gameState.bucket.width / 2);
                this.gameState.bucket.y = this.canvas.clientHeight - 100;
            }
        });
    }

    addGameDecorations() {
        const gameDecorations = document.querySelector('.game-decorations');
        if (!gameDecorations) return;

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
        
        // Add decorative balloons
        for (let i = 0; i < 6; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'game-balloon';
            balloon.style.left = `${10 + i * 15}%`;
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